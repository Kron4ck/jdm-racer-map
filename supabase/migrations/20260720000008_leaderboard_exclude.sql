ALTER TABLE public.racers
  ADD COLUMN IF NOT EXISTS exclude_from_leaderboard boolean NOT NULL DEFAULT false;
