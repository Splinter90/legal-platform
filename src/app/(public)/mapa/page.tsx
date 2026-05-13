"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => (
<Skeleton className="h-[600px] rounded-3xl border border-white/10 bg-slate-900/60" />
  ),
});

export default function PublicMapPage() {
  const { status } = useSession();
  const router = useRouter();
  const isAuth = status === "authenticated";

  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!isAuth) {
      setLoading(false);
      return;
    }
    fetch("/api/lawyers/map")
      .then((r) => r.json())
      .then((data) => {
        setLawyers(data);
        setLoading(false);
      });
  }, [isAuth]);

  const allSpecialties = [
    ...new Set(
      lawyers.flatMap((l) =>
        l.specialties.split(",").map((s: string) => s.trim())
      )
    ),
  ];

  const filtered = filter
    ? lawyers.filter((l) => l.specialties.includes(filter))
    : lawyers;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-20 pb-12 sm:pt-28 sm:pb-16 overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 hero-rays opacity-60" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Geolocalizacion
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
              Abogados{" "}
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-300 bg-clip-text text-transparent">
                cerca tuyo
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isAuth
                ? "Explora el mapa interactivo y encontra profesionales en tu zona. Filtra por especialidad y descubri quien puede ayudarte."
                : "Acceso reservado a clientes registrados. Inicia sesion para descubrir abogados cerca tuyo."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Map */}
      <section className="bg-slate-950 px-4 sm:px-6 pb-20 -mt-4">
        <div className="max-w-7xl mx-auto">
          {/* Filter chips: only for authenticated */}
          {isAuth && (
            <Reveal>
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setFilter("")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    !filter
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-brand"
                      : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Todos ({lawyers.length})
                </button>
                {allSpecialties.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      filter === s
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-brand"
                        : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {s} (
                    {lawyers.filter((l) => l.specialties.includes(s)).length})
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {/* Map container */}
          <Reveal delay={120}>
            <div className="relative rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur p-2 overflow-hidden shadow-2xl">
              {status === "loading" || (isAuth && loading) ? (
<Skeleton className="h-[600px] rounded-3xl border border-white/10 bg-slate-900/60" />
              ) : !isAuth ? (
                // Locked map: blurred Argentina view + interactive overlay
                <div
                  className="relative h-[600px] cursor-pointer group"
                  onClick={() => router.push("/login")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") router.push("/login");
                  }}
                >
                  {/* Blurred map preview (Argentina-ish gradient + dots) */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-[6px] scale-110 opacity-50"
                      style={{
                        backgroundImage:
                          "url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Argentina_relief_location_map.jpg/600px-Argentina_relief_location_map.jpg')",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90" />
                    {/* Fake markers for atmosphere */}
                    {[
                      { top: "25%", left: "45%" },
                      { top: "40%", left: "50%" },
                      { top: "55%", left: "40%" },
                      { top: "30%", left: "55%" },
                      { top: "65%", left: "48%" },
                      { top: "20%", left: "38%" },
                    ].map((pos, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-brand-400 shadow-glow-brand animate-pulse-glow"
                        style={pos}
                      />
                    ))}
                  </div>

                  {/* Overlay CTA */}
                  <div className="relative h-full flex items-center justify-center p-6">
                    <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl group-hover:border-brand-500/40 transition-colors">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand flex items-center justify-center mb-5">
                        <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                      <h2 className="text-2xl font-extrabold tracking-tight text-white">
                        Iniciá sesión para ver el mapa
                      </h2>
                      <p className="mt-3 text-slate-300 leading-relaxed">
                        Las ubicaciones de los abogados solo son visibles para
                        clientes registrados. Es gratis y solo te lleva un
                        minuto.
                      </p>
                      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/login" onClick={(e) => e.stopPropagation()}>
                          <Button variant="primary" size="lg">
                            Iniciar sesion
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link
                          href="/register-client"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline-dark" size="lg">
                            Crear cuenta
                          </Button>
                        </Link>
                      </div>
                      <p className="mt-5 text-xs text-slate-400">
                        Click en cualquier parte para iniciar sesion
                      </p>
                    </div>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">
                      No hay abogados con esa especialidad
                    </p>
                  </div>
                </div>
              ) : (
                <LawyersMap lawyers={filtered} showLink={false} height="600px" />
              )}
            </div>
          </Reveal>

          {/* Legend + CTA — only when authenticated */}
          {isAuth && (
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand" />
                  <span>Abogado verificado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 shadow-glow-accent" />
                  <span>Mejor calificado (4.8+)</span>
                </div>
              </div>
              <Link
                href="/abogados"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors"
              >
                Ver directorio completo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
