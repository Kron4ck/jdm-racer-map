import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 0; // never cache — always fresh

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString(); // 3 min ago

    const { data, error } = await db
      .from("live_locations")
      .select("racer_id, lat, lng, updated_at, racers(display_name, avatar_url)")
      .eq("is_active", true)
      .gt("updated_at", cutoff);

    if (error) throw error;

    // Flatten join — racers() comes back as an object (one-to-one FK)
    const racers = (data ?? []).map((row) => {
      const racer = row.racers as { display_name: string | null; avatar_url: string | null } | null;
      return {
        racer_id:     row.racer_id,
        lat:          row.lat,
        lng:          row.lng,
        updated_at:   row.updated_at,
        display_name: racer?.display_name ?? null,
        avatar_url:   racer?.avatar_url   ?? null,
      };
    });

    return NextResponse.json({ racers });
  } catch (err) {
    console.error("[location/active]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
