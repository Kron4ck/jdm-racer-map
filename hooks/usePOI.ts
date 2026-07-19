"use client";

import { useState, useEffect, useCallback } from "react";

export interface POI {
  id:          string;
  title:       string;
  description: string | null;
  lat:         number;
  lng:         number;
  icon_type:   string;
  created_by:  string | null;
  created_at:  string;
}

export function usePOI() {
  const [pois, setPois] = useState<POI[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/poi");
      if (res.ok) setPois((await res.json()).pois ?? []);
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { pois, refresh };
}
