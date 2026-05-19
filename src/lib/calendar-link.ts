function formatGoogleDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export function buildGoogleCalendarLink(opts: {
  title: string;
  startISO: string;
  durationMinutes?: number;
  details?: string;
  location?: string;
}): string {
  const start = new Date(opts.startISO);
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 60) * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });
  if (opts.details) params.set("details", opts.details);
  if (opts.location) params.set("location", opts.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
