/**
 * Database schema types — match the Supabase tables from /docs/sql/01_schema.sql
 *
 * To regenerate from your live Supabase project:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 *
 * Conformance: this file matches @supabase/supabase-js's GenericSchema shape:
 *   Tables: each has Row, Insert, Update, Relationships
 *   Views:  each has Row (and Relationships for completeness)
 *   Functions: each has Args, Returns
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// Enums
// ============================================================================

export type VarietySource = 'trees' | 'kitchen_plants' | 'cut_flowers' | 'field_crops';

export type PlotCategory =
  | 'orchard'
  | 'kitchen_garden'
  | 'cut_flower_bed'
  | 'field_crop'
  | 'mixed';

export type PlantingStatus =
  | 'planned'
  | 'planted'
  | 'harvested'
  | 'failed'
  | 'archived';

export type TaskStatus = 'pending' | 'done' | 'skipped' | 'overdue';
export type TaskSource = 'auto_generated' | 'user_created';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// ============================================================================
// Database
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          units_preference: string;
          experience_level: string | null;
          timezone: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          units_preference?: string;
          experience_level?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          units_preference?: string;
          experience_level?: string | null;
          timezone?: string;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };

      properties: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          elevation_ft: number | null;
          total_acreage: number | null;
          usda_zone: string | null;
          usda_zone_refreshed_at: string | null;
          avg_last_frost_date: string | null;
          avg_first_frost_date: string | null;
          growing_season_days: number | null;
          annual_chill_hours: number | null;
          climate_refreshed_at: string | null;
          soil_type: string | null;
          soil_ph_min: number | null;
          soil_ph_max: number | null;
          soil_notes: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          elevation_ft?: number | null;
          total_acreage?: number | null;
          usda_zone?: string | null;
          avg_last_frost_date?: string | null;
          avg_first_frost_date?: string | null;
          growing_season_days?: number | null;
          annual_chill_hours?: number | null;
          soil_type?: string | null;
          soil_ph_min?: number | null;
          soil_ph_max?: number | null;
          soil_notes?: string | null;
          is_primary?: boolean;
        };
        Update: {
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          elevation_ft?: number | null;
          total_acreage?: number | null;
          usda_zone?: string | null;
          avg_last_frost_date?: string | null;
          avg_first_frost_date?: string | null;
          growing_season_days?: number | null;
          annual_chill_hours?: number | null;
          soil_type?: string | null;
          soil_ph_min?: number | null;
          soil_ph_max?: number | null;
          soil_notes?: string | null;
          is_primary?: boolean;
        };
        Relationships: [];
      };

      plots: {
        Row: {
          id: string;
          property_id: string;
          user_id: string;
          name: string;
          category: PlotCategory;
          length_ft: number | null;
          width_ft: number | null;
          area_sqft: number | null;
          sun_hours: number | null;
          sun_exposure: string | null;
          slope_direction: string | null;
          slope_percent: number | null;
          map_geometry: Json | null;
          description: string | null;
          soil_amendments: string | null;
          irrigation_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id: string;
          name: string;
          category: PlotCategory;
          length_ft?: number | null;
          width_ft?: number | null;
          sun_hours?: number | null;
          sun_exposure?: string | null;
          slope_direction?: string | null;
          slope_percent?: number | null;
          map_geometry?: Json | null;
          description?: string | null;
          soil_amendments?: string | null;
          irrigation_type?: string | null;
        };
        Update: {
          name?: string;
          category?: PlotCategory;
          length_ft?: number | null;
          width_ft?: number | null;
          sun_hours?: number | null;
          sun_exposure?: string | null;
          slope_direction?: string | null;
          slope_percent?: number | null;
          map_geometry?: Json | null;
          description?: string | null;
          soil_amendments?: string | null;
          irrigation_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plots_property_id_fkey';
            columns: ['property_id'];
            isOneToOne: false;
            referencedRelation: 'properties';
            referencedColumns: ['id'];
          }
        ];
      };

      plantings: {
        Row: {
          id: string;
          plot_id: string;
          user_id: string;
          variety_table: VarietySource;
          variety_id: string;
          season_year: number;
          planned_start_date: string | null;
          actual_planted_date: string | null;
          expected_harvest_start: string | null;
          expected_harvest_end: string | null;
          quantity: number;
          quantity_unit: string;
          status: PlantingStatus;
          notes: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plot_id: string;
          user_id: string;
          variety_table: VarietySource;
          variety_id: string;
          season_year: number;
          planned_start_date?: string | null;
          actual_planted_date?: string | null;
          expected_harvest_start?: string | null;
          expected_harvest_end?: string | null;
          quantity?: number;
          quantity_unit?: string;
          status?: PlantingStatus;
          notes?: string | null;
        };
        Update: {
          season_year?: number;
          planned_start_date?: string | null;
          actual_planted_date?: string | null;
          expected_harvest_start?: string | null;
          expected_harvest_end?: string | null;
          quantity?: number;
          quantity_unit?: string;
          status?: PlantingStatus;
          notes?: string | null;
          failure_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plantings_plot_id_fkey';
            columns: ['plot_id'];
            isOneToOne: false;
            referencedRelation: 'plots';
            referencedColumns: ['id'];
          }
        ];
      };

      trees: {
        Row: {
          variety_id: string;
          species: string;
          variety_name: string;
          scientific_name: string;
          chill_hours_min: number | null;
          chill_hours_max: number | null;
          self_fertile: boolean | null;
          pollinators: string[] | null;
          years_to_first_fruit_min: number | null;
          years_to_first_fruit_max: number | null;
          ripening_season: string | null;
          usda_zone_min: number | null;
          usda_zone_max: number | null;
          mature_height_ft_min: number | null;
          mature_height_ft_max: number | null;
          tree_spacing_ft_min: number | null;
          tree_spacing_ft_max: number | null;
          training_system: string | null;
          disease_notes: string | null;
          variety_notes: string | null;
          sources: string[] | null;
          source_notes: string | null;
          confidence: ConfidenceLevel;
          last_verified_date: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };

      kitchen_plants: {
        Row: {
          variety_id: string;
          species: string;
          variety_name: string;
          scientific_name: string;
          plant_type: string | null;
          days_to_maturity_min: number | null;
          days_to_maturity_max: number | null;
          sun_requirement: string | null;
          spacing_inches_min: number | null;
          spacing_inches_max: number | null;
          row_spacing_inches: number | null;
          plants_per_sqft: number | null;
          start_method: string | null;
          growth_habit: string | null;
          mature_height_inches_min: number | null;
          mature_height_inches_max: number | null;
          first_harvest_year: number | null;
          productive_lifespan_years_min: number | null;
          productive_lifespan_years_max: number | null;
          usda_zone_min: number | null;
          usda_zone_max: number | null;
          disease_resistance: string | null;
          companion_notes: string | null;
          variety_notes: string | null;
          sources: string[] | null;
          source_notes: string | null;
          confidence: ConfidenceLevel;
          last_verified_date: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };

      cut_flowers: {
        Row: {
          variety_id: string;
          species: string;
          variety_name: string;
          scientific_name: string;
          plant_type: string | null;
          days_to_maturity_min: number | null;
          days_to_maturity_max: number | null;
          sun_requirement: string | null;
          spacing_inches_min: number | null;
          spacing_inches_max: number | null;
          start_method: string | null;
          pinch_at_height_inches: number | null;
          stem_length_inches_min: number | null;
          stem_length_inches_max: number | null;
          bloom_size_inches_min: number | null;
          bloom_size_inches_max: number | null;
          vase_life_days_min: number | null;
          vase_life_days_max: number | null;
          cut_and_come_again: boolean | null;
          succession_interval_days: number | null;
          bloom_color: string | null;
          usda_zone_perennial_min: number | null;
          usda_zone_perennial_max: number | null;
          overwintering_method: string | null;
          variety_notes: string | null;
          sources: string[] | null;
          source_notes: string | null;
          confidence: ConfidenceLevel;
          last_verified_date: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };

      field_crops: {
        Row: {
          variety_id: string;
          species: string;
          variety_name: string;
          scientific_name: string;
          crop_type: string | null;
          sugar_genetic_type: string | null;
          days_to_maturity_min: number | null;
          days_to_maturity_max: number | null;
          ear_length_inches_min: number | null;
          ear_length_inches_max: number | null;
          plant_height_ft_min: number | null;
          plant_height_ft_max: number | null;
          rows_per_ear_min: number | null;
          rows_per_ear_max: number | null;
          plant_spacing_inches: number | null;
          row_spacing_inches_min: number | null;
          row_spacing_inches_max: number | null;
          min_block_rows: number | null;
          isolation_requirement: string | null;
          use_types: string[] | null;
          soil_temp_minimum_f: number | null;
          open_pollinated_or_hybrid: string | null;
          disease_resistance: string | null;
          variety_notes: string | null;
          sources: string[] | null;
          source_notes: string | null;
          confidence: ConfidenceLevel;
          last_verified_date: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };

    Views: {
      all_varieties: {
        Row: {
          variety_id: string;
          variety_table: VarietySource;
          species: string;
          variety_name: string;
          scientific_name: string;
          notes: string | null;
          confidence: ConfidenceLevel;
        };
        Relationships: [];
      };
    };

    Functions: {
      check_pollination_compatible: {
        Args: { variety_a: string; variety_b: string };
        Returns: { compatible: boolean; reason: string }[];
      };
      list_compatible_pollinators: {
        Args: { target_variety: string };
        Returns: {
          pollinator_variety_id: string;
          pollinator_variety_name: string;
          pollinator_species: string;
          pollinator_ripening: string | null;
        }[];
      };
      trees_suitable_for_property: {
        Args: { zone_num: number; available_chill_hours: number };
        Returns: {
          variety_id: string;
          variety_name: string;
          species: string;
          zone_fit: boolean;
          chill_fit: boolean;
          notes: string;
        }[];
      };
    };

    Enums: {
      variety_source: VarietySource;
      plot_category: PlotCategory;
      planting_status: PlantingStatus;
      task_status: TaskStatus;
      task_source: TaskSource;
      confidence_level: ConfidenceLevel;
    };

    CompositeTypes: Record<never, never>;
  };
}
