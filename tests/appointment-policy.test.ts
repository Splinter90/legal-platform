import { describe, it, expect } from "vitest";
import {
  CLIENT_CANCELLATION_CUTOFF_HOURS,
  canClientCancel,
  hoursUntil,
} from "@/lib/appointment-policy";

const NOW = new Date("2026-06-01T12:00:00Z");

function hoursFromNow(h: number): string {
  return new Date(NOW.getTime() + h * 60 * 60 * 1000).toISOString();
}

describe("hoursUntil", () => {
  it("calcula diferencia positiva", () => {
    expect(hoursUntil(hoursFromNow(5), NOW)).toBeCloseTo(5);
  });

  it("calcula diferencia negativa si ya paso", () => {
    expect(hoursUntil(hoursFromNow(-3), NOW)).toBeCloseTo(-3);
  });
});

describe("canClientCancel", () => {
  it("permite cancelar pending_payment siempre", () => {
    const result = canClientCancel(
      { status: "pending_payment", dateTime: hoursFromNow(2) },
      NOW
    );
    expect(result.ok).toBe(true);
  });

  it("permite cancelar confirmed con mas de 24h", () => {
    const result = canClientCancel(
      { status: "confirmed", dateTime: hoursFromNow(48) },
      NOW
    );
    expect(result.ok).toBe(true);
  });

  it(`permite cancelar confirmed exactamente a ${CLIENT_CANCELLATION_CUTOFF_HOURS}h`, () => {
    const result = canClientCancel(
      {
        status: "confirmed",
        dateTime: hoursFromNow(CLIENT_CANCELLATION_CUTOFF_HOURS),
      },
      NOW
    );
    expect(result.ok).toBe(true);
  });

  it("bloquea cancelar confirmed dentro de la ventana", () => {
    const result = canClientCancel(
      { status: "confirmed", dateTime: hoursFromNow(10) },
      NOW
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("24");
    }
  });

  it("bloquea cancelar cita ya cancelada", () => {
    const result = canClientCancel(
      { status: "cancelled", dateTime: hoursFromNow(48) },
      NOW
    );
    expect(result.ok).toBe(false);
  });

  it("bloquea cancelar cita completed", () => {
    const result = canClientCancel(
      { status: "completed", dateTime: hoursFromNow(-2) },
      NOW
    );
    expect(result.ok).toBe(false);
  });
});
