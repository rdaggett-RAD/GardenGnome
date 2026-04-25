-- ============================================================================
-- HELPER VIEWS AND FUNCTIONS
-- Run AFTER 01_schema.sql and 02_import_seed_data.sql
-- ============================================================================
--
-- These are small but critical utilities that make the app much cleaner:
--
--   1. all_varieties — unified view across the four seed tables, for variety
--      pickers where the user wants to search anything (or filter by category).
--
--   2. check_pollination_compatible() — given two tree variety_ids, returns
--      whether they can pollinate each other. Encodes the S-allele rules for
--      sweet cherries, bloom group rules for apples, etc.
--
--   3. list_compatible_pollinators() — given a tree variety_id, returns the
--      list of other varieties that will pollinate it. Used in the "which
--      second tree should I plant?" UI.
-- ============================================================================


-- ============================================================================
-- UNIFIED VARIETY VIEW — for pickers that search across all categories
-- ============================================================================

CREATE OR REPLACE VIEW all_varieties AS
SELECT
    variety_id,
    'trees'::variety_source AS variety_table,
    species,
    variety_name,
    scientific_name,
    variety_notes AS notes,
    confidence
FROM trees
UNION ALL
SELECT
    variety_id,
    'kitchen_plants'::variety_source,
    species,
    variety_name,
    scientific_name,
    variety_notes,
    confidence
FROM kitchen_plants
UNION ALL
SELECT
    variety_id,
    'cut_flowers'::variety_source,
    species,
    variety_name,
    scientific_name,
    variety_notes,
    confidence
FROM cut_flowers
UNION ALL
SELECT
    variety_id,
    'field_crops'::variety_source,
    species,
    variety_name,
    scientific_name,
    variety_notes,
    confidence
FROM field_crops;

GRANT SELECT ON all_varieties TO authenticated;

COMMENT ON VIEW all_varieties IS
    'Unified variety lookup across all four seed tables. Use this for search
     pickers or faceted browse UI. For full variety detail, query the specific
     table indicated by variety_table.';


-- ============================================================================
-- POLLINATION COMPATIBILITY
-- ============================================================================
--
-- Rules encoded in the trees.pollinators array during data entry:
--
--   - Self-fertile varieties need no pollinator (self_fertile = true).
--   - For non-self-fertile, the pollinators array lists compatible partner
--     variety_ids. A returns a B means "if you want fruit from A, plant B
--     nearby." Compatibility is usually (but not always) symmetric.
--
-- Special cases baked into the data:
--   - Sweet cherry Lambert, Bing, Royal Ann share an S-allele group and
--     CANNOT pollinate each other — they're all absent from each other's
--     pollinators arrays.
--   - Apple Honeycrisp and Cosmic Crisp share bloom group 4 pollen parent —
--     absent from each other's pollinators.
--   - Bartlett + Seckel pear — absent from each other's pollinators.
--   - Triploid apples (Arkansas Black, Stayman Winesap) have sterile pollen —
--     they'll set fruit with a partner but CANNOT pollinate others. These
--     have empty pollinators arrays and are absent from everyone else's.
--   - Pecan is split Type I (protandrous) and Type II (protogynous); a
--     Type I needs a Type II partner and vice versa.
--
-- This logic all lives in the data itself. The function below is a simple
-- lookup, not a rules engine.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_pollination_compatible(
    variety_a TEXT,
    variety_b TEXT
)
RETURNS TABLE (
    compatible BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    a_row trees%ROWTYPE;
    b_row trees%ROWTYPE;
BEGIN
    SELECT * INTO a_row FROM trees WHERE variety_id = variety_a;
    SELECT * INTO b_row FROM trees WHERE variety_id = variety_b;

    IF a_row.variety_id IS NULL OR b_row.variety_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'One or both varieties not found';
        RETURN;
    END IF;

    IF a_row.species <> b_row.species THEN
        -- Different species — most can't cross (apples vs pears, etc.)
        -- Exception: European plum + European plum, Japanese plum + Japanese
        -- plum, etc. are captured by species already matching.
        RETURN QUERY SELECT FALSE, format(
            'Different species: %s and %s cannot cross-pollinate',
            a_row.species, b_row.species
        );
        RETURN;
    END IF;

    IF a_row.self_fertile = TRUE THEN
        RETURN QUERY SELECT TRUE, format(
            '%s is self-fertile — no pollinator required',
            a_row.variety_name
        );
        RETURN;
    END IF;

    IF a_row.pollinators IS NOT NULL AND variety_b = ANY(a_row.pollinators) THEN
        RETURN QUERY SELECT TRUE, format(
            '%s pollinates %s',
            b_row.variety_name, a_row.variety_name
        );
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, format(
        '%s is not listed as a compatible pollinator for %s — check S-allele group or bloom timing',
        b_row.variety_name, a_row.variety_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION check_pollination_compatible(TEXT, TEXT) TO authenticated;


-- ============================================================================
-- LIST COMPATIBLE POLLINATORS
-- ============================================================================
-- Given a tree variety_id, return all varieties that will pollinate it.
-- Used in the "I planted variety X, what should I plant next to it?" UI.
--
-- Returns empty if the variety is self-fertile (none needed) or if it's a
-- triploid with no documented working partners.

CREATE OR REPLACE FUNCTION list_compatible_pollinators(target_variety TEXT)
RETURNS TABLE (
    pollinator_variety_id TEXT,
    pollinator_variety_name TEXT,
    pollinator_species TEXT,
    pollinator_ripening TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    target_row trees%ROWTYPE;
BEGIN
    SELECT * INTO target_row FROM trees WHERE variety_id = target_variety;

    IF target_row.variety_id IS NULL OR target_row.self_fertile = TRUE THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        t.variety_id,
        t.variety_name,
        t.species,
        t.ripening_season
    FROM trees t
    WHERE t.variety_id = ANY(target_row.pollinators)
      AND t.species = target_row.species;
END;
$$;

GRANT EXECUTE ON FUNCTION list_compatible_pollinators(TEXT) TO authenticated;


-- ============================================================================
-- FILTER VARIETIES BY PROPERTY
-- ============================================================================
-- Given a property's USDA zone and chill hours, return varieties that
-- should succeed there. Wrap this in a UI filter — don't hide incompatible
-- varieties entirely, just mark them.

CREATE OR REPLACE FUNCTION trees_suitable_for_property(
    zone_num INTEGER,
    available_chill_hours INTEGER
)
RETURNS TABLE (
    variety_id TEXT,
    variety_name TEXT,
    species TEXT,
    zone_fit BOOLEAN,
    chill_fit BOOLEAN,
    notes TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        t.variety_id,
        t.variety_name,
        t.species,
        (zone_num BETWEEN t.usda_zone_min AND t.usda_zone_max) AS zone_fit,
        (available_chill_hours >= t.chill_hours_min) AS chill_fit,
        CASE
            WHEN zone_num NOT BETWEEN t.usda_zone_min AND t.usda_zone_max THEN
                format('Outside hardiness zone (%s-%s)', t.usda_zone_min, t.usda_zone_max)
            WHEN available_chill_hours < t.chill_hours_min THEN
                format('Needs %s+ chill hours; your area gets ~%s',
                       t.chill_hours_min, available_chill_hours)
            ELSE 'Suitable'
        END AS notes
    FROM trees t;
$$;

GRANT EXECUTE ON FUNCTION trees_suitable_for_property(INTEGER, INTEGER) TO authenticated;


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Expected: TRUE ("Lambert is self-compatible with Van")
-- SELECT * FROM check_pollination_compatible('cherry_lambert', 'cherry_van');

-- Expected: FALSE ("same S-allele group")
-- SELECT * FROM check_pollination_compatible('cherry_lambert', 'cherry_bing');

-- Expected: empty rowset if Methley is self-fertile
-- SELECT * FROM list_compatible_pollinators('plum_methley');

-- Expected: list of pecan Type II varieties
-- SELECT * FROM list_compatible_pollinators('pecan_pawnee');

-- Expected: all trees with fit flags based on zone 6, 800 chill hours
-- SELECT variety_name, species, zone_fit, chill_fit, notes
-- FROM trees_suitable_for_property(6, 800)
-- WHERE zone_fit AND chill_fit
-- ORDER BY species, variety_name;
