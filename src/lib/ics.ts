function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIcsDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

export type IcsAppointment = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  title: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  organizerEmail?: string | null;
  organizerName?: string | null;
  attendeeEmail?: string | null;
  attendeeName?: string | null;
};

export function buildAppointmentIcs(appt: IcsAppointment): string {
  const host = process.env.NEXTAUTH_URL || "https://legalconnect.local";
  const domain = host.replace(/^https?:\/\//, "").replace(/[/].*$/, "");
  const uid = `${appt.id}@${domain || "legalconnect"}`;
  const now = toIcsDate(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LegalConnect//Appointments//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(appt.startsAt)}`,
    `DTEND:${toIcsDate(appt.endsAt)}`,
    `SUMMARY:${escapeText(appt.title)}`,
  ];

  if (appt.description) {
    lines.push(`DESCRIPTION:${escapeText(appt.description)}`);
  }
  if (appt.location) {
    lines.push(`LOCATION:${escapeText(appt.location)}`);
  }
  if (appt.url) {
    lines.push(`URL:${appt.url}`);
  }
  if (appt.organizerEmail) {
    const name = appt.organizerName ? `;CN=${escapeText(appt.organizerName)}` : "";
    lines.push(`ORGANIZER${name}:mailto:${appt.organizerEmail}`);
  }
  if (appt.attendeeEmail) {
    const name = appt.attendeeName ? `;CN=${escapeText(appt.attendeeName)}` : "";
    lines.push(
      `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE${name}:mailto:${appt.attendeeEmail}`
    );
  }

  lines.push(
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio: tu consulta legal empieza en 1 hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
