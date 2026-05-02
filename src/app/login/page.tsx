"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/ui/brand-logo";

type LoginType = "client" | "lawyer" | "admin";

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
  const [loginType, setLoginType] = useState<LoginType>("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminForm, setAdminForm] = useState({ username: "", password: "" });
  const [lawyerForm, setLawyerForm] = useState({ email: "", password: "" });
  const [clientForm, setClientForm] = useState({ email: "", password: "" });

  async function handleGoogleLogin(role: "client" | "lawyer") {
    setLoading(true);
    const callbackUrl = role === "lawyer" ? "/lawyer/dashboard" : "/client/dashboard";
    await signIn("google", { callbackUrl });
  }

  async function handleClientLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("client-login", {
      email: clientForm.email,
      password: clientForm.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Credenciales incorrectas");
      setLoading(false);
    } else {
      router.push("/client/dashboard");
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("admin-login", {
      username: adminForm.username,
      password: adminForm.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Credenciales incorrectas");
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  }

  async function handleLawyerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("lawyer-login", {
      email: lawyerForm.email,
      password: lawyerForm.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Credenciales incorrectas o perfil no aprobado");
      setLoading(false);
    } else {
      router.push("/lawyer/dashboard");
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

          {/* Forms */}
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="px-4 bg-slate-900 text-slate-500">o con email</span>
                  </div>
                </div>

                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      placeholder="Tu contrasena"
                      value={clientForm.password}
                      onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </form>
                <p className="text-center text-sm text-slate-400">
                  No tenes cuenta?{" "}
                  <Link href="/register-client" className="text-brand-300 font-semibold hover:text-brand-200">
                    Registrate aqui
                  </Link>
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="px-4 bg-slate-900 text-slate-500">o con email</span>
                  </div>
                </div>

                <form onSubmit={handleLawyerLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={lawyerForm.email}
                      onChange={(e) => setLawyerForm({ ...lawyerForm, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Contrasena
                    </label>
                    <input
                      type="password"
                      placeholder="Tu contrasena"
                      value={lawyerForm.password}
                      onChange={(e) => setLawyerForm({ ...lawyerForm, password: e.target.value })}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </form>
                <p className="text-center text-sm text-slate-400">
                  No tenes cuenta?{" "}
                  <Link href="/register-lawyer" className="text-brand-300 font-semibold hover:text-brand-200">
                    Registrate aqui
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
                <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar como Admin"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
