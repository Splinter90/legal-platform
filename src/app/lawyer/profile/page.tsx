"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { PhoneInputAR } from "@/components/ui/phone-input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Save, MapPin, CreditCard, User, Crown, CheckCircle, AlertCircle, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { SkeletonProfile } from "@/components/ui/skeleton";
import { AvatarUpload } from "@/components/ui/avatar-upload";

const SPECIALTY_OPTIONS = [
  "Derecho Penal", "Derecho Civil", "Derecho Laboral", "Derecho Comercial",
  "Derecho de Familia", "Derecho Tributario", "Derecho Administrativo",
  "Derecho Ambiental", "Derecho Inmobiliario", "Derecho de Seguros",
  "Derecho Informatico", "Derecho Migratorio",
];

export default function LawyerProfile() {
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [lawyer, setLawyer] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [specialtyToAdd, setSpecialtyToAdd] = useState("");
  const [savingSpecialties, setSavingSpecialties] = useState(false);
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
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        narrative: form.narrative,
        experience: form.experience,
        address: form.address,
        city: form.city,
        province: form.province,
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
    const fullName = `${updated.firstName || ""} ${updated.lastName || ""}`.trim();
    if (fullName) {
      await updateSession({ name: fullName });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function updateSpecialties(next: string[]) {
    setSavingSpecialties(true);
    try {
      const res = await fetch("/api/lawyers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialties: next.join(", ") }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "No se pudo actualizar");
        return;
      }
      const updated = await res.json();
      setLawyer(updated);
      setForm(updated);
    } finally {
      setSavingSpecialties(false);
    }
  }

  function currentSpecialties(): string[] {
    if (!lawyer?.specialties) return [];
    return lawyer.specialties
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
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
<SkeletonProfile />
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
              <AvatarUpload
                currentUrl={lawyer.profilePhoto}
                fallbackInitials={`${lawyer.firstName[0] || ""}${lawyer.lastName[0] || ""}`.toUpperCase()}
                size="lg"
                onChange={async (url) => {
                  const res = await fetch("/api/lawyers/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profilePhoto: url }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.error || "Error");
                  }
                  const updated = await res.json();
                  setLawyer(updated);
                  await updateSession({ image: updated.profilePhoto ?? null });
                  setForm(updated);
                }}
              />
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
                    ({lawyer.reviewCount} reseñas)
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={form.firstName || ""}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  minLength={2}
                  maxLength={40}
                  required
                />
                <Input
                  label="Apellido"
                  value={form.lastName || ""}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  minLength={2}
                  maxLength={40}
                  required
                />
              </div>
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
            <div className="flex flex-wrap gap-2 mb-4">
              {currentSpecialties().length === 0 && (
                <p className="text-sm text-slate-400">Aún no agregaste especialidades.</p>
              )}
              {currentSpecialties().map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium"
                >
                  {s}
                  <button
                    type="button"
                    disabled={savingSpecialties || currentSpecialties().length <= 1}
                    onClick={() => {
                      const next = currentSpecialties().filter((x) => x !== s);
                      updateSpecialties(next);
                    }}
                    title={
                      currentSpecialties().length <= 1
                        ? "Debés mantener al menos una"
                        : "Quitar"
                    }
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-brand-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={specialtyToAdd}
                onChange={(e) => setSpecialtyToAdd(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Elegí una especialidad para agregar...</option>
                {SPECIALTY_OPTIONS.filter(
                  (opt) => !currentSpecialties().includes(opt)
                ).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                disabled={!specialtyToAdd || savingSpecialties}
                onClick={async () => {
                  const next = [...currentSpecialties(), specialtyToAdd];
                  await updateSpecialties(next);
                  setSpecialtyToAdd("");
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
