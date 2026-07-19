"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface LeaderboardEntry {
  id:               string;
  nickname:         string | null;
  display_name:     string | null;
  car_make:         string | null;
  car_model:        string | null;
  avatar_url:       string | null;
  total_distance_m: number;
}

const MEDALS = [
  { bg: "rgba(255,215,0,0.12)",  border: "rgba(255,215,0,0.5)",  text: "#FFD700", label: "1" },
  { bg: "rgba(192,192,192,0.1)", border: "rgba(192,192,192,0.4)", text: "#C0C0C0", label: "2" },
  { bg: "rgba(205,127,50,0.1)",  border: "rgba(205,127,50,0.4)", text: "#CD7F32", label: "3" },
];

function formatKm(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

function racerName(r: LeaderboardEntry): string {
  return r.nickname?.trim() || r.display_name || "Racer";
}

function RankBadge({ pos }: { pos: number }) {
  const medal = MEDALS[pos - 1];
  if (medal) {
    return (
      <div
        className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-bold text-[12px]"
        style={{
          background: medal.bg,
          border:     `1px solid ${medal.border}`,
          color:      medal.text,
          boxShadow:  `0 0 8px ${medal.border}`,
          fontFamily: "var(--font-racing)",
        }}
      >
        {medal.label}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center w-7 h-7 shrink-0 text-[11px]"
      style={{ color: "rgba(226,232,240,0.3)", fontFamily: "var(--font-racing)" }}
    >
      {pos}
    </div>
  );
}

function LeaderRow({ entry, pos }: { entry: LeaderboardEntry; pos: number }) {
  const medal = MEDALS[pos - 1];
  const name  = racerName(entry);
  const car   = [entry.car_make, entry.car_model].filter(Boolean).join(" ");

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all"
      style={{
        background:  medal ? medal.bg : "rgba(6,6,8,0.5)",
        borderColor: medal ? medal.border : "rgba(0,212,255,0.08)",
      }}
    >
      <RankBadge pos={pos} />

      {/* Avatar */}
      {entry.avatar_url ? (
        <Image
          src={entry.avatar_url}
          alt={name}
          width={36}
          height={36}
          className="rounded-full object-cover shrink-0"
          style={{
            border:    `1.5px solid ${medal ? medal.border : "rgba(0,212,255,0.3)"}`,
            boxShadow: medal ? `0 0 6px ${medal.border}` : "none",
          }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
          style={{
            background: medal ? medal.bg : "rgba(0,212,255,0.06)",
            border:     `1.5px solid ${medal ? medal.border : "rgba(0,212,255,0.2)"}`,
            color:      medal ? medal.text : "#00D4FF",
            fontFamily: "var(--font-racing)",
          }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Name + car */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-bold truncate tracking-wide"
          style={{
            color:      medal ? medal.text : "rgba(226,232,240,0.9)",
            fontFamily: "var(--font-racing)",
          }}
        >
          {name}
        </div>
        {car && (
          <div
            className="text-[10px] truncate mt-0.5"
            style={{
              color:      medal ? `${medal.text}99` : "rgba(226,232,240,0.3)",
              fontFamily: "var(--font-racing)",
            }}
          >
            {car}
          </div>
        )}
      </div>

      {/* Distance */}
      <div className="shrink-0 text-right">
        <div
          className="text-[13px] font-bold"
          style={{
            color:      medal ? medal.text : "rgba(0,212,255,0.8)",
            fontFamily: "var(--font-racing)",
            textShadow: medal ? `0 0 8px ${medal.text}66` : "none",
          }}
        >
          {formatKm(entry.total_distance_m)}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardTab() {
  const [entries,  setEntries]  = useState<LeaderboardEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard/distance")
      .then((r) => r.json())
      .then((d) => setEntries(d.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0">
        <span className="section-label">Clasament KM</span>
        <div className="flex-1 h-px bg-gradient-to-r from-[rgba(255,215,0,0.3)] to-transparent" />
        <span
          className="text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(255,215,0,0.5)", fontFamily: "var(--font-racing)" }}
        >
          Total • Toate sesiunile
        </span>
      </div>

      {/* Podium legend */}
      <div className="flex items-center gap-3 px-4 pb-2 shrink-0">
        {MEDALS.map((m, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: m.text, boxShadow: `0 0 4px ${m.text}` }} />
            <span className="text-[8px] tracking-widest uppercase" style={{ color: m.text, fontFamily: "var(--font-racing)" }}>
              {["Aur", "Argint", "Bronz"][i]}
            </span>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-t-[#FFD700] border-[rgba(255,215,0,0.1)] animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,215,0,0.2)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <div className="text-[rgba(226,232,240,0.2)] text-[11px] tracking-[0.2em] uppercase text-center"
              style={{ fontFamily: "var(--font-racing)" }}>
              Niciun racer înregistrat
            </div>
          </div>
        ) : (
          entries.map((entry, i) => (
            <LeaderRow key={entry.id} entry={entry} pos={i + 1} />
          ))
        )}
      </div>
    </div>
  );
}
