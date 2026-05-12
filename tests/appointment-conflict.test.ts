import { describe, it, expect } from "vitest";
import {
  computeConflictWindow,
  appointmentsOverlap,
} from "@/lib/appointment-conflict";

describe("computeConflictWindow", () => {
  it("crea ventana simetrica al rededor del horario", () => {
    const target = new Date("2026-06-01T15:00:00Z");
    const { earliest, latest } = computeConflictWindow(target, 60);
    expect(earliest.toISOString()).toBe("2026-06-01T14:00:00.000Z");
    expect(latest.toISOString()).toBe("2026-06-01T16:00:00.000Z");
  });

  it("acepta dateTime como string ISO", () => {
    const { earliest, latest } = computeConflictWindow("2026-06-01T15:00:00Z", 30);
    expect(earliest.toISOString()).toBe("2026-06-01T14:30:00.000Z");
    expect(latest.toISOString()).toBe("2026-06-01T15:30:00.000Z");
  });

  it("usa duracion minima de 1 minuto si se pasa cero o negativo", () => {
    const target = new Date("2026-06-01T15:00:00Z");
    const { earliest, latest } = computeConflictWindow(target, 0);
    expect(latest.getTime() - earliest.getTime()).toBe(2 * 60 * 1000);
  });
});

describe("appointmentsOverlap", () => {
  it("detecta solapamiento exacto", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 },
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 }
      )
    ).toBe(true);
  });

  it("detecta solapamiento parcial al final", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 },
        { dateTime: "2026-06-01T15:30:00Z", durationMinutes: 60 }
      )
    ).toBe(true);
  });

  it("detecta solapamiento parcial al inicio", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 },
        { dateTime: "2026-06-01T14:30:00Z", durationMinutes: 60 }
      )
    ).toBe(true);
  });

  it("no marca solapamiento cuando son adyacentes exactos (back-to-back)", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 },
        { dateTime: "2026-06-01T16:00:00Z", durationMinutes: 60 }
      )
    ).toBe(false);
  });

  it("no marca solapamiento cuando hay separacion", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 60 },
        { dateTime: "2026-06-01T17:00:00Z", durationMinutes: 60 }
      )
    ).toBe(false);
  });

  it("detecta solapamiento si una cita esta totalmente contenida en la otra", () => {
    expect(
      appointmentsOverlap(
        { dateTime: "2026-06-01T15:00:00Z", durationMinutes: 120 },
        { dateTime: "2026-06-01T15:30:00Z", durationMinutes: 30 }
      )
    ).toBe(true);
  });
});
