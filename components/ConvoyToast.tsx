"use client";

import type { ConvoyToast } from "@/hooks/useConvoy";

interface Props {
  toasts:  ConvoyToast[];
  dismiss: (id: string) => void;
}

export default function ConvoyToastContainer({ toasts, dismiss }: Props) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[9999] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg
                     animate-[slideDown_0.3s_ease-out]"
          style={{
            background:  "rgba(6,6,8,0.95)",
            border:      "1px solid rgba(0,212,255,0.4)",
            boxShadow:   "0 0 20px rgba(0,212,255,0.2), 0 4px 16px rgba(0,0,0,0.6)",
            fontFamily:  "var(--font-racing)",
            maxWidth:    "320px",
            width:       "100%",
          }}
        >
          <span className="text-[13px] text-[rgba(226,232,240,0.9)] tracking-wide flex-1">
            {t.message}
          </span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-[rgba(0,212,255,0.5)] hover:text-[#00D4FF] transition-colors shrink-0 text-[16px] leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
