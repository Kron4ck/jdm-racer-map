"use client";

import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useActiveRacers } from "@/hooks/useActiveRacers";

const GROUP_NAME = "JDM Moldova";

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (url) {
    return (
      <Image
        src={url}
        alt={name ?? "avatar"}
        width={32}
        height={32}
        className="rounded-full border border-[rgba(0,212,255,0.4)] object-cover w-8 h-8"
      />
    );
  }

  return (
    <div
      className="w-8 h-8 rounded-full border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)]
                 flex items-center justify-center text-[11px] font-bold neon-text-blue"
      style={{ fontFamily: "var(--font-racing)" }}
    >
      {initials}
    </div>
  );
}

export default function Header() {
  const { racer, loading } = useAuth();
  const activeRacers = useActiveRacers(5_000);

  const displayLabel = loading
    ? "…"
    : racer?.display_name ?? "JDM Racer";

  return (
    <header className="app-header flex items-center justify-between px-4 h-14 shrink-0 relative z-50">
      {/* Left – avatar + user name / group name */}
      <div className="flex items-center gap-2.5">
        {loading ? (
          <div className="w-8 h-8 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] animate-pulse" />
        ) : (
          <Avatar url={racer?.avatar_url ?? null} name={racer?.display_name ?? null} />
        )}

        <div className="flex flex-col leading-none">
          <span
            className="neon-text-blue text-[11px] tracking-[0.18em] uppercase truncate max-w-[120px]"
            style={{ fontFamily: "var(--font-racing)" }}
          >
            {displayLabel}
          </span>
          <span
            className="text-white font-bold text-[17px] leading-none tracking-wide uppercase"
            style={{ fontFamily: "var(--font-racing)" }}
          >
            {GROUP_NAME}
          </span>
        </div>
      </div>

      {/* Center – racing stripe */}
      <div className="flex-1 mx-4 hidden sm:flex items-center">
        <div className="racing-stripe w-full" />
      </div>

      {/* Right – online status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded neon-border bg-[rgba(0,212,255,0.04)]">
        <span className="live-dot" />
        <span
          className="text-white text-xs font-semibold tracking-wider"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <span className="neon-text-blue font-bold">{activeRacers.length}</span>
          <span className="text-[rgba(226,232,240,0.5)] ml-1">PE HARTĂ</span>
        </span>
      </div>
    </header>
  );
}
