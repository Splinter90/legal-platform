"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  FileText,
  User,
} from "lucide-react";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  paymentStatus: string;
  amount: number;
  lawyerAmount: number;
  meetLink: string | null;
  notes: string | null;
  client: { name: string; email: string };
  caseTracking: { id: string; status: string; description: string | null } | null;
}

const statusMap: Record<string, { label: string; variant: any }> = {
  pending_payment: { label: "Pago Pendiente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  completed: { label: "Completada", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

export default function LawyerAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [caseModal, setCaseModal] = useState<Appointment | null>(null);
  const [caseDescription, setCaseDescription] = useState("");
  const [caseStatus, setCaseStatus] = useState("initiated");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setAppointments(await res.json());
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/appointments/manage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchAppointments();
  }

  async function saveCase(appointmentId: string) {
    setSaving(true);
    await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId,
        description: caseDescription,
        status: caseStatus,
      }),
    });
    setSaving(false);
    setCaseModal(null);
    fetchAppointments();
  }

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.dateTime);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && a.status === "confirmed";
  });

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
        <h1 className="text-2xl font-bold text-slate-900">Mis Citas</h1>
        <p className="text-slate-500 mt-1">Gestiona tu agenda de consultas</p>
      </div>

      {todayAppointments.length > 0 && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-5">
            <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Citas de Hoy ({todayAppointments.length})
            </h3>
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {apt.client.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(apt.dateTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {apt.meetLink && (
                      <a
                        href={apt.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                      >
                        <Video className="w-4 h-4" />
                        Meet
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "confirmed", label: "Confirmadas" },
          { key: "completed", label: "Completadas" },
          { key: "pending_payment", label: "Pago Pendiente" },
          { key: "cancelled", label: "Canceladas" },
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
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay citas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {apt.client.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {apt.client.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(apt.dateTime)}
                        </span>
                        <span>{formatCurrency(apt.lawyerAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-16 sm:ml-0">
                    <Badge
                      variant={statusMap[apt.status]?.variant || "default"}
                    >
                      {statusMap[apt.status]?.label || apt.status}
                    </Badge>
                    {apt.caseTracking && (
                      <Badge variant="info">
                        <FileText className="w-3 h-3 mr-1" />
                        Tramite
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  {apt.status === "confirmed" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(apt.id, "completed")}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateStatus(apt.id, "cancelled")}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  {apt.meetLink && (
                    <a
                      href={apt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      Meet
                    </a>
                  )}
                  {(apt.status === "confirmed" || apt.status === "completed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCaseModal(apt);
                        setCaseDescription(
                          apt.caseTracking?.description || ""
                        );
                        setCaseStatus(
                          apt.caseTracking?.status || "initiated"
                        );
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      {apt.caseTracking ? "Editar Tramite" : "Crear Tramite"}
                    </Button>
                  )}
                </div>

                {apt.notes && (
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="font-medium">Notas:</span> {apt.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!caseModal}
        onClose={() => setCaseModal(null)}
        title={caseModal?.caseTracking ? "Editar Tramite" : "Crear Tramite"}
      >
        {caseModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Cliente:{" "}
              <span className="font-semibold">{caseModal.client.name}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Estado del Tramite
              </label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="initiated">Iniciado</option>
                <option value="in_progress">En Proceso</option>
                <option value="waiting_docs">Esperando Documentacion</option>
                <option value="in_court">En Juzgado</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripcion
              </label>
              <textarea
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-none"
                placeholder="Detalle del tramite o caso..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCaseModal(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={saving}
                onClick={() => saveCase(caseModal.id)}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
