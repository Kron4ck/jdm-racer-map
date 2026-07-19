-- Add admin flag to racers (set manually via SQL Editor)
ALTER TABLE public.racers
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Points of interest table
CREATE TABLE IF NOT EXISTS public.points_of_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  icon_type   text NOT NULL DEFAULT 'default',
  created_by  uuid REFERENCES public.racers(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
