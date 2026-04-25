/**
 * Horticulture rules engine (placeholder for Phase 3).
 *
 * This module surfaces domain-specific warnings to users — pollination
 * incompatibilities, day-length mismatches, vine borer risks, etc. The full
 * rule set is documented in docs/BRIEF.md section 9.
 *
 * Most rules are data-driven (encoded in the seed CSVs) and live in the
 * Supabase helper functions:
 *   - check_pollination_compatible(a, b)
 *   - list_compatible_pollinators(variety)
 *   - trees_suitable_for_property(zone, chill_hours)
 *
 * App-level rules that aren't data-driven (e.g., onion day-length warnings
 * based on the user's latitude) will be implemented here in Phase 3.
 */

export {};
