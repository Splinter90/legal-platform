"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  Video,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface LawyerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialties: string;
  province: string;
  city: string;
  address: string;
  narrative: string;
  experience: string;
  rating: number;
  reviewCount: number;
  profilePhoto: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { name: string; image: string | null };
}

export default function LawyerProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState("");
  const [consultationFee, setConsultationFee] = useState(5000);
  const [availableSlots, setAvailableSlots] = useState<Array<{ date: string; startTime: string; available: boolean }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState("");

  useEffect(() => {
    fetch(`/api/lawyers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLawyer(data.lawyer);
        setConsultationFee(data.consultationFee || 5000);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/reviews?lawyerId=${id}`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlotsMessage("");
    setSelectedTime("");
    fetch(`/api/lawyers/${id}/slots?date=${selectedDate}&days=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) setSlotsMessage(data.message);
        const daySlots = (data.slots || []).filter((s: any) => s.date === selectedDate && s.available);
        setAvailableSlots(daySlots);
      })
      .catch(() => setSlotsMessage("Error al cargar horarios"))
      .finally(() => setSlotsLoading(false));
  }, [id, selectedDate]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const dateTime = `${selectedDate}T${selectedTime}:00`;

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawyerId: id, dateTime, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const appointment = await res.json();

      // Create Mercado Pago payment preference
      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        if (paymentData.initPoint) {
          window.location.href = paymentData.initPoint;
          return;
        }
        if (paymentData.sandboxInitPoint) {
          window.location.href = paymentData.sandboxInitPoint;
          return;
        }
      }

      // Fallback: confirm directly if Mercado Pago is not configured
      const confirmRes = await fetch(`/api/appointments/${appointment.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: (session as any)?.accessToken || null,
        }),
      });

      const confirmData = await confirmRes.json();
      setSuccess(confirmData);
    } catch (err: any) {
      setError(err.message || "Error al crear la cita");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Abogado no encontrado</p>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="animate-in max-w-4xl mx-auto">
      <Link
        href="/client/lawyers"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la busqueda
      </Link>

      {/* Lawyer info */}
      <Card className="mb-6">
        <CardContent className="py-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {lawyer.profilePhoto ? (
              <img
                src={lawyer.profilePhoto}
                alt={`${lawyer.firstName} ${lawyer.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {lawyer.firstName[0]}
                {lawyer.lastName[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {lawyer.firstName} {lawyer.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={Math.round(lawyer.rating)} size="sm" />
                <span className="text-sm text-slate-500">
                  ({lawyer.reviewCount} resenas)
                </span>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {lawyer.city}, {lawyer.province}
                </span>
                {lawyer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {lawyer.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {lawyer.email}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {lawyer.specialties.split(",").map((s) => (
                  <Badge key={s} variant="info">
                    {s.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {lawyer.narrative && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Sobre mi</h3>
              <p className="text-slate-600">{lawyer.narrative}</p>
            </div>
          )}

          {lawyer.experience && (
            <div className="mt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Experiencia</h3>
              <p className="text-slate-600">{lawyer.experience}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Resenas ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                      {review.client.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{review.client.name}</p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} size="xs" />
                        <span className="text-xs text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600 ml-11">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking section */}
      {success ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Cita Confirmada
            </h2>
            <p className="text-slate-600 mb-4">{success.message}</p>
            {success.meetLink && (
              <a
                href={success.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
              >
                <Video className="w-5 h-5" />
                Abrir Google Meet
              </a>
            )}
            <div className="mt-4">
              <Link
                href="/client/dashboard"
                className="text-brand-600 font-medium text-sm hover:text-brand-700"
              >
                Ir al Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Agendar Consulta
                </h2>
                <p className="text-sm text-slate-500">
                  Valor de la consulta:{" "}
                  <span className="font-semibold text-slate-900">
                    ${consultationFee.toLocaleString("es-AR")}
                  </span>
                </p>
              </div>
              {!bookingOpen && (
                <Button onClick={() => setBookingOpen(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Reservar Cita
                </Button>
              )}
            </div>

            {bookingOpen && (
              <form onSubmit={handleBooking} className="space-y-5">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Fecha
                  </label>
                  <input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Horario
                  </label>
                  {!selectedDate ? (
                    <p className="text-sm text-slate-400">Selecciona una fecha para ver los horarios disponibles</p>
                  ) : slotsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500" />
                      Cargando horarios...
                    </div>
                  ) : slotsMessage ? (
                    <p className="text-sm text-amber-600">{slotsMessage}</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-slate-400">No hay horarios disponibles para esta fecha</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedTime(slot.startTime)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedTime === slot.startTime
                              ? "bg-brand-600 text-white shadow-lg shadow-glow-brand"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          {slot.startTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-none"
                    placeholder="Describe brevemente tu consulta..."
                  />
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 text-sm mb-2">
                    Resumen
                  </h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Abogado: {lawyer.firstName} {lawyer.lastName}</p>
                    {selectedDate && <p>Fecha: {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-AR")}</p>}
                    {selectedTime && <p>Hora: {selectedTime} hs</p>}
                    <p className="font-semibold text-slate-900 pt-1">
                      Total: ${consultationFee.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setBookingOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting || !selectedDate || !selectedTime}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {submitting ? "Procesando..." : "Pagar con Mercado Pago"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
