import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// ── Typed Supabase client ──────────────────────────────────────────

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Default client — uses the anon key.
 * RLS policies enforce per-user access based on the JWT's telegram_id claim.
 * Call `supabase.auth.setSession({ access_token })` after the Telegram auth
 * Edge Function returns a signed JWT to activate per-user policies.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!,
);

// ── Convenience row types ─────────────────────────────────────────

export type Racer         = Database["public"]["Tables"]["racers"]["Row"];
export type RacerInsert   = Database["public"]["Tables"]["racers"]["Insert"];
export type RacerUpdate   = Database["public"]["Tables"]["racers"]["Update"];

export type LiveLocation        = Database["public"]["Tables"]["live_locations"]["Row"];
export type LiveLocationInsert  = Database["public"]["Tables"]["live_locations"]["Insert"];
export type LiveLocationUpdate  = Database["public"]["Tables"]["live_locations"]["Update"];

export type SpeedRecord       = Database["public"]["Tables"]["speed_records"]["Row"];
export type SpeedRecordInsert = Database["public"]["Tables"]["speed_records"]["Insert"];

// ── Typed query helpers ───────────────────────────────────────────
//  Ready-to-use typed references; call .select(), .upsert(), etc. on them.

export const racersTable        = () => supabase.from("racers");
export const liveLocationsTable = () => supabase.from("live_locations");
export const speedRecordsTable  = () => supabase.from("speed_records");
