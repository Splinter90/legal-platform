"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Access {
  status: string;
  subscriptionStatus: string;
  subscriptionPaidUntil: string | Date | null;
  rejectionReason: string | null;
  hasActiveSubscription: boolean;
  canAccessFeatures: boolean;
}

type StepState = "done" | "current" | "pending" | "error" | "locked";

interface Step {
  number: number;
  title: string;
  state: StepState;
  body: React.ReactNode;
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <CheckCircle2 className="w-6 h-6 text-emerald-600" />;
  if (state === "error") return <XCircle className="w-6 h-6 text-red-600" />;
  if (state === "current") return <Clock className="w-6 h-6 text-amber-600" />;
  return <Clock className="w-6 h-6 text-slate-400" />;
}

function stepBg(state: StepState) {
  if (state === "done") return "bg-emerald-50 border-emerald-200";
  if (state === "error") return "bg-red-50 border-red-200";
  if (state === "current") return "bg-amber-50 border-amber-200";
  return "bg-slate-50 border-slate-200";
}

export function OnboardingStepper({ access, onChanged }: { access: Access; onChanged: () => void }) {
  const [resubmitting, setResubmitting] = useState(false);

  async function resubmit() {
    setResubmitting(true);
    try {
      const res = await fetch("/api/lawyers/resubmit", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo reenviar la solicitud");
        return;
      }
      onChanged();
    } finally {
      setResubmitting(false);
    }
  }

  const isApproved = access.status === "approved";
  const isRejected = access.status === "rejected";
  const isSuspended = access.status === "suspended";

  const paidUntilStr = access.subscriptionPaidUntil
    ? new Date(access.subscriptionPaidUntil).toLocaleDateString("es-AR")
    : null;

  const steps: Step[] = [
    {
      number: 1,
      title: "Registro",
      state: "done",
      body: <p className="text-sm text-slate-600">Completaste tus datos profesionales.</p>,
    },
    {
      number: 2,
      title: "Aprobación del Admin",
      state: isApproved || isSuspended
        ? "done"
        : isRejected
        ? "error"
        : "current",
      body: isRejected ? (
        <div className="space-y-3">
          <p className="text-sm text-red-700">
            Tu solicitud fue <strong>rechazada</strong>.
          </p>
          {access.rejectionReason && (
            <div className="text-sm bg-white border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-700 mb-1">Motivo:</p>
              <p className="text-slate-700">{access.rejectionReason}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/lawyer/profile">
              <Button variant="outline" size="sm">Editar mi perfil</Button>
            </Link>
            <Button size="sm" onClick={resubmit} disabled={resubmitting}>
              {resubmitting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Reenviando...</>
              ) : (
                "Reenviar solicitud"
              )}
            </Button>
          </div>
        </div>
      ) : isApproved || isSuspended ? (
        <p className="text-sm text-emerald-700">El Admin aprobó tu perfil.</p>
      ) : (
        <p className="text-sm text-amber-700">
          Estamos revisando tu solicitud. Mientras tanto podés cargar tu disponibilidad y completar tu perfil.
        </p>
      ),
    },
    {
      number: 3,
      title: "Suscripción activa",
      state: access.hasActiveSubscription
        ? "done"
        : isApproved
        ? "current"
        : "locked",
      body: access.hasActiveSubscription ? (
        <p className="text-sm text-emerald-700">
          Estás visible en el mapa para clientes. Suscripción vigente hasta el <strong>{paidUntilStr}</strong>.
        </p>
      ) : isApproved ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            Activá tu suscripción para aparecer en el mapa y habilitar el CRM, casos y mensajes.
          </p>
          <Link href="/lawyer/profile">
            <Button size="sm">
              <CreditCard className="w-4 h-4 mr-1" /> Activar suscripción
            </Button>
          </Link>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Disponible cuando el Admin apruebe tu perfil.
        </p>
      ),
    },
  ];

  return (
    <div className="mb-8 space-y-4">
      {isSuspended && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Tu cuenta está suspendida</p>
            <p className="text-sm text-red-600">
              Mientras esté suspendida no aparecés en el mapa y el CRM, casos y mensajes están bloqueados. Contactá al Admin para reactivarla.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className={`rounded-2xl border p-4 ${stepBg(step.state)}`}>
            <div className="flex items-center gap-2 mb-2">
              <StepIcon state={step.state} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Paso {step.number}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
            {step.body}
          </div>
        ))}
      </div>
    </div>
  );
}
