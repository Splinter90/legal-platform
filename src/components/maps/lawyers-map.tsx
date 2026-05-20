"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

interface LawyerMarker {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string;
  province: string;
  city: string;
  address?: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  narrative?: string;
  phone?: string;
  profilePhoto?: string | null;
}

interface LawyersMapProps {
  lawyers: LawyerMarker[];
  showLink?: boolean;
  height?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  initialCenter?: [number, number];
  initialZoom?: number;
}

function lawyerIcon(lawyer: LawyerMarker, isTop: boolean) {
  const size = isTop ? 52 : 44;
  const initials = `${lawyer.firstName[0] || ""}${lawyer.lastName[0] || ""}`.toUpperCase();
  const ring = isTop
    ? "linear-gradient(135deg, #f59e0b, #ef4444)"
    : "linear-gradient(135deg, #3b82f6, #6366f1)";
  const inner = lawyer.profilePhoto
    ? `<img src="${lawyer.profilePhoto}" alt="" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${
        isTop ? 16 : 14
      }px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:50%;">${initials}</div>`;
  return L.divIcon({
    className: "lawyer-photo-marker",
    html: `<div style="
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        padding:3px;
        background:${ring};
        box-shadow:0 4px 12px rgba(15,23,42,0.25);
      ">
        <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:white;">
          ${inner}
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.25;animation:pulse 2s infinite;"></div>
      <div style="position:absolute;inset:6px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
    </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function RecenterOnUser({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 13, { animate: true });
  }, [coords, map]);
  return null;
}

export default function LawyersMap({
  lawyers,
  showLink = true,
  height = "600px",
  userLocation,
  initialCenter,
  initialZoom = 13,
}: LawyersMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userCoords = useMemo<[number, number] | null>(
    () => (userLocation ? [userLocation.latitude, userLocation.longitude] : null),
    [userLocation]
  );

  const lawyerIcons = useMemo(
    () =>
      new Map(
        lawyers.map((l) => [l.id, lawyerIcon(l, l.rating >= 4.8)])
      ),
    [lawyers]
  );

  if (!mounted) {
    return (
      <div
        className="bg-slate-100 rounded-2xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2 animate-pulse" />
          <p className="text-slate-500">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const center: [number, number] =
    userCoords ||
    initialCenter ||
    (lawyers.length > 0
      ? [
          lawyers.reduce((s, l) => s + l.latitude, 0) / lawyers.length,
          lawyers.reduce((s, l) => s + l.longitude, 0) / lawyers.length,
        ]
      : [-38.0055, -57.5426]);

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg border border-slate-200"
      style={{ height }}
    >
      <style>{`@keyframes pulse{0%{transform:scale(1);opacity:.35}70%{transform:scale(1.8);opacity:0}100%{transform:scale(1.8);opacity:0}}`}</style>
      <MapContainer
        center={center}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          updateWhenIdle={true}
          keepBuffer={4}
        />
        <RecenterOnUser coords={userCoords} />

        {userCoords && (
          <Marker position={userCoords} icon={userIcon}>
            <Popup>Tu ubicación</Popup>
          </Marker>
        )}

        {lawyers.map((lawyer) => (
          <Marker
            key={lawyer.id}
            position={[lawyer.latitude, lawyer.longitude]}
            icon={lawyerIcons.get(lawyer.id)!}
          >
            <Popup maxWidth={320} minWidth={280}>
              <div className="p-1">
                <div className="flex items-center gap-3 mb-3">
                  {lawyer.profilePhoto ? (
                    <img
                      src={lawyer.profilePhoto}
                      alt={`${lawyer.firstName} ${lawyer.lastName}`}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        flexShrink: 0,
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      {lawyer.firstName[0]}
                      {lawyer.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#1e293b" }}>
                      {lawyer.firstName} {lawyer.lastName}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <span style={{ color: "#f59e0b", fontSize: 13 }}>
                        {"★".repeat(Math.round(lawyer.rating))}
                        {"☆".repeat(5 - Math.round(lawyer.rating))}
                      </span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        ({lawyer.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {lawyer.specialties.split(",").map((s) => (
                    <span
                      key={s}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>

                {lawyer.address && (
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px 0" }}>
                    📍 {lawyer.address}
                  </p>
                )}

                {lawyer.narrative && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      margin: "6px 0",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {lawyer.narrative}
                  </p>
                )}

                {showLink && (
                  <a
                    href={`/client/lawyers/${lawyer.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 10,
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      color: "white",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Ver Perfil Completo →
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
