-- ── Profile fields added to racers ──────────────────────────────────
-- nickname:      display name chosen by the user (fallback: display_name)
-- car_make:      brand of their JDM car (e.g. "Nissan")
-- car_model:     specific model     (e.g. "Silvia S15")
-- car_photo_url: optional photo URL

ALTER TABLE public.racers
  ADD COLUMN IF NOT EXISTS nickname      text,
  ADD COLUMN IF NOT EXISTS car_make      text,
  ADD COLUMN IF NOT EXISTS car_model     text,
  ADD COLUMN IF NOT EXISTS car_photo_url text;

COMMENT ON COLUMN public.racers.nickname      IS 'User-chosen display name shown on the map. Falls back to display_name.';
COMMENT ON COLUMN public.racers.car_make      IS 'Brand of JDM car, e.g. Nissan.';
COMMENT ON COLUMN public.racers.car_model     IS 'Model of JDM car, e.g. Silvia S15.';
COMMENT ON COLUMN public.racers.car_photo_url IS 'Optional photo URL for the car.';
