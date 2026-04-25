-- ============================================================================
-- GARDEN GNOME — SUPABASE SCHEMA
-- Target: Supabase Postgres 15+
-- Auth: Supabase Auth (email/password; Google OAuth optional)
-- Multi-user: enabled day 1 via Row Level Security (RLS)
-- ============================================================================
--
-- RUN ORDER:
--   1. This file (schema + RLS) in Supabase SQL Editor
--   2. 02_import_seed_data.sql (load the 4 CSVs into seed tables)
--   3. 03_functions_and_views.sql (helper views + compatibility logic)
--
-- DESIGN DECISIONS:
--
--   1. Seed tables (trees, kitchen_plants, cut_flowers, field_crops) are
--      public READ-only reference data. All authenticated users can SELECT;
--      only service_role can INSERT/UPDATE. This matches the "app-curated
--      variety library, users can't edit" mental model.
--
--   2. Variety references from user tables use (variety_table, variety_id)
--      pairs instead of a single FK. This is because the 4 seed CSVs have
--      genuinely different shapes (trees need pollination fields, cut
--      flowers need vase life, etc.) and merging them would mean 80%
--      NULL columns. The all_varieties view gives a unified query surface.
--
--   3. Each property has a single owner (user_id). Collaborators (spouses,
--      family) deferred to v2 — can be added via a property_collaborators
--      junction table without breaking existing data.
--
--   4. Plantings are the core user object — a planting = "I intend to grow
--      variety X in plot Y during season Z". They can be planned, planted,
--      harvested, or archived. Historical data is preserved via status
--      column, not DELETE.
--
--   5. Climate data (frost dates, USDA zone, chill hours) is cached per
--      property to avoid repeated NOAA/USDA API calls. Recalculated when
--      the property's coordinates change.
--
--   6. Text arrays (TEXT[]) used for list fields like pollinators, sources,
--      use_types. Makes queries like "find trees that pollinate Lambert"
--      index-friendly and clean.
-- ============================================================================


-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE variety_source AS ENUM (
    'trees',
    'kitchen_plants',
    'cut_flowers',
    'field_crops'
);

CREATE TYPE plot_category AS ENUM (
    'orchard',
    'kitchen_garden',
    'cut_flower_bed',
    'field_crop',
    'mixed'
);

CREATE TYPE planting_status AS ENUM (
    'planned',        -- user has added to plan but hasn't planted
    'planted',        -- actively growing
    'harvested',      -- produced harvest
    'failed',         -- died, diseased, etc.
    'archived'        -- preserved for history, not active
);

CREATE TYPE task_status AS ENUM (
    'pending',
    'done',
    'skipped',
    'overdue'
);

CREATE TYPE task_source AS ENUM (
    'auto_generated',  -- system-generated from planting schedules
    'user_created'     -- user-added custom task
);

CREATE TYPE confidence_level AS ENUM (
    'low',
    'medium',
    'high'
);


-- ============================================================================
-- SEED TABLES — public read-only reference data
-- ============================================================================

-- Trees (orchard)
CREATE TABLE trees (
    variety_id TEXT PRIMARY KEY,
    species TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,

    -- Pollination & fruiting
    chill_hours_min INTEGER,
    chill_hours_max INTEGER,
    self_fertile BOOLEAN,
    pollinators TEXT[],  -- variety_ids of compatible pollinators
    years_to_first_fruit_min INTEGER,
    years_to_first_fruit_max INTEGER,
    ripening_season TEXT,

    -- Site requirements
    usda_zone_min INTEGER,
    usda_zone_max INTEGER,

    -- Physical
    mature_height_ft_min INTEGER,
    mature_height_ft_max INTEGER,
    tree_spacing_ft_min INTEGER,
    tree_spacing_ft_max INTEGER,
    training_system TEXT,

    -- Notes
    disease_notes TEXT,
    variety_notes TEXT,

    -- Provenance
    sources TEXT[],
    source_notes TEXT,
    confidence confidence_level NOT NULL DEFAULT 'medium',
    last_verified_date DATE
);

CREATE INDEX idx_trees_species ON trees (species);
CREATE INDEX idx_trees_self_fertile ON trees (self_fertile);
CREATE INDEX idx_trees_zone ON trees (usda_zone_min, usda_zone_max);
CREATE INDEX idx_trees_pollinators ON trees USING GIN (pollinators);


-- Kitchen plants (vegetables, herbs, perennial edibles)
CREATE TABLE kitchen_plants (
    variety_id TEXT PRIMARY KEY,
    species TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,

    plant_type TEXT,  -- annual, biennial, perennial, tender perennial, etc.
    days_to_maturity_min INTEGER,
    days_to_maturity_max INTEGER,
    sun_requirement TEXT,

    -- Spacing
    spacing_inches_min INTEGER,
    spacing_inches_max INTEGER,
    row_spacing_inches INTEGER,
    plants_per_sqft NUMERIC(4,1),

    -- Growing
    start_method TEXT,
    growth_habit TEXT,
    mature_height_inches_min INTEGER,
    mature_height_inches_max INTEGER,

    -- Perennial-specific
    first_harvest_year INTEGER,
    productive_lifespan_years_min INTEGER,
    productive_lifespan_years_max INTEGER,
    usda_zone_min INTEGER,
    usda_zone_max INTEGER,

    -- Notes
    disease_resistance TEXT,
    companion_notes TEXT,
    variety_notes TEXT,

    -- Provenance
    sources TEXT[],
    source_notes TEXT,
    confidence confidence_level NOT NULL DEFAULT 'medium',
    last_verified_date DATE
);

CREATE INDEX idx_kitchen_species ON kitchen_plants (species);
CREATE INDEX idx_kitchen_plant_type ON kitchen_plants (plant_type);


-- Cut flowers
CREATE TABLE cut_flowers (
    variety_id TEXT PRIMARY KEY,
    species TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,

    plant_type TEXT,
    days_to_maturity_min INTEGER,
    days_to_maturity_max INTEGER,
    sun_requirement TEXT,

    -- Spacing
    spacing_inches_min INTEGER,
    spacing_inches_max INTEGER,

    -- Cut flower specifics
    start_method TEXT,
    pinch_at_height_inches INTEGER,
    stem_length_inches_min INTEGER,
    stem_length_inches_max INTEGER,
    bloom_size_inches_min NUMERIC(4,1),
    bloom_size_inches_max NUMERIC(4,1),
    vase_life_days_min INTEGER,
    vase_life_days_max INTEGER,
    cut_and_come_again BOOLEAN,
    succession_interval_days INTEGER,
    bloom_color TEXT,

    -- Perennial-specific
    usda_zone_perennial_min INTEGER,
    usda_zone_perennial_max INTEGER,
    overwintering_method TEXT,

    -- Notes
    variety_notes TEXT,

    -- Provenance
    sources TEXT[],
    source_notes TEXT,
    confidence confidence_level NOT NULL DEFAULT 'medium',
    last_verified_date DATE
);

CREATE INDEX idx_cut_flowers_species ON cut_flowers (species);
CREATE INDEX idx_cut_flowers_cut_come_again ON cut_flowers (cut_and_come_again);


-- Field crops (corn, pumpkins, grains, cover crops)
CREATE TABLE field_crops (
    variety_id TEXT PRIMARY KEY,
    species TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,

    crop_type TEXT,
    sugar_genetic_type TEXT,  -- sweet corn: su/se/sh2/synergistic
    days_to_maturity_min INTEGER,
    days_to_maturity_max INTEGER,

    -- Corn-specific (nullable for non-corn)
    ear_length_inches_min INTEGER,
    ear_length_inches_max INTEGER,
    plant_height_ft_min INTEGER,
    plant_height_ft_max INTEGER,
    rows_per_ear_min INTEGER,
    rows_per_ear_max INTEGER,

    -- Spacing
    plant_spacing_inches INTEGER,
    row_spacing_inches_min INTEGER,
    row_spacing_inches_max INTEGER,
    min_block_rows INTEGER,
    isolation_requirement TEXT,

    -- Use
    use_types TEXT[],
    soil_temp_minimum_f INTEGER,
    open_pollinated_or_hybrid TEXT,

    -- Notes
    disease_resistance TEXT,
    variety_notes TEXT,

    -- Provenance
    sources TEXT[],
    source_notes TEXT,
    confidence confidence_level NOT NULL DEFAULT 'medium',
    last_verified_date DATE
);

CREATE INDEX idx_field_crops_species ON field_crops (species);
CREATE INDEX idx_field_crops_crop_type ON field_crops (crop_type);


-- ============================================================================
-- USER TABLES
-- ============================================================================

-- Profiles (extends auth.users with app-specific data)
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    units_preference TEXT NOT NULL DEFAULT 'imperial',  -- 'imperial' or 'metric'
    experience_level TEXT,  -- 'beginner' | 'intermediate' | 'experienced'
    timezone TEXT DEFAULT 'America/New_York',
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Properties (a user may have multiple — e.g., home + cabin)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,

    -- Location
    address TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    elevation_ft INTEGER,

    -- Size
    total_acreage NUMERIC(8,3),

    -- Cached climate data (refreshed when coordinates change)
    usda_zone TEXT,
    usda_zone_refreshed_at TIMESTAMPTZ,
    avg_last_frost_date DATE,  -- any year — we use month/day
    avg_first_frost_date DATE,
    growing_season_days INTEGER,
    annual_chill_hours INTEGER,
    climate_refreshed_at TIMESTAMPTZ,

    -- Soil (from USDA Web Soil Survey)
    soil_type TEXT,
    soil_ph_min NUMERIC(3,1),
    soil_ph_max NUMERIC(3,1),
    soil_notes TEXT,

    -- Metadata
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_user_id ON properties (user_id);


-- Plots (sections within a property — orchard, kitchen garden, cut flower bed)
CREATE TABLE plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    category plot_category NOT NULL,

    -- Dimensions (imperial; frontend can convert)
    length_ft NUMERIC(8,2),
    width_ft NUMERIC(8,2),
    area_sqft NUMERIC(10,2) GENERATED ALWAYS AS (length_ft * width_ft) STORED,

    -- Site
    sun_hours INTEGER,  -- hours of direct sun
    sun_exposure TEXT,  -- 'full_sun' | 'part_shade' | 'shade'
    slope_direction TEXT,  -- N/S/E/W/flat
    slope_percent NUMERIC(5,2),

    -- Polygon on property map (GeoJSON as JSONB — defer full PostGIS to v2)
    map_geometry JSONB,

    -- Notes
    description TEXT,
    soil_amendments TEXT,
    irrigation_type TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plots_property ON plots (property_id);
CREATE INDEX idx_plots_user ON plots (user_id);
CREATE INDEX idx_plots_category ON plots (category);


-- Plantings (a variety planted in a plot for a season)
--
-- variety_table + variety_id together reference one of the 4 seed tables.
-- Check constraint enforces valid combinations; see trigger below for
-- existence check.
CREATE TABLE plantings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Variety reference (polymorphic via variety_table enum)
    variety_table variety_source NOT NULL,
    variety_id TEXT NOT NULL,

    -- Timing
    season_year INTEGER NOT NULL,  -- the year this planting is active
    planned_start_date DATE,       -- when to start seeds or plant
    actual_planted_date DATE,
    expected_harvest_start DATE,
    expected_harvest_end DATE,

    -- Quantity
    quantity INTEGER NOT NULL DEFAULT 1,
    quantity_unit TEXT NOT NULL DEFAULT 'plants',  -- 'plants' | 'row_feet' | 'sqft'

    -- Status
    status planting_status NOT NULL DEFAULT 'planned',

    -- Notes
    notes TEXT,
    failure_reason TEXT,  -- if status='failed'

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_plantings_plot ON plantings (plot_id);
CREATE INDEX idx_plantings_user ON plantings (user_id);
CREATE INDEX idx_plantings_season ON plantings (season_year);
CREATE INDEX idx_plantings_status ON plantings (status);
CREATE INDEX idx_plantings_variety ON plantings (variety_table, variety_id);


-- Tasks (auto-generated + user-created)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Optional links to other entities
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
    planting_id UUID REFERENCES plantings(id) ON DELETE CASCADE,

    -- Task content
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority INTEGER NOT NULL DEFAULT 3,  -- 1=high, 5=low

    -- Source & status
    source task_source NOT NULL DEFAULT 'user_created',
    status task_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user ON tasks (user_id);
CREATE INDEX idx_tasks_due_date ON tasks (due_date) WHERE status = 'pending';
CREATE INDEX idx_tasks_planting ON tasks (planting_id);


-- Harvests (tracked yields — learning loop for future seasons)
CREATE TABLE harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planting_id UUID NOT NULL REFERENCES plantings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    harvest_date DATE NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    quantity_unit TEXT NOT NULL,  -- 'lbs' | 'count' | 'bushels' | 'stems' | 'pints'
    quality_rating INTEGER,  -- 1-5 stars
    notes TEXT,
    photo_urls TEXT[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_harvests_planting ON harvests (planting_id);
CREATE INDEX idx_harvests_user_date ON harvests (user_id, harvest_date);


-- Notes (freeform observations — linked to property/plot/planting)
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Optional links
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
    planting_id UUID REFERENCES plantings(id) ON DELETE CASCADE,

    content TEXT NOT NULL,  -- markdown
    photo_urls TEXT[],
    tags TEXT[],

    observed_at DATE,  -- what date is this note about (can differ from created_at)

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_user ON notes (user_id);
CREATE INDEX idx_notes_planting ON notes (planting_id);
CREATE INDEX idx_notes_plot ON notes (plot_id);


-- ============================================================================
-- TRIGGERS — updated_at maintenance + referential integrity for plantings
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plots_updated BEFORE UPDATE ON plots FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plantings_updated BEFORE UPDATE ON plantings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Ensures plantings.variety_id actually exists in the table named by variety_table.
-- This replaces strict foreign-key enforcement (which we can't do with
-- polymorphic refs).
CREATE OR REPLACE FUNCTION check_planting_variety_exists()
RETURNS TRIGGER AS $$
DECLARE
    variety_exists BOOLEAN;
BEGIN
    CASE NEW.variety_table
        WHEN 'trees' THEN
            SELECT EXISTS(SELECT 1 FROM trees WHERE variety_id = NEW.variety_id) INTO variety_exists;
        WHEN 'kitchen_plants' THEN
            SELECT EXISTS(SELECT 1 FROM kitchen_plants WHERE variety_id = NEW.variety_id) INTO variety_exists;
        WHEN 'cut_flowers' THEN
            SELECT EXISTS(SELECT 1 FROM cut_flowers WHERE variety_id = NEW.variety_id) INTO variety_exists;
        WHEN 'field_crops' THEN
            SELECT EXISTS(SELECT 1 FROM field_crops WHERE variety_id = NEW.variety_id) INTO variety_exists;
    END CASE;

    IF NOT variety_exists THEN
        RAISE EXCEPTION 'Variety % not found in table %', NEW.variety_id, NEW.variety_table;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plantings_variety_check
BEFORE INSERT OR UPDATE OF variety_table, variety_id ON plantings
FOR EACH ROW EXECUTE FUNCTION check_planting_variety_exists();


-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Seed tables: all authenticated users can SELECT; nobody can INSERT/UPDATE/DELETE
-- (service_role bypasses RLS for admin imports)
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seed data readable by all authenticated users"
    ON trees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Seed data readable by all authenticated users"
    ON kitchen_plants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Seed data readable by all authenticated users"
    ON cut_flowers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Seed data readable by all authenticated users"
    ON field_crops FOR SELECT TO authenticated USING (true);


-- User tables: owners only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);


ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own properties"
    ON properties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own plots"
    ON plots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


ALTER TABLE plantings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own plantings"
    ON plantings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own tasks"
    ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own harvests"
    ON harvests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own notes"
    ON notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- GRANTS (Supabase convention)
-- ============================================================================

-- Authenticated users can SELECT seed tables
GRANT SELECT ON trees, kitchen_plants, cut_flowers, field_crops TO authenticated;

-- Authenticated users get full CRUD on user tables (RLS filters rows)
GRANT ALL ON profiles, properties, plots, plantings, tasks, harvests, notes TO authenticated;

-- Anon users can't read anything — auth required throughout
