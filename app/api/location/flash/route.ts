import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json() as { initData?: string };
    if (!initData) return NextResponse.json({ error: "initData missing" }, { status: 400 });

    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) return NextResponse.json({ error: "Invalid auth" }, { status: 401 });

    const db = getSupabaseAdmin();

    const { data: racer } = await db
      .from("racers")
      .select("id")
      .eq("telegram_id", user.telegram_id)
      .single();

    if (!racer) return NextResponse.json({ error: "Racer not found" }, { status: 404 });

    // Only flash if currently sharing location
    const { data: loc } = await db
      .from("live_locations")
      .select("is_active")
      .eq("racer_id", racer.id)
      .single();

    if (!loc?.is_active) {
      return NextResponse.json({ error: "Locația nu e activă" }, { status: 409 });
    }

    const { error } = await db
      .from("live_locations")
      .update({ flash_at: new Date().toISOString() })
      .eq("racer_id", racer.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[location/flash]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
