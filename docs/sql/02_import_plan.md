# Seed data import plan

Target: Supabase Postgres after `01_schema.sql` has been run.

## Why this needs transformation

Three things in the CSVs don't map directly to Postgres:

1. **`sources` and `pollinators` and `use_types`** are semicolon-separated strings. The schema defines them as `TEXT[]` arrays for clean querying ("find all trees that pollinate Lambert"). The import needs to split them.
2. **Booleans** are written as `TRUE`/`FALSE` strings. Postgres wants actual booleans.
3. **Empty strings** for numeric fields should become `NULL`, not zero.

Easiest path: import raw CSVs into staging tables with all-text columns, then `INSERT … SELECT` with transforms into the final tables.

## The three import methods

Pick one — they all end in the same place.

### Method A — Supabase Dashboard (simplest)

1. Go to **Table Editor → trees → Import data from CSV**
2. Upload `trees.csv`. Supabase maps columns by name automatically.
3. Before clicking Import: manually fix the array columns (`sources`, `pollinators`) — Supabase doesn't auto-convert strings to arrays. Leave them blank in the CSV, then run a follow-up UPDATE to populate.
4. Repeat for `kitchen_plants.csv`, `cut_flowers.csv`, `field_crops.csv`.

Works fine for one-time import. Annoying if you re-import after edits.

### Method B — SQL Editor with staging tables (most control)

Use `02_import_seed_data.sql` below. Creates staging tables, uses Supabase's storage.objects to host the CSVs, runs COPY, then INSERTs with transforms into the final tables. Rerunnable.

### Method C — psql from local machine

If you have the Supabase connection string:

```bash
psql "$SUPABASE_DB_URL" < 01_schema.sql
psql "$SUPABASE_DB_URL" -c "\COPY trees_staging FROM 'trees.csv' CSV HEADER"
# …etc
```

Then run the transform INSERTs from `02_import_seed_data.sql`.

## Column-by-column mapping

Every CSV column maps to a column of the same name in the target table, **with these transforms**:

### All four seed tables

| CSV column | Transform |
|---|---|
| `sources` | Split on `;`, trim whitespace → `TEXT[]` |
| `source_notes` | Keep as-is |
| `confidence` | Lowercase → `confidence_level` enum |
| `last_verified_date` | Parse `YYYY-MM-DD` → `DATE` |
| All `*_min`, `*_max`, other numeric cols | Empty string → `NULL`; otherwise cast to `INTEGER` or `NUMERIC` per schema |

### Trees additional

| CSV column | Transform |
|---|---|
| `self_fertile` | `'TRUE'` → `true`, `'FALSE'` → `false`, empty → `NULL` |
| `pollinators` | Split on `;`, trim → `TEXT[]` |

### Cut flowers additional

| CSV column | Transform |
|---|---|
| `cut_and_come_again` | `'TRUE'` → `true`, `'FALSE'` → `false`, empty → `NULL` |

### Field crops additional

| CSV column | Transform |
|---|---|
| `use_types` | Split on `;`, trim → `TEXT[]` (semicolon-separated in CSV) |

### Kitchen plants

No boolean or array transforms needed beyond the common set.

## Verification queries

After import, run these to confirm everything loaded:

```sql
-- Expected: trees 92, kitchen_plants 71, cut_flowers 53, field_crops 41
SELECT 'trees' AS table_name, COUNT(*) FROM trees
UNION ALL SELECT 'kitchen_plants', COUNT(*) FROM kitchen_plants
UNION ALL SELECT 'cut_flowers', COUNT(*) FROM cut_flowers
UNION ALL SELECT 'field_crops', COUNT(*) FROM field_crops;

-- Spot check: array fields populated
SELECT variety_id, pollinators FROM trees WHERE pollinators IS NOT NULL LIMIT 5;
SELECT variety_id, sources FROM kitchen_plants LIMIT 3;
SELECT variety_id, use_types FROM field_crops WHERE use_types IS NOT NULL LIMIT 5;

-- Spot check: booleans parsed
SELECT variety_id, self_fertile FROM trees WHERE self_fertile = true LIMIT 5;
SELECT variety_id, cut_and_come_again FROM cut_flowers WHERE cut_and_come_again = true LIMIT 5;

-- Spot check: confidence enum
SELECT confidence, COUNT(*) FROM trees GROUP BY confidence;
```

If any count is off, the COPY probably hit a bad row — check the error message in the SQL Editor output panel.
