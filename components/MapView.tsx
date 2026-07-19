"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Default center: Chișinău ── */
const MAP_CENTER: [number, number] = [47.0105, 28.8638];
const MAP_ZOOM = 13;

/* ── Mock racer locations around Chișinău ── */
const MOCK_RACERS = [
  { id: 1, lat: 47.0205, lng: 28.8538, name: "Mihail V.", car: "Skyline R34" },
  { id: 2, lat: 47.0005, lng: 28.8738, name: "Alex T.",   car: "Supra MK4"  },
  { id: 3, lat: 47.0155, lng: 28.8838, name: "Radu M.",   car: "Evo IX"     },
  { id: 4, lat: 46.9980, lng: 28.8450, name: "Dan P.",    car: "RX-7 FD"    },
  { id: 5, lat: 47.0320, lng: 28.8720, name: "Andrei L.", car: "S15 Silvia" },
];

/* ── Custom neon marker factory ── */
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
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const racerMarker = createNeonMarker("#FF4500", "#FF6622");
const selfMarker  = createNeonMarker("#00D4FF", "#33DDFF");

/* ── Inner component: requests geolocation and flies the map view ── */
function GeolocateView() {
  const map = useMap();

  useEffect(() => {
    if (!navigator?.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          MAP_ZOOM,
          { animate: true, duration: 1.2 },
        );
      },
      () => {
        /* denied or unavailable — stay on Chișinău, no action needed */
      },
      { timeout: 10_000, maximumAge: 0, enableHighAccuracy: false },
    );
  }, [map]);

  return null;
}

export default function MapView() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  }, []);

  return (
    <div className="map-wrapper w-full h-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark CartoDB tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Geolocation handler — flies view to real position if granted */}
        <GeolocateView />

        {/* Mock racer markers */}
        {MOCK_RACERS.map((racer) => (
          <Marker key={racer.id} position={[racer.lat, racer.lng]} icon={racerMarker}>
            <Popup closeButton={false}>
              <div style={{
                background: "#0e0f1c",
                border: "1px solid rgba(255,69,0,0.4)",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#e2e8f0",
                fontFamily: "var(--font-racing), sans-serif",
                minWidth: "120px",
              }}>
                <div style={{ color: "#FF4500", fontWeight: 700, fontSize: "14px", letterSpacing: "0.05em" }}>
                  {racer.name}
                </div>
                <div style={{ color: "rgba(226,232,240,0.6)", fontSize: "11px", marginTop: "2px" }}>
                  {racer.car}
                </div>
                <div style={{ color: "rgba(0,212,255,0.7)", fontSize: "10px", marginTop: "4px", letterSpacing: "0.08em" }}>
                  STAȚIONAR
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* "My location" placeholder — stays at Chișinău until real tracking is added */}
        <Marker position={MAP_CENTER} icon={selfMarker}>
          <Popup closeButton={false}>
            <div style={{
              background: "#0e0f1c",
              border: "1px solid rgba(0,212,255,0.4)",
              borderRadius: "6px",
              padding: "8px 12px",
              color: "#e2e8f0",
              fontFamily: "var(--font-racing), sans-serif",
            }}>
              <div style={{ color: "#00D4FF", fontWeight: 700, fontSize: "14px" }}>
                TU
              </div>
              <div style={{ color: "rgba(226,232,240,0.5)", fontSize: "10px", marginTop: "2px", letterSpacing: "0.08em" }}>
                LOCAȚIE PLACEHOLDER
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Soft radius around placeholder position */}
        <Circle
          center={MAP_CENTER}
          radius={800}
          pathOptions={{
            color: "rgba(0,212,255,0.4)",
            fillColor: "rgba(0,212,255,0.04)",
            fillOpacity: 1,
            weight: 1,
          }}
        />
      </MapContainer>
    </div>
  );
}
