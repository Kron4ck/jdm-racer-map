"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ActiveRacer } from "@/hooks/useActiveRacers";

const MAP_CENTER: [number, number] = [47.0105, 28.8638];
const MAP_ZOOM = 13;
const MARKER_SIZE = 38;

/* ── Avatar marker factory ── */
function createAvatarMarker(
  avatarUrl:   string | null,
  borderColor: string,
  glowColor:   string,
  convoy:      boolean = false,
): L.DivIcon {
  const convoyRing = convoy
    ? `<div style="
        position:absolute;inset:-5px;border-radius:50%;
        border:2px solid ${borderColor};
        animation:convoy-pulse 1.5s ease-out infinite;
        pointer-events:none;
      "></div>`
    : "";

  const inner = avatarUrl
    ? `<img src="${avatarUrl}"
           width="${MARKER_SIZE}" height="${MARKER_SIZE}"
           style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;object-fit:cover;border-radius:50%;display:block;" />`
    : `<svg width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 38 38" fill="none">
         <circle cx="19" cy="14" r="7" fill="${borderColor}" opacity="0.85"/>
         <path d="M5 36c0-7.732 6.268-14 14-14s14 6.268 14 14"
               stroke="${borderColor}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
       </svg>`;

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;">
      ${convoyRing}
      <div style="
        width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;
        border:2.5px solid ${borderColor};
        box-shadow:0 0 8px ${glowColor},0 0 18px ${glowColor}55${convoy ? `,0 0 30px ${glowColor}88` : ""};
        overflow:hidden;background:#0a0b14;
        display:flex;align-items:center;justify-content:center;
      ">${inner}</div>
    </div>`,
    iconSize:    [MARKER_SIZE, MARKER_SIZE],
    iconAnchor:  [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2 - 6],
  });
}

/* ── Display name with nickname fallback ── */
function racerLabel(r: ActiveRacer): string {
  return r.nickname?.trim() || r.display_name || "Racer";
}

/* ── Relative time helper ── */
function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

/* ── Popup style ── */
const popupStyle = (borderColor: string): React.CSSProperties => ({
  background:   "#0e0f1c",
  border:       `1px solid ${borderColor}`,
  borderRadius: "6px",
  padding:      "8px 12px",
  color:        "#e2e8f0",
  fontFamily:   "var(--font-racing), sans-serif",
  minWidth:     "140px",
});

/* ── Fly to real position on first load, only if permission already granted ── */
function GeolocateView() {
  const map = useMap();
  useEffect(() => {
    if (!navigator?.geolocation || !navigator?.permissions) return;
    navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
      if (result.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          MAP_ZOOM,
          { animate: true, duration: 1.2 },
        ),
        () => {},
        { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
      );
    }).catch(() => {});
  }, [map]);
  return null;
}

interface MapViewProps {
  activeRacers: ActiveRacer[];
  myRacerId:    string | null;
  nearbyIds?:   Set<string>;
}

export default function MapView({ activeRacers, myRacerId, nearbyIds }: MapViewProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  }, []);

  const selfRacer   = activeRacers.find((r) => r.racer_id === myRacerId) ?? null;
  const otherRacers = activeRacers.filter((r) => r.racer_id !== myRacerId);

  return (
    <div className="map-wrapper w-full h-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        <GeolocateView />

        {/* Other active racers — orange border avatar */}
        {otherRacers.map((r) => (
          <Marker
            key={r.racer_id}
            position={[r.lat, r.lng]}
            icon={createAvatarMarker(r.avatar_url, "#FF4500", "#FF6622", nearbyIds?.has(r.racer_id))}
          >
            <Popup closeButton={false}>
              <div style={popupStyle("rgba(255,69,0,0.4)")}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {r.avatar_url && (
                    <img
                      src={r.avatar_url}
                      alt={racerLabel(r)}
                      width={32} height={32}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                               border: "1px solid rgba(255,69,0,0.5)", flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <div style={{ color: "#FF4500", fontWeight: 700, fontSize: "13px" }}>
                      {racerLabel(r)}
                    </div>
                    {(r.car_make || r.car_model) && (
                      <div style={{ color: "rgba(255,100,0,0.75)", fontSize: "10px",
                                    marginTop: "2px", letterSpacing: "0.06em" }}>
                        {[r.car_make, r.car_model].filter(Boolean).join(" ")}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ color: "rgba(0,212,255,0.5)", fontSize: "10px",
                              marginTop: "6px", letterSpacing: "0.08em" }}>
                  {timeAgo(r.updated_at)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Self — blue border avatar + accuracy circle */}
        {selfRacer && (
          <>
            <Marker
              position={[selfRacer.lat, selfRacer.lng]}
              icon={createAvatarMarker(selfRacer.avatar_url, "#00D4FF", "#33DDFF")}
            >
              <Popup closeButton={false}>
                <div style={popupStyle("rgba(0,212,255,0.4)")}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {selfRacer.avatar_url && (
                      <img
                        src={selfRacer.avatar_url}
                        alt={racerLabel(selfRacer)}
                        width={32} height={32}
                        style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                                 border: "1px solid rgba(0,212,255,0.5)", flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <div style={{ color: "#00D4FF", fontWeight: 700, fontSize: "13px" }}>
                        {racerLabel(selfRacer)}
                      </div>
                      {(selfRacer.car_make || selfRacer.car_model) && (
                        <div style={{ color: "rgba(0,212,255,0.6)", fontSize: "10px",
                                      marginTop: "2px", letterSpacing: "0.06em" }}>
                          {[selfRacer.car_make, selfRacer.car_model].filter(Boolean).join(" ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ color: "rgba(0,212,255,0.5)", fontSize: "10px",
                                marginTop: "6px", letterSpacing: "0.08em" }}>
                    ● LIVE
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[selfRacer.lat, selfRacer.lng]}
              radius={150}
              pathOptions={{
                color:       "rgba(0,212,255,0.4)",
                fillColor:   "rgba(0,212,255,0.06)",
                fillOpacity: 1,
                weight:      1,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
