"use client";
import Link from "next/link";
import { Lock, CreditCard, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LockReason = "pending" | "rejected" | "suspended" | "no_subscription" | "incomplete";

interface Props {
  featureName: string;
  reason: LockReason;
}

const config: Record<LockReason, {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  tone: string;
}> = {
  pending: {
    icon: <Clock className="w-10 h-10 text-amber-600" />,
    title: "Esperando aprobación del Admin",
    description: "Una vez que el Admin apruebe tu perfil vas a poder activar tu suscripción y desbloquear esta sección.",
    ctaLabel: "Ir al dashboard",
    ctaHref: "/lawyer/dashboard",
    tone: "amber",
  },
  rejected: {
    icon: <XCircle className="w-10 h-10 text-red-600" />,
    title: "Tu solicitud fue rechazada",
    description: "Revisá el motivo en el dashboard, corregí tu perfil y reenviá la solicitud.",
    ctaLabel: "Ver detalle",
    ctaHref: "/lawyer/dashboard",
    tone: "red",
  },
  suspended: {
    icon: <AlertTriangle className="w-10 h-10 text-red-600" />,
    title: "Tu cuenta está suspendida",
    description: "Mientras tu cuenta esté suspendida no podés usar esta sección. Contactá al Admin.",
    ctaLabel: "Ir al dashboard",
    ctaHref: "/lawyer/dashboard",
    tone: "red",
  },
  no_subscription: {
    icon: <CreditCard className="w-10 h-10 text-brand-600" />,
    title: "Activá tu suscripción",
    description: "Para usar esta sección necesitás una suscripción activa. Mientras tanto seguís pudiendo cargar tu perfil y disponibilidad.",
    ctaLabel: "Activar suscripción",
    ctaHref: "/lawyer/profile",
    tone: "brand",
  },
  incomplete: {
    icon: <Lock className="w-10 h-10 text-slate-500" />,
    title: "Completá tu perfil",
    description: "Necesitás completar tus datos profesionales para continuar.",
    ctaLabel: "Completar perfil",
    ctaHref: "/register-lawyer/complete",
    tone: "slate",
  },
};

const toneClasses: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50",
  red: "border-red-200 bg-red-50",
  brand: "border-brand-200 bg-brand-50",
  slate: "border-slate-200 bg-slate-50",
};

export function deriveLockReason(access: {
  status: string;
  hasActiveSubscription: boolean;
}): LockReason | null {
  if (access.status === "incomplete") return "incomplete";
  if (access.status === "rejected") return "rejected";
  if (access.status === "suspended") return "suspended";
  if (access.status !== "approved") return "pending";
  if (!access.hasActiveSubscription) return "no_subscription";
  return null;
}

export function LockedFeature({ featureName, reason }: Props) {
  const c = config[reason];
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{featureName}</h1>
        <p className="text-slate-500 mt-1">Esta sección está bloqueada</p>
      </div>
      <div className={`rounded-3xl border-2 p-10 text-center ${toneClasses[c.tone]}`}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm mb-4">
          {c.icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{c.title}</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-6">{c.description}</p>
        <Link href={c.ctaHref}>
          <Button>{c.ctaLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
