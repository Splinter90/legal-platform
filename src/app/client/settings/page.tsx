"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { Download, Trash2, ShieldCheck, AlertTriangle, Mail, Phone, User as UserIcon, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
};

export default function ClientSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/clients/me")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/clients/me/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "No se pudo exportar tus datos");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `leyes-digital-mis-datos-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Descargamos tus datos");
    } catch {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  }

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
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <dt className="w-32 flex items-center gap-1.5 text-slate-500">
                  <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  Nombre
                </dt>
                <dd className="text-slate-900 font-medium">{profile.name}</dd>
              </div>
              <div className="flex items-start gap-3">
                <dt className="w-32 flex items-center gap-1.5 text-slate-500">
                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                  Email
                </dt>
                <dd className="text-slate-900 font-medium break-all">{profile.email}</dd>
              </div>
              <div className="flex items-start gap-3">
                <dt className="w-32 flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  Teléfono
                </dt>
                <dd className="text-slate-900 font-medium">
                  {profile.phone || <span className="text-slate-400">Sin completar</span>}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {/* Privacidad */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">Privacidad</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Descargá una copia completa de tus datos personales en un archivo ZIP
            (citas, mensajes, reseñas, pagos, favoritos). Es tu derecho de acceso
            según la Ley 25.326.
          </p>
          <Button
            onClick={exportData}
            disabled={exporting}
            aria-busy={exporting}
            className="inline-flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
            {exporting ? "Generando ZIP..." : "Exportar mis datos"}
          </Button>
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
