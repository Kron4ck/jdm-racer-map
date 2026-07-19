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
    };

    const { initData, lat, lng } = body;

    if (!initData || lat == null || lng == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
      return NextResponse.json({ error: "Racer not found" }, { status: 404 });
    }

    // Update only lat/lng — the DB trigger sets updated_at automatically.
    // is_active is NOT touched here (only toggle changes it).
    const { error } = await db
      .from("live_locations")
      .update({ lat, lng })
      .eq("racer_id", racer.id)
      .eq("is_active", true); // safety: only update if still active

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[location/update]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
