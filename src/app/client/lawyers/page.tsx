"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, MapPin, Filter, ArrowRight, User } from "lucide-react";

interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string;
  province: string;
  city: string;
  narrative: string;
  rating: number;
  reviewCount: number;
}

const specialties = [
  "Derecho Penal",
  "Derecho Civil",
  "Derecho Laboral",
  "Derecho Comercial",
  "Derecho de Familia",
  "Derecho Tributario",
  "Derecho Administrativo",
  "Derecho Ambiental",
  "Derecho Inmobiliario",
  "Derecho Informatico",
];

const provinces = [
  "Buenos Aires",
  "CABA",
  "Cordoba",
  "Santa Fe",
  "Mendoza",
  "Tucuman",
];

export default function ClientLawyers() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyers();
  }, [specialty, province]);

  async function fetchLawyers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (province) params.set("province", province);
    if (search) params.set("search", search);
    const res = await fetch(`/api/clients/lawyers?${params}`);
    const data = await res.json();
    setLawyers(data);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchLawyers();
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Buscar Abogados
        </h1>
        <p className="text-slate-500 mt-1">
          Encontra al profesional ideal segun tu necesidad
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl font-medium hover:from-brand-400 hover:to-brand-500 transition-all shadow-lg shadow-glow-brand"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Especialidad
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Provincia
          </label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      ) : lawyers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron abogados
            </h3>
            <p className="text-slate-500">
              Intenta con otros filtros de busqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <Card
              key={lawyer.id}
              className="hover:shadow-lg hover:border-brand-100 transition-all duration-300 group"
            >
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {lawyer.firstName[0]}
                    {lawyer.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {lawyer.firstName} {lawyer.lastName}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Stars rating={Math.round(lawyer.rating)} size="sm" />
                      <span className="text-xs text-slate-500">
                        ({lawyer.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {lawyer.city}, {lawyer.province}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {lawyer.specialties
                    .split(",")
                    .slice(0, 3)
                    .map((s) => (
                      <Badge key={s} variant="info">
                        {s.trim()}
                      </Badge>
                    ))}
                </div>

                {lawyer.narrative && (
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {lawyer.narrative}
                  </p>
                )}

                <Link
                  href={`/client/lawyers/${lawyer.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors group-hover:bg-brand-50"
                >
                  Ver Perfil
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
