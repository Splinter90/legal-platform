import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto - Leyes Digital",
  description:
    "Canales de contacto de Leyes Digital. Soporte, consultas y reclamos.",
};

const CONTACT_EMAIL = "contacto@leyesdigital.com";
const CONTACT_PHONE = "+54 9 223 618-2864";

export default function ContactPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider">
          Contacto
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2">
          Estamos para ayudarte
        </h1>
        <p className="text-slate-400 mt-3">
          Si necesitas soporte, queres reportar un problema o tenes dudas
          sobre la plataforma, escribinos. Respondemos en dias habiles
          dentro de las 48 horas.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <ContactCard
          icon={<Mail className="w-5 h-5 text-brand-400" />}
          label="Email"
          value={CONTACT_EMAIL}
          href={`mailto:${CONTACT_EMAIL}`}
        />
        <ContactCard
          icon={<Phone className="w-5 h-5 text-brand-400" />}
          label="Telefono / WhatsApp"
          value={CONTACT_PHONE}
          href={`tel:${CONTACT_PHONE.replace(/\s|-/g, "")}`}
        />
        <ContactCard
          icon={<MapPin className="w-5 h-5 text-brand-400" />}
          label="Ubicacion"
          value="Mar del Plata, Buenos Aires, Argentina"
        />
        <ContactCard
          icon={<Clock className="w-5 h-5 text-brand-400" />}
          label="Horario de atencion"
          value="Lunes a Viernes, 9:00 a 18:00 (ART)"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Para que motivos podes escribirnos
        </h2>
        <ul className="space-y-2 text-slate-300 list-disc pl-5">
          <li>Soporte tecnico sobre el uso de la plataforma.</li>
          <li>Problemas con pagos o reembolsos.</li>
          <li>
            Reclamos sobre un abogado o una consulta realizada en la
            plataforma.
          </li>
          <li>
            Solicitud de acceso, rectificacion o eliminacion de tus datos
            personales (Ley 25.326).
          </li>
          <li>Consultas comerciales o de prensa.</li>
        </ul>
      </section>

      <footer className="mt-14 pt-8 border-t border-white/5 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/privacidad" className="text-brand-400 hover:underline">
          Politica de Privacidad
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/terminos" className="text-brand-400 hover:underline">
          Terminos y Condiciones
        </Link>
      </footer>
    </article>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-brand-500/40 transition-colors h-full">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider">
          {label}
        </p>
        <p className="text-white font-medium mt-1 break-words">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
