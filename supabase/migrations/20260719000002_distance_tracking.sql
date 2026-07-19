-- ── Distance tracking fields on live_locations ───────────────────────
-- session_distance_m: accumulated meters for current active session
-- last_lat / last_lng: previous position used as reference for delta calc

ALTER TABLE public.live_locations
  ADD COLUMN IF NOT EXISTS session_distance_m double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_lat           double precision,
  ADD COLUMN IF NOT EXISTS last_lng           double precision;

COMMENT ON COLUMN public.live_locations.session_distance_m IS 'Meters accumulated since last activate. Reset to 0 on each new session.';
COMMENT ON COLUMN public.live_locations.last_lat           IS 'Latitude of the previous update — used as Haversine reference.';
COMMENT ON COLUMN public.live_locations.last_lng           IS 'Longitude of the previous update — used as Haversine reference.';
