import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN      = process.env.TELEGRAM_BOT_TOKEN      ?? "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL     ?? "";

/** Call the Telegram Bot API */
async function telegram(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

export async function POST(req: NextRequest) {
  try {
    // Validate the secret token Telegram sends in the header
    if (
      WEBHOOK_SECRET &&
      req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET
    ) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const update = await req.json();
    const message = update?.message ?? update?.edited_message;
    if (!message) return NextResponse.json({ ok: true });

    const text   = (message.text ?? "") as string;
    const chatId = message.chat?.id as number;

    // Handle /start command
    if (text.startsWith("/start")) {
      await telegram("sendMessage", {
        chat_id: chatId,
        text: "🏎️ *JDM Racer Map*\n\nApasă butonul de mai jos pentru a deschide harta live a comunității.",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🗺️ Deschide Harta",
              web_app: { url: APP_URL },
            },
          ]],
        },
      });
    }

    // Always return 200 — Telegram retries on any other status
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // still 200 to stop retries
  }
}

/** Simple health-check for the webhook URL */
export async function GET() {
  return NextResponse.json({ ok: true, webhook: "jdm-racer-map" });
}
