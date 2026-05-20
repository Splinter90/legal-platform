"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, LocateFixed, AlertCircle } from "lucide-react";
import { SkeletonMap } from "@/components/ui/skeleton";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => (
<SkeletonMap />
  ),
});

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function ClientMapPage() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "unsupported" | "ok">(
    "idle"
  );

  useEffect(() => {
    fetch("/api/lawyers/map")
      .then((r) => r.json())
      .then((data) => setLawyers(Array.isArray(data) ? data : []))
      .catch(() => setLawyers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  function requestLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }

  const allSpecialties = [
    ...new Set(lawyers.flatMap((l) => l.specialties.split(",").map((s: string) => s.trim()))),
  ];

  const filtered = useMemo(() => {
    const base = filter ? lawyers.filter((l) => l.specialties.includes(filter)) : lawyers;
    if (!userLocation) return base;
    return [...base]
      .map((l) => ({
        ...l,
        _distanceKm: haversineKm(
          { lat: userLocation.latitude, lng: userLocation.longitude },
          { lat: l.latitude, lng: l.longitude }
        ),
      }))
      .sort((a, b) => a._distanceKm - b._distanceKm);
  }, [lawyers, filter, userLocation]);

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mapa de Abogados</h1>
        <p className="text-slate-500 mt-1">Encontra profesionales cerca tuyo</p>
      </div>

      {geoStatus === "denied" && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            No pudimos acceder a tu ubicación. El mapa se muestra centrado en el promedio de los
            abogados. Habilitá la ubicación en tu navegador para ver los más cercanos.
            <button
              onClick={requestLocation}
              className="ml-2 underline font-medium hover:text-amber-900"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {geoStatus === "ok" && userLocation && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2 text-sm text-emerald-800 flex items-center gap-2">
          <LocateFixed className="w-4 h-4" />
          Mostrando abogados ordenados por cercanía a tu ubicación.
        </div>
      )}

      {/* Filter by specialty */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !filter
              ? "bg-brand-600 text-white shadow-lg shadow-glow-brand"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Todos ({lawyers.length})
        </button>
        {allSpecialties.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s
                ? "bg-brand-600 text-white shadow-lg shadow-glow-brand"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {s} ({lawyers.filter((l) => l.specialties.includes(s)).length})
          </button>
        ))}
      </div>

      {loading ? (
<SkeletonMap />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No hay abogados con esa especialidad</p>
          </div>
        </div>
      ) : (
        <LawyersMap
          lawyers={filtered}
          showLink={true}
          height="600px"
          userLocation={userLocation}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 ring-1 ring-white" />
          <span>Abogado verificado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-red-500 ring-1 ring-white" />
          <span>Mejor calificado (4.8+)</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />
            <span>Tu ubicación</span>
          </div>
        )}
      </div>
    </div>
  );
}
