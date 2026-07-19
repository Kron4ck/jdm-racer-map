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
  racer:    AuthedRacer | null;
  loading:  boolean;
  initData: string | null;  // raw Telegram initData — passed to location hooks
}

const AuthContext = createContext<AuthContextValue>({
  racer: null, loading: true, initData: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [racer,    setRacer]    = useState<AuthedRacer | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg?.initData) {
      setLoading(false);
      return;
    }

    const raw = tg.initData;
    setInitData(raw);
    tg.ready();
    tg.expand();

    fetch("/api/auth", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ initData: raw }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.racer) setRacer(data.racer); })
      .catch((err) => console.error("[auth]", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ racer, loading, initData }}>
      {children}
    </AuthContext.Provider>
  );
}
