"use client";

import { useState, useEffect } from "react";

export interface ActiveRacer {
  racer_id:     string;
  lat:          number;
  lng:          number;
  updated_at:   string;
  display_name: string | null;
  avatar_url:   string | null;
  nickname:     string | null;
  car_make:     string | null;
  car_model:    string | null;
}

export function useActiveRacers(intervalMs = 5_000): ActiveRacer[] {
  const [racers, setRacers] = useState<ActiveRacer[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetch_ = async () => {
      try {
        const res = await fetch("/api/location/active");
        if (!cancelled && res.ok) {
          const json = await res.json();
          setRacers(json.racers ?? []);
        }
      } catch {}
    };

    fetch_();
    const id = setInterval(fetch_, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return racers;
}
