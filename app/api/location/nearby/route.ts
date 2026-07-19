import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { haversineMeters } from "@/lib/geo-utils";

const CONVOY_RADIUS_M = 100;

export async function GET(req: NextRequest) {
  try {
    const racerId = req.nextUrl.searchParams.get("racer_id");
    if (!racerId) return NextResponse.json({ nearby: [] });

    const db = getSupabaseAdmin();

    // Fetch own position + convoy setting via join
    const { data: myLoc } = await db
      .from("live_locations")
      .select("lat, lng, racers(convoy_notifications_enabled)")
      .eq("racer_id", racerId)
      .eq("is_active", true)
      .single();

    if (!myLoc) return NextResponse.json({ nearby: [] });

    const myRacer = myLoc.racers as { convoy_notifications_enabled: boolean } | null;
    // If the user disabled convoy, return empty immediately
    if (!myRacer?.convoy_notifications_enabled) return NextResponse.json({ nearby: [] });

    // Fetch all other active racers (within last 3 min)
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const { data: others } = await db
      .from("live_locations")
      .select("racer_id, lat, lng, racers(nickname, display_name)")
      .eq("is_active", true)
      .gt("updated_at", cutoff)
      .neq("racer_id", racerId);

    if (!others?.length) return NextResponse.json({ nearby: [] });

    const nearby = others
      .map((r) => {
        const info = r.racers as { nickname: string | null; display_name: string | null } | null;
        const dist = haversineMeters(myLoc.lat, myLoc.lng, r.lat, r.lng);
        return {
          racer_id:   r.racer_id,
          name:       info?.nickname?.trim() || info?.display_name || "Racer",
          distance_m: Math.round(dist),
        };
      })
      .filter((r) => r.distance_m <= CONVOY_RADIUS_M);

    return NextResponse.json({ nearby });
  } catch (err) {
    console.error("[location/nearby]", err);
    return NextResponse.json({ nearby: [] });
  }
}
