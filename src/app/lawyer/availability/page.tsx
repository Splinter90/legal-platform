"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { SkeletonList } from "@/components/ui/skeleton";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    fetch("/api/lawyers/availability")
      .then((r) => r.json())
      .then((data) => {
        if (data.availability) {
          setSlots(
            data.availability.map((a: any) => ({
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
            }))
          );
        }
        if (data.consultationDuration) setDuration(data.consultationDuration);
        if (data.googleCalendarConnected) setGoogleConnected(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addSlot(dayOfWeek: number) {
    setSlots([...slots, { dayOfWeek, startTime: "09:00", endTime: "17:00" }]);
    setSaved(false);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
    setSaved(false);
  }

  function updateSlot(index: number, field: "startTime" | "endTime", value: string) {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/lawyers/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots, consultationDuration: duration }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function slotsForDay(day: number) {
    return slots
      .map((s, i) => ({ ...s, originalIndex: i }))
      .filter((s) => s.dayOfWeek === day);
  }

  if (loading) {
    return (
<SkeletonList rows={4} />
    );
  }

  return (
    <div className="animate-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Disponibilidad</h1>
        <p className="text-slate-500 mt-1">
          Configura tus horarios de atencion para que los clientes puedan agendar citas
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {saved && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
          Disponibilidad guardada correctamente
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Duracion de cada consulta
              </label>
              <select
                value={duration}
                onChange={(e) => { setDuration(Number(e.target.value)); setSaved(false); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1 hora 30 min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            {googleConnected && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Calendar conectado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const daySlots = slotsForDay(day);
          return (
            <Card key={day}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{DAY_NAMES[day]}</h3>
                  <Button variant="ghost" size="sm" onClick={() => addSlot(day)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-slate-400">Sin horarios configurados</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.originalIndex} className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.originalIndex, "startTime", e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-slate-400">a</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.originalIndex, "endTime", e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          onClick={() => removeSlot(slot.originalIndex)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Disponibilidad"}
        </Button>
      </div>
    </div>
  );
}
