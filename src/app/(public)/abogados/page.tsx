"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  MapPin,
  User,
  ArrowRight,
  Sparkles,
  Filter,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function PublicLawyersPage() {
  const { status } = useSession();
  const isAuth = status === "authenticated";

  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) {
      setLoading(false);
      return;
    }
    fetchLawyers();
  }, [specialty, province, isAuth]);

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
    if (!isAuth) return;
    fetchLawyers();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Abogados verificados en Argentina",
            description:
              "Listado de abogados matriculados disponibles para consulta legal online.",
            inLanguage: "es-AR",
            isPartOf: {
              "@type": "WebSite",
              name: "Leyes Digital",
            },
            about: {
              "@type": "LegalService",
              name: "Leyes Digital",
              areaServed: "AR",
            },
          }),
        }}
      />
      {/* Hero */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-20 overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 hero-rays opacity-60" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Directorio profesional
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              Encontra al{" "}
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-300 bg-clip-text text-transparent">
                abogado ideal
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Filtra por especialidad y provincia. Todos los profesionales estan
              verificados y matriculados.
            </p>
          </Reveal>

          {/* Search bar (visual, gated) */}
          <Reveal delay={120} className="mt-10">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      isAuth
                        ? "Buscar por nombre o ciudad..."
                        : "Inicia sesion para buscar"
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={!isAuth}
                    className="w-full pl-14 pr-5 py-4 rounded-full border border-white/10 bg-slate-900/60 backdrop-blur text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" disabled={!isAuth}>
                  Buscar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="bg-gradient-to-b from-slate-50 to-white text-slate-900 px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto">
          {status === "loading" ? (
<div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl bg-slate-800/40 border border-white/5" />
              ))}
            </div>
          ) : !isAuth ? (
            // Login wall for anonymous users
            <Reveal>
              <div className="relative max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xl overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Acceso reservado a clientes
                  </h2>
                  <p className="mt-3 text-slate-600 leading-relaxed max-w-md mx-auto">
                    Para proteger los datos de los profesionales, el directorio
                    de abogados solo esta disponible para clientes registrados.
                    Es gratis y solo te lleva un minuto.
                  </p>

                  <ul className="mt-6 space-y-2 text-sm text-slate-700 max-w-sm mx-auto text-left">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      Buscar abogados verificados por especialidad
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      Ver perfiles, calificaciones y reseñas reales
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      Agendar consultas por videollamada
                    </li>
                  </ul>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/login">
                      <Button variant="primary" size="lg">
                        Iniciar sesion
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/register-client">
                      <Button variant="outline" size="lg">
                        Crear cuenta gratis
                      </Button>
                    </Link>
                  </div>

                  <p className="mt-6 text-xs text-slate-500">
                    Sos abogado?{" "}
                    <Link
                      href="/register-lawyer"
                      className="font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Registrate como profesional
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <Reveal>
                <div className="flex flex-wrap items-center gap-4 mb-10">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      Filtros
                    </span>
                  </div>
                  <div>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Todas las especialidades</option>
                      {specialties.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Todas las provincias</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  {(specialty || province || search) && (
                    <button
                      onClick={() => {
                        setSpecialty("");
                        setProvince("");
                        setSearch("");
                      }}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  <span className="ml-auto text-sm text-slate-500">
                    {lawyers.length}{" "}
                    {lawyers.length === 1 ? "resultado" : "resultados"}
                  </span>
                </div>
              </Reveal>

              {loading ? (
<div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl bg-slate-800/40 border border-white/5" />
                  ))}
                </div>
              ) : lawyers.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center">
                  <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    No se encontraron abogados
                  </h3>
                  <p className="text-slate-500">
                    Intenta con otros filtros de busqueda
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lawyers.map((lawyer, idx) => (
                    <Reveal key={lawyer.id} delay={idx * 60}>
                      <div className="group h-full rounded-3xl border border-slate-200 bg-white p-6 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {lawyer.firstName[0]}
                            {lawyer.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">
                              {lawyer.firstName} {lawyer.lastName}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
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
                              <Badge key={s} variant="brand">
                                {s.trim()}
                              </Badge>
                            ))}
                        </div>

                        {lawyer.narrative && (
                          <p className="text-sm text-slate-600 mt-4 line-clamp-2 leading-relaxed">
                            {lawyer.narrative}
                          </p>
                        )}

                        <Link
                          href={`/abogados/${lawyer.id}`}
                          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:from-brand-400 hover:to-brand-500 shadow-glow-brand hover:shadow-[0_15px_40px_-10px_rgba(20,184,166,0.6)] hover:-translate-y-0.5 transition-all"
                        >
                          Ver perfil y agendar
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
