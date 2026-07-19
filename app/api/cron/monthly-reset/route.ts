import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron invocations.
// The same header is used when calling manually (for testing).
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();

    // "YYYY-MM" of the month that just ended
    const now  = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthLabel = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

    // Fetch all racers sorted by total_distance_m descending
    const { data: racers, error: fetchErr } = await db
      .from("racers")
      .select("id, nickname, display_name, car_make, car_model, total_distance_m")
      .order("total_distance_m", { ascending: false });

    if (fetchErr) throw fetchErr;
    if (!racers?.length) return NextResponse.json({ ok: true, archived: 0, reset: 0 });

    // Archive only racers who actually drove this month (distance > 0)
    const toArchive = racers.filter((r) => (r.total_distance_m ?? 0) > 0);

    if (toArchive.length > 0) {
      const rows = toArchive.map((r, i) => ({
        month_label: monthLabel,
        racer_id:    r.id,
        nickname:    r.nickname ?? r.display_name ?? null,
        car_make:    r.car_make  ?? null,
        car_model:   r.car_model ?? null,
        distance_m:  r.total_distance_m,
        rank:        i + 1,
      }));

      const { error: insertErr } = await db
        .from("monthly_leaderboard_archive")
        .insert(rows);

      if (insertErr) throw insertErr;
    }

    // Reset total_distance_m for everyone
    const { error: resetErr } = await db
      .from("racers")
      .update({ total_distance_m: 0 })
      .gte("total_distance_m", 0); // matches all rows

    if (resetErr) throw resetErr;

    console.log(`[monthly-reset] Archived ${toArchive.length} racers for ${monthLabel}`);
    return NextResponse.json({ ok: true, month: monthLabel, archived: toArchive.length });
  } catch (err) {
    console.error("[monthly-reset]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
