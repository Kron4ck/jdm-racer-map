import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

async function getAdminRacer(initData: string) {
  const user = validateTelegramInitData(initData, BOT_TOKEN);
  if (!user) return null;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("racers")
    .select("id, is_admin")
    .eq("telegram_id", user.telegram_id)
    .single();

  if (!data?.is_admin) return null;
  return data;
}

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("points_of_interest")
      .select("id, title, description, lat, lng, icon_type, created_by, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ pois: data ?? [] });
  } catch (err) {
    console.error("[poi GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      initData?:    string;
      title?:       string;
      description?: string;
      lat?:         number;
      lng?:         number;
      icon_type?:   string;
    };

    const { initData, title, description, lat, lng, icon_type } = body;

    if (!initData) return NextResponse.json({ error: "initData missing" }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ error: "Titlul e obligatoriu" }, { status: 400 });
    if (lat == null || lng == null) return NextResponse.json({ error: "Coordonate lipsă" }, { status: 400 });

    const racer = await getAdminRacer(initData);
    if (!racer) return NextResponse.json({ error: "Acces interzis" }, { status: 403 });

    const db = getSupabaseAdmin();
    const { error } = await db.from("points_of_interest").insert({
      title:       title.trim(),
      description: description?.trim() || null,
      lat,
      lng,
      icon_type:   icon_type ?? "default",
      created_by:  racer.id,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[poi POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { initData?: string; poi_id?: string };
    const { initData, poi_id } = body;

    if (!initData) return NextResponse.json({ error: "initData missing" }, { status: 400 });
    if (!poi_id)   return NextResponse.json({ error: "poi_id missing" }, { status: 400 });

    const racer = await getAdminRacer(initData);
    if (!racer) return NextResponse.json({ error: "Acces interzis" }, { status: 403 });

    const db = getSupabaseAdmin();
    const { error } = await db.from("points_of_interest").delete().eq("id", poi_id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[poi DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
