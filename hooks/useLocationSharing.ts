"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SharingState {
  isActive:  boolean;
  isLoading: boolean;
  error:     string | null;
  distanceM: number;
  toggle:    () => void;
}

interface PostResult {
  ok:         boolean;
  error:      string | null;
  distanceM?: number;
}

async function postJSON(url: string, body: object): Promise<PostResult> {
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      return { ok: true, error: null, distanceM: json.distanceM };
    }
    let msg: string | null = null;
    try {
      const json = await res.json();
      msg = json?.error ?? json?.message ?? null;
    } catch {}
    return { ok: false, error: msg ?? `Server error ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MIN_DELTA_M = 5;

export function useLocationSharing(initData: string | null): SharingState {
  const [isActive,  setIsActive]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [distanceM, setDistanceM] = useState(0);

  const watchIdRef      = useRef<number | null>(null);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosRef      = useRef<{ lat: number; lng: number } | null>(null);
  const isFirstPosRef   = useRef(true);
  const isActiveRef     = useRef(false);
  const distanceMRef    = useRef(0); // mirror for interval callback

  const sendUpdate = useCallback(async (lat: number, lng: number) => {
    if (!initData) return;
    const result = await postJSON("/api/location/update", { initData, lat, lng });
    // Sync distance from server response (authoritative value)
    if (result.ok && result.distanceM != null) {
      distanceMRef.current = result.distanceM;
      setDistanceM(result.distanceM);
    }
  }, [initData]);

  const stopSharing = useCallback(async (displayError?: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (initData && isActiveRef.current) {
      await postJSON("/api/location/toggle", { initData, action: "deactivate" });
    }
    isActiveRef.current   = false;
    isFirstPosRef.current = true;
    lastPosRef.current    = null;
    setIsActive(false);
    if (displayError !== undefined) setError(displayError);
  }, [initData]);

  const startSharing = useCallback(() => {
    if (!initData) { setError("Nu ești autentificat"); return; }
    if (!navigator?.geolocation) { setError("Geolocația nu e disponibilă pe acest device"); return; }

    setIsLoading(true);
    setError(null);
    setDistanceM(0);
    distanceMRef.current  = 0;
    isFirstPosRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Client-side distance accumulation (immediate feedback)
        if (lastPosRef.current) {
          const delta = haversineMeters(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);
          if (delta >= MIN_DELTA_M) {
            distanceMRef.current += delta;
            setDistanceM(distanceMRef.current);
          }
        }
        lastPosRef.current = { lat, lng };

        if (isFirstPosRef.current) {
          isFirstPosRef.current = false;

          const result = await postJSON("/api/location/toggle", {
            initData, lat, lng, action: "activate",
          });

          if (!result.ok) {
            setIsLoading(false);
            stopSharing(result.error ?? "Eroare la activarea locației");
            return;
          }

          isActiveRef.current = true;
          setIsActive(true);
          setIsLoading(false);

          intervalRef.current = setInterval(() => {
            if (lastPosRef.current && isActiveRef.current) {
              sendUpdate(lastPosRef.current.lat, lastPosRef.current.lng);
            }
          }, 10_000);
        } else {
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

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isActive, isLoading, error, distanceM, toggle };
}
