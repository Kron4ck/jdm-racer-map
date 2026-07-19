-- ── Convoy mode setting on racers ────────────────────────────────────
ALTER TABLE public.racers
  ADD COLUMN IF NOT EXISTS convoy_notifications_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.racers.convoy_notifications_enabled IS
  'When true the racer receives toast notifications when another active racer comes within 100m.';
