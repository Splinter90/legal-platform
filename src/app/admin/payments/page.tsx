"use client";
import { useEffect, useState } from "react";
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
  clientId: string | null;
  type: string;
  amount: number;
  platformFee: number;
  lawyerAmount: number;
  status: string;
  mpPaymentId: string | null;
  createdAt: string;
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalConsultations: 0,
    totalSubscriptions: 0,
    totalPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments);
        setStats(data.stats);
        setLoading(false);
      });
  }, []);

  const filtered =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status === filter);

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

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Todos" },
          { key: "completed", label: "Completados" },
          { key: "pending", label: "Pendientes" },
          { key: "failed", label: "Fallidos" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay pagos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Fecha</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Tipo</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Monto</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Comision</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase py-3 px-4">Abogado</th>
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
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-emerald-600 font-medium">
                    {formatCurrency(payment.platformFee)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {formatCurrency(payment.lawyerAmount)}
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
