import Link from "next/link";
import {
  Scale,
  Search,
  Calendar,
  Shield,
  MapPin,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  Briefcase,
  Users,
  Award,
  Video,
  CreditCard,
  FileText,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-display">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <BrandLogo size="sm" tone="dark" />

          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "#servicios", label: "Servicios" },
              { href: "/abogados", label: "Abogados" },
              { href: "/mapa", label: "Mapa" },
              { href: "#nosotros", label: "Nosotros" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Ingresar
            </Link>
            <Link href="/register-lawyer">
              <Button variant="accent" size="sm">
                Soy Abogado
              </Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="text-sm text-slate-300 px-3 py-2">
              Ingresar
            </Link>
            <Link href="/register-lawyer">
              <Button variant="accent" size="sm">
                Soy Abogado
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 hero-rays opacity-60" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Plataforma legal digital
            </span>

            <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
              Tu camino hacia la{" "}
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-300 bg-clip-text text-transparent">
                justicia
              </span>
              ,<br />
              simplificado.
            </h1>

            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              Encontrá un abogado verificado, agendá una videollamada y recibí
              asesoramiento profesional sin moverte de tu casa. Pagás cuando
              reservás, te conectás cuando lo necesitás.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/abogados">
                <Button variant="primary" size="lg">
                  Buscar abogado
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register-lawyer">
                <Button variant="outline-dark" size="lg">
                  Soy abogado, quiero unirme
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 ring-2 ring-slate-950 flex items-center justify-center text-xs font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-accent-400 text-accent-400"
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold">4.9</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  +500 clientes satisfechos
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/30 via-brand-600/20 to-accent-500/20 rounded-[2rem] blur-2xl" />
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1200&q=80')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-800/40 to-transparent mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Floating cards */}
                <div className="absolute top-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-3 flex items-center gap-3 shadow-xl animate-float">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Próxima cita</p>
                      <p className="text-sm font-bold text-slate-900">
                        Hoy 16:30 · Dra. González
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-brand-100 text-brand-800 font-semibold">
                      Confirmada
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-slate-900/90 backdrop-blur border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-brand-400" />
                      <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
                        Pago confirmado
                      </p>
                    </div>
                    <p className="text-sm font-bold text-white">
                      Link de Google Meet enviado a tu correo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Logos / partners pseudo */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mt-16">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500 mb-6">
            Compatible con
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-slate-400">
            <span className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Google Calendar
            </span>
            <span className="text-base font-semibold flex items-center gap-2">
              <Video className="w-4 h-4" /> Google Meet
            </span>
            <span className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Mercado Pago
            </span>
            <span className="text-base font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" /> Notificaciones
            </span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20 bg-gradient-to-b from-slate-950 via-brand-950/40 to-slate-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "500+", label: "Clientes asesorados", sub: "En toda Argentina" },
            { value: "150+", label: "Abogados verificados", sub: "Matriculados" },
            { value: "2.000+", label: "Consultas digitales", sub: "Realizadas" },
            { value: "98%", label: "Satisfacción", sub: "Calificación promedio" },
          ].map((stat, idx) => (
            <Reveal key={stat.label} delay={idx * 100} className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.sub}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 sm:py-28 bg-slate-950 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeading
              eyebrow="Proceso"
              title="Cómo"
              highlight="funciona"
              description="Tres pasos simples para resolver tu situación legal."
              tone="dark"
            />
          </Reveal>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Agendá una consulta",
                desc: "Buscá por especialidad y ubicación. Reservá un turno según la disponibilidad real del abogado.",
                icon: Calendar,
              },
              {
                step: "02",
                title: "Confirmá con el pago",
                desc: "Pagás de forma segura con Mercado Pago. Recibís el link de Google Meet por correo.",
                icon: CreditCard,
              },
              {
                step: "03",
                title: "Consultá por videollamada",
                desc: "Hacés tu consulta donde estés. Después seguís el avance del trámite desde tu panel.",
                icon: Video,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.step} delay={idx * 120}>
                  <div className="group relative h-full rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-8 hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-6 right-6 text-6xl font-black text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
                      {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand mb-6">
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section id="servicios" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white text-slate-900 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeading
              eyebrow="Áreas de práctica"
              title="Especialistas en"
              highlight="cada caso"
              description="Sin importar tu situación, tenemos un profesional verificado listo para ayudarte."
            />
          </Reveal>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Scale, title: "Civil y Comercial", desc: "Contratos, herencias, litigios civiles y comerciales." },
              { icon: Shield, title: "Penal", desc: "Defensa legal, representación en juicio, apelaciones." },
              { icon: Briefcase, title: "Laboral", desc: "Despidos, reclamos salariales, negociación colectiva." },
              { icon: Users, title: "Familia", desc: "Divorcios, custodia, alimentos, adopción, mediación." },
              { icon: FileText, title: "Administrativo", desc: "Trámites ante organismos públicos, licitaciones, permisos." },
              { icon: Award, title: "Consumidor", desc: "Defensa del consumidor, reclamos, garantías." },
              { icon: CreditCard, title: "Tributario", desc: "Planificación fiscal, recursos, AFIP, impuestos provinciales." },
              { icon: MapPin, title: "Inmobiliario", desc: "Escrituras, boletos, usucapión, desalojos, propiedad horizontal." },
            ].map((area, idx) => {
              const Icon = area.icon;
              return (
                <Reveal key={area.title} delay={idx * 60}>
                  <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      {area.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {area.desc}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* About / Why Us */}
      <section id="nosotros" className="relative py-20 sm:py-28 overflow-hidden bg-slate-950 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-950/60 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <Reveal>
            <SectionHeading
              eyebrow="Quiénes somos"
              title="Por qué"
              highlight="elegirnos"
              description="Somos un equipo apasionado por hacer accesible la justicia mediante tecnología, transparencia y profesionales verificados."
              tone="dark"
            />
          </Reveal>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Profesionales verificados", desc: "Validamos matrícula, título y antecedentes antes de aprobar a cada abogado." },
              { icon: Zap, title: "Asesoramiento inmediato", desc: "Reservás hoy y atendés mañana. Nada de salas de espera ni trámites largos." },
              { icon: Award, title: "Reputación transparente", desc: "Calificaciones y reseñas verificadas de clientes reales con casos reales." },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Reveal key={feat.title} delay={idx * 120}>
                  <div className="group h-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 hover:border-brand-400/50 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow-brand">
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-white">{feat.title}</h3>
                    <p className="mt-3 text-slate-300 leading-relaxed">{feat.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Lawyers */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-slate-50 text-slate-900 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-100 text-accent-800 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Para profesionales
            </span>
            <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Potenciá tu{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                estudio jurídico
              </span>
            </h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Conseguí nuevos clientes, agendá automáticamente, cobrá por
              adelantado y administrá tu cartera con un CRM integrado.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Perfil profesional verificado y visible",
                "CRM integrado para gestionar tus clientes",
                "Agenda sincronizada con Google Calendar",
                "Cobro automático con Mercado Pago",
                "Seguimiento de casos y trámites",
                "Consultas por videollamada con Google Meet",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Link href="/register-lawyer">
                <Button variant="primary" size="lg">
                  Registrarme como abogado
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-200 via-brand-100 to-accent-100 rounded-[2rem] blur-2xl" />
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Search, title: "Visibilidad", desc: "Los clientes te encuentran por especialidad y ubicación." },
                  { icon: Calendar, title: "Agenda inteligente", desc: "Reservas según tu disponibilidad real, sin choques." },
                  { icon: CreditCard, title: "Cobro adelantado", desc: "Recibís el pago antes de la consulta vía MP." },
                  { icon: Video, title: "Meet automático", desc: "Se crea la videollamada al confirmar la cita." },
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-brand-400/50 hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Map Teaser */}
      <section className="py-20 sm:py-28 bg-slate-950 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto text-center">
          <Reveal>
            <SectionHeading
              eyebrow="Ubicación"
              title="Encontrá abogados"
              highlight="cerca tuyo"
              description="Usá nuestro mapa interactivo para descubrir profesionales en tu zona. Filtrá por especialidad, calificación y disponibilidad."
              tone="dark"
            />
          </Reveal>
          <Reveal delay={200} className="mt-12">
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 hero-rays opacity-30" />
              <MapPin className="relative w-16 h-16 text-brand-400 mx-auto mb-6 animate-float" />
              <p className="relative text-lg text-slate-300 mb-8">
                Explorá el mapa interactivo de Argentina
              </p>
              <Link href="/mapa">
                <Button variant="primary" size="lg">
                  Ver mapa interactivo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.2),_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              ¿Necesitás asesoramiento legal?
            </h2>
            <p className="mt-5 text-lg text-white/90 max-w-2xl mx-auto">
              Agendá tu consulta digital ahora. Profesionales verificados,
              precios claros y atención inmediata.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/abogados">
                <Button variant="accent" size="lg">
                  Buscar abogado <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur"
                >
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <BrandLogo size="sm" tone="dark" />
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Innovando en el ámbito jurídico con tecnología y compromiso
                profesional.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                Áreas
              </h4>
              <ul className="space-y-2.5">
                {["Civil y Comercial", "Penal", "Laboral", "Familia", "Consumidor"].map(
                  (area) => (
                    <li key={area}>
                      <span className="text-slate-400 text-sm flex items-center gap-2">
                        <span className="h-px w-3 bg-brand-500/50" />
                        {area}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                Plataforma
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Buscar abogados", href: "/abogados" },
                  { label: "Mapa interactivo", href: "/mapa" },
                  { label: "Iniciar sesión", href: "/login" },
                  { label: "Registrar abogado", href: "/register-lawyer" },
                  { label: "Registrar cliente", href: "/register-client" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 text-sm hover:text-brand-400 transition-colors flex items-center gap-2"
                    >
                      <ArrowRight className="w-3 h-3 text-brand-500/60" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                Contacto
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand-400" />
                  <span className="text-slate-400 text-sm">contacto@legesdigital.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span className="text-slate-400 text-sm">+54 9 223 618-2864</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span className="text-slate-400 text-sm">Mar del Plata, Argentina</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 Leges Digital. Todos los derechos reservados.
            </p>
            <p className="text-slate-500 text-xs">
              Estudio Jurídico Digital · Mar del Plata, Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
