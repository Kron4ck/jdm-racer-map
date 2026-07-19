-- ── Flash/Signal column on live_locations ────────────────────────────
ALTER TABLE public.live_locations
  ADD COLUMN IF NOT EXISTS flash_at timestamptz;

COMMENT ON COLUMN public.live_locations.flash_at IS
  'Set to now() when the racer sends a Flash signal. Clients animate within ~8 s of this timestamp.';
