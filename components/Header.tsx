"use client";

const MOCK_GROUP = "JDM Romania";
const MOCK_ONLINE = 14;

export default function Header() {
  return (
    <header className="app-header flex items-center justify-between px-4 h-14 shrink-0 relative z-50">
      {/* Left – logo + group name */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-center justify-center w-8 h-8 rounded border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.06)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="neon-text-blue text-[11px] tracking-[0.18em] uppercase"
            style={{ fontFamily: "var(--font-racing)" }}
          >
            JDM Racer
          </span>
          <span
            className="text-white font-bold text-[17px] leading-none tracking-wide uppercase"
            style={{ fontFamily: "var(--font-racing)" }}
          >
            {MOCK_GROUP}
          </span>
        </div>
      </div>

      {/* Center – racing stripe decoration */}
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
          <span className="neon-text-blue font-bold">{MOCK_ONLINE}</span>
          <span className="text-[rgba(226,232,240,0.5)] ml-1">ONLINE</span>
        </span>
      </div>
    </header>
  );
}
