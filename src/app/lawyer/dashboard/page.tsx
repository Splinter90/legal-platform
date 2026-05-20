"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Reveal } from "@/components/ui/reveal";
import { OnboardingStepper } from "@/components/lawyer/onboarding-stepper";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import {
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  Star,
  Clock,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function LawyerDashboard() {
  const [data, setData] = useState<any>(null);
  const [renewing, setRenewing] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/lawyers/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleRenew() {
    setRenewing(true);
    try {
      const res = await fetch("/api/payments/subscription", { method: "POST" });
      const json = await res.json();
      const url = json.initPoint || json.sandboxInitPoint;
      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setRenewing(false);
  }

  if (!data) {
    return (
<SkeletonDashboard />
    );
  }

  const stats = [
    {
      label: "Ingresos Totales",
      value: formatCurrency(data.totalEarnings),
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Citas Totales",
      value: data.appointments.length,
      icon: <Calendar className="w-6 h-6" />,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Clientes CRM",
      value: data.crmClientsCount,
      icon: <Users className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Mensajes sin leer",
      value: data.unreadMessages,
      icon: <MessageSquare className="w-6 h-6" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const statusMap: Record<string, { label: string; variant: any }> = {
    pending_payment: { label: "Pago Pendiente", variant: "warning" },
    confirmed: { label: "Confirmada", variant: "success" },
    completed: { label: "Completada", variant: "info" },
    cancelled: { label: "Cancelada", variant: "danger" },
  };

  return (
    <div className="animate-in">
      <Reveal className="mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          <span className="h-px w-6 bg-brand-500" />
          Panel del abogado
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
          Hola, {data.lawyer?.firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          Resumen de tu actividad profesional
        </p>
      </Reveal>

      {(() => {
        const paidUntil = data.lawyer?.subscriptionPaidUntil
          ? new Date(data.lawyer.subscriptionPaidUntil)
          : null;
        if (!paidUntil) return null;
        const now = new Date();
        const msInDay = 24 * 60 * 60 * 1000;
        const daysLeft = Math.ceil((paidUntil.getTime() - now.getTime()) / msInDay);
        if (data.lawyer.subscriptionStatus !== "active") return null;
        if (daysLeft < 0 || daysLeft > 7) return null;
        return (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {daysLeft === 0
                    ? "Tu suscripción vence hoy"
                    : daysLeft === 1
                    ? "Tu suscripción vence mañana"
                    : `Tu suscripción vence en ${daysLeft} días`}
                </p>
                <p className="text-sm text-amber-700">
                  Renová ahora para seguir apareciendo en la plataforma y recibir reservas.
                </p>
              </div>
            </div>
            <Button onClick={handleRenew} disabled={renewing} className="flex-shrink-0">
              <CreditCard className="w-4 h-4 mr-2" />
              {renewing ? "Procesando..." : "Renovar"}
            </Button>
          </div>
        );
      })()}

      {data.lawyer && data.lawyer.googleCalendarConnected === false && (
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="font-semibold text-sky-900">
                Conectá tu Google Calendar
              </p>
              <p className="text-sm text-sky-700">
                Las citas que reserven tus clientes se van a agendar automáticamente en tu calendario.
              </p>
            </div>
          </div>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/lawyer/dashboard" })}
            className="flex-shrink-0"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Conectar
          </Button>
        </div>
      )}

      {data.access && <OnboardingStepper access={data.access} onChanged={reload} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {stats.map((stat, idx) => (
          <Reveal key={stat.label} delay={idx * 60}>
            <Card className="h-full hover:border-brand-500/40">
              <CardContent className="flex items-center gap-4 py-6">
                <div className={`p-3 rounded-2xl ${stat.bg} flex-shrink-0`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500 truncate">{stat.label}</p>
                  <p
                    className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 whitespace-nowrap truncate leading-tight"
                    title={String(stat.value)}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal className="mb-6">
        <Card>
          <CardContent className="py-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Ingresos por Cliente
            </h3>
            {(!data.earningsByClient || data.earningsByClient.length === 0) ? (
              <div className="text-center py-6">
                <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Todavía no hay pagos completados</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.earningsByClient.map((row: any) => (
                  <div
                    key={row.clientId}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {row.clientName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.appointments} {row.appointments === 1 ? "consulta" : "consultas"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 ml-4 whitespace-nowrap">
                      {formatCurrency(row.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal>
          <Card className="h-full">
            <CardContent className="py-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                Citas Recientes
              </h3>
              {data.appointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay citas aun</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.appointments.slice(0, 5).map((apt: any) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-brand-50/40 transition-colors rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {apt.client.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(apt.dateTime)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          statusMap[apt.status]?.variant || "default"
                        }
                      >
                        {statusMap[apt.status]?.label || apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={120}>
          <Card className="h-full">
            <CardContent className="py-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 fill-accent-400 text-accent-500" />
                Ultimas Resenas
              </h3>
              {data.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No hay resenas aun</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.reviews.map((review: any) => (
                    <div
                      key={review.id}
                      className="p-3 bg-slate-50 hover:bg-brand-50/40 transition-colors rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {review.client.name}
                        </p>
                        <Stars rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
