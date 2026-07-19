"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ConvoyToast {
  id:      string;
  message: string;
}

interface NearbyRacer {
  racer_id:   string;
  name:       string;
  distance_m: number;
}

interface ConvoyState {
  nearbyIds: Set<string>;
  toasts:    ConvoyToast[];
  dismiss:   (id: string) => void;
}

export function useConvoy(
  myRacerId: string | null,
  initData:  string | null,
): ConvoyState {
  const [enabled,   setEnabled]   = useState(false);
  const [nearbyIds, setNearbyIds] = useState<Set<string>>(new Set());
  const [toasts,    setToasts]    = useState<ConvoyToast[]>([]);

  const prevNearbyRef = useRef<Set<string>>(new Set());

  const addToast = useCallback((message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // Load convoy setting from profile
  useEffect(() => {
    if (!initData) return;
    fetch(`/api/profile?initData=${encodeURIComponent(initData)}`)
      .then((r) => r.json())
      .then((data) => {
        setEnabled(data.racer?.convoy_notifications_enabled ?? true);
      })
      .catch(() => {});
  }, [initData]);

  // Listen for real-time toggle from ProfileTab (via custom event)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(detail.enabled);
      if (!detail.enabled) {
        setNearbyIds(new Set());
        prevNearbyRef.current = new Set();
      }
    };
    window.addEventListener("convoy-settings-changed", handler);
    return () => window.removeEventListener("convoy-settings-changed", handler);
  }, []);

  // Poll nearby endpoint
  useEffect(() => {
    if (!myRacerId || !enabled) {
      setNearbyIds(new Set());
      prevNearbyRef.current = new Set();
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/location/nearby?racer_id=${myRacerId}`);
        if (!res.ok) return;
        const { nearby }: { nearby: NearbyRacer[] } = await res.json();

        const newIds = new Set(nearby.map((r) => r.racer_id));
        const prev   = prevNearbyRef.current;

        // Notify only on new entries (not repeats)
        for (const r of nearby) {
          if (!prev.has(r.racer_id)) {
            addToast(`🏁 ${r.name} e la ${r.distance_m}m de tine!`);
          }
        }

        prevNearbyRef.current = newIds;
        setNearbyIds(newIds);
      } catch {}
    };

    poll();
    const id = setInterval(poll, 5_000);
    return () => clearInterval(id);
  }, [myRacerId, enabled, addToast]);

  return { nearbyIds, toasts, dismiss };
}
