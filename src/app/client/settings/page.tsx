"use client";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Mail, Phone, User as UserIcon, Loader2, Save } from "lucide-react";
import { PhoneInputAR } from "@/components/ui/phone-input";
import { normalizePhoneAR, formatPhoneAR } from "@/lib/phone";

type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
};

export default function ClientSettingsPage() {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/clients/me")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setNameInput(p?.name || "");
        setPhoneInput(p?.phone ? formatPhoneAR(p.phone) : "");
      })
      .catch(() => setProfile(null));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    if (trimmedName.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }
    const phoneTrimmed = phoneInput.trim();
    let phoneToSend: string | null = null;
    if (phoneTrimmed) {
      const normalized = normalizePhoneAR(phoneTrimmed);
      if (!normalized) {
        toast.error("El teléfono debe ser un celular argentino válido (ej: +54 9 11 1234-5678)");
        return;
      }
      phoneToSend = normalized;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/clients/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: phoneToSend }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok) {
        const fallback = `No se pudo actualizar (HTTP ${res.status})`;
        toast.error(data?.error || fallback);
        if (!data?.error && text) console.error("PUT /api/clients/me response:", text);
        return;
      }
      setProfile(data);
      setNameInput(data.name || "");
      setPhoneInput(data.phone ? formatPhoneAR(data.phone) : "");
      await updateSession({ name: data.name, image: data.image });
      toast.success("Datos actualizados");
    } catch (err) {
      console.error(err);
      toast.error("Error de red al actualizar");
    } finally {
      setSavingProfile(false);
    }
  }

  const normalizedFormPhone = phoneInput.trim()
    ? normalizePhoneAR(phoneInput) || ""
    : "";
  const dirty =
    !!profile &&
    (nameInput.trim() !== (profile.name || "") ||
      normalizedFormPhone !== (profile.phone || ""));

  async function deleteAccount() {
    if (confirmText.trim().toLowerCase() !== "eliminar") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/clients/me", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || "No se pudo eliminar la cuenta");
        setDeleting(false);
        return;
      }
      toast.success("Cuenta eliminada");
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Error al eliminar la cuenta");
      setDeleting(false);
    }
  }

  return (
    <div className="animate-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">
          Gestioná tus datos personales y privacidad.
        </p>
      </div>

      {/* Perfil */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">Mi perfil</h2>
          </div>
          {!profile ? (
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <>
              <div className="mb-5 pb-5 border-b border-slate-100">
                <AvatarUpload
                  currentUrl={profile.image}
                  fallbackInitials={(profile.name || "U")
                    .split(" ")
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                  size="lg"
                  onChange={async (url) => {
                    const res = await fetch("/api/clients/me", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ image: url }),
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data?.error || "Error");
                    }
                    const updated = await res.json();
                    setProfile(updated);
                    await updateSession({ image: updated.image });
                  }}
                />
              </div>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    minLength={2}
                    maxLength={80}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed break-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    El email está asociado a tu cuenta de Google y no se puede cambiar.
                  </p>
                </div>
                <PhoneInputAR
                  label="Teléfono"
                  value={phoneInput}
                  onChange={setPhoneInput}
                />
                <Button
                  type="submit"
                  disabled={!dirty || savingProfile}
                  className="inline-flex items-center gap-2"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="w-4 h-4" aria-hidden="true" />
                  )}
                  {savingProfile ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cuenta */}
      <Card className="border-red-100">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">Eliminar mi cuenta</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Tu perfil queda anonimizado: borramos tu nombre, email, foto y teléfono.
            Tus citas pasadas, reseñas y mensajes permanecen para que abogados y la
            plataforma puedan cumplir con obligaciones contables y legales. Esta
            acción es <strong>irreversible</strong>.
          </p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Eliminar cuenta
          </button>
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setConfirmText("");
          }
        }}
        title="¿Eliminar tu cuenta?"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="mb-2">
                Vamos a <strong>anonimizar</strong> tu perfil y cerrar tu sesión.
                No vas a poder recuperar tu cuenta.
              </p>
              <p>
                Si tenés citas confirmadas a futuro, cancelalas primero o esperá
                a que pasen.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-delete"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Escribí <span className="font-mono text-red-600">eliminar</span> para confirmar
            </label>
            <input
              id="confirm-delete"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deleting}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus:border-red-400"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmText("");
              }}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deleting || confirmText.trim().toLowerCase() !== "eliminar"}
              aria-busy={deleting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              )}
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
