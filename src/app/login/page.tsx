"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Lock, ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

type LoginType = "client" | "lawyer" | "admin";

const URL_ERRORS: Record<string, string> = {
  unauthorized:
    "Tu cuenta de Google no tiene permisos para esta sección.",
  email_already_client:
    "Este email ya está registrado como cliente. Usá otro Gmail para registrarte como abogado.",
  OAuthSignin:
    "No se pudo iniciar sesión con Google. Revisá la configuración de OAuth.",
  OAuthCallback:
    "Falló el callback de Google. Verificá el redirect URI en Google Cloud.",
  Callback: "Hubo un problema al completar el login. Probá de nuevo.",
};

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginType, setLoginType] = useState<LoginType>("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminForm, setAdminForm] = useState({ username: "", password: "", totp: "" });
  const [needsTotp, setNeedsTotp] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(URL_ERRORS[urlError] || `Error de autenticación: ${urlError}`);
      if (urlError === "unauthorized") {
        setLoginType("lawyer");
      }
    }
  }, [searchParams]);

  async function handleGoogleLogin(role: "client" | "lawyer") {
    setLoading(true);
    document.cookie = `signin_intent=${role}; path=/; max-age=300; samesite=lax`;
    const callbackUrl = role === "lawyer" ? "/lawyer/dashboard" : "/client/dashboard";
    await signIn("google", { callbackUrl });
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("admin-login", {
      username: adminForm.username,
      password: adminForm.password,
      totp: adminForm.totp,
      redirect: false,
    });
    if (res?.error) {
      if (res.error === "TwoFactorRequired") {
        setNeedsTotp(true);
        setError("");
      } else if (res.error === "TwoFactorInvalid") {
        setNeedsTotp(true);
        setError("Código 2FA incorrecto.");
      } else if (res.error === "RateLimitExceeded") {
        setError("Demasiados intentos fallidos. Esperá 15 minutos antes de volver a probar.");
      } else {
        setError("Credenciales incorrectas");
        setNeedsTotp(false);
      }
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  }

  const tabs: { key: LoginType; label: string; icon: React.ReactNode }[] = [
    { key: "client", label: "Cliente", icon: <User className="w-4 h-4" /> },
    { key: "lawyer", label: "Abogado", icon: <Scale className="w-4 h-4" /> },
    { key: "admin", label: "Admin", icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-hero text-white font-display flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 hero-rays opacity-50" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-brand-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 text-center border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex justify-center mb-4">
              <BrandLogo size="md" tone="dark" href="" />
            </div>
            <p className="text-sm text-slate-400">
              Bienvenido. Elegi tu tipo de cuenta para continuar.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setLoginType(tab.key);
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
                  loginType === tab.key
                    ? "text-brand-300 border-b-2 border-brand-400 bg-brand-500/5"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {loginType === "client" && (
              <div className="space-y-4">
                <Button
                  onClick={() => handleGoogleLogin("client")}
                  variant="outline-dark"
                  size="lg"
                  className="w-full gap-3"
                  disabled={loading}
                >
                  <GoogleIcon />
                  Continuar con Google
                </Button>
                <p className="text-center text-xs text-slate-500 leading-relaxed">
                  Iniciá sesión con tu cuenta de Gmail. Necesaria para integrar
                  Google Calendar y recibir el link de Meet.
                </p>
              </div>
            )}

            {loginType === "lawyer" && (
              <div className="space-y-4">
                <Button
                  onClick={() => handleGoogleLogin("lawyer")}
                  variant="outline-dark"
                  size="lg"
                  className="w-full gap-3"
                  disabled={loading}
                >
                  <GoogleIcon />
                  Ingresar con Google
                </Button>
                <p className="text-center text-xs text-slate-500 leading-relaxed">
                  Tu cuenta de Gmail se usa para sincronizar Google Calendar y
                  generar las videollamadas de Meet.
                </p>
                <p className="text-center text-sm text-slate-400 pt-2">
                  Sos abogado y aún no tenés perfil?{" "}
                  <Link href="/register-lawyer" className="text-brand-300 font-semibold hover:text-brand-200">
                    Registrate aquí
                  </Link>
                </p>
              </div>
            )}

            {loginType === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Usuario
                  </label>
                  <input
                    type="text"
                    placeholder="Usuario administrador"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                    required
                    disabled={needsTotp}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Contrasena
                  </label>
                  <input
                    type="password"
                    placeholder="Contrasena"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    required
                    disabled={needsTotp}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-60"
                  />
                </div>
                {needsTotp && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Código 2FA (6 dígitos)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="123456"
                      value={adminForm.totp}
                      onChange={(e) => setAdminForm({ ...adminForm, totp: e.target.value.replace(/\D/g, "") })}
                      autoFocus
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent tracking-widest text-center font-mono"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Ingresá el código de tu app de autenticación.
                    </p>
                  </div>
                )}
                <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Ingresando..." : needsTotp ? "Verificar código" : "Ingresar como Admin"}
                </Button>
                {needsTotp && (
                  <button
                    type="button"
                    className="w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    onClick={() => {
                      setNeedsTotp(false);
                      setAdminForm({ ...adminForm, totp: "" });
                      setError("");
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
