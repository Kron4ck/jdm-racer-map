import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Racer } from "@/lib/supabase";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json() as { initData?: string };

    if (!initData) {
      return NextResponse.json({ error: "initData missing" }, { status: 400 });
    }

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "Bot not configured" }, { status: 503 });
    }

    // 1. Validate signature
    const user = validateTelegramInitData(initData, BOT_TOKEN);
    if (!user) {
      return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
    }

    // 2. Upsert racer (service-role bypasses RLS for this trusted operation)
    const db = getSupabaseAdmin();
    const display_name = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");

    const { data, error } = await db
      .from("racers")
      .upsert(
        {
          telegram_id:  user.telegram_id,
          username:     user.username,
          display_name,
          avatar_url:   user.photo_url,
        },
        { onConflict: "telegram_id" },
      )
      .select("id, telegram_id, display_name, avatar_url")
      .single();

    if (error) {
      console.error("[auth] upsert error:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ racer: data as Pick<Racer, "id" | "telegram_id" | "display_name" | "avatar_url"> });
  } catch (err) {
    console.error("[auth] unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
