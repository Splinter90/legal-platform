"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { formatCurrency } from "@/lib/utils";
import {
  Scale,
  Users,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface DashboardData {
  totalLawyers: number;
  pendingLawyers: number;
  approvedLawyers: number;
  totalClients: number;
  totalAppointments: number;
  paidAppointments: number;
  totalRevenue: number;
  consultationFee: number;
  commissionPercent: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
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

  const stats = [
    {
      label: "Abogados Activos",
      value: data.approvedLawyers,
      icon: <Scale className="w-6 h-6" />,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Solicitudes Pendientes",
      value: data.pendingLawyers,
      icon: <Clock className="w-6 h-6" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      badge: data.pendingLawyers > 0 ? "warning" : undefined,
    },
    {
      label: "Clientes Registrados",
      value: data.totalClients,
      icon: <Users className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Consultas Realizadas",
      value: data.paidAppointments,
      icon: <Calendar className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Ingresos Plataforma",
      value: formatCurrency(data.totalRevenue),
      icon: <DollarSign className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Abogados",
      value: data.totalLawyers,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-brand-700",
      bg: "bg-brand-50",
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
            <Card className="h-full hover:border-brand-500/40">
              <CardContent className="flex items-center gap-4 py-6">
                <div className={`p-3 rounded-2xl ${stat.bg} flex-shrink-0`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="min-w-0">
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
              </CardContent>
            </Card>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Monto de Consulta</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(data.consultationFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Comision Plataforma</span>
                  <span className="font-semibold text-slate-900">
                    {data.commissionPercent}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">Ganancia por Consulta</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(
                      data.consultationFee * (data.commissionPercent / 100)
                    )}
                  </span>
                </div>
              </div>
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
                <a
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
                </a>
                <a
                  href="/admin/settings"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Configurar Tarifas
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </a>
                <a
                  href="/admin/map"
                  className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-brand-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    Ver Mapa de Abogados
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all ml-auto" />
                </a>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
