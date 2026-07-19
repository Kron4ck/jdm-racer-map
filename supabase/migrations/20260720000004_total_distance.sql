-- ── Permanent total distance accumulator on racers ───────────────────
ALTER TABLE public.racers
  ADD COLUMN IF NOT EXISTS total_distance_m double precision NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.racers.total_distance_m IS
  'Lifetime accumulated distance in meters across all sessions. Never resets.';
