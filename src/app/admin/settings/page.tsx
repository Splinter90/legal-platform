"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, DollarSign, Percent, CreditCard, Lock, User } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    consultationFee: 0,
    commissionPercent: 0,
    cbuAlias: "",
    username: "",
  });
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
      .then(setSettings);
  }, []);

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

              <div className="p-4 bg-brand-50 rounded-xl">
                <p className="text-sm text-brand-700">
                  <strong>Resumen:</strong> Por cada consulta de{" "}
                  <strong>
                    $
                    {Number(settings.consultationFee).toLocaleString("es-AR")}
                  </strong>
                  , la plataforma retiene{" "}
                  <strong>
                    $
                    {(
                      settings.consultationFee *
                      (settings.commissionPercent / 100)
                    ).toLocaleString("es-AR")}
                  </strong>{" "}
                  y el abogado recibe{" "}
                  <strong>
                    $
                    {(
                      settings.consultationFee *
                      (1 - settings.commissionPercent / 100)
                    ).toLocaleString("es-AR")}
                  </strong>
                </p>
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
