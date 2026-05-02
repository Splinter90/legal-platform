"use client";
import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, Camera, FileText, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/ui/brand-logo";

const specialties = [
  "Derecho Penal", "Derecho Civil", "Derecho Laboral", "Derecho Comercial",
  "Derecho de Familia", "Derecho Tributario", "Derecho Administrativo",
  "Derecho Ambiental", "Derecho Inmobiliario", "Derecho de Seguros",
  "Derecho Informatico", "Derecho Migratorio",
];

const provinces = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Cordoba",
  "Corrientes", "Entre Rios", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquen", "Rio Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucuman",
];

function FileUpload({
  label,
  hint,
  icon,
  value,
  onChange,
  uploading,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  value: string;
  onChange: (url: string) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "lawyers");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
      }
    } catch {}
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <p className="text-xs text-slate-500 mb-2">{hint}</p>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="w-32 h-32 object-cover rounded-xl border border-slate-200" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-2xl hover:border-brand-400 hover:bg-brand-50/40 transition-all w-full"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-sm text-slate-600">
            {uploading ? "Subiendo..." : "Click para subir imagen"}
          </span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

export default function RegisterLawyerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    matricula: "",
    specialties: [] as string[],
    province: "",
    city: "",
    address: "",
    narrative: "",
    experience: "",
    cbuAlias: "",
    profilePhoto: "",
    titleDocument: "",
  });

  function updateForm(field: string, value: string | string[]) {
    setForm({ ...form, [field]: value });
  }

  function toggleSpecialty(s: string) {
    const current = form.specialties;
    if (current.includes(s)) {
      updateForm("specialties", current.filter((x) => x !== s));
    } else {
      updateForm("specialties", [...current, s]);
    }
  }

  async function handleGoogleRegister() {
    await signIn("google", { callbackUrl: "/register-lawyer/complete" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lawyers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          specialties: form.specialties.join(","),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
            Solicitud enviada
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Tu solicitud de registro fue enviada correctamente. Un
            administrador revisara tus datos y documentos, y aprobara tu perfil.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg">Ir al Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
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
                Completa tus datos para crear tu perfil profesional verificado.
              </p>
            </div>
          </div>

          {/* Google register option */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
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
              Registrarme con Google
            </Button>
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">o completa el formulario</span>
              </div>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex border-b border-slate-100">
            {["Datos personales", "Profesional", "Documentos"].map((s, i) => (
              <button
                key={s}
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`flex-1 py-3.5 text-xs sm:text-sm font-semibold text-center transition-all ${
                  step === i + 1
                    ? "text-brand-600 border-b-2 border-brand-500 bg-brand-50/60"
                    : step > i + 1
                    ? "text-brand-700"
                    : "text-slate-400"
                }`}
              >
                {step > i + 1 ? <span>&#10003; </span> : null}
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-8">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    value={form.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    required
                  />
                  <Input
                    label="Apellido"
                    value={form.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                />
                <Input
                  label="Contrasena"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  required
                />
                <Input
                  label="Telefono"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                />
                <Input
                  label="Numero de Matricula"
                  value={form.matricula}
                  onChange={(e) => updateForm("matricula", e.target.value)}
                  required
                />
                <Input
                  label="CBU / Alias (para recibir pagos)"
                  value={form.cbuAlias}
                  onChange={(e) => updateForm("cbuAlias", e.target.value)}
                  placeholder="Alias o CBU para depositos"
                />
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Especialidades
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          form.specialties.includes(s)
                            ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow-brand"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Provincia
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => updateForm("province", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">Seleccionar provincia</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Ciudad"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  required
                />
                <Input
                  label="Direccion"
                  value={form.address}
                  onChange={(e) => updateForm("address", e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Narrativa profesional
                  </label>
                  <textarea
                    value={form.narrative}
                    onChange={(e) => updateForm("narrative", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-none"
                    placeholder="Conta sobre vos y tu enfoque profesional..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Experiencia laboral
                  </label>
                  <textarea
                    value={form.experience}
                    onChange={(e) => updateForm("experience", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px] resize-none"
                    placeholder="Detalla tu experiencia laboral..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                    Atras
                  </Button>
                  <Button type="button" size="lg" className="flex-1" onClick={() => setStep(3)}>
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-brand-200/60 bg-brand-50/60 p-4">
                  <p className="text-sm text-brand-800">
                    Subi tu foto de perfil y una foto de tu titulo universitario para que el administrador pueda verificar tu identidad profesional.
                  </p>
                </div>

                <FileUpload
                  label="Foto de Perfil"
                  hint="Una foto profesional tuya (JPG, PNG, max 5MB)"
                  icon={<Camera className="w-5 h-5" />}
                  value={form.profilePhoto}
                  onChange={(url) => updateForm("profilePhoto", url)}
                  uploading={uploading}
                />

                <FileUpload
                  label="Foto del Titulo Universitario"
                  hint="Foto legible de tu titulo de abogado (JPG, PNG, max 5MB)"
                  icon={<FileText className="w-5 h-5" />}
                  value={form.titleDocument}
                  onChange={(url) => updateForm("titleDocument", url)}
                  uploading={uploading}
                />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                    Atras
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {loading ? "Enviando..." : "Enviar Solicitud"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
