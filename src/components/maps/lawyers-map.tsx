"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";

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
}

interface LawyersMapProps {
  lawyers: LawyerMarker[];
  showLink?: boolean;
  height?: string;
}

const defaultIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      transform: rotate(45deg);
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">⚖</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const highlightIcon = L.divIcon({
  className: "custom-marker-highlight",
  html: `<div style="
    width: 42px;
    height: 42px;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      transform: rotate(45deg);
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">★</div>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

export default function LawyersMap({ lawyers, showLink = true, height = "600px" }: LawyersMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const center: [number, number] = lawyers.length > 0
    ? [
        lawyers.reduce((s, l) => s + l.latitude, 0) / lawyers.length,
        lawyers.reduce((s, l) => s + l.longitude, 0) / lawyers.length,
      ]
    : [-38.0055, -57.5426];

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {lawyers.map((lawyer) => (
          <Marker
            key={lawyer.id}
            position={[lawyer.latitude, lawyer.longitude]}
            icon={lawyer.rating >= 4.8 ? highlightIcon : defaultIcon}
          >
            <Popup maxWidth={320} minWidth={280}>
              <div className="p-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex-shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    {lawyer.firstName[0]}{lawyer.lastName[0]}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "15px", margin: 0, color: "#1e293b" }}>
                      {lawyer.firstName} {lawyer.lastName}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <span style={{ color: "#f59e0b", fontSize: "13px" }}>
                        {"★".repeat(Math.round(lawyer.rating))}{"☆".repeat(5 - Math.round(lawyer.rating))}
                      </span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        ({lawyer.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                  {lawyer.specialties.split(",").map((s) => (
                    <span
                      key={s}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>

                {lawyer.address && (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                    📍 {lawyer.address}
                  </p>
                )}

                {lawyer.narrative && (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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
                      gap: "6px",
                      marginTop: "10px",
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                      color: "white",
                      borderRadius: "10px",
                      fontSize: "13px",
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
