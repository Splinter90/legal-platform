"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { formatCurrency } from "@/lib/utils";
import { calculateMPBreakdown, type MPAccreditationScheme } from "@/lib/mp-fees";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import {
  Scale,
  Users,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
  CreditCard,
} from "lucide-react";

interface DashboardData {
  totalLawyers: number;
  pendingLawyers: number;
  approvedLawyers: number;
  suspendedLawyers: number;
  totalClients: number;
  totalAppointments: number;
  completedAppointments: number;
  activeSubscriptions: number;
  totalConsultationRevenue: number;
  totalConsultationAmount: number;
  totalConsultations: number;
  totalSubscriptionRevenue: number;
  totalSubscriptions: number;
  consultationFee: number;
  subscriptionFee: number;
  commissionPercent: number;
  mpAccreditationScheme: MPAccreditationScheme;
  mpFeePercent: number;
  mpFixedFee: number;
  mpIvaPercent: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const breakdown = useMemo(() => {
    if (!data) return null;
    return calculateMPBreakdown(data.consultationFee, data.commissionPercent, {
      scheme: data.mpAccreditationScheme,
      feePercent: data.mpFeePercent,
      fixedFee: data.mpFixedFee,
      ivaPercent: data.mpIvaPercent,
    });
  }, [data]);

  if (!data) {
    return (
<SkeletonDashboard />
    );
  }

  const platformRevenue =
    (data.totalConsultationRevenue || 0) + (data.totalSubscriptionRevenue || 0);

  const stats = [
    {
      label: "Abogados Activos",
      value: data.approvedLawyers,
      icon: <Scale className="w-6 h-6" />,
      color: "text-brand-600",
      bg: "bg-brand-50",
      href: "/admin/lawyers?status=approved",
    },
    {
      label: "Solicitudes Pendientes",
      value: data.pendingLawyers,
      icon: <Clock className="w-6 h-6" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      badge: data.pendingLawyers > 0 ? "warning" : undefined,
      href: "/admin/lawyers?status=pending",
    },
    {
      label: "Clientes Registrados",
      value: data.totalClients,
      icon: <Users className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/clients",
    },
    {
      label: "Consultas Realizadas",
      value: data.completedAppointments,
      icon: <Calendar className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/payments?type=consultation",
    },
    {
      label: "Ingresos Plataforma",
      value: formatCurrency(platformRevenue),
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/payments",
    },
    {
      label: "Total Abogados",
      value: data.totalLawyers,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-brand-700",
      bg: "bg-brand-50",
      href: "/admin/lawyers",
    },
  ];

  return (
    <div className="animate-in">
      <Reveal className="mb-8">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          <span className="h-px w-6 bg-brand-500" />
          Panel administrativo
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Resumen general de la plataforma
        </p>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((stat, idx) => (
          <Reveal key={stat.label} delay={idx * 60}>
            <Link href={stat.href} className="block group h-full">
              <Card className="h-full hover:border-brand-500/40 group-hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className={`p-3 rounded-2xl ${stat.bg} flex-shrink-0`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-500 truncate">{stat.label}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-2xl font-extrabold text-slate-900">
                        {stat.value}
                      </p>
                      {stat.badge && (
                        <Badge variant={stat.badge as any}>Pendientes</Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Reveal>
          <Card className="h-full">
            <CardContent className="py-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-600" />
                Configuracion Actual
              </h3>
              <div className="space-y-1">
                <Row label="Monto de Consulta" value={formatCurrency(data.consultationFee)} />
                <Row label="Comision Plataforma" value={`${data.commissionPercent}%`} />
                {breakdown && (
                  <>
                    <Row
                      label={`MP descuenta (${data.mpFeePercent}% + $${data.mpFixedFee} + IVA)`}
                      value={`− ${formatCurrency(breakdown.mpTotalFee)}`}
                      tone="negative"
                    />
                    <Row
                      label="Llega al marketplace"
                      value={formatCurrency(breakdown.marketplaceReceives)}
                    />
                    <Row
                      label="Recibe el abogado"
                      value={formatCurrency(breakdown.lawyerReceives)}
                    />
                    <Row
                      label="Ganancia plataforma"
                      value={formatCurrency(breakdown.platformCommission)}
                      tone="positive"
                      bold
                    />
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Ajustá tarifas, comisión y tasas MP en{" "}
                <Link href="/admin/settings" className="text-brand-600 font-medium hover:underline">
                  Configuración
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={120}>
          <Card className="h-full">
            <CardContent className="py-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Acciones Rapidas
              </h3>
              <div className="space-y-2.5">
                <Link
                  href="/admin/lawyers"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <Scale className="w-5 h-5 text-brand-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Gestionar Abogados
                  </span>
                  {data.pendingLawyers > 0 && (
                    <Badge variant="warning" className="ml-auto">
                      {data.pendingLawyers} pendientes
                    </Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </Link>
                <Link
                  href="/admin/payments"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Ver Pagos
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </Link>
                <Link
                  href="/admin/settings"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Configurar Tarifas
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </Link>
                <Link
                  href="/admin/map"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Ver Mapa de Abogados
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
