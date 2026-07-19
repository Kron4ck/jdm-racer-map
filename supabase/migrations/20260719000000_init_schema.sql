-- ─────────────────────────────────────────────────────────────────
--  JDM Racer Map – initial schema
--  Auth model: custom JWT issued by a backend Edge Function after
--  verifying Telegram initData. The JWT carries a "telegram_id"
--  claim (bigint) used by every RLS policy below.
-- ─────────────────────────────────────────────────────────────────


-- ── 1. Tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.racers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id   bigint      UNIQUE NOT NULL,
  username      text,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.racers                IS 'One row per Telegram user who joined the group.';
COMMENT ON COLUMN public.racers.telegram_id    IS 'Telegram user ID — used as the auth identity anchor.';
COMMENT ON COLUMN public.racers.username       IS 'Telegram @username (without the @), may be null.';


CREATE TABLE IF NOT EXISTS public.live_locations (
  id          uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id    uuid              NOT NULL REFERENCES public.racers(id) ON DELETE CASCADE,
  lat         double precision  NOT NULL,
  lng         double precision  NOT NULL,
  is_active   boolean           NOT NULL DEFAULT false,
  updated_at  timestamptz       NOT NULL DEFAULT now(),

  UNIQUE (racer_id)   -- each racer has exactly one live-location row (upsert target)
);

COMMENT ON TABLE  public.live_locations            IS 'Single mutable row per racer for live sharing. Upsert on racer_id.';
COMMENT ON COLUMN public.live_locations.is_active  IS 'true while the racer is actively sharing their location.';
COMMENT ON COLUMN public.live_locations.updated_at IS 'Auto-refreshed by trigger on every update.';


CREATE TABLE IF NOT EXISTS public.speed_records (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  racer_id         uuid        NOT NULL REFERENCES public.racers(id) ON DELETE CASCADE,
  best_speed_kmh   numeric     NOT NULL CHECK (best_speed_kmh > 0),
  recorded_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.speed_records              IS 'Immutable speed record entries — no UPDATE policy.';
COMMENT ON COLUMN public.speed_records.best_speed_kmh IS 'GPS-derived speed in km/h at the moment of recording.';


-- ── 2. Auto-refresh updated_at on live_locations upserts ─────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER live_locations_set_updated_at
  BEFORE UPDATE ON public.live_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 3. Auth helper functions ──────────────────────────────────────
--
--  These read the JWT claim injected by the Edge Function that
--  verified the Telegram initData signature:
--    { "telegram_id": 123456789, "role": "authenticated", ... }

CREATE OR REPLACE FUNCTION public.current_telegram_id()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (auth.jwt() ->> 'telegram_id')::bigint;
$$;

COMMENT ON FUNCTION public.current_telegram_id IS
  'Returns the Telegram user ID from the current JWT claim, or NULL if not authenticated.';


CREATE OR REPLACE FUNCTION public.current_racer_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id
  FROM   public.racers
  WHERE  telegram_id = public.current_telegram_id();
$$;

COMMENT ON FUNCTION public.current_racer_id IS
  'Returns the racers.id for the currently authenticated Telegram user.';


-- ── 4. Row Level Security ─────────────────────────────────────────

ALTER TABLE public.racers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speed_records   ENABLE ROW LEVEL SECURITY;


-- ┌─ racers ────────────────────────────────────────────────────────┐

-- Any member of the group (authenticated) can read the full list
CREATE POLICY "racers: members can read all"
  ON public.racers FOR SELECT
  TO authenticated
  USING (true);

-- A racer can register themselves (first login upsert)
CREATE POLICY "racers: insert own row"
  ON public.racers FOR INSERT
  TO authenticated
  WITH CHECK (telegram_id = public.current_telegram_id());

-- A racer can update only their own row
CREATE POLICY "racers: update own row"
  ON public.racers FOR UPDATE
  TO authenticated
  USING     (telegram_id = public.current_telegram_id())
  WITH CHECK (telegram_id = public.current_telegram_id());

-- └────────────────────────────────────────────────────────────────┘


-- ┌─ live_locations ────────────────────────────────────────────────┐

CREATE POLICY "live_locations: members can read all"
  ON public.live_locations FOR SELECT
  TO authenticated
  USING (true);

-- Only active (is_active = true) rows are visible to the group;
-- own row is always readable regardless of is_active.
-- If you prefer to hide parked racers from others, swap USING above with:
--   USING (is_active = true OR racer_id = public.current_racer_id())

CREATE POLICY "live_locations: insert own row"
  ON public.live_locations FOR INSERT
  TO authenticated
  WITH CHECK (racer_id = public.current_racer_id());

CREATE POLICY "live_locations: update own row"
  ON public.live_locations FOR UPDATE
  TO authenticated
  USING     (racer_id = public.current_racer_id())
  WITH CHECK (racer_id = public.current_racer_id());

-- └────────────────────────────────────────────────────────────────┘


-- ┌─ speed_records ─────────────────────────────────────────────────┐

CREATE POLICY "speed_records: members can read all"
  ON public.speed_records FOR SELECT
  TO authenticated
  USING (true);

-- Records are append-only; no UPDATE or DELETE policy.
CREATE POLICY "speed_records: insert own record"
  ON public.speed_records FOR INSERT
  TO authenticated
  WITH CHECK (racer_id = public.current_racer_id());

-- └────────────────────────────────────────────────────────────────┘


-- ── 5. Indexes ────────────────────────────────────────────────────

-- Fast lookup of live locations for the map (only active)
CREATE INDEX IF NOT EXISTS idx_live_locations_active
  ON public.live_locations (racer_id)
  WHERE is_active = true;

-- Speed records per racer, newest first
CREATE INDEX IF NOT EXISTS idx_speed_records_racer
  ON public.speed_records (racer_id, recorded_at DESC);
