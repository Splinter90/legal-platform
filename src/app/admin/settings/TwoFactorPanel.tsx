"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react";

type Status = "loading" | "disabled" | "setup" | "enabled" | "disabling";

interface SetupData {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

export function TwoFactorPanel() {
  const [status, setStatus] = useState<Status>("loading");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/admin/2fa/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al consultar 2FA");
      setStatus(data.enabled ? "enabled" : "disabled");
    } catch (e: any) {
      setError(e.message);
      setStatus("disabled");
    }
  }

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar setup");
      setSetupData(data);
      setStatus("setup");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    if (code.length !== 6) {
      setError("El codigo debe tener 6 digitos");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Codigo invalido");
      setSetupData(null);
      setCode("");
      setStatus("enabled");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (!password || code.length !== 6) {
      setError("Ingresa tu contrasena y el codigo de 6 digitos");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo desactivar");
      setPassword("");
      setCode("");
      setStatus("disabled");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  function cancelSetup() {
    setSetupData(null);
    setCode("");
    setError(null);
    setStatus("disabled");
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {status === "enabled" ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          )}
          Autenticacion en dos pasos (2FA)
        </h2>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <p className="text-sm text-slate-500">Cargando estado...</p>
        )}

        {status === "disabled" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Agrega una capa extra de seguridad usando una app autenticadora
              (Google Authenticator, Authy, 1Password, etc).
            </p>
            <Button onClick={startSetup} disabled={busy}>
              {busy ? "Generando..." : "Activar 2FA"}
            </Button>
          </div>
        )}

        {status === "setup" && setupData && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">
                1. Escanea este codigo QR con tu app autenticadora:
              </p>
              <div className="flex justify-center bg-white p-4 rounded-lg border border-slate-200 w-fit">
                <Image
                  src={setupData.qrDataUrl}
                  alt="Codigo QR 2FA"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">
                O ingresa el codigo manualmente:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm font-mono break-all">
                  {setupData.secret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  pill={false}
                >
                  {secretCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <Input
                label="2. Ingresa el codigo de 6 digitos de tu app"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
              <div className="flex gap-2">
                <Button onClick={confirmEnable} disabled={busy || code.length !== 6}>
                  {busy ? "Verificando..." : "Confirmar y activar"}
                </Button>
                <Button variant="ghost" onClick={cancelSetup} disabled={busy}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "enabled" && (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              2FA activo. Cada vez que inicies sesion necesitaras tu codigo de
              6 digitos.
            </p>
            <Button variant="danger" onClick={() => setStatus("disabling")}>
              Desactivar 2FA
            </Button>
          </div>
        )}

        {status === "disabling" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Para desactivar el 2FA confirma tu contrasena y un codigo actual.
            </p>
            <Input
              label="Contrasena actual"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Codigo de 6 digitos"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
            <div className="flex gap-2">
              <Button variant="danger" onClick={confirmDisable} disabled={busy}>
                {busy ? "Procesando..." : "Confirmar desactivacion"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus("enabled");
                  setPassword("");
                  setCode("");
                  setError(null);
                }}
                disabled={busy}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
