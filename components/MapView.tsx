"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ActiveRacer } from "@/hooks/useActiveRacers";

const MAP_CENTER: [number, number] = [47.0105, 28.8638];
const MAP_ZOOM = 13;

/* ── Neon marker factory ── */
function createNeonMarker(color: string, glowColor: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};
        border:2px solid ${glowColor};
        box-shadow:0 0 8px ${color},0 0 16px ${glowColor}66;
        position:relative;
      ">
        <div style="
          width:4px;height:4px;border-radius:50%;
          background:#fff;opacity:0.8;
          position:absolute;top:2px;left:2px;
        "></div>
      </div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
}

const markerOther = createNeonMarker("#FF4500", "#FF6622"); // orange — other racers
const markerSelf  = createNeonMarker("#00D4FF", "#33DDFF"); // blue   — own position

/* ── Display name with nickname fallback ── */
function racerLabel(r: ActiveRacer): string {
  return r.nickname?.trim() || r.display_name || "Racer";
}

/* ── Relative time helper ── */
function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

/* ── Popup style ── */
const popupStyle = (borderColor: string): React.CSSProperties => ({
  background:  "#0e0f1c",
  border:      `1px solid ${borderColor}`,
  borderRadius: "6px",
  padding:     "8px 12px",
  color:       "#e2e8f0",
  fontFamily:  "var(--font-racing), sans-serif",
  minWidth:    "120px",
});

/* ── Fly to real position on first load ── */
function GeolocateView() {
  const map = useMap();
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo(
        [pos.coords.latitude, pos.coords.longitude],
        MAP_ZOOM,
        { animate: true, duration: 1.2 },
      ),
      () => { /* denied — stay on Chișinău */ },
      { timeout: 10_000, maximumAge: 0, enableHighAccuracy: false },
    );
  }, [map]);
  return null;
}

interface MapViewProps {
  activeRacers: ActiveRacer[];
  myRacerId:    string | null;
}

export default function MapView({ activeRacers, myRacerId }: MapViewProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  }, []);

  const selfRacer  = activeRacers.find((r) => r.racer_id === myRacerId) ?? null;
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

        {/* Other active racers — orange markers */}
        {otherRacers.map((r) => (
          <Marker key={r.racer_id} position={[r.lat, r.lng]} icon={markerOther}>
            <Popup closeButton={false}>
              <div style={popupStyle("rgba(255,69,0,0.4)")}>
                <div style={{ color: "#FF4500", fontWeight: 700, fontSize: "14px" }}>
                  {racerLabel(r)}
                </div>
                {(r.car_make || r.car_model) && (
                  <div style={{ color: "rgba(255,100,0,0.75)", fontSize: "10px", marginTop: "2px", letterSpacing: "0.06em" }}>
                    {[r.car_make, r.car_model].filter(Boolean).join(" ")}
                  </div>
                )}
                <div style={{ color: "rgba(0,212,255,0.5)", fontSize: "10px", marginTop: "4px", letterSpacing: "0.08em" }}>
                  {timeAgo(r.updated_at)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Self — blue marker + accuracy circle */}
        {selfRacer && (
          <>
            <Marker position={[selfRacer.lat, selfRacer.lng]} icon={markerSelf}>
              <Popup closeButton={false}>
                <div style={popupStyle("rgba(0,212,255,0.4)")}>
                  <div style={{ color: "#00D4FF", fontWeight: 700, fontSize: "14px" }}>
                    {racerLabel(selfRacer)}
                  </div>
                  {(selfRacer.car_make || selfRacer.car_model) && (
                    <div style={{ color: "rgba(0,212,255,0.6)", fontSize: "10px", marginTop: "2px", letterSpacing: "0.06em" }}>
                      {[selfRacer.car_make, selfRacer.car_model].filter(Boolean).join(" ")}
                    </div>
                  )}
                  <div style={{ color: "rgba(0,212,255,0.5)", fontSize: "10px", marginTop: "4px", letterSpacing: "0.08em" }}>
                    LIVE
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
