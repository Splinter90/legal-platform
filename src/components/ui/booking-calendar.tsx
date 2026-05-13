"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";

interface Slot {
  date: string;
  startTime: string;
  endTime: string;
  dateTime: string;
  available: boolean;
}

interface BookingCalendarProps {
  lawyerId: string;
  onSelect: (selection: { date: string; startTime: string; dateTime: string }) => void;
  selectedDate?: string;
  selectedTime?: string;
}

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookingCalendar({
  lawyerId,
  onSelect,
  selectedDate: initialSelectedDate,
  selectedTime,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate || "");

  useEffect(() => {
    setLoading(true);
    setMessage("");
    fetch(`/api/lawyers/${lawyerId}/slots?days=30`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) setMessage(data.message);
        setAllSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => setMessage("No se pudo cargar la disponibilidad"))
      .finally(() => setLoading(false));
  }, [lawyerId]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of allSlots) {
      if (!s.available) continue;
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    }
    return map;
  }, [allSlots]);

  const gridDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const firstDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(viewYear, viewMonth, d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [viewMonth, viewYear]);

  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const canGoPrev = viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth);

  const daySlots = selectedDate ? slotsByDate.get(selectedDate) || [] : [];

  function selectDate(date: Date) {
    const key = ymd(date);
    setSelectedDate(key);
  }

  function pickTime(slot: Slot) {
    onSelect({ date: slot.date, startTime: slot.startTime, dateTime: slot.dateTime });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!canGoPrev) return;
            if (viewMonth === 0) {
              setViewMonth(11);
              setViewYear((y) => y - 1);
            } else {
              setViewMonth((m) => m - 1);
            }
          }}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900">
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 11) {
              setViewMonth(0);
              setViewYear((y) => y + 1);
            } else {
              setViewMonth((m) => m + 1);
            }
          }}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : message ? (
        <p className="text-sm text-amber-600 text-center py-6 bg-amber-50 rounded-xl">{message}</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 pb-1"
              >
                {d}
              </div>
            ))}
            {gridDays.map((cell, i) => {
              if (!cell.date) return <div key={i} />;
              const key = ymd(cell.date);
              const isPast =
                cell.date.getTime() < today.getTime();
              const slots = slotsByDate.get(key) || [];
              const hasSlots = slots.length > 0;
              const isSelected = selectedDate === key;
              const isToday = key === ymd(today);

              const base =
                "aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all";
              const disabled = isPast || !hasSlots;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(cell.date!)}
                  className={`${base} ${
                    isSelected
                      ? "bg-brand-600 text-white shadow-md"
                      : hasSlots
                      ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                      : "bg-slate-50 text-slate-400 cursor-not-allowed"
                  } ${isToday && !isSelected ? "ring-2 ring-brand-400" : ""}`}
                >
                  <span className="font-semibold">{cell.date.getDate()}</span>
                  {hasSlots && !isSelected && (
                    <span className="text-[10px] mt-0.5 opacity-80">{slots.length} hs</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-md bg-emerald-50 border border-emerald-200" />
              Con disponibilidad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-md bg-slate-50 border border-slate-200" />
              Sin disponibilidad
            </span>
          </div>

          {selectedDate && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Horarios disponibles —{" "}
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {daySlots.length === 0 ? (
                <p className="text-sm text-slate-400">No hay horarios disponibles este día.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {daySlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => pickTime(slot)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedTime === slot.startTime
                          ? "bg-brand-600 text-white shadow-md"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
