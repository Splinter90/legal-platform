"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, MapPin, ArrowRight, User, SlidersHorizontal, X } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/client/favorite-button";

interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string;
  languages: string;
  gender: string | null;
  province: string;
  city: string;
  narrative: string;
  rating: number;
  reviewCount: number;
  _distanceKm?: number;
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

const languages = ["Espanol", "Ingles", "Portugues", "Italiano", "Frances", "Aleman"];
const genders = [
  { value: "female", label: "Mujer" },
  { value: "male", label: "Hombre" },
  { value: "other", label: "Otro" },
];

export default function ClientLawyers() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [province, setProvince] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [radiusKm, setRadiusKm] = useState(0);
  const [availableOn, setAvailableOn] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLawyers();
  }, [specialty, province, language, gender, minRating, radiusKm, availableOn, userLoc]);

  async function ensureLocation(): Promise<{ lat: number; lng: number } | null> {
    if (userLoc) return userLoc;
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          resolve(loc);
        },
        () => resolve(null),
        { timeout: 8000 }
      );
    });
  }

  async function fetchLawyers() {
    setLoading(true);
    const params = new URLSearchParams();
    if (specialty) params.set("specialty", specialty);
    if (province) params.set("province", province);
    if (language) params.set("language", language);
    if (gender) params.set("gender", gender);
    if (minRating > 0) params.set("minRating", String(minRating));
    if (availableOn) params.set("availableOn", availableOn);
    if (search) params.set("search", search);
    if (radiusKm > 0 && userLoc) {
      params.set("lat", String(userLoc.lat));
      params.set("lng", String(userLoc.lng));
      params.set("radiusKm", String(radiusKm));
    }
    const res = await fetch(`/api/clients/lawyers?${params}`);
    const data = await res.json();
    setLawyers(data);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchLawyers();
  }

  async function handleRadiusChange(value: number) {
    if (value > 0 && !userLoc) {
      const loc = await ensureLocation();
      if (!loc) {
        alert("Necesitamos tu ubicacion para filtrar por radio. Activa la geolocalizacion del navegador.");
        return;
      }
    }
    setRadiusKm(value);
  }

  function clearFilters() {
    setSpecialty("");
    setProvince("");
    setLanguage("");
    setGender("");
    setMinRating(0);
    setRadiusKm(0);
    setAvailableOn("");
  }

  const activeFiltersCount =
    (specialty ? 1 : 0) +
    (province ? 1 : 0) +
    (language ? 1 : 0) +
    (gender ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (radiusKm > 0 ? 1 : 0) +
    (availableOn ? 1 : 0);

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Buscar Abogados</h1>
        <p className="text-slate-500 mt-1">
          Encontra al profesional ideal segun tu necesidad
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
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

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad</label>
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
          <label className="block text-xs font-medium text-slate-500 mb-1">Provincia</label>
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
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros avanzados
          {activeFiltersCount > 0 && (
            <Badge variant="brand">{activeFiltersCount}</Badge>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {advancedOpen && (
        <Card className="mb-6">
          <CardContent className="py-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Cualquiera</option>
                  {languages.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Genero</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Cualquiera</option>
                  {genders.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Disponible el dia
                </label>
                <input
                  type="date"
                  value={availableOn}
                  onChange={(e) => setAvailableOn(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Rating minimo: {minRating > 0 ? `${minRating} estrellas` : "Cualquiera"}
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Radio: {radiusKm > 0 ? `${radiusKm} km de mi ubicacion` : "Sin limite"}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={radiusKm}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <SkeletonList rows={6} />
      ) : lawyers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No se encontraron abogados
            </h3>
            <p className="text-slate-500">Intenta con otros filtros de busqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <Card
              key={lawyer.id}
              className="hover:shadow-lg hover:border-brand-100 transition-all duration-300 group relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton lawyerId={lawyer.id} size="sm" />
              </div>
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {lawyer.firstName[0]}
                    {lawyer.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
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
                      {lawyer._distanceKm !== undefined && (
                        <span className="text-brand-600 font-medium ml-1">
                          · {lawyer._distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {lawyer.specialties
                    .split(",")
                    .filter(Boolean)
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
