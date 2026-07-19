"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/components/AuthProvider";
import { useActiveRacers } from "@/hooks/useActiveRacers";
import { useLocationSharing } from "@/hooks/useLocationSharing";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0b14]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#00D4FF] border-[rgba(0,212,255,0.1)] animate-spin" />
        <span className="section-label tracking-[0.2em]" style={{ fontFamily: "var(--font-racing)" }}>
          LOADING MAP…
        </span>
      </div>
    </div>
  ),
});

export default function MapSection() {
  const { racer, initData }  = useAuth();
  const activeRacers         = useActiveRacers(5_000);
  const { isActive, isLoading, error, toggle } = useLocationSharing(initData);

  const racerCount = activeRacers.length;

  return (
    <main className="flex-1 min-h-0 px-3 pb-3">
      <div className="w-full h-full rounded-lg overflow-hidden neon-border relative">

        <MapView activeRacers={activeRacers} myRacerId={racer?.id ?? null} />

        {/* ── HUD: coords ── */}
        <div
          className="absolute top-2 right-10 z-[1001] pointer-events-none px-2 py-1 rounded bg-[rgba(6,6,8,0.75)] border border-[rgba(0,212,255,0.15)]"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <span className="text-[9px] text-[rgba(0,212,255,0.5)] tracking-widest uppercase">
            47.0105°N &nbsp; 28.8638°E
          </span>
        </div>

        {/* ── HUD: racer count ── */}
        <div
          className="absolute bottom-6 left-3 z-[1001] pointer-events-none px-2.5 py-1.5 rounded bg-[rgba(6,6,8,0.85)] neon-border"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="live-dot" style={{ width: "6px", height: "6px" }} />
            <span className="text-[10px] text-[rgba(226,232,240,0.7)] tracking-wider uppercase">
              <span className="neon-text-orange font-bold">{racerCount}</span>
              <span className="ml-1">raceri pe hartă</span>
            </span>
          </div>
        </div>

        {/* ── Location toggle button ── */}
        <div className="absolute bottom-6 right-3 z-[1001] flex flex-col items-end gap-1.5">
          <button
            onClick={toggle}
            disabled={isLoading}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase transition-all",
              "border backdrop-blur-sm",
              isActive
                ? "bg-[rgba(255,34,0,0.12)] border-[rgba(255,34,0,0.5)] text-[#FF2200] shadow-[0_0_12px_rgba(255,34,0,0.3)]"
                : "bg-[rgba(0,212,255,0.08)] border-[rgba(0,212,255,0.4)] text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.2)]",
              isLoading ? "opacity-60 cursor-wait" : "cursor-pointer active:scale-95",
            ].join(" ")}
            style={{ fontFamily: "var(--font-racing)" }}
          >
            {isLoading ? (
              <>
                <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                <span>SE ACTIVEAZĂ…</span>
              </>
            ) : isActive ? (
              <>
                {/* Pulsing red dot */}
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#FF2200] opacity-75 animate-ping" />
                  <span className="relative w-2 h-2 rounded-full bg-[#FF2200]" />
                </span>
                <span>LOCAȚIE ACTIVĂ</span>
              </>
            ) : (
              <>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="5" cy="4.5" r="2.5" />
                  <path d="M5 12 C5 12 1 7.5 1 4.5 A4 4 0 0 1 9 4.5 C9 7.5 5 12 5 12Z" />
                </svg>
                <span>ACTIVEAZĂ LOCAȚIA</span>
              </>
            )}
          </button>

          {/* Error message */}
          {error && (
            <div
              className="px-2 py-1 rounded text-[9px] tracking-wide bg-[rgba(255,34,0,0.1)] border border-[rgba(255,34,0,0.3)] text-[#FF4444] max-w-[160px] text-right"
              style={{ fontFamily: "var(--font-racing)" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Corner brackets */}
        <svg className="absolute top-1.5 left-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 10 L0 0 L10 0" stroke="#00D4FF" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-1.5 right-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M14 4 L14 14 L4 14" stroke="#FF4500" strokeWidth="1.5" />
        </svg>
      </div>
    </main>
  );
}
