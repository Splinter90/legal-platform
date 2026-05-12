export const CLIENT_CANCELLATION_CUTOFF_HOURS = 24;

const MS_PER_HOUR = 60 * 60 * 1000;

export function hoursUntil(dateTime: Date | string, now: Date = new Date()): number {
  const target = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  return (target.getTime() - now.getTime()) / MS_PER_HOUR;
}

export function canClientCancel(
  appointment: { status: string; dateTime: Date | string },
  now: Date = new Date()
): { ok: true } | { ok: false; reason: string } {
  if (appointment.status === "pending_payment") return { ok: true };

  if (appointment.status !== "confirmed") {
    return {
      ok: false,
      reason: `No se puede cancelar una cita en estado "${appointment.status}"`,
    };
  }

  const hours = hoursUntil(appointment.dateTime, now);
  if (hours < CLIENT_CANCELLATION_CUTOFF_HOURS) {
    return {
      ok: false,
      reason: `Las cancelaciones se permiten hasta ${CLIENT_CANCELLATION_CUTOFF_HOURS}h antes de la consulta.`,
    };
  }

  return { ok: true };
}
