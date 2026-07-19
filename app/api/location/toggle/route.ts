import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      initData?: string;
      lat?: number;
      lng?: number;
      action?: string;
    };

    const { initData, lat, lng, action } = body;

    if (!initData || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (action !== "activate" && action !== "deactivate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (action === "activate" && (lat == null || lng == null)) {
      return NextResponse.json({ error: "lat/lng required for activate" }, { status: 400 });
    }

    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) {
      return NextResponse.json({ error: "Invalid auth" }, { status: 401 });
    }

    const db = getSupabaseAdmin();

    const { data: racer } = await db
      .from("racers")
      .select("id")
      .eq("telegram_id", user.telegram_id)
      .single();

    if (!racer) {
      return NextResponse.json({ error: "Racer not found — call /api/auth first" }, { status: 404 });
    }

    if (action === "activate") {
      const { error } = await db.from("live_locations").upsert(
        {
          racer_id:           racer.id,
          lat:                lat!,
          lng:                lng!,
          is_active:          true,
          updated_at:         new Date().toISOString(),
          session_distance_m: 0,       // reset distance for new session
          last_lat:           lat!,
          last_lng:           lng!,
        },
        { onConflict: "racer_id" },
      );
      if (error) throw error;
    } else {
      const { error } = await db
        .from("live_locations")
        .update({ is_active: false })
        .eq("racer_id", racer.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[location/toggle]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
