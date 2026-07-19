"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

interface ProfileData {
  display_name:  string | null;
  avatar_url:    string | null;
  nickname:      string | null;
  car_make:      string | null;
  car_model:     string | null;
}

function InputField({
  label, value, onChange, placeholder, maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[9px] tracking-[0.2em] uppercase text-[rgba(0,212,255,0.6)]"
        style={{ fontFamily: "var(--font-racing)" }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength ?? 40}
        className="w-full px-3 py-2.5 rounded bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.2)]
                   text-[rgba(226,232,240,0.9)] text-[13px] tracking-wide outline-none
                   focus:border-[rgba(0,212,255,0.5)] focus:bg-[rgba(0,212,255,0.07)]
                   placeholder:text-[rgba(226,232,240,0.25)] transition-all"
        style={{ fontFamily: "var(--font-racing)" }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { racer, initData, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile]     = useState<ProfileData | null>(null);
  const [nickname, setNickname]   = useState("");
  const [carMake, setCarMake]     = useState("");
  const [carModel, setCarModel]   = useState("");
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!initData) { setFetching(false); return; }

    fetch(`/api/profile?initData=${encodeURIComponent(initData)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.racer) {
          setProfile(data.racer);
          setNickname(data.racer.nickname ?? "");
          setCarMake(data.racer.car_make   ?? "");
          setCarModel(data.racer.car_model ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [initData, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initData) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ initData, nickname, car_make: carMake, car_model: carModel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Eroare la salvare");
      } else {
        setSaved(true);
        setTimeout(() => router.push("/"), 1200);
      }
    } catch {
      setError("Eroare de rețea");
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl    = profile?.avatar_url ?? racer?.avatar_url ?? null;
  const displayName  = profile?.display_name ?? racer?.display_name ?? "JDM Racer";
  const isLoading    = loading || fetching;

  return (
    <div className="min-h-screen flex flex-col hud-texture" style={{ fontFamily: "var(--font-racing)" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 h-14 shrink-0 app-header relative z-50">
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center w-8 h-8 rounded border border-[rgba(0,212,255,0.25)]
                     bg-[rgba(0,212,255,0.04)] text-[rgba(0,212,255,0.7)] active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 3 L5 8 L10 13" />
          </svg>
        </button>
        <span className="text-white text-[15px] font-bold tracking-widest uppercase">
          Profil
        </span>
        <div className="flex-1" />
        <span className="text-[9px] tracking-[0.2em] text-[rgba(0,212,255,0.4)] uppercase">
          JDM Moldova
        </span>
      </div>

      <div className="racing-stripe shrink-0" />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-[#00D4FF] border-[rgba(0,212,255,0.1)] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">

          {/* ── Avatar + name ── */}
          <div className="flex flex-col items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={72}
                height={72}
                className="rounded-full border-2 border-[rgba(0,212,255,0.4)] object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full border-2 border-[rgba(0,212,255,0.35)]
                              bg-[rgba(0,212,255,0.08)] flex items-center justify-center
                              text-[22px] font-bold neon-text-blue">
                {(displayName).slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-center">
              <div className="text-[rgba(226,232,240,0.5)] text-[10px] tracking-[0.15em] uppercase">
                Telegram
              </div>
              <div className="text-white text-[14px] font-bold tracking-wide">
                {displayName}
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSave} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1">
              <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(255,69,0,0.7)] mb-1">
                Identitate pe hartă
              </div>
              <div className="rounded border border-[rgba(0,212,255,0.12)] bg-[rgba(6,6,8,0.5)] p-4 flex flex-col gap-4">
                <InputField
                  label="Nickname"
                  value={nickname}
                  onChange={setNickname}
                  placeholder={displayName}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(255,69,0,0.7)] mb-1">
                Mașina ta
              </div>
              <div className="rounded border border-[rgba(0,212,255,0.12)] bg-[rgba(6,6,8,0.5)] p-4 flex flex-col gap-4">
                <InputField
                  label="Marcă"
                  value={carMake}
                  onChange={setCarMake}
                  placeholder="Nissan, Toyota, Mazda…"
                  maxLength={30}
                />
                <InputField
                  label="Model"
                  value={carModel}
                  onChange={setCarModel}
                  placeholder="Silvia S15, Supra, RX-7…"
                  maxLength={30}
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded bg-[rgba(255,34,0,0.08)] border border-[rgba(255,34,0,0.3)]
                              text-[#FF4444] text-[10px] tracking-wide">
                {error}
              </div>
            )}

            {saved && (
              <div className="px-3 py-2 rounded bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.3)]
                              text-[#00D4FF] text-[10px] tracking-wide text-center">
                Profil salvat!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={[
                "w-full py-3 rounded text-[12px] font-bold tracking-[0.2em] uppercase transition-all",
                "border backdrop-blur-sm",
                saving
                  ? "opacity-60 cursor-wait bg-[rgba(0,212,255,0.06)] border-[rgba(0,212,255,0.3)] text-[rgba(0,212,255,0.6)]"
                  : "bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.5)] text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.2)] active:scale-[0.98]",
              ].join(" ")}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  Se salvează…
                </span>
              ) : (
                "Salvează"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
