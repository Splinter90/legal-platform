"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Stars } from "@/components/ui/stars";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { buildGoogleCalendarLink } from "@/lib/calendar-link";
import { SkeletonList } from "@/components/ui/skeleton";
import {
  CLIENT_CANCELLATION_CUTOFF_HOURS,
  canClientCancel,
} from "@/lib/appointment-policy";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Star,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  CalendarPlus,
} from "lucide-react";

interface Appointment {
  id: string;
  lawyerId: string;
  dateTime: string;
  status: string;
  paymentStatus: string;
  amount: number;
  meetLink: string | null;
  notes: string | null;
  lawyer: { id: string; firstName: string; lastName: string; email: string };
  caseTracking: { id: string; status: string } | null;
}

const statusMap: Record<string, { label: string; variant: any }> = {
  pending_payment: { label: "Pago Pendiente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  completed: { label: "Completada", variant: "info" },
  cancelled: { label: "Cancelada", variant: "danger" },
};

export default function ClientAppointments() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [reviewModal, setReviewModal] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, []);

  async function cancelAppointment(id: string) {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data?.error || "No se pudo cancelar");
        return;
      }
      setCancelTarget(null);
      const refreshed = await fetch("/api/appointments");
      setAppointments(await refreshed.json());
    } finally {
      setCancelling(false);
    }
  }

  async function archiveAppointment(id: string) {
    if (!confirm("Quitar esta cita de tu historial?")) return;
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function submitReview(appointmentId: string, lawyerId: string) {
    setSubmittingReview(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId,
        lawyerId,
        rating: reviewRating,
        comment: reviewComment,
      }),
    });
    setReviewModal(null);
    setReviewRating(5);
    setReviewComment("");
    setSubmittingReview(false);
    const res = await fetch("/api/appointments");
    setAppointments(await res.json());
  }

  const filtered =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" && new Date(a.dateTime) > new Date()
  );

  if (loading) {
    return (
<SkeletonList rows={5} />
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mis Citas</h1>
        <p className="text-slate-500 mt-1">
          Historial y proximas consultas legales
        </p>
      </div>

      {paymentStatus === "success" && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Pago procesado exitosamente. Tu cita sera confirmada en breve.
        </div>
      )}
      {paymentStatus === "failure" && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          El pago no pudo procesarse. Intenta nuevamente.
        </div>
      )}

      {upcoming.length > 0 && (
        <Card className="mb-6 border-brand-200 bg-brand-50/50">
          <CardContent className="py-5">
            <h3 className="font-semibold text-brand-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Proximas Citas
            </h3>
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                      {apt.lawyer.firstName[0]}
                      {apt.lawyer.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {apt.lawyer.firstName} {apt.lawyer.lastName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(apt.dateTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={buildGoogleCalendarLink({
                        title: `Consulta con ${apt.lawyer.firstName} ${apt.lawyer.lastName}`,
                        startISO: apt.dateTime,
                        details: apt.meetLink
                          ? `Link de Google Meet: ${apt.meetLink}`
                          : "Consulta legal reservada en LegalConnect",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                      title="Agregar a Google Calendar"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Calendario
                    </a>
                    {apt.meetLink && (
                      <a
                        href={apt.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-brand-400 hover:to-brand-500 transition-all"
                      >
                        <Video className="w-4 h-4" />
                        Google Meet
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Todas" },
          { key: "confirmed", label: "Confirmadas" },
          { key: "completed", label: "Completadas" },
          { key: "pending_payment", label: "Pendientes" },
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
            <Link
              href="/client/lawyers"
              className="inline-flex items-center gap-2 mt-4 text-brand-600 font-medium text-sm"
            >
              Buscar un abogado
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {apt.lawyer.firstName[0]}
                      {apt.lawyer.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {apt.lawyer.firstName} {apt.lawyer.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateTime(apt.dateTime)}
                        </span>
                        <span>{formatCurrency(apt.amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-16 sm:ml-0">
                    <Badge
                      variant={statusMap[apt.status]?.variant || "default"}
                    >
                      {statusMap[apt.status]?.label || apt.status}
                    </Badge>
                    <div className="flex gap-1">
                      {apt.meetLink && (
                        <a
                          href={apt.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Google Meet"
                        >
                          <Video className="w-4 h-4 text-brand-600" />
                        </a>
                      )}
                      {apt.status === "confirmed" && (
                        <a
                          href={buildGoogleCalendarLink({
                            title: `Consulta con ${apt.lawyer.firstName} ${apt.lawyer.lastName}`,
                            startISO: apt.dateTime,
                            details: apt.meetLink
                              ? `Link de Google Meet: ${apt.meetLink}`
                              : "Consulta legal reservada en LegalConnect",
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Agregar a Google Calendar"
                        >
                          <CalendarPlus className="w-4 h-4 text-brand-600" />
                        </a>
                      )}
                      {(apt.status === "confirmed" || apt.status === "completed") && (
                        <Link
                          href={`/client/messages?with=${apt.lawyer.id}&name=${encodeURIComponent(`${apt.lawyer.firstName} ${apt.lawyer.lastName}`)}`}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Enviar mensaje"
                        >
                          <MessageSquare className="w-4 h-4 text-brand-600" />
                        </Link>
                      )}
                      {apt.status === "completed" && (
                        <button
                          onClick={() => {
                            setReviewModal(apt);
                            setReviewRating(5);
                            setReviewComment("");
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Dejar reseña"
                        >
                          <Star className="w-4 h-4 text-amber-500" />
                        </button>
                      )}
                      {canClientCancel(apt).ok && (
                        <button
                          onClick={() => {
                            setCancelTarget(apt);
                            setCancelError(null);
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Cancelar cita"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      {(apt.status === "completed" ||
                        apt.status === "cancelled") && (
                        <button
                          onClick={() => archiveAppointment(apt.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Quitar del historial"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {apt.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Notas:</span> {apt.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => !cancelling && setCancelTarget(null)}
        title="Cancelar cita"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vas a cancelar tu consulta con{" "}
              <span className="font-semibold">
                {cancelTarget.lawyer.firstName} {cancelTarget.lawyer.lastName}
              </span>{" "}
              del{" "}
              <span className="font-semibold">
                {formatDateTime(cancelTarget.dateTime)}
              </span>
              .
            </p>
            {cancelTarget.status === "confirmed" &&
              cancelTarget.paymentStatus === "completed" && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  Te vamos a reembolsar {formatCurrency(cancelTarget.amount)} al
                  medio de pago que usaste. Puede demorar entre 1 y 10 dias
                  habiles segun tu banco.
                </div>
              )}
            {cancelError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {cancelError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => cancelAppointment(cancelTarget.id)}
                disabled={cancelling}
              >
                {cancelling ? "Cancelando..." : "Confirmar cancelacion"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title="Dejar Reseña"
      >
        {reviewModal && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Califica tu experiencia con{" "}
              <span className="font-semibold">
                {reviewModal.lawyer.firstName} {reviewModal.lawyer.lastName}
              </span>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Calificacion
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Comentario (opcional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
                placeholder="Cuenta tu experiencia..."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setReviewModal(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={submittingReview}
                onClick={() =>
                  submitReview(reviewModal.id, reviewModal.lawyer.id)
                }
              >
                {submittingReview ? "Enviando..." : "Enviar Reseña"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
