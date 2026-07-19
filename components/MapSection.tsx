"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0b14]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#00D4FF] border-[rgba(0,212,255,0.1)] animate-spin" />
        <span
          className="section-label tracking-[0.2em]"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          LOADING MAP…
        </span>
      </div>
    </div>
  ),
});

export default function MapSection() {
  return (
    <main className="flex-1 min-h-0 px-3 pb-3">
      <div className="w-full h-full rounded-lg overflow-hidden neon-border relative">
        <MapView />

        {/* HUD – top-right coords placeholder */}
        <div
          className="absolute top-2 right-10 z-[1001] pointer-events-none px-2 py-1 rounded bg-[rgba(6,6,8,0.75)] border border-[rgba(0,212,255,0.15)]"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <span className="text-[9px] text-[rgba(0,212,255,0.5)] tracking-widest uppercase">
            47.0105°N &nbsp; 28.8638°E
          </span>
        </div>

        {/* HUD – racer count */}
        <div
          className="absolute bottom-6 left-3 z-[1001] pointer-events-none px-2.5 py-1.5 rounded bg-[rgba(6,6,8,0.85)] neon-border"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="live-dot" style={{ width: "6px", height: "6px" }} />
            <span className="text-[10px] text-[rgba(226,232,240,0.7)] tracking-wider uppercase">
              <span className="neon-text-orange font-bold">5</span>
              <span className="ml-1">raceri pe hartă</span>
            </span>
          </div>
        </div>

        {/* Corner bracket – top-left */}
        <svg
          className="absolute top-1.5 left-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M0 10 L0 0 L10 0" stroke="#00D4FF" strokeWidth="1.5" />
        </svg>

        {/* Corner bracket – bottom-right */}
        <svg
          className="absolute bottom-1.5 right-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none"
        >
          <path d="M14 4 L14 14 L4 14" stroke="#FF4500" strokeWidth="1.5" />
        </svg>
      </div>
    </main>
  );
}
