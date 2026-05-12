"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Receipt,
  Search,
} from "lucide-react";

interface Payment {
  id: string;
  appointmentId: string | null;
  lawyerId: string | null;
  lawyerName: string | null;
  clientId: string | null;
  clientName: string | null;
  senderName: string;
  type: string;
  amount: number;
  platformFee: number;
  status: string;
  mpPaymentId: string | null;
  createdAt: string;
}

interface LawyerOpt {
  id: string;
  name: string;
}

interface Stats {
  totalRevenue: number;
  totalConsultations: number;
  totalSubscriptions: number;
  totalPayments: number;
}

const statusMap: Record<string, { label: string; variant: any }> = {
  pending: { label: "Pendiente", variant: "warning" },
  completed: { label: "Completado", variant: "success" },
  failed: { label: "Fallido", variant: "danger" },
  refunded: { label: "Reembolsado", variant: "info" },
};

const typeMap: Record<string, string> = {
  consultation: "Consulta",
  subscription: "Suscripcion",
};

export default function AdminPayments() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOpt[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalConsultations: 0,
    totalSubscriptions: 0,
    totalPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get("type") || "all");
  const [lawyerFilter, setLawyerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments);
        setLawyers(data.lawyers || []);
        setStats(data.stats);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (lawyerFilter !== "all" && p.lawyerId !== lawyerFilter) return false;
      if (q) {
        const haystack = `${p.senderName} ${p.lawyerName || ""} ${p.clientName || ""} ${p.mpPaymentId || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, typeFilter, lawyerFilter, search]);

  const lawyerSubtotal = useMemo(() => {
    if (lawyerFilter === "all") return null;
    return filtered
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.platformFee || p.amount), 0);
  }, [filtered, lawyerFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
        <p className="text-slate-500 mt-1">
          Historial y estadisticas de pagos de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-slate-500">Ingresos Plataforma</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stats.totalPayments}</p>
              <p className="text-xs text-slate-500">Total Pagos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stats.totalConsultations}</p>
              <p className="text-xs text-slate-500">Consultas Pagadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stats.totalSubscriptions}</p>
              <p className="text-xs text-slate-500">Suscripciones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID de MP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={lawyerFilter}
            onChange={(e) => setLawyerFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos los abogados</option>
            {lawyers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todos" },
            { key: "completed", label: "Completados" },
            { key: "pending", label: "Pendientes" },
            { key: "failed", label: "Fallidos" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-1 text-slate-300">|</span>
          {[
            { key: "all", label: "Todo tipo" },
            { key: "consultation", label: "Consultas" },
            { key: "subscription", label: "Suscripciones" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                typeFilter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {lawyerSubtotal !== null && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-800">
            Ingresos plataforma del abogado seleccionado (pagos completados):{" "}
            <strong>{formatCurrency(lawyerSubtotal)}</strong>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay pagos para los filtros seleccionados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Fecha</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Tipo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Quien</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Abogado</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Monto</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Comision</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Estado</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">MP ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {formatDateTime(payment.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={payment.type === "consultation" ? "info" : "default"}>
                      {typeMap[payment.type] || payment.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {payment.senderName}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {payment.lawyerName || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-emerald-600 font-medium">
                    {formatCurrency(payment.platformFee)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusMap[payment.status]?.variant || "default"}>
                      {statusMap[payment.status]?.label || payment.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                    {payment.mpPaymentId || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
