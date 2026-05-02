"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Search,
  MessageSquare,
  FileText,
  ArrowRight,
} from "lucide-react";

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/clients/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: any }> = {
    pending_payment: { label: "Pago Pendiente", variant: "warning" },
    confirmed: { label: "Confirmada", variant: "success" },
    completed: { label: "Completada", variant: "info" },
    cancelled: { label: "Cancelada", variant: "danger" },
  };

  const actions = [
    {
      icon: <Search className="w-6 h-6" />,
      label: "Buscar Abogados",
      href: "/client/lawyers",
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: "Mis Citas",
      href: "/client/appointments",
      color: "text-purple-600",
      bg: "bg-purple-50",
      count: data.appointments?.length,
    },
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Mis Tramites",
      href: "/client/cases",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      count: data.cases?.length,
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      label: "Mensajes",
      href: "/client/messages",
      color: "text-amber-600",
      bg: "bg-amber-50",
      count: data.unreadMessages,
    },
  ];

  return (
    <div className="animate-in">
      <Reveal className="mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          <span className="h-px w-6 bg-brand-500" />
          Panel del cliente
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
          Hola, {session?.user?.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Tu panel de seguimiento legal
        </p>
      </Reveal>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {actions.map((action, idx) => (
          <Reveal key={action.href} delay={idx * 60}>
            <Link href={action.href}>
              <Card className="hover:border-brand-500/40 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer h-full">
                <CardContent className="py-6 flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-2xl ${action.bg}`}>
                    <div className={action.color}>{action.icon}</div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {action.label}
                  </span>
                  {action.count !== undefined && action.count > 0 && (
                    <Badge variant="brand">{action.count}</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Recent appointments */}
      <Reveal>
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                Citas Recientes
              </h3>
              <Link
                href="/client/appointments"
                className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {!data.appointments || data.appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-brand-400" />
                </div>
                <p className="text-slate-500 mb-3">No tenes citas todavia</p>
                <Link
                  href="/client/lawyers"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:from-brand-400 hover:to-brand-500 shadow-glow-brand hover:-translate-y-0.5 transition-all"
                >
                  Buscar un abogado <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.appointments.slice(0, 5).map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-slate-50 hover:bg-brand-50/40 transition-colors rounded-2xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-glow-brand flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {apt.lawyer?.firstName?.[0]}
                        {apt.lawyer?.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {apt.lawyer?.firstName} {apt.lawyer?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(apt.dateTime)} -{" "}
                          {formatCurrency(apt.amount)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusMap[apt.status]?.variant || "default"}>
                      {statusMap[apt.status]?.label || apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
