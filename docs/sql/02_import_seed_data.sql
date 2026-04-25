-- ============================================================================
-- SEED DATA IMPORT
-- Run AFTER 01_schema.sql
-- ============================================================================
--
-- HOW TO USE:
--
--   1. Upload the four CSV files to Supabase Storage:
--        Bucket: "seed-data" (create it, make it private)
--        Files: trees.csv, kitchen_plants.csv, cut_flowers.csv, field_crops.csv
--
--   2. Run this entire file in the Supabase SQL Editor.
--
--   3. Run the verification queries at the bottom to confirm counts match.
--
-- ALTERNATIVE: If you want to COPY from local files instead of Storage,
-- replace each "COPY … FROM 'https://…'" with your local path in psql.
-- ============================================================================


-- ============================================================================
-- STAGING TABLES — all-text columns, no constraints
-- ============================================================================

DROP TABLE IF EXISTS _stage_trees;
DROP TABLE IF EXISTS _stage_kitchen_plants;
DROP TABLE IF EXISTS _stage_cut_flowers;
DROP TABLE IF EXISTS _stage_field_crops;

CREATE TABLE _stage_trees (
    variety_id TEXT, species TEXT, variety_name TEXT, scientific_name TEXT,
    chill_hours_min TEXT, chill_hours_max TEXT,
    self_fertile TEXT, pollinators TEXT,
    years_to_first_fruit_min TEXT, years_to_first_fruit_max TEXT,
    ripening_season TEXT, usda_zone_min TEXT, usda_zone_max TEXT,
    mature_height_ft_min TEXT, mature_height_ft_max TEXT,
    tree_spacing_ft_min TEXT, tree_spacing_ft_max TEXT,
    training_system TEXT, disease_notes TEXT, variety_notes TEXT,
    sources TEXT, source_notes TEXT,
    confidence TEXT, last_verified_date TEXT
);

CREATE TABLE _stage_kitchen_plants (
    variety_id TEXT, species TEXT, variety_name TEXT, scientific_name TEXT,
    plant_type TEXT,
    days_to_maturity_min TEXT, days_to_maturity_max TEXT,
    sun_requirement TEXT,
    spacing_inches_min TEXT, spacing_inches_max TEXT, row_spacing_inches TEXT,
    start_method TEXT, plants_per_sqft TEXT,
    growth_habit TEXT,
    mature_height_inches_min TEXT, mature_height_inches_max TEXT,
    first_harvest_year TEXT,
    productive_lifespan_years_min TEXT, productive_lifespan_years_max TEXT,
    usda_zone_min TEXT, usda_zone_max TEXT,
    disease_resistance TEXT, companion_notes TEXT, variety_notes TEXT,
    sources TEXT, source_notes TEXT,
    confidence TEXT, last_verified_date TEXT
);

CREATE TABLE _stage_cut_flowers (
    variety_id TEXT, species TEXT, variety_name TEXT, scientific_name TEXT,
    plant_type TEXT,
    days_to_maturity_min TEXT, days_to_maturity_max TEXT,
    sun_requirement TEXT,
    spacing_inches_min TEXT, spacing_inches_max TEXT,
    start_method TEXT, pinch_at_height_inches TEXT,
    stem_length_inches_min TEXT, stem_length_inches_max TEXT,
    bloom_size_inches_min TEXT, bloom_size_inches_max TEXT,
    vase_life_days_min TEXT, vase_life_days_max TEXT,
    cut_and_come_again TEXT, succession_interval_days TEXT,
    bloom_color TEXT,
    usda_zone_perennial_min TEXT, usda_zone_perennial_max TEXT,
    overwintering_method TEXT, variety_notes TEXT,
    sources TEXT, source_notes TEXT,
    confidence TEXT, last_verified_date TEXT
);

CREATE TABLE _stage_field_crops (
    variety_id TEXT, species TEXT, variety_name TEXT, scientific_name TEXT,
    crop_type TEXT, sugar_genetic_type TEXT,
    days_to_maturity_min TEXT, days_to_maturity_max TEXT,
    ear_length_inches_min TEXT, ear_length_inches_max TEXT,
    plant_height_ft_min TEXT, plant_height_ft_max TEXT,
    rows_per_ear_min TEXT, rows_per_ear_max TEXT,
    plant_spacing_inches TEXT,
    row_spacing_inches_min TEXT, row_spacing_inches_max TEXT,
    min_block_rows TEXT, isolation_requirement TEXT,
    use_types TEXT, soil_temp_minimum_f TEXT,
    open_pollinated_or_hybrid TEXT,
    disease_resistance TEXT, variety_notes TEXT,
    sources TEXT, source_notes TEXT,
    confidence TEXT, last_verified_date TEXT
);


-- ============================================================================
-- LOAD CSV INTO STAGING
-- ============================================================================
-- Supabase SQL Editor doesn't support \copy; use the Storage → CSV approach:
--   Dashboard: Table Editor → _stage_trees → Import from CSV → pick trees.csv
-- Repeat for each staging table. Or run this via psql:
--
--   \copy _stage_trees          FROM 'trees.csv'          CSV HEADER
--   \copy _stage_kitchen_plants FROM 'kitchen_plants.csv' CSV HEADER
--   \copy _stage_cut_flowers    FROM 'cut_flowers.csv'    CSV HEADER
--   \copy _stage_field_crops    FROM 'field_crops.csv'    CSV HEADER


-- ============================================================================
-- HELPER: safe numeric cast — empty string → NULL
-- ============================================================================

CREATE OR REPLACE FUNCTION _nullif_empty(s TEXT) RETURNS TEXT AS $$
    SELECT NULLIF(NULLIF(TRIM(s), ''), 'NULL')
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION _to_int(s TEXT) RETURNS INTEGER AS $$
    SELECT CASE WHEN _nullif_empty(s) IS NULL THEN NULL ELSE s::INTEGER END
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION _to_num(s TEXT) RETURNS NUMERIC AS $$
    SELECT CASE WHEN _nullif_empty(s) IS NULL THEN NULL ELSE s::NUMERIC END
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION _to_bool(s TEXT) RETURNS BOOLEAN AS $$
    SELECT CASE
        WHEN _nullif_empty(s) IS NULL THEN NULL
        WHEN upper(trim(s)) IN ('TRUE', 'T', '1', 'YES', 'Y') THEN TRUE
        WHEN upper(trim(s)) IN ('FALSE', 'F', '0', 'NO', 'N') THEN FALSE
        ELSE NULL
    END
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION _split_semicolon(s TEXT) RETURNS TEXT[] AS $$
    SELECT CASE
        WHEN _nullif_empty(s) IS NULL THEN NULL
        ELSE (
            SELECT array_agg(trim(x))
            FROM unnest(string_to_array(s, ';')) x
            WHERE trim(x) <> ''
        )
    END
$$ LANGUAGE sql IMMUTABLE;


-- ============================================================================
-- INSERT FROM STAGING → FINAL TABLES
-- ============================================================================

-- Trees
INSERT INTO trees (
    variety_id, species, variety_name, scientific_name,
    chill_hours_min, chill_hours_max,
    self_fertile, pollinators,
    years_to_first_fruit_min, years_to_first_fruit_max,
    ripening_season, usda_zone_min, usda_zone_max,
    mature_height_ft_min, mature_height_ft_max,
    tree_spacing_ft_min, tree_spacing_ft_max,
    training_system, disease_notes, variety_notes,
    sources, source_notes, confidence, last_verified_date
)
SELECT
    variety_id, species, variety_name, scientific_name,
    _to_int(chill_hours_min), _to_int(chill_hours_max),
    _to_bool(self_fertile), _split_semicolon(pollinators),
    _to_int(years_to_first_fruit_min), _to_int(years_to_first_fruit_max),
    ripening_season, _to_int(usda_zone_min), _to_int(usda_zone_max),
    _to_int(mature_height_ft_min), _to_int(mature_height_ft_max),
    _to_int(tree_spacing_ft_min), _to_int(tree_spacing_ft_max),
    training_system, disease_notes, variety_notes,
    _split_semicolon(sources), source_notes,
    lower(confidence)::confidence_level,
    _nullif_empty(last_verified_date)::DATE
FROM _stage_trees
ON CONFLICT (variety_id) DO NOTHING;


-- Kitchen plants
INSERT INTO kitchen_plants (
    variety_id, species, variety_name, scientific_name,
    plant_type, days_to_maturity_min, days_to_maturity_max,
    sun_requirement, spacing_inches_min, spacing_inches_max, row_spacing_inches,
    start_method, plants_per_sqft,
    growth_habit, mature_height_inches_min, mature_height_inches_max,
    first_harvest_year, productive_lifespan_years_min, productive_lifespan_years_max,
    usda_zone_min, usda_zone_max,
    disease_resistance, companion_notes, variety_notes,
    sources, source_notes, confidence, last_verified_date
)
SELECT
    variety_id, species, variety_name, scientific_name,
    plant_type, _to_int(days_to_maturity_min), _to_int(days_to_maturity_max),
    sun_requirement,
    _to_int(spacing_inches_min), _to_int(spacing_inches_max), _to_int(row_spacing_inches),
    start_method, _to_num(plants_per_sqft),
    growth_habit,
    _to_int(mature_height_inches_min), _to_int(mature_height_inches_max),
    _to_int(first_harvest_year),
    _to_int(productive_lifespan_years_min), _to_int(productive_lifespan_years_max),
    _to_int(usda_zone_min), _to_int(usda_zone_max),
    disease_resistance, companion_notes, variety_notes,
    _split_semicolon(sources), source_notes,
    lower(confidence)::confidence_level,
    _nullif_empty(last_verified_date)::DATE
FROM _stage_kitchen_plants
ON CONFLICT (variety_id) DO NOTHING;


-- Cut flowers
INSERT INTO cut_flowers (
    variety_id, species, variety_name, scientific_name,
    plant_type, days_to_maturity_min, days_to_maturity_max,
    sun_requirement, spacing_inches_min, spacing_inches_max,
    start_method, pinch_at_height_inches,
    stem_length_inches_min, stem_length_inches_max,
    bloom_size_inches_min, bloom_size_inches_max,
    vase_life_days_min, vase_life_days_max,
    cut_and_come_again, succession_interval_days,
    bloom_color, usda_zone_perennial_min, usda_zone_perennial_max,
    overwintering_method, variety_notes,
    sources, source_notes, confidence, last_verified_date
)
SELECT
    variety_id, species, variety_name, scientific_name,
    plant_type, _to_int(days_to_maturity_min), _to_int(days_to_maturity_max),
    sun_requirement, _to_int(spacing_inches_min), _to_int(spacing_inches_max),
    start_method, _to_int(pinch_at_height_inches),
    _to_int(stem_length_inches_min), _to_int(stem_length_inches_max),
    _to_num(bloom_size_inches_min), _to_num(bloom_size_inches_max),
    _to_int(vase_life_days_min), _to_int(vase_life_days_max),
    _to_bool(cut_and_come_again), _to_int(succession_interval_days),
    bloom_color,
    _to_int(usda_zone_perennial_min), _to_int(usda_zone_perennial_max),
    overwintering_method, variety_notes,
    _split_semicolon(sources), source_notes,
    lower(confidence)::confidence_level,
    _nullif_empty(last_verified_date)::DATE
FROM _stage_cut_flowers
ON CONFLICT (variety_id) DO NOTHING;


-- Field crops
INSERT INTO field_crops (
    variety_id, species, variety_name, scientific_name,
    crop_type, sugar_genetic_type,
    days_to_maturity_min, days_to_maturity_max,
    ear_length_inches_min, ear_length_inches_max,
    plant_height_ft_min, plant_height_ft_max,
    rows_per_ear_min, rows_per_ear_max,
    plant_spacing_inches, row_spacing_inches_min, row_spacing_inches_max,
    min_block_rows, isolation_requirement,
    use_types, soil_temp_minimum_f,
    open_pollinated_or_hybrid,
    disease_resistance, variety_notes,
    sources, source_notes, confidence, last_verified_date
)
SELECT
    variety_id, species, variety_name, scientific_name,
    crop_type, sugar_genetic_type,
    _to_int(days_to_maturity_min), _to_int(days_to_maturity_max),
    _to_int(ear_length_inches_min), _to_int(ear_length_inches_max),
    _to_int(plant_height_ft_min), _to_int(plant_height_ft_max),
    _to_int(rows_per_ear_min), _to_int(rows_per_ear_max),
    _to_int(plant_spacing_inches),
    _to_int(row_spacing_inches_min), _to_int(row_spacing_inches_max),
    _to_int(min_block_rows), isolation_requirement,
    _split_semicolon(use_types), _to_int(soil_temp_minimum_f),
    open_pollinated_or_hybrid,
    disease_resistance, variety_notes,
    _split_semicolon(sources), source_notes,
    lower(confidence)::confidence_level,
    _nullif_empty(last_verified_date)::DATE
FROM _stage_field_crops
ON CONFLICT (variety_id) DO NOTHING;


-- ============================================================================
-- CLEANUP
-- ============================================================================

DROP TABLE _stage_trees;
DROP TABLE _stage_kitchen_plants;
DROP TABLE _stage_cut_flowers;
DROP TABLE _stage_field_crops;


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Expected counts: trees 92, kitchen_plants 71, cut_flowers 53, field_crops 41
SELECT 'trees' AS table_name, COUNT(*) AS row_count FROM trees
UNION ALL SELECT 'kitchen_plants', COUNT(*) FROM kitchen_plants
UNION ALL SELECT 'cut_flowers', COUNT(*) FROM cut_flowers
UNION ALL SELECT 'field_crops', COUNT(*) FROM field_crops;

-- Sample checks: arrays populated, booleans parsed
-- SELECT variety_id, pollinators FROM trees WHERE array_length(pollinators, 1) > 0 LIMIT 5;
-- SELECT variety_id, self_fertile FROM trees WHERE self_fertile = true LIMIT 5;
-- SELECT variety_id, sources FROM kitchen_plants LIMIT 3;
-- SELECT confidence, COUNT(*) FROM trees GROUP BY confidence;
