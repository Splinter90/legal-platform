"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { PhoneInputAR } from "@/components/ui/phone-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Save, MapPin, CreditCard, User, Crown, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const LawyersMap = dynamic(() => import("@/components/maps/lawyers-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-100 rounded-2xl flex items-center justify-center h-[250px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
    </div>
  ),
});

export default function LawyerProfile() {
  const searchParams = useSearchParams();
  const [lawyer, setLawyer] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    fetch("/api/lawyers/profile")
      .then((r) => r.json())
      .then((data) => {
        setLawyer(data);
        setForm(data);
      });

    fetch("/api/payments/subscription")
      .then((r) => r.json())
      .then(setSubscription)
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/lawyers/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: form.phone,
        narrative: form.narrative,
        experience: form.experience,
        address: form.address,
        cbuAlias: form.cbuAlias,
        latitude: typeof form.latitude === "number" ? form.latitude : undefined,
        longitude: typeof form.longitude === "number" ? form.longitude : undefined,
      }),
    });
    if (!res.ok) {
      try {
        const err = await res.json();
        toast.error(err.error || "No se pudo guardar");
      } catch {}
      setSaving(false);
      return;
    }
    const updated = await res.json();
    setLawyer(updated);
    setForm(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/payments/subscription", {
        method: "POST",
      });
      const data = await res.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
        return;
      }
      if (data.sandboxInitPoint) {
        window.location.href = data.sandboxInitPoint;
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setSubscribing(false);
  }

  if (!lawyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const isSubscribed = subscription?.status === "active";
  const paidUntil = subscription?.paidUntil
    ? new Date(subscription.paidUntil).toLocaleDateString("es-AR")
    : null;
  const canSubscribe = lawyer.status === "approved";
  const subscribeBlockedReason =
    lawyer.status === "pending"
      ? "Esperá la aprobación del Admin para activar la suscripción"
      : lawyer.status === "rejected"
      ? "Tu solicitud fue rechazada. Reenviala desde el dashboard."
      : lawyer.status === "suspended"
      ? "Tu cuenta está suspendida"
      : "Completá tu perfil para continuar";

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-500 mt-1">
          Gestiona tu informacion profesional
        </p>
      </div>

      {paymentStatus === "success" && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Pago de suscripcion procesado exitosamente
        </div>
      )}
      {paymentStatus === "failure" && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          El pago no pudo procesarse. Intenta nuevamente.
        </div>
      )}

      <div className="grid gap-6 max-w-2xl">
        {/* Subscription */}
        <Card className={isSubscribed ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSubscribed ? "bg-emerald-100" : "bg-amber-100"}`}>
                  <Crown className={`w-6 h-6 ${isSubscribed ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Suscripcion {isSubscribed ? "Activa" : "Inactiva"}
                  </h3>
                  {isSubscribed ? (
                    <p className="text-sm text-emerald-600">
                      Activa hasta el {paidUntil}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600">
                      Suscribite para aparecer en la plataforma
                    </p>
                  )}
                </div>
              </div>
              {!isSubscribed && (
                <div className="flex flex-col items-end gap-1">
                  <Button
                    onClick={handleSubscribe}
                    disabled={subscribing || !canSubscribe}
                    title={!canSubscribe ? subscribeBlockedReason : undefined}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {subscribing ? "Procesando..." : `Pagar $${(subscription?.amount || 5000).toLocaleString("es-AR")}/mes`}
                  </Button>
                  {!canSubscribe && (
                    <p className="text-xs text-amber-700 max-w-xs text-right">
                      {subscribeBlockedReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile header */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-2xl">
                {lawyer.firstName[0]}
                {lawyer.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lawyer.firstName} {lawyer.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={lawyer.status === "approved" ? "success" : "warning"}
                  >
                    {lawyer.status === "approved" ? "Activo" : "Pendiente"}
                  </Badge>
                  <Stars rating={Math.round(lawyer.rating)} size="sm" />
                  <span className="text-sm text-slate-500">
                    ({lawyer.reviewCount} resenas)
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {lawyer.city}, {lawyer.province}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location map */}
        {lawyer.latitude && lawyer.longitude ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Tu ubicacion en el mapa
              </h2>
            </CardHeader>
            <CardContent>
              <LawyersMap
                lawyers={[{
                  id: lawyer.id,
                  firstName: lawyer.firstName,
                  lastName: lawyer.lastName,
                  specialties: lawyer.specialties,
                  province: lawyer.province,
                  city: lawyer.city,
                  address: lawyer.address,
                  rating: lawyer.rating,
                  reviewCount: lawyer.reviewCount,
                  latitude: lawyer.latitude,
                  longitude: lawyer.longitude,
                }]}
                showLink={false}
                height="250px"
              />
              <p className="text-xs text-slate-400 mt-2">
                La ubicacion se calcula automaticamente a partir de tu direccion. Si no es correcta, actualiza tu direccion abajo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Sin ubicacion en el mapa</h3>
                  <p className="text-sm text-amber-600">
                    Completa tu direccion para aparecer en el mapa de abogados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editable fields */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" />
              Informacion del Perfil
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <PhoneInputAR
                label="Celular"
                value={form.phone || ""}
                onChange={(v) => setForm({ ...form, phone: v })}
                showErrorOnIncomplete
              />
              <AddressAutocomplete
                label="Direccion"
                value={form.address || ""}
                onChange={(v) => setForm({ ...form, address: v })}
                onSelect={(opt) =>
                  setForm({
                    ...form,
                    address: opt.address,
                    city: opt.city || form.city,
                    province: opt.province || form.province,
                    latitude: opt.latitude,
                    longitude: opt.longitude,
                  })
                }
                province={form.province}
                city={form.city}
                helper="Empezá a escribir y elegí una sugerencia para fijar la ubicación exacta."
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Narrativa Profesional
                </label>
                <textarea
                  value={form.narrative || ""}
                  onChange={(e) => setForm({ ...form, narrative: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Experiencia Laboral
                </label>
                <textarea
                  value={form.experience || ""}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px] resize-none"
                />
              </div>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
              {saved && (
                <span className="text-sm text-emerald-600 ml-3">Guardado</span>
              )}
            </form>
          </CardContent>
        </Card>

        {/* CBU */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Datos de Cobro
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="CBU / Alias"
                value={form.cbuAlias || ""}
                onChange={(e) => setForm({ ...form, cbuAlias: e.target.value })}
                placeholder="Ingresa tu alias o CBU para recibir depositos"
              />
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Specialties */}
        <Card>
          <CardContent className="py-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Especialidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {lawyer.specialties.split(",").map((s: string) => (
                <Badge key={s} variant="info">
                  {s.trim()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
