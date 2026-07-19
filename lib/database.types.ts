/**
 * Hand-written types that mirror the schema in
 * supabase/migrations/20260719000000_init_schema.sql
 *
 * When Supabase CLI is wired up, replace this file with:
 *   supabase gen types typescript --linked > lib/database.types.ts
 */

export type Database = {
  public: {
    Tables: {
      racers: {
        Row: {
          id:           string;
          telegram_id:  number;
          username:     string | null;
          display_name: string | null;
          avatar_url:   string | null;
          created_at:   string;
        };
        Insert: {
          id?:           string;
          telegram_id:   number;
          username?:     string | null;
          display_name?: string | null;
          avatar_url?:   string | null;
          created_at?:   string;
        };
        Update: {
          id?:           string;
          telegram_id?:  number;
          username?:     string | null;
          display_name?: string | null;
          avatar_url?:   string | null;
          created_at?:   string;
        };
      };

      live_locations: {
        Row: {
          id:         string;
          racer_id:   string;
          lat:        number;
          lng:        number;
          is_active:  boolean;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          racer_id:    string;
          lat:         number;
          lng:         number;
          is_active?:  boolean;
          updated_at?: string;
        };
        Update: {
          id?:         string;
          racer_id?:   string;
          lat?:        number;
          lng?:        number;
          is_active?:  boolean;
          updated_at?: string;
        };
      };

      speed_records: {
        Row: {
          id:               string;
          racer_id:         string;
          best_speed_kmh:   number;
          recorded_at:      string;
        };
        Insert: {
          id?:               string;
          racer_id:          string;
          best_speed_kmh:    number;
          recorded_at?:      string;
        };
        Update: {
          id?:               string;
          racer_id?:         string;
          best_speed_kmh?:   number;
          recorded_at?:      string;
        };
      };
    };

    Functions: {
      current_telegram_id: {
        Args:    Record<never, never>;
        Returns: number;
      };
      current_racer_id: {
        Args:    Record<never, never>;
        Returns: string;
      };
    };

    Enums: Record<never, never>;
  };
};
