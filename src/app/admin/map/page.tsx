"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Star, LocateFixed, AlertCircle } from "lucide-react";
import { SkeletonMap } from "@/components/ui/skeleton";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => <SkeletonMap />,
});

// Mar del Plata, Buenos Aires
const FALLBACK_CENTER: [number, number] = [-38.0055, -57.5426];

export default function AdminMapPage() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "loading" | "denied" | "unsupported" | "ok"
  >("idle");

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

  const avgRating =
    lawyers.length > 0
      ? (lawyers.reduce((s, l) => s + l.rating, 0) / lawyers.length).toFixed(1)
      : "0";

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mapa de Abogados</h1>
        <p className="text-slate-500 mt-1">
          Visualiza la ubicación de todos los profesionales activos
        </p>
      </div>

      {geoStatus === "denied" && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            No pudimos acceder a tu ubicación. El mapa arranca centrado en Mar del
            Plata, Buenos Aires.
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
          Mostrando el mapa centrado en tu ubicación.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{lawyers.length}</p>
              <p className="text-xs text-slate-500">Abogados en el mapa</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{avgRating}</p>
              <p className="text-xs text-slate-500">Rating promedio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {[...new Set(lawyers.map((l) => l.city))].length}
              </p>
              <p className="text-xs text-slate-500">Ciudades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <SkeletonMap />
      ) : (
        <LawyersMap
          lawyers={lawyers}
          showLink={false}
          height="600px"
          userLocation={userLocation}
          initialCenter={FALLBACK_CENTER}
          initialZoom={12}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-700" />
          <span>Abogado activo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-red-500" />
          <span>Rating destacado (4.8+)</span>
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
