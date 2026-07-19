import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 0;

export async function GET() {
  try {
    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from("racers")
      .select("id, nickname, display_name, car_make, car_model, avatar_url, total_distance_m")
      .eq("exclude_from_leaderboard", false)
      .order("total_distance_m", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ leaderboard: data ?? [] });
  } catch (err) {
    console.error("[leaderboard/distance]", err);
    return NextResponse.json({ leaderboard: [] }, { status: 500 });
  }
}
