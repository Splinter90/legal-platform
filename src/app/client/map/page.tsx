"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
    </div>
  ),
});

export default function ClientMapPage() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/lawyers/map")
      .then((r) => r.json())
      .then((data) => {
        setLawyers(data);
        setLoading(false);
      });
  }, []);

  const allSpecialties = [
    ...new Set(lawyers.flatMap((l) => l.specialties.split(",").map((s: string) => s.trim()))),
  ];

  const filtered = filter
    ? lawyers.filter((l) => l.specialties.includes(filter))
    : lawyers;

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Mapa de Abogados
        </h1>
        <p className="text-slate-500 mt-1">
          Encontra profesionales cerca tuyo
        </p>
      </div>

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
        <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[600px]">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">No hay abogados con esa especialidad</p>
          </div>
        </div>
      ) : (
        <LawyersMap lawyers={filtered} showLink={true} height="600px" />
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-700" />
          <span>Abogado verificado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-red-500" />
          <span>Mejor calificado (4.8+)</span>
        </div>
        <span className="text-slate-400">|</span>
        <span>Hace click en un marcador para ver detalles</span>
      </div>
    </div>
  );
}
