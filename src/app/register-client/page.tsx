"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function RegisterClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  function updateForm(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar");
      }

      const loginRes = await signIn("client-login", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginRes?.ok) {
        router.push("/client/dashboard");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/client/dashboard" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="relative px-8 py-10 bg-gradient-hero overflow-hidden text-center">
            <div className="absolute inset-0 hero-rays opacity-50" />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-500/20 rounded-full blur-[100px]" />
            <div className="relative z-10 flex flex-col items-center">
              <BrandLogo size="sm" tone="dark" href="" />
              <span className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Nueva cuenta
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Crear Cuenta
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Registrate para agendar consultas legales.
              </p>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google signup */}
            <Button
              onClick={handleGoogleSignup}
              variant="outline"
              size="lg"
              className="w-full gap-3 mb-6"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Registrarse con Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">o con email</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre completo"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Tu nombre"
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="tu@email.com"
                required
              />
              <Input
                label="Telefono (opcional)"
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="Tu telefono"
              />
              <Input
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                placeholder="Minimo 6 caracteres"
                required
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                placeholder="Repetir contraseña"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Ya tenes cuenta?{" "}
              <Link
                href="/login"
                className="text-brand-600 font-semibold hover:text-brand-700"
              >
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
