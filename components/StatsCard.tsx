import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "blue" | "orange";
}

export default function StatsCard({
  icon,
  label,
  value,
  sublabel,
  accent = "blue",
}: StatsCardProps) {
  const accentClass = accent === "orange" ? "neon-text-orange" : "neon-text-blue";
  const borderClass = accent === "orange" ? "neon-border-orange" : "neon-border";
  const iconBg =
    accent === "orange"
      ? "border-[rgba(255,69,0,0.35)] bg-[rgba(255,69,0,0.08)]"
      : "border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.06)]";

  return (
    <div className={`hud-card ${borderClass} rounded-lg p-3 flex flex-col gap-1.5 min-w-0`}>
      {/* Icon row */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded border ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className="section-label truncate">{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span
          className={`stat-value ${accentClass} text-2xl font-bold leading-none`}
          style={{ fontFamily: "var(--font-racing)" }}
        >
          {value}
        </span>
        {sublabel && (
          <span className="text-[rgba(226,232,240,0.4)] text-[10px] mb-0.5 tracking-wider uppercase">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
