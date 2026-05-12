const MS_PER_MINUTE = 60 * 1000;

export type ConflictWindow = {
  earliest: Date;
  latest: Date;
};

export function computeConflictWindow(
  dateTime: Date | string,
  durationMinutes: number
): ConflictWindow {
  const target = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
  const duration = Math.max(1, durationMinutes) * MS_PER_MINUTE;
  return {
    earliest: new Date(target.getTime() - duration),
    latest: new Date(target.getTime() + duration),
  };
}

export function appointmentsOverlap(
  a: { dateTime: Date | string; durationMinutes: number },
  b: { dateTime: Date | string; durationMinutes: number }
): boolean {
  const aStart =
    typeof a.dateTime === "string"
      ? new Date(a.dateTime).getTime()
      : a.dateTime.getTime();
  const bStart =
    typeof b.dateTime === "string"
      ? new Date(b.dateTime).getTime()
      : b.dateTime.getTime();

  const aEnd = aStart + a.durationMinutes * MS_PER_MINUTE;
  const bEnd = bStart + b.durationMinutes * MS_PER_MINUTE;

  return aStart < bEnd && bStart < aEnd;
}
