-- ── Monthly leaderboard archive ──────────────────────────────────────
-- Snapshots the final standings at the end of each month.
-- nickname/car_make/car_model are stored denormalised so the archive
-- remains accurate even if the racer later changes their profile.

CREATE TABLE IF NOT EXISTS public.monthly_leaderboard_archive (
  id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  month_label text             NOT NULL,           -- "YYYY-MM" of the month that ended
  racer_id    uuid             NOT NULL REFERENCES public.racers(id) ON DELETE CASCADE,
  nickname    text,
  car_make    text,
  car_model   text,
  distance_m  double precision NOT NULL,
  rank        int              NOT NULL,
  archived_at timestamptz      NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.monthly_leaderboard_archive IS
  'Immutable end-of-month snapshots. One row per racer per month (only racers with distance > 0).';

CREATE INDEX IF NOT EXISTS idx_monthly_archive_month_rank
  ON public.monthly_leaderboard_archive (month_label, rank);
