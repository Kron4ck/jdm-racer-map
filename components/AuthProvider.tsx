"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Racer } from "@/lib/supabase";

type AuthedRacer = Pick<Racer, "id" | "telegram_id" | "display_name" | "avatar_url">;

interface AuthContextValue {
  racer:   AuthedRacer | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ racer: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [racer,   setRacer]   = useState<AuthedRacer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Not inside Telegram — skip auth, show placeholder UI
    if (!tg?.initData) {
      setLoading(false);
      return;
    }

    tg.ready();
    tg.expand();

    fetch("/api/auth", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ initData: tg.initData }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.racer) setRacer(data.racer); })
      .catch((err) => console.error("[auth]", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ racer, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
