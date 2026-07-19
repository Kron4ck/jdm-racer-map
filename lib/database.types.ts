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
          id:            string;
          telegram_id:   number;
          username:      string | null;
          display_name:  string | null;
          avatar_url:    string | null;
          created_at:    string;
          nickname:                      string | null;
          car_make:                      string | null;
          car_model:                     string | null;
          car_photo_url:                 string | null;
          convoy_notifications_enabled:  boolean;
          total_distance_m:              number;
        };
        Insert: {
          id?:                             string;
          telegram_id:                     number;
          username?:                       string | null;
          display_name?:                   string | null;
          avatar_url?:                     string | null;
          created_at?:                     string;
          nickname?:                       string | null;
          car_make?:                       string | null;
          car_model?:                      string | null;
          car_photo_url?:                  string | null;
          convoy_notifications_enabled?:   boolean;
          total_distance_m?:               number;
        };
        Update: {
          id?:                             string;
          telegram_id?:                    number;
          username?:                       string | null;
          display_name?:                   string | null;
          avatar_url?:                     string | null;
          created_at?:                     string;
          nickname?:                       string | null;
          car_make?:                       string | null;
          car_model?:                      string | null;
          car_photo_url?:                  string | null;
          convoy_notifications_enabled?:   boolean;
          total_distance_m?:               number;
        };
        Relationships: [];
      };

      live_locations: {
        Row: {
          id:                 string;
          racer_id:           string;
          lat:                number;
          lng:                number;
          is_active:          boolean;
          updated_at:         string;
          session_distance_m: number;
          last_lat:           number | null;
          last_lng:           number | null;
        };
        Insert: {
          id?:                 string;
          racer_id:            string;
          lat:                 number;
          lng:                 number;
          is_active?:          boolean;
          updated_at?:         string;
          session_distance_m?: number;
          last_lat?:           number | null;
          last_lng?:           number | null;
        };
        Update: {
          id?:                 string;
          racer_id?:           string;
          lat?:                number;
          lng?:                number;
          is_active?:          boolean;
          updated_at?:         string;
          session_distance_m?: number;
          last_lat?:           number | null;
          last_lng?:           number | null;
        };
        Relationships: [
          {
            foreignKeyName: "live_locations_racer_id_fkey";
            columns: ["racer_id"];
            isOneToOne: true;
            referencedRelation: "racers";
            referencedColumns: ["id"];
          },
        ];
      };

      speed_records: {
        Row: {
          id:             string;
          racer_id:       string;
          best_speed_kmh: number;
          recorded_at:    string;
        };
        Insert: {
          id?:             string;
          racer_id:        string;
          best_speed_kmh:  number;
          recorded_at?:    string;
        };
        Update: {
          id?:             string;
          racer_id?:       string;
          best_speed_kmh?: number;
          recorded_at?:    string;
        };
        Relationships: [
          {
            foreignKeyName: "speed_records_racer_id_fkey";
            columns: ["racer_id"];
            isOneToOne: false;
            referencedRelation: "racers";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views:          Record<never, never>;

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

    Enums:          Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
