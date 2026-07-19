# JDM Racer Map

Telegram Mini App pentru comunitatea JDM din Moldova/România — hartă live cu locațiile membrilor grupului.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Leaflet · Supabase · Telegram Bot API

---

## Setup local

```bash
git clone https://github.com/Kron4ck/jdm-racer-map.git
cd jdm-racer-map
npm install
cp .env.local.example .env.local   # sau editează .env.local direct
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

---

## Variabile de mediu

Copiază `.env.local` și completează valorile reale:

| Variabilă | De unde | Observații |
|-----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Nu expune pe client!** |
| `TELEGRAM_BOT_TOKEN` | @BotFather (vezi mai jos) | **Nu expune pe client!** |
| `TELEGRAM_WEBHOOK_SECRET` | Alege un string random (min 32 chars) | |
| `NEXT_PUBLIC_APP_URL` | URL-ul deployment-ului Vercel | ex: `https://jdm-racer-map.vercel.app` |

Pe Vercel, adaugă toate variabilele în **Project Settings → Environment Variables**.

---

## Configurare Telegram Bot

### 1. Creează botul la @BotFather

1. Deschide [@BotFather](https://t.me/BotFather) în Telegram
2. Trimite `/newbot`
3. Alege un **nume** (ex: `JDM Racer Map`) și un **username** (ex: `jdmracermap_bot`)
4. Copiază **token-ul** primit → pune-l în `TELEGRAM_BOT_TOKEN`

### 2. Activează Mini App (Web App)

În @BotFather:
```
/mybots → selectează botul → Bot Settings → Menu Button → Configure menu button
URL: https://jdm-racer-map.vercel.app
Text: 🗺️ Deschide Harta
```

Sau cu comanda `/setmenubutton`.

### 3. Setează webhook-ul

Înlocuiește `BOT_TOKEN`, `YOUR_SECRET` și `YOUR_VERCEL_URL` cu valorile reale:

```bash
curl "https://api.telegram.org/botBOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_VERCEL_URL/api/telegram/webhook" \
  -d "secret_token=YOUR_SECRET" \
  -d "allowed_updates=[\"message\",\"callback_query\"]"
```

Sau din browser (GET):
```
https://api.telegram.org/botBOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram/webhook&secret_token=YOUR_SECRET
```

### 4. Verifică webhook-ul

```bash
curl "https://api.telegram.org/botBOT_TOKEN/getWebhookInfo"
```

Răspuns așteptat:
```json
{ "ok": true, "result": { "url": "https://...", "pending_update_count": 0 } }
```

### 5. Testează

Trimite `/start` botului în Telegram — ar trebui să primești butonul **"🗺️ Deschide Harta"**.

---

## Baza de date (Supabase)

Schema e în `supabase/migrations/20260719000000_init_schema.sql`.

```bash
# Dacă ai Supabase CLI:
supabase db push
```

Sau rulează SQL-ul manual în **Supabase → SQL Editor**.

---

## Structura proiectului

```
app/
  api/
    auth/route.ts              ← validare initData + upsert racer
    telegram/webhook/route.ts  ← handler comenzi bot (/start)
  layout.tsx                   ← AuthProvider + Telegram SDK script
  page.tsx                     ← dashboard principal
components/
  AuthProvider.tsx             ← React Context pentru racer autentificat
  Header.tsx                   ← avatar + display_name real
  MapSection.tsx               ← wrapper client pentru import dinamic Leaflet
  MapView.tsx                  ← hartă Leaflet cu geolocație
  StatsCard.tsx                ← card statistici
lib/
  telegram-auth.ts             ← validare HMAC-SHA256 initData
  supabase-admin.ts            ← client Supabase service-role (server only)
  supabase.ts                  ← client Supabase anon (client + server)
  database.types.ts            ← tipuri TypeScript pentru schema DB
supabase/
  migrations/                  ← SQL migrations
types/
  telegram.d.ts                ← tipuri pentru window.Telegram.WebApp
```
