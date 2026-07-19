import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

export async function GET(req: NextRequest) {
  try {
    const initData = req.nextUrl.searchParams.get("initData");
    if (!initData) return NextResponse.json({ error: "initData missing" }, { status: 400 });

    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) return NextResponse.json({ error: "Invalid auth" }, { status: 401 });

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("racers")
      .select("id, display_name, avatar_url, nickname, car_make, car_model, car_photo_url, convoy_notifications_enabled")
      .eq("telegram_id", user.telegram_id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Racer not found" }, { status: 404 });

    return NextResponse.json({ racer: data });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      initData?:                      string;
      nickname?:                      string;
      car_make?:                      string;
      car_model?:                     string;
      convoy_notifications_enabled?:  boolean;
    };

    const { initData, nickname, car_make, car_model, convoy_notifications_enabled } = body;
    if (!initData) return NextResponse.json({ error: "initData missing" }, { status: 400 });

    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) return NextResponse.json({ error: "Invalid auth" }, { status: 401 });

    const db = getSupabaseAdmin();

    const updatePayload: Record<string, unknown> = {};
    if (nickname  !== undefined) updatePayload.nickname  = nickname?.trim()  || null;
    if (car_make  !== undefined) updatePayload.car_make  = car_make?.trim()  || null;
    if (car_model !== undefined) updatePayload.car_model = car_model?.trim() || null;
    if (convoy_notifications_enabled !== undefined) {
      updatePayload.convoy_notifications_enabled = convoy_notifications_enabled;
    }

    const { error } = await db
      .from("racers")
      .update(updatePayload)
      .eq("telegram_id", user.telegram_id);

    if (error) {
      console.error("[profile POST]", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
