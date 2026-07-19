"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

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

export default function ProfileTab() {
  const { racer, initData, loading } = useAuth();

  const [nickname,        setNickname]        = useState("");
  const [carMake,         setCarMake]         = useState("");
  const [carModel,        setCarModel]        = useState("");
  const [convoyEnabled,   setConvoyEnabled]   = useState(true);
  const [convoyToggling,  setConvoyToggling]  = useState(false);
  const [fetching,        setFetching]        = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [saved,           setSaved]           = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!initData) { setFetching(false); return; }

    fetch(`/api/profile?initData=${encodeURIComponent(initData)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.racer) {
          setNickname(data.racer.nickname  ?? "");
          setCarMake(data.racer.car_make   ?? "");
          setCarModel(data.racer.car_model ?? "");
          setConvoyEnabled(data.racer.convoy_notifications_enabled ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [initData, loading]);

  const handleConvoyToggle = async () => {
    if (!initData || convoyToggling) return;
    const next = !convoyEnabled;
    setConvoyEnabled(next);
    setConvoyToggling(true);
    try {
      await fetch("/api/profile", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ initData, convoy_notifications_enabled: next }),
      });
      // Notify convoy hook in MapSection about the change
      window.dispatchEvent(new CustomEvent("convoy-settings-changed", { detail: { enabled: next } }));
    } catch {
      setConvoyEnabled(!next); // revert on error
    } finally {
      setConvoyToggling(false);
    }
  };

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
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Eroare de rețea");
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl   = racer?.avatar_url   ?? null;
  const displayName = racer?.display_name ?? "JDM Racer";
  const isLoading   = loading || fetching;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-t-[#00D4FF] border-[rgba(0,212,255,0.1)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ fontFamily: "var(--font-racing)" }}>
      {/* Title row */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <span className="section-label">Profil</span>
        <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-transparent" />
      </div>

      <div className="px-4 pb-6 flex flex-col gap-5">
        {/* Avatar + Telegram name */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-[rgba(0,212,255,0.1)] bg-[rgba(6,6,8,0.6)]">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={56}
              height={56}
              className="rounded-full border-2 border-[rgba(0,212,255,0.4)] object-cover shrink-0"
              style={{ boxShadow: "0 0 12px rgba(0,212,255,0.2)" }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full border-2 border-[rgba(0,212,255,0.35)]
                            bg-[rgba(0,212,255,0.08)] flex items-center justify-center
                            text-[20px] font-bold neon-text-blue shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-[9px] text-[rgba(226,232,240,0.35)] tracking-[0.15em] uppercase">
              Telegram
            </div>
            <div className="text-white text-[14px] font-bold tracking-wide mt-0.5">
              {displayName}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="rounded-lg border border-[rgba(0,212,255,0.12)] bg-[rgba(6,6,8,0.5)] p-4 flex flex-col gap-4">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(255,69,0,0.7)]">
              Identitate pe hartă
            </div>
            <InputField
              label="Nickname"
              value={nickname}
              onChange={setNickname}
              placeholder={displayName}
              maxLength={30}
            />
          </div>

          <div className="rounded-lg border border-[rgba(0,212,255,0.12)] bg-[rgba(6,6,8,0.5)] p-4 flex flex-col gap-4">
            <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(255,69,0,0.7)]">
              Mașina ta
            </div>
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

          {/* Convoy Mode toggle */}
          <div className="rounded-lg border border-[rgba(0,212,255,0.12)] bg-[rgba(6,6,8,0.5)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(255,69,0,0.7)] mb-1">
                  Convoy Mode
                </div>
                <div className="text-[11px] text-[rgba(226,232,240,0.5)] tracking-wide leading-snug">
                  Primești notificare când un racer<br />e la &lt;100m de tine
                </div>
              </div>
              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleConvoyToggle}
                disabled={convoyToggling}
                className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300"
                style={{
                  background:  convoyEnabled ? "rgba(0,212,255,0.25)" : "rgba(226,232,240,0.08)",
                  border:      `1px solid ${convoyEnabled ? "rgba(0,212,255,0.6)" : "rgba(226,232,240,0.2)"}`,
                  boxShadow:   convoyEnabled ? "0 0 10px rgba(0,212,255,0.3)" : "none",
                  opacity:     convoyToggling ? 0.6 : 1,
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
                  style={{
                    left:       convoyEnabled ? "calc(100% - 18px)" : "2px",
                    background: convoyEnabled ? "#00D4FF" : "rgba(226,232,240,0.4)",
                    boxShadow:  convoyEnabled ? "0 0 6px rgba(0,212,255,0.8)" : "none",
                  }}
                />
              </button>
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
                : "bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.5)] text-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.15)] active:scale-[0.98]",
            ].join(" ")}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                Se salvează…
              </span>
            ) : "Salvează"}
          </button>
        </form>
      </div>
    </div>
  );
}
