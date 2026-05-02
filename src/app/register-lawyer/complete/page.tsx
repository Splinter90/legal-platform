"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, Camera, FileText, X, Loader2, Sparkles } from "lucide-react";
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
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  value: string;
  onChange: (url: string) => void;
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
          className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-2xl hover:border-brand-400 hover:bg-brand-50/40 transition-all w-full"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-sm text-slate-600">Click para subir imagen</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

export default function CompleteLawyerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    matricula: "",
    specialties: [] as string[],
    province: "",
    city: "",
    address: "",
    narrative: "",
    experience: "",
    profilePhoto: "",
    titleDocument: "",
  });

  useEffect(() => {
    if (status === "loading" || initialized.current) return;
    if (status === "unauthenticated") {
      router.push("/register-lawyer");
      return;
    }

    initialized.current = true;

    async function createLawyerRecord() {
      try {
        const res = await fetch("/api/lawyers/register-google", { method: "POST" });
        const data = await res.json();

        if (!res.ok) {
          setInitError(data.error || "Error al iniciar registro");
          return;
        }

        if (data.status === "pending" || data.status === "approved") {
          router.push("/login");
          return;
        }

        const name = session?.user?.name || "";
        const nameParts = name.trim().split(/\s+/);
        setForm((f) => ({
          ...f,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          profilePhoto: session?.user?.image || "",
        }));
      } catch {
        setInitError("Error de conexión. Intentá de nuevo.");
      } finally {
        setInitializing(false);
      }
    }

    createLawyerRecord();
  }, [status, session, router]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lawyers/register-google", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          specialties: form.specialties,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al completar perfil");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Preparando tu registro...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">No se pudo continuar</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">{initError}</p>
          <Link href="/register-lawyer">
            <Button variant="primary" size="lg">Volver al registro</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-brand flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">Solicitud enviada</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Tu solicitud de registro fue enviada correctamente. Un administrador revisara tus datos y documentos, y aprobara tu perfil.
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
          href="/register-lawyer"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al registro
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="relative px-6 sm:px-8 py-10 bg-gradient-hero overflow-hidden">
            <div className="absolute inset-0 hero-rays opacity-50" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <BrandLogo size="sm" tone="dark" href="" />
              <span className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Paso final
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Completa tu perfil
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Hola {session?.user?.name}, completa tus datos profesionales.
              </p>
            </div>
          </div>

          <div className="flex border-b border-slate-100">
            {["Datos profesionales", "Documentos"].map((s, i) => (
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
                />

                <FileUpload
                  label="Foto del Titulo Universitario"
                  hint="Foto legible de tu titulo de abogado (JPG, PNG, max 5MB)"
                  icon={<FileText className="w-5 h-5" />}
                  value={form.titleDocument}
                  onChange={(url) => updateForm("titleDocument", url)}
                />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
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
