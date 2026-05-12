"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, FileCheck2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function RegisterLawyerPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleRegister() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/register-lawyer/complete" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="relative px-6 sm:px-8 py-10 bg-gradient-hero overflow-hidden">
            <div className="absolute inset-0 hero-rays opacity-50" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <BrandLogo size="sm" tone="dark" href="" />
              <span className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Para profesionales
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Registro de Abogado
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Ingresá con tu Gmail para crear tu perfil profesional verificado.
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-8 space-y-6">
            <Button
              onClick={handleGoogleRegister}
              variant="outline"
              size="lg"
              className="w-full gap-3"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? "Redirigiendo a Google..." : "Continuar con Google"}
            </Button>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cómo funciona
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-brand-600 flex-shrink-0" />
                  Iniciás sesión con tu cuenta de Google — sin contraseñas.
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <FileCheck2 className="w-4 h-4 mt-0.5 text-brand-600 flex-shrink-0" />
                  Completás tus datos profesionales y subís tu título de abogado.
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <Clock className="w-4 h-4 mt-0.5 text-brand-600 flex-shrink-0" />
                  Un administrador revisa tu perfil y lo aprueba.
                </li>
              </ul>
            </div>

            <p className="text-xs text-slate-500 text-center">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
