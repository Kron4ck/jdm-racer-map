"use client";

export type Tab = "map" | "racers" | "profile";

interface Props {
  activeTab:   Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "map",
    label: "Hartă",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: "racers",
    label: "Raceri",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profil",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="shrink-0 flex items-center bg-[rgba(6,6,8,0.97)]"
      style={{
        borderTop:    "1px solid rgba(0,212,255,0.12)",
        boxShadow:    "0 -4px 24px rgba(0,0,0,0.6), 0 -1px 0 rgba(0,212,255,0.08)",
        height:       "56px",
        fontFamily:   "var(--font-racing)",
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
            style={{
              color: active ? "#00D4FF" : "rgba(226,232,240,0.3)",
              filter: active ? "drop-shadow(0 0 6px rgba(0,212,255,0.6))" : "none",
            }}
          >
            {tab.icon}
            <span
              className="text-[9px] tracking-[0.12em] uppercase"
              style={{ opacity: active ? 1 : 0.7 }}
            >
              {tab.label}
            </span>
            {/* Active indicator dot */}
            {active && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full bg-[#00D4FF]"
                style={{ boxShadow: "0 0 6px #00D4FF" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
