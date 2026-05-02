"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Star } from "lucide-react";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
    </div>
  ),
});

export default function AdminMapPage() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lawyers/map")
      .then((r) => r.json())
      .then((data) => {
        setLawyers(data);
        setLoading(false);
      });
  }, []);

  const avgRating = lawyers.length > 0
    ? (lawyers.reduce((s, l) => s + l.rating, 0) / lawyers.length).toFixed(1)
    : "0";

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Mapa de Abogados
        </h1>
        <p className="text-slate-500 mt-1">
          Visualiza la ubicacion de todos los profesionales activos
        </p>
      </div>

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
        <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      ) : (
        <LawyersMap lawyers={lawyers} showLink={false} height="600px" />
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
      </div>
    </div>
  );
}
