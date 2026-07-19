import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import MapSection from "@/components/MapSection";

/* ── Placeholder stat data ── */
const STATS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "Membri activi",
    value: "47",
    sublabel: "azi",
    accent: "blue" as const,
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="2.2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    label: "Recorduri",
    value: "128",
    sublabel: "total",
    accent: "orange" as const,
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Sesiunea ta",
    value: "--",
    sublabel: "km",
    accent: "blue" as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden hud-texture">
      {/* ── Header ── */}
      <Header />

      {/* ── Racing stripe accent ── */}
      <div className="racing-stripe shrink-0" />

      {/* ── Stats row ── */}
      <section className="shrink-0 px-3 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((stat) => (
            <StatsCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              sublabel={stat.sublabel}
              accent={stat.accent}
            />
          ))}
        </div>
      </section>

      {/* ── Map section label ── */}
      <div className="shrink-0 flex items-center gap-2 px-4 pb-1.5">
        <span className="section-label">Live Map</span>
        <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.25)] to-transparent" />
        <span className="text-[9px] text-[rgba(226,232,240,0.3)] tracking-widest uppercase">
          Chișinău • MD
        </span>
      </div>

      {/* ── Map (client component with dynamic Leaflet import) ── */}
      <MapSection />
    </div>
  );
}
