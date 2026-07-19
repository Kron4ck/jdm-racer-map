import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

const ALLOWED_MESSAGES = new Set(["🔥", "👋 Salut!", "🏁 Vin!", "📍 Unde ești?", "💨 Let's go!"]);
const RATE_LIMIT_MS    = 5_000;

/* Module-level map — best-effort rate limit per warm serverless instance */
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      initData?:        string;
      target_racer_id?: string;
      message?:         string;
    };

    const { initData, target_racer_id, message } = body;

    if (!initData)        return NextResponse.json({ error: "initData missing" },        { status: 400 });
    if (!target_racer_id) return NextResponse.json({ error: "target_racer_id missing" }, { status: 400 });
    if (!message || !ALLOWED_MESSAGES.has(message))
      return NextResponse.json({ error: "Mesaj nepermis" }, { status: 400 });

    const sender = validateTelegramInitData(initData, BOT_TOKEN);
    if (!sender) return NextResponse.json({ error: "Invalid auth" }, { status: 401 });

    const db = getSupabaseAdmin();

    /* Get sender info */
    const { data: senderRacer } = await db
      .from("racers")
      .select("id, nickname, display_name")
      .eq("telegram_id", sender.telegram_id)
      .single();

    if (!senderRacer) return NextResponse.json({ error: "Racer not found" }, { status: 404 });
    if (senderRacer.id === target_racer_id)
      return NextResponse.json({ error: "Nu poți trimite ție însuți" }, { status: 400 });

    /* Rate limit: 1 reaction per 5s per sender→target pair */
    const rlKey  = `${senderRacer.id}:${target_racer_id}`;
    const lastAt = rateLimitMap.get(rlKey) ?? 0;
    if (Date.now() - lastAt < RATE_LIMIT_MS)
      return NextResponse.json({ error: "Prea repede, mai așteaptă puțin" }, { status: 429 });
    rateLimitMap.set(rlKey, Date.now());

    /* Get target telegram_id */
    const { data: targetRacer } = await db
      .from("racers")
      .select("telegram_id")
      .eq("id", target_racer_id)
      .single();

    if (!targetRacer) return NextResponse.json({ error: "Destinatar negăsit" }, { status: 404 });

    const senderNick = senderRacer.nickname?.trim() || senderRacer.display_name || "Un racer";
    const text = `🏁 ${senderNick} îți trimite: ${message}`;

    /* Send Telegram DM — fire & forget errors (user may not have started bot) */
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: targetRacer.telegram_id, text }),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reaction/send]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
