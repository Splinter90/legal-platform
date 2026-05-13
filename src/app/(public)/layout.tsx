import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-display">
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <BrandLogo size="sm" tone="dark" />

          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/", label: "Inicio" },
              { href: "/abogados", label: "Abogados" },
              { href: "/mapa", label: "Mapa" },
              { href: "/#nosotros", label: "Nosotros" },
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

      <main className="pt-16">{children}</main>

      <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <BrandLogo size="sm" tone="dark" />
              <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                Innovando en el ambito juridico con tecnologia y compromiso
                profesional.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                Areas
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
                  { label: "Iniciar sesion", href: "/login" },
                  { label: "Registrar abogado", href: "/register-lawyer" },
                  { label: "Registrar cliente", href: "/register-client" },
                  { label: "Politica de Privacidad", href: "/privacidad" },
                  { label: "Terminos y Condiciones", href: "/terminos" },
                  { label: "Contacto", href: "/contacto" },
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
                  <span className="text-slate-400 text-sm">contacto@leyesdigital.com</span>
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
              (c) 2026 Leyes Digital. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Link href="/privacidad" className="hover:text-brand-400 transition-colors">
                Privacidad
              </Link>
              <span className="text-slate-700">·</span>
              <Link href="/terminos" className="hover:text-brand-400 transition-colors">
                Terminos
              </Link>
              <span className="text-slate-700">·</span>
              <Link href="/contacto" className="hover:text-brand-400 transition-colors">
                Contacto
              </Link>
              <span className="text-slate-700">·</span>
              <span>Mar del Plata, Argentina</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
