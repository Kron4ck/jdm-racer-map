"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useActiveRacers } from "@/hooks/useActiveRacers";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useConvoy } from "@/hooks/useConvoy";
import { usePOI } from "@/hooks/usePOI";
import ConvoyToastContainer from "@/components/ConvoyToast";

const FLASH_COOLDOWN_SEC = 10;

const POI_ICON_OPTIONS = [
  { value: "meetup", label: "Loc de întâlnire" },
  { value: "gas",    label: "Benzinărie" },
  { value: "wash",   label: "Spălătorie" },
  { value: "repair", label: "Service" },
  { value: "default",label: "Alt punct" },
] as const;

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

const inputStyle: React.CSSProperties = {
  width:        "100%",
  background:   "rgba(255,255,255,0.05)",
  border:       "1px solid rgba(0,212,255,0.2)",
  borderRadius: "4px",
  color:        "#e2e8f0",
  padding:      "7px 10px",
  fontSize:     "13px",
  fontFamily:   "var(--font-hud), sans-serif",
  outline:      "none",
  marginBottom: "10px",
  boxSizing:    "border-box",
};

export default function MapSection() {
  const { racer, initData }  = useAuth();
  const activeRacers         = useActiveRacers(5_000);
  const { isActive, isLoading, error, distanceM, toggle } = useLocationSharing(initData);
  const { nearbyIds, toasts, dismiss } = useConvoy(racer?.id ?? null, initData);
  const { pois, refresh: refreshPOIs } = usePOI();

  /* ── Flash cooldown ── */
  const [flashCooldown, setFlashCooldown] = useState(0);
  const [flashLoading, setFlashLoading]   = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  async function handleFlash() {
    if (!initData || flashCooldown > 0 || flashLoading) return;
    setFlashLoading(true);
    try {
      await fetch("/api/location/flash", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ initData }),
      });
    } finally {
      setFlashLoading(false);
      setFlashCooldown(FLASH_COOLDOWN_SEC);
      cooldownRef.current = setInterval(() => {
        setFlashCooldown((s) => {
          if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
          return s - 1;
        });
      }, 1_000);
    }
  }

  /* ── Admin state ── */
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!initData) return;
    fetch(`/api/profile?initData=${encodeURIComponent(initData)}`)
      .then((r) => r.json())
      .then((data) => { if (data.racer?.is_admin) setIsAdmin(true); })
      .catch(() => {});
  }, [initData]);

  /* ── POI add mode ── */
  const [addMode,        setAddMode]        = useState(false);
  const [pendingCoords,  setPendingCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [showForm,       setShowForm]       = useState(false);
  const [formTitle,      setFormTitle]      = useState("");
  const [formDesc,       setFormDesc]       = useState("");
  const [formIcon,       setFormIcon]       = useState("meetup");
  const [savingPOI,      setSavingPOI]      = useState(false);
  const [poiError,       setPoiError]       = useState<string | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setFormTitle("");
    setFormDesc("");
    setFormIcon("meetup");
    setPoiError(null);
    setShowForm(true);
    setAddMode(false);
  }, []);

  function cancelForm() {
    setShowForm(false);
    setPendingCoords(null);
    setPoiError(null);
  }

  async function submitPOI() {
    if (!initData || !pendingCoords || !formTitle.trim()) return;
    setSavingPOI(true);
    setPoiError(null);
    try {
      const res = await fetch("/api/poi", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          initData,
          title:       formTitle.trim(),
          description: formDesc.trim() || undefined,
          lat:         pendingCoords.lat,
          lng:         pendingCoords.lng,
          icon_type:   formIcon,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setPoiError(json.error ?? "Eroare la salvare"); return; }
      await refreshPOIs();
      cancelForm();
    } catch {
      setPoiError("Eroare de rețea");
    } finally {
      setSavingPOI(false);
    }
  }

  async function deletePOI(poiId: string) {
    if (!initData) return;
    try {
      await fetch("/api/poi", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ initData, poi_id: poiId }),
      });
      await refreshPOIs();
    } catch {}
  }

  const racerCount = activeRacers.length;

  return (
    <main className="flex-1 min-h-0 px-3 pb-3">
      <div className={`w-full h-full rounded-lg overflow-hidden neon-border relative${addMode ? " map-add-mode" : ""}`}>

        <MapView
          activeRacers={activeRacers}
          myRacerId={racer?.id ?? null}
          nearbyIds={nearbyIds}
          pois={pois}
          isAdmin={isAdmin}
          addMode={addMode}
          onMapClick={handleMapClick}
          onDeletePOI={deletePOI}
        />

        {/* ── HUD: coords ── */}
        <div
          className="absolute top-2 right-10 z-[1001] pointer-events-none px-2 py-1 rounded bg-[rgba(6,6,8,0.75)] border border-[rgba(0,212,255,0.15)]"
          style={{ fontFamily: "var(--font-racing)" }}
        >
          <span className="text-[9px] text-[rgba(0,212,255,0.5)] tracking-widest uppercase">
            47.0105°N &nbsp; 28.8638°E
          </span>
        </div>

        {/* ── HUD: racer count + admin POI button ── */}
        <div className="absolute bottom-6 left-3 z-[1001] flex flex-col items-start gap-1.5">
          <div
            className="pointer-events-none px-2.5 py-1.5 rounded bg-[rgba(6,6,8,0.85)] neon-border"
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

          {/* Admin: Add POI toggle */}
          {isAdmin && !showForm && (
            <button
              onClick={() => setAddMode((m) => !m)}
              className={[
                "pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all",
                "border backdrop-blur-sm",
                addMode
                  ? "bg-[rgba(204,68,255,0.18)] border-[rgba(204,68,255,0.6)] text-[#CC44FF] shadow-[0_0_12px_rgba(204,68,255,0.35)] cursor-pointer active:scale-95"
                  : "bg-[rgba(204,68,255,0.08)] border-[rgba(204,68,255,0.35)] text-[rgba(204,68,255,0.8)] cursor-pointer active:scale-95",
              ].join(" ")}
              style={{ fontFamily: "var(--font-racing)" }}
            >
              {addMode ? (
                <>
                  {/* X icon */}
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="1" y1="1" x2="8" y2="8" /><line x1="8" y1="1" x2="1" y2="8" />
                  </svg>
                  <span>ANULEAZĂ</span>
                </>
              ) : (
                <>
                  {/* Plus icon */}
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="4.5" y1="1" x2="4.5" y2="8" /><line x1="1" y1="4.5" x2="8" y2="4.5" />
                  </svg>
                  <span>ADAUGĂ PUNCT</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Add mode hint */}
        {addMode && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none px-3 py-1.5 rounded"
            style={{
              background:  "rgba(204,68,255,0.15)",
              border:      "1px solid rgba(204,68,255,0.4)",
              fontFamily:  "var(--font-racing)",
              fontSize:    "10px",
              color:       "#CC44FF",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace:  "nowrap",
            }}
          >
            Apasă pe hartă pentru a plasa un punct
          </div>
        )}

        {/* ── Location + Flash controls ── */}
        <div className="absolute bottom-6 right-3 z-[1001] flex flex-col items-end gap-1.5">
          {/* Distance badge */}
          {isActive && (
            <div
              className="px-2.5 py-1 rounded bg-[rgba(6,6,8,0.85)] border border-[rgba(0,212,255,0.25)] flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-racing)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="text-[10px] tracking-wider">
                <span className="neon-text-blue font-bold">
                  {distanceM >= 1000
                    ? `${(distanceM / 1000).toFixed(2)} km`
                    : `${Math.round(distanceM)} m`}
                </span>
              </span>
            </div>
          )}

          {/* Flash button */}
          {isActive && (
            <button
              onClick={handleFlash}
              disabled={flashCooldown > 0 || flashLoading}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase transition-all",
                "border backdrop-blur-sm",
                flashCooldown > 0 || flashLoading
                  ? "bg-[rgba(255,102,0,0.05)] border-[rgba(255,102,0,0.2)] text-[rgba(255,102,0,0.4)] cursor-not-allowed"
                  : "bg-[rgba(255,102,0,0.12)] border-[rgba(255,102,0,0.5)] text-[#FF6600] shadow-[0_0_10px_rgba(255,102,0,0.3)] cursor-pointer active:scale-95",
              ].join(" ")}
              style={{ fontFamily: "var(--font-racing)" }}
            >
              {flashLoading ? (
                <>
                  <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                  <span>FLASH…</span>
                </>
              ) : flashCooldown > 0 ? (
                <>
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6,0 1,7 5,7 4,12 9,5 5,5" />
                  </svg>
                  <span>FLASH {flashCooldown}s</span>
                </>
              ) : (
                <>
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" stroke="none">
                    <polygon points="6,0 1,7 5,7 4,12 9,5 5,5" />
                  </svg>
                  <span>FLASH</span>
                </>
              )}
            </button>
          )}

          {/* Location toggle */}
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

        {/* ── Convoy toasts ── */}
        <ConvoyToastContainer toasts={toasts} dismiss={dismiss} />

        {/* Corner brackets */}
        <svg className="absolute top-1.5 left-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 10 L0 0 L10 0" stroke="#00D4FF" strokeWidth="1.5" />
        </svg>
        <svg className="absolute bottom-1.5 right-1.5 z-[1001] pointer-events-none opacity-50"
          width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M14 4 L14 14 L4 14" stroke="#FF4500" strokeWidth="1.5" />
        </svg>

        {/* ── POI form modal (admin only) ── */}
        {showForm && pendingCoords && (
          <div
            style={{
              position:       "absolute",
              inset:          0,
              zIndex:         2000,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              background:     "rgba(6,6,8,0.72)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="hud-card"
              style={{ padding: "20px", width: "min(320px, 90%)", boxSizing: "border-box" }}
            >
              {/* Header */}
              <div style={{
                fontFamily:    "var(--font-racing), sans-serif",
                color:         "#CC44FF",
                fontWeight:    700,
                fontSize:      "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom:  "16px",
              }}>
                Punct nou
                <span style={{ color: "rgba(204,68,255,0.5)", fontWeight: 400, marginLeft: "6px", fontSize: "9px" }}>
                  {pendingCoords.lat.toFixed(4)}°N {pendingCoords.lng.toFixed(4)}°E
                </span>
              </div>

              {/* Title */}
              <input
                placeholder="Titlu *"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={inputStyle}
                autoFocus
              />

              {/* Description */}
              <textarea
                placeholder="Descriere (opțional)"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.4 }}
              />

              {/* Icon type */}
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                style={{ ...inputStyle, marginBottom: "16px" }}
              >
                {POI_ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Error */}
              {poiError && (
                <div style={{
                  color:         "#FF4444",
                  fontSize:      "10px",
                  marginBottom:  "10px",
                  fontFamily:    "var(--font-racing), sans-serif",
                  letterSpacing: "0.06em",
                }}>
                  {poiError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={cancelForm}
                  style={{
                    flex:          1,
                    padding:       "8px",
                    background:    "rgba(255,255,255,0.04)",
                    border:        "1px solid rgba(255,255,255,0.12)",
                    borderRadius:  "4px",
                    color:         "rgba(226,232,240,0.6)",
                    fontSize:      "11px",
                    fontWeight:    700,
                    fontFamily:    "var(--font-racing), sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor:        "pointer",
                  }}
                >
                  Anulează
                </button>
                <button
                  onClick={submitPOI}
                  disabled={!formTitle.trim() || savingPOI}
                  style={{
                    flex:          1,
                    padding:       "8px",
                    background:    formTitle.trim() && !savingPOI ? "rgba(204,68,255,0.15)" : "rgba(204,68,255,0.05)",
                    border:        `1px solid ${formTitle.trim() && !savingPOI ? "rgba(204,68,255,0.5)" : "rgba(204,68,255,0.15)"}`,
                    borderRadius:  "4px",
                    color:         formTitle.trim() && !savingPOI ? "#CC44FF" : "rgba(204,68,255,0.35)",
                    fontSize:      "11px",
                    fontWeight:    700,
                    fontFamily:    "var(--font-racing), sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor:        formTitle.trim() && !savingPOI ? "pointer" : "not-allowed",
                  }}
                >
                  {savingPOI ? "Se salvează…" : "Salvează"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
