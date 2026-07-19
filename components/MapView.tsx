"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ActiveRacer } from "@/hooks/useActiveRacers";
import type { POI } from "@/hooks/usePOI";

const MAP_CENTER: [number, number] = [47.0105, 28.8638];
const MAP_ZOOM = 13;
const MARKER_SIZE = 38;
const AVATAR_ZOOM_THRESHOLD = 16;
const FLASH_WINDOW_MS = 8_000;

function isFlashing(flashAt: string | null): boolean {
  if (!flashAt) return false;
  return Date.now() - new Date(flashAt).getTime() < FLASH_WINDOW_MS;
}

function flashRings(size: number): string {
  const half = size / 2;
  return `
    <div style="position:absolute;inset:-${half}px;border-radius:50%;border:2.5px solid #FF6600;
      animation:flash-ping-outer 0.75s ease-out infinite;pointer-events:none;"></div>
    <div style="position:absolute;inset:-${Math.round(half * 0.55)}px;border-radius:50%;border:2px solid #FFB300;
      animation:flash-ping-inner 0.75s ease-out 0.15s infinite;pointer-events:none;"></div>`;
}

/* ── Simple neon dot marker (used at low zoom) ── */
function createNeonMarker(color: string, glowColor: string, convoy = false, flash = false): L.DivIcon {
  const convoyRing = convoy
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid ${color};animation:convoy-pulse 1.5s ease-out infinite;pointer-events:none;"></div>`
    : "";
  const flashOverlay = flash ? flashRings(14) : "";
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:14px;height:14px;">
      ${convoyRing}${flashOverlay}
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:${flash ? "#FF6600" : color};border:2px solid ${flash ? "#FFB300" : glowColor};
        box-shadow:0 0 8px ${color},0 0 16px ${glowColor}66${convoy ? `,0 0 24px ${glowColor}` : ""}${flash ? ",0 0 20px #FF660088" : ""};
        position:relative;
      ">
        <div style="width:4px;height:4px;border-radius:50%;background:#fff;opacity:0.8;position:absolute;top:2px;left:2px;"></div>
      </div>
    </div>`,
    iconSize:    [14, 14],
    iconAnchor:  [7, 7],
    popupAnchor: [0, -10],
  });
}

/* ── Avatar marker (used at high zoom) ── */
function createAvatarMarker(
  avatarUrl:   string | null,
  borderColor: string,
  glowColor:   string,
  convoy:      boolean = false,
  flash:       boolean = false,
): L.DivIcon {
  const convoyRing = convoy
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid ${borderColor};animation:convoy-pulse 1.5s ease-out infinite;pointer-events:none;"></div>`
    : "";
  const flashOverlay = flash ? flashRings(MARKER_SIZE) : "";

  const inner = avatarUrl
    ? `<img src="${avatarUrl}" width="${MARKER_SIZE}" height="${MARKER_SIZE}"
           style="width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;object-fit:cover;border-radius:50%;display:block;" />`
    : `<svg width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 38 38" fill="none">
         <circle cx="19" cy="14" r="7" fill="${borderColor}" opacity="0.85"/>
         <path d="M5 36c0-7.732 6.268-14 14-14s14 6.268 14 14"
               stroke="${borderColor}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
       </svg>`;

  const activeBorder = flash ? "#FF6600" : borderColor;
  const activeGlow   = flash ? "#FF660088" : `${glowColor}55`;

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;">
      ${convoyRing}${flashOverlay}
      <div style="
        width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:50%;
        border:2.5px solid ${activeBorder};
        box-shadow:0 0 8px ${glowColor},0 0 18px ${activeGlow}${convoy ? `,0 0 30px ${glowColor}88` : ""}${flash ? ",0 0 28px #FF660099" : ""};
        overflow:hidden;background:#0a0b14;
        display:flex;align-items:center;justify-content:center;
      ">${inner}</div>
    </div>`,
    iconSize:    [MARKER_SIZE, MARKER_SIZE],
    iconAnchor:  [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2 - 6],
  });
}

/* ── POI icon config ── */
const POI_ICON_CONFIG: Record<string, { color: string; label: string }> = {
  meetup:  { color: "#00D4FF", label: "Loc de întâlnire" },
  gas:     { color: "#FFB300", label: "Benzinărie" },
  wash:    { color: "#00FFCC", label: "Spălătorie" },
  repair:  { color: "#FF4500", label: "Service" },
  default: { color: "#CC44FF", label: "Punct" },
};

function createPOIMarker(iconType: string): L.DivIcon {
  const { color } = POI_ICON_CONFIG[iconType] ?? POI_ICON_CONFIG.default;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:30px;">
      <svg width="22" height="30" viewBox="0 0 22 30" fill="none"
           style="filter:drop-shadow(0 0 5px ${color}) drop-shadow(0 0 2px ${color});">
        <path d="M11 0C4.925 0 0 4.925 0 11c0 3.624 1.63 6.858 4.187 9.014L11 30l6.813-9.986C20.37 17.858 22 14.624 22 11 22 4.925 17.075 0 11 0z"
              fill="${color}" opacity="0.92"/>
        <circle cx="11" cy="11" r="4.5" fill="rgba(255,255,255,0.35)"/>
        <circle cx="11" cy="11" r="2" fill="rgba(255,255,255,0.65)"/>
      </svg>
    </div>`,
    iconSize:    [22, 30],
    iconAnchor:  [11, 30],
    popupAnchor: [0, -32],
  });
}

function createPOIDotMarker(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:14px;height:14px;">
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:#FFD700;border:2px solid #FFA500;
        box-shadow:0 0 8px #FFD700,0 0 16px #FFA50066;
        position:relative;
      ">
        <div style="width:4px;height:4px;border-radius:50%;background:#fff;opacity:0.8;position:absolute;top:2px;left:2px;"></div>
      </div>
    </div>`,
    iconSize:    [14, 14],
    iconAnchor:  [7, 7],
    popupAnchor: [0, -10],
  });
}

/* ── Map click handler (add-POI mode) ── */
function MapClickHandler({
  enabled,
  onMapClick,
}: {
  enabled:    boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ── POI markers layer ── */
interface POILayerProps {
  pois:        POI[];
  isAdmin:     boolean;
  onDeletePOI: (id: string) => void;
}

function POILayer({ pois, isAdmin, onDeletePOI }: POILayerProps) {
  const [zoom, setZoom] = useState(MAP_ZOOM);

  useMapEvents({
    zoom: (e) => setZoom(e.target.getZoom()),
  });

  const showPin = zoom >= AVATAR_ZOOM_THRESHOLD;

  return (
    <>
      {pois.map((poi) => {
        const cfg = POI_ICON_CONFIG[poi.icon_type] ?? POI_ICON_CONFIG.default;
        const icon = showPin ? createPOIMarker(poi.icon_type) : createPOIDotMarker();
        return (
          <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={icon}>
            <Popup closeButton={false}>
              <div style={{
                background:   "#0e0f1c",
                border:       `1px solid ${cfg.color}55`,
                borderRadius: "6px",
                padding:      "8px 12px",
                color:        "#e2e8f0",
                fontFamily:   "var(--font-racing), sans-serif",
                minWidth:     "140px",
              }}>
                <div style={{ fontSize: "9px", color: `${cfg.color}99`, letterSpacing: "0.1em",
                              textTransform: "uppercase", marginBottom: "4px" }}>
                  {cfg.label}
                </div>
                <div style={{ color: cfg.color, fontWeight: 700, fontSize: "13px" }}>
                  {poi.title}
                </div>
                {poi.description && (
                  <div style={{ color: "rgba(226,232,240,0.65)", fontSize: "11px",
                                marginTop: "4px", lineHeight: 1.4 }}>
                    {poi.description}
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={() => onDeletePOI(poi.id)}
                    style={{
                      marginTop:    "10px",
                      background:   "rgba(255,34,0,0.1)",
                      border:       "1px solid rgba(255,34,0,0.35)",
                      borderRadius: "3px",
                      color:        "#FF4444",
                      fontSize:     "9px",
                      fontWeight:   700,
                      letterSpacing:"0.08em",
                      padding:      "3px 8px",
                      cursor:       "pointer",
                      width:        "100%",
                      fontFamily:   "var(--font-racing), sans-serif",
                      textTransform:"uppercase",
                    }}
                  >
                    Șterge punct
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
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

/* ── Markers layer — switches between dot and avatar based on zoom ── */
interface MarkersProps {
  otherRacers: ActiveRacer[];
  selfRacer:   ActiveRacer | null;
  nearbyIds?:  Set<string>;
}

function MarkersLayer({ otherRacers, selfRacer, nearbyIds }: MarkersProps) {
  const [zoom, setZoom] = useState(MAP_ZOOM);

  useMapEvents({
    zoom: (e) => setZoom(e.target.getZoom()),
  });

  const showAvatar = zoom >= AVATAR_ZOOM_THRESHOLD;

  return (
    <>
      {/* Other active racers */}
      {otherRacers.map((r) => {
        const inConvoy = nearbyIds?.has(r.racer_id) ?? false;
        const flashing = isFlashing(r.flash_at);
        const icon = showAvatar
          ? createAvatarMarker(r.avatar_url, "#FF4500", "#FF6622", inConvoy, flashing)
          : createNeonMarker("#FF4500", "#FF6622", inConvoy, flashing);

        return (
          <Marker key={r.racer_id} position={[r.lat, r.lng]} icon={icon}>
            <Popup closeButton={false}>
              <div style={popupStyle("rgba(255,69,0,0.4)")}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {r.avatar_url && (
                    <img src={r.avatar_url} alt={racerLabel(r)} width={32} height={32}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                               border: "1px solid rgba(255,69,0,0.5)", flexShrink: 0 }} />
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
        );
      })}

      {/* Self — blue marker + accuracy circle */}
      {selfRacer && (
        <>
          <Marker
            position={[selfRacer.lat, selfRacer.lng]}
            icon={showAvatar
              ? createAvatarMarker(selfRacer.avatar_url, "#00D4FF", "#33DDFF")
              : createNeonMarker("#00D4FF", "#33DDFF")}
          >
            <Popup closeButton={false}>
              <div style={popupStyle("rgba(0,212,255,0.4)")}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {selfRacer.avatar_url && (
                    <img src={selfRacer.avatar_url} alt={racerLabel(selfRacer)} width={32} height={32}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                               border: "1px solid rgba(0,212,255,0.5)", flexShrink: 0 }} />
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
    </>
  );
}

interface MapViewProps {
  activeRacers: ActiveRacer[];
  myRacerId:    string | null;
  nearbyIds?:   Set<string>;
  pois?:        POI[];
  isAdmin?:     boolean;
  addMode?:     boolean;
  onMapClick?:  (lat: number, lng: number) => void;
  onDeletePOI?: (id: string) => void;
}

export default function MapView({
  activeRacers,
  myRacerId,
  nearbyIds,
  pois        = [],
  isAdmin     = false,
  addMode     = false,
  onMapClick  = () => {},
  onDeletePOI = () => {},
}: MapViewProps) {
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
        <MarkersLayer otherRacers={otherRacers} selfRacer={selfRacer} nearbyIds={nearbyIds} />
        <POILayer pois={pois} isAdmin={isAdmin} onDeletePOI={onDeletePOI} />
        <MapClickHandler enabled={addMode} onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
