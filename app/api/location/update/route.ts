import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const MIN_DELTA_M = 5; // ignore GPS noise below 5 m

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      initData?: string;
      lat?: number;
      lng?: number;
    };

    const { initData, lat, lng } = body;

    if (!initData || lat == null || lng == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) return NextResponse.json({ error: "Invalid auth" }, { status: 401 });

    const db = getSupabaseAdmin();

    const { data: racer } = await db
      .from("racers")
      .select("id")
      .eq("telegram_id", user.telegram_id)
      .single();

    if (!racer) return NextResponse.json({ error: "Racer not found" }, { status: 404 });

    // Fetch current location row to calculate delta distance
    const { data: loc } = await db
      .from("live_locations")
      .select("last_lat, last_lng, session_distance_m")
      .eq("racer_id", racer.id)
      .eq("is_active", true)
      .single();

    if (!loc) return NextResponse.json({ ok: true }); // session ended, silently ignore

    let newDistance = loc.session_distance_m ?? 0;

    if (loc.last_lat != null && loc.last_lng != null) {
      const delta = haversineMeters(loc.last_lat, loc.last_lng, lat, lng);
      if (delta >= MIN_DELTA_M) {
        newDistance += delta;
      }
    }

    const { error } = await db
      .from("live_locations")
      .update({
        lat,
        lng,
        last_lat:           lat,
        last_lng:           lng,
        session_distance_m: newDistance,
      })
      .eq("racer_id", racer.id)
      .eq("is_active", true);

    if (error) throw error;

    return NextResponse.json({ ok: true, distanceM: newDistance });
  } catch (err) {
    console.error("[location/update]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
