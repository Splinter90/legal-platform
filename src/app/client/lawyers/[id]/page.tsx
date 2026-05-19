"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { BookingCalendar } from "@/components/ui/booking-calendar";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { SkeletonProfile } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/client/favorite-button";

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
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | "all">("all");
  const [reviewSort, setReviewSort] = useState<"recent" | "best" | "worst">("recent");
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [consultationFee, setConsultationFee] = useState(5000);

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

      // Crear preferencia de pago en Mercado Pago
      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      if (!paymentRes.ok) {
        const data = await paymentRes.json().catch(() => ({}));
        throw new Error(
          data.error ||
            "No se pudo iniciar el pago. Revisá tu conexión e intentá de nuevo."
        );
      }

      const paymentData = await paymentRes.json();
      const checkoutUrl = paymentData.initPoint || paymentData.sandboxInitPoint;

      if (!checkoutUrl) {
        throw new Error(
          "El proveedor de pagos no devolvió una URL de checkout. Intentá de nuevo en unos minutos."
        );
      }

      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Error al crear la cita");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
<SkeletonProfile />
    );
  }

  if (!lawyer) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Abogado no encontrado</p>
      </div>
    );
  }

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
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {lawyer.firstName} {lawyer.lastName}
                </h1>
                <FavoriteButton lawyerId={lawyer.id} />
              </div>
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
        <ReviewsSection
          reviews={reviews}
          ratingFilter={reviewRatingFilter}
          setRatingFilter={setReviewRatingFilter}
          sort={reviewSort}
          setSort={setReviewSort}
        />
      )}

      {/* Booking section */}
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

                <BookingCalendar
                  lawyerId={String(id)}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={({ date, startTime }) => {
                    setSelectedDate(date);
                    setSelectedTime(startTime);
                  }}
                />

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
    </div>
  );
}

function ReviewsSection({
  reviews,
  ratingFilter,
  setRatingFilter,
  sort,
  setSort,
}: {
  reviews: Review[];
  ratingFilter: number | "all";
  setRatingFilter: (v: number | "all") => void;
  sort: "recent" | "best" | "worst";
  setSort: (v: "recent" | "best" | "worst") => void;
}) {
  const filtered = useMemo(() => {
    let list = ratingFilter === "all" ? reviews : reviews.filter((r) => r.rating === ratingFilter);
    list = [...list];
    if (sort === "best") list.sort((a, b) => b.rating - a.rating);
    else if (sort === "worst") list.sort((a, b) => a.rating - b.rating);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [reviews, ratingFilter, sort]);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const r of reviews) map.set(r.rating, (map.get(r.rating) || 0) + 1);
    return map;
  }, [reviews]);

  return (
    <Card className="mb-6">
      <CardContent className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Resenas ({filtered.length}
            {filtered.length !== reviews.length ? ` de ${reviews.length}` : ""})
          </h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "best" | "worst")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="recent">Más recientes</option>
            <option value="best">Mejor rating</option>
            <option value="worst">Peor rating</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRatingFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              ratingFilter === "all"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((r) => {
            const c = counts.get(r) || 0;
            return (
              <button
                key={r}
                type="button"
                disabled={c === 0}
                onClick={() => setRatingFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  ratingFilter === r
                    ? "bg-brand-600 text-white"
                    : c === 0
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {r}★ <span className="opacity-70">({c})</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            No hay reseñas con esa calificación.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((review) => (
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
        )}
      </CardContent>
    </Card>
  );
}
