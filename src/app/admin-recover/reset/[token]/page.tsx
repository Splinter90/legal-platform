"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function AdminResetPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "El link no es valido o expiro");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-hero text-white font-display flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 hero-rays opacity-50" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </Link>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8 text-center border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex justify-center mb-4">
              <BrandLogo size="md" tone="dark" href="" />
            </div>
            <h1 className="text-lg font-semibold text-white">
              Definir nueva contrasena
            </h1>
          </div>

          <div className="px-8 py-8">
            {done ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                </div>
                <p className="text-sm text-slate-300">
                  Contrasena actualizada. Redirigiendo al login...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nueva contrasena
                  </label>
                  <input
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Confirmar contrasena
                  </label>
                  <input
                    type="password"
                    placeholder="Repetir contrasena"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Restablecer contrasena"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
