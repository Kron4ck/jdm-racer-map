"use client";

import Image from "next/image";
import { useActiveRacers } from "@/hooks/useActiveRacers";
import type { ActiveRacer } from "@/hooks/useActiveRacers";

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}

function racerLabel(r: ActiveRacer): string {
  return r.nickname?.trim() || r.display_name || "Racer";
}

function RacerRow({ racer }: { racer: ActiveRacer }) {
  const name = racerLabel(racer);
  const car  = [racer.car_make, racer.car_model].filter(Boolean).join(" ");

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[rgba(0,212,255,0.1)] bg-[rgba(6,6,8,0.6)]"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {racer.avatar_url ? (
          <Image
            src={racer.avatar_url}
            alt={name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border border-[rgba(255,69,0,0.5)]"
            style={{ boxShadow: "0 0 8px rgba(255,69,0,0.3)" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full border border-[rgba(255,69,0,0.4)] bg-[rgba(255,69,0,0.06)]
                       flex items-center justify-center"
            style={{ boxShadow: "0 0 6px rgba(255,69,0,0.2)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,69,0,0.7)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
        {/* Live pulse dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF4500] border border-[#0a0b14]"
          style={{ boxShadow: "0 0 6px #FF4500" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-bold text-[rgba(226,232,240,0.9)] truncate tracking-wide"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          {name}
        </div>
        {car ? (
          <div className="text-[10px] text-[rgba(255,69,0,0.7)] tracking-wide truncate mt-0.5"
            style={{ fontFamily: "var(--font-racing)" }}>
            {car}
          </div>
        ) : (
          <div className="text-[10px] text-[rgba(226,232,240,0.25)] tracking-wide mt-0.5"
            style={{ fontFamily: "var(--font-racing)" }}>
            mașină necunoscută
          </div>
        )}
      </div>

      {/* Time */}
      <div className="shrink-0 text-right">
        <div className="text-[9px] text-[rgba(0,212,255,0.5)] tracking-widest uppercase"
          style={{ fontFamily: "var(--font-racing)" }}>
          {timeAgo(racer.updated_at)}
        </div>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
          <span className="text-[8px] text-[rgba(255,69,0,0.6)] tracking-widest uppercase"
            style={{ fontFamily: "var(--font-racing)" }}>
            live
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RacersTab() {
  const racers = useActiveRacers(5_000);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <span className="section-label">Raceri activi</span>
        <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-transparent" />
        <span
          className="text-[9px] tracking-[0.2em] text-[rgba(0,212,255,0.5)] uppercase"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <span className="neon-text-orange font-bold">{racers.length}</span> pe hartă
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        {racers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <div className="text-center">
              <div className="text-[rgba(226,232,240,0.2)] text-[11px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "var(--font-racing)" }}>
                Niciun racer activ
              </div>
              <div className="text-[rgba(226,232,240,0.12)] text-[10px] tracking-wider mt-1"
                style={{ fontFamily: "var(--font-racing)" }}>
                Activează locația ca să apari
              </div>
            </div>
          </div>
        ) : (
          racers.map((r) => <RacerRow key={r.racer_id} racer={r} />)
        )}
      </div>
    </div>
  );
}
