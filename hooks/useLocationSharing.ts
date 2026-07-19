"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SharingState {
  isActive:  boolean;
  isLoading: boolean;
  error:     string | null;
  toggle:    () => void;
}

async function postJSON(url: string, body: object): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useLocationSharing(initData: string | null): SharingState {
  const [isActive,  setIsActive]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const watchIdRef      = useRef<number | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef      = useRef<{ lat: number; lng: number } | null>(null);
  const isFirstPosRef   = useRef(true);
  const isActiveRef     = useRef(false); // mirror for callbacks

  const sendUpdate = useCallback((lat: number, lng: number) => {
    if (!initData) return;
    postJSON("/api/location/update", { initData, lat, lng });
  }, [initData]);

  const stopSharing = useCallback(async () => {
    // 1. Stop watchPosition
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // 2. Stop interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 3. Deactivate in DB
    if (initData && isActiveRef.current) {
      await postJSON("/api/location/toggle", { initData, action: "deactivate" });
    }
    isActiveRef.current  = false;
    isFirstPosRef.current = true;
    lastPosRef.current   = null;
    setIsActive(false);
    setError(null);
  }, [initData]);

  const startSharing = useCallback(() => {
    if (!initData) { setError("Nu ești autentificat"); return; }
    if (!navigator?.geolocation) { setError("Geolocația nu e disponibilă pe acest device"); return; }

    setIsLoading(true);
    setError(null);
    isFirstPosRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        lastPosRef.current = { lat, lng };

        if (isFirstPosRef.current) {
          isFirstPosRef.current = false;

          // Activate — first position
          const ok = await postJSON("/api/location/toggle", {
            initData, lat, lng, action: "activate",
          });

          if (!ok) {
            setError("Eroare la activarea locației");
            setIsLoading(false);
            stopSharing();
            return;
          }

          isActiveRef.current = true;
          setIsActive(true);
          setIsLoading(false);

          // 10s fallback interval (fires if position doesn't change)
          intervalRef.current = setInterval(() => {
            if (lastPosRef.current && isActiveRef.current) {
              sendUpdate(lastPosRef.current.lat, lastPosRef.current.lng);
            }
          }, 10_000);
        } else {
          // Subsequent positions — update only
          sendUpdate(lat, lng);
        }
      },
      (err) => {
        const msg =
          err.code === 1 ? "Permisiune geolocație refuzată" :
          err.code === 2 ? "Poziție indisponibilă" :
          "Timeout geolocație";
        setError(msg);
        setIsLoading(false);
        isFirstPosRef.current = true;
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }, [initData, sendUpdate, stopSharing]);

  const toggle = useCallback(() => {
    if (isActive || isActiveRef.current) {
      stopSharing();
    } else {
      startSharing();
    }
  }, [isActive, startSharing, stopSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isActive, isLoading, error, toggle };
}
