import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 0;

export async function GET() {
  try {
    const db = getSupabaseAdmin();

    // Find the most recent month_label in the archive
    const { data: latest } = await db
      .from("monthly_leaderboard_archive")
      .select("month_label")
      .order("month_label", { ascending: false })
      .limit(1)
      .single();

    if (!latest) return NextResponse.json({ month: null, top: [] });

    const { data, error } = await db
      .from("monthly_leaderboard_archive")
      .select("rank, nickname, car_make, car_model, distance_m")
      .eq("month_label", latest.month_label)
      .order("rank", { ascending: true })
      .limit(3);

    if (error) throw error;

    return NextResponse.json({ month: latest.month_label, top: data ?? [] });
  } catch (err) {
    console.error("[leaderboard/last-month]", err);
    return NextResponse.json({ month: null, top: [] });
  }
}
