"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, DollarSign, CreditCard, Lock, User, ExternalLink, Calculator } from "lucide-react";
import { TwoFactorPanel } from "./TwoFactorPanel";
import {
  MP_SCHEME_DEFAULTS,
  MP_OFFICIAL_FEES_URL,
  calculateMPBreakdown,
  type MPAccreditationScheme,
} from "@/lib/mp-fees";

const SCHEME_OPTIONS: { value: MPAccreditationScheme; label: string }[] = [
  { value: "immediate", label: "Acreditación inmediata (~6,29% + $4)" },
  { value: "14days", label: "Acreditación a 14 días (~3,99%)" },
  { value: "28days", label: "Acreditación a 28 días (~2,99%)" },
  { value: "custom", label: "Personalizado" },
];

function formatARS(value: number) {
  return `$${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-red-600"
      : "text-slate-900";
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`${bold ? "font-semibold" : "font-medium"} ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    consultationFee: 0,
    commissionPercent: 0,
    mpAccreditationScheme: "immediate" as MPAccreditationScheme,
    mpFeePercent: 6.29,
    mpFixedFee: 4,
    mpIvaPercent: 21,
    cbuAlias: "",
    username: "",
  });
  const [simulatorAmount, setSimulatorAmount] = useState(0);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setSimulatorAmount(Number(data.consultationFee) || 0);
      });
  }, []);

  function applyScheme(scheme: MPAccreditationScheme) {
    if (scheme === "custom") {
      setSettings((s) => ({ ...s, mpAccreditationScheme: scheme }));
      return;
    }
    const defaults = MP_SCHEME_DEFAULTS[scheme];
    setSettings((s) => ({
      ...s,
      mpAccreditationScheme: scheme,
      mpFeePercent: defaults.feePercent,
      mpFixedFee: defaults.fixedFee,
    }));
  }

  const breakdown = useMemo(
    () =>
      calculateMPBreakdown(
        Number(simulatorAmount) || 0,
        Number(settings.commissionPercent) || 0,
        {
          scheme: settings.mpAccreditationScheme,
          feePercent: Number(settings.mpFeePercent) || 0,
          fixedFee: Number(settings.mpFixedFee) || 0,
          ivaPercent: Number(settings.mpIvaPercent) || 0,
        }
      ),
    [
      simulatorAmount,
      settings.commissionPercent,
      settings.mpAccreditationScheme,
      settings.mpFeePercent,
      settings.mpFixedFee,
      settings.mpIvaPercent,
    ]
  );

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultationFee: Number(settings.consultationFee),
        commissionPercent: Number(settings.commissionPercent),
        mpAccreditationScheme: settings.mpAccreditationScheme,
        mpFeePercent: Number(settings.mpFeePercent),
        mpFixedFee: Number(settings.mpFixedFee),
        mpIvaPercent: Number(settings.mpIvaPercent),
        cbuAlias: settings.cbuAlias,
        username: settings.username,
      }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passwords.currentPassword) {
      setError("Debes ingresar la contrasena actual");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }
    if (passwords.newPassword.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al cambiar contrasena");
      return;
    }
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Configuracion</h1>
        <p className="text-slate-500 mt-1">
          Gestiona tarifas, comisiones y datos de la plataforma
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Tarifas */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Tarifas y Comisiones
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monto de Consulta (ARS)"
                  type="number"
                  value={settings.consultationFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      consultationFee: Number(e.target.value),
                    })
                  }
                />
                <Input
                  label="Comision Plataforma (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.commissionPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      commissionPercent: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="p-4 bg-brand-50 rounded-xl text-sm text-brand-800">
                Esto es el monto bruto y tu comisión. Lo que descuenta Mercado
                Pago se configura abajo y se ve reflejado en el desglose.
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Tarifas"}
              </Button>
              {saved && (
                <span className="text-sm text-emerald-600 ml-3">
                  Guardado correctamente
                </span>
              )}
            </form>
          </CardContent>
        </Card>

        {/* MP fees */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              Comisión Mercado Pago
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Las tarifas de MP cambian sin aviso. Editalas a mano cuando lo
              hagan y verificá los valores oficiales acá:{" "}
              <a
                href={MP_OFFICIAL_FEES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 font-medium hover:underline"
              >
                mercadopago.com.ar/costs-section
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Esquema de acreditación
                </label>
                <select
                  value={settings.mpAccreditationScheme}
                  onChange={(e) => applyScheme(e.target.value as MPAccreditationScheme)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {SCHEME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Al cambiar el esquema se autocargan los valores tipicos. Podés
                  ajustarlos manualmente abajo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Tasa MP (%)"
                  type="number"
                  step="0.01"
                  min={0}
                  max={50}
                  value={settings.mpFeePercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mpFeePercent: Number(e.target.value),
                      mpAccreditationScheme: "custom",
                    })
                  }
                />
                <Input
                  label="Costo fijo MP ($)"
                  type="number"
                  step="0.01"
                  min={0}
                  value={settings.mpFixedFee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mpFixedFee: Number(e.target.value),
                      mpAccreditationScheme: "custom",
                    })
                  }
                />
                <Input
                  label="IVA sobre comisión (%)"
                  type="number"
                  step="0.01"
                  min={0}
                  max={50}
                  value={settings.mpIvaPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mpIvaPercent: Number(e.target.value),
                    })
                  }
                />
              </div>

              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Guardando..." : "Guardar tarifas MP"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Simulator */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Desglose por consulta
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Simulá cuánto descuenta MP, cuánto retiene la plataforma y cuánto
              recibe el abogado para cualquier monto.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Monto a simular (ARS)"
                type="number"
                min={0}
                value={simulatorAmount}
                onChange={(e) => setSimulatorAmount(Number(e.target.value))}
              />

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 divide-y divide-slate-100">
                <Row label="Cliente paga (bruto)" value={formatARS(breakdown.gross)} bold />
                <Row
                  label={`MP descuenta (${settings.mpFeePercent}% + $${settings.mpFixedFee} + IVA ${settings.mpIvaPercent}%)`}
                  value={`− ${formatARS(breakdown.mpTotalFee)}`}
                  tone="negative"
                />
                <Row
                  label="Llega al marketplace"
                  value={formatARS(breakdown.marketplaceReceives)}
                />
                <Row
                  label={`Comisión plataforma (${settings.commissionPercent}% del bruto)`}
                  value={`− ${formatARS(breakdown.platformCommission)}`}
                  tone="negative"
                />
                <Row
                  label="Recibe el abogado"
                  value={formatARS(breakdown.lawyerReceives)}
                  bold
                  tone="positive"
                />
              </div>

              <p className="text-xs text-slate-500">
                Cálculo simplificado. La comisión real de MP puede variar según
                medio de pago, tipo de tarjeta o promociones activas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CBU/Alias */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              Datos de Cobro
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <Input
                label="CBU / Alias para recibir pagos"
                value={settings.cbuAlias}
                onChange={(e) =>
                  setSettings({ ...settings, cbuAlias: e.target.value })
                }
                placeholder="Ingresa tu alias o CBU"
              />
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </form>
          </CardContent>
        </Card>

        <TwoFactorPanel />

        {/* Credenciales */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Credenciales de Acceso
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <form onSubmit={saveSettings}>
                <Input
                  label="Nombre de Usuario"
                  value={settings.username}
                  onChange={(e) =>
                    setSettings({ ...settings, username: e.target.value })
                  }
                />
                <Button type="submit" className="mt-3" disabled={loading}>
                  <User className="w-4 h-4 mr-2" />
                  Cambiar Usuario
                </Button>
              </form>

              <hr className="border-slate-100" />

              <form onSubmit={changePassword} className="space-y-3">
                <Input
                  label="Contrasena Actual"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="Nueva Contrasena"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                />
                <Input
                  label="Confirmar Contrasena"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <Button type="submit">
                  <Lock className="w-4 h-4 mr-2" />
                  Cambiar Contrasena
                </Button>
                {passwordSaved && (
                  <span className="text-sm text-emerald-600 ml-3">
                    Contrasena actualizada
                  </span>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
