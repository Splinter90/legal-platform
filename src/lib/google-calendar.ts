import { google } from "googleapis";
import { prisma } from "./prisma";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
}

export async function getLawyerAccessToken(lawyerId: string): Promise<string | null> {
  const lawyer = await prisma.lawyer.findUnique({
    where: { id: lawyerId },
    select: { googleRefreshToken: true },
  });

  if (!lawyer?.googleRefreshToken) {
    console.warn(`[google-calendar] Lawyer ${lawyerId} sin googleRefreshToken`);
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: lawyer.googleRefreshToken,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `[google-calendar] Refresh token falló para lawyer ${lawyerId}: ${response.status} ${body}`
      );
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.error(`[google-calendar] Excepción refrescando token para lawyer ${lawyerId}:`, err);
    return null;
  }
}

export async function createCalendarEvent({
  accessToken,
  summary,
  description,
  startDateTime,
  endDateTime,
  attendees,
}: {
  accessToken: string;
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendees: string[];
}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `legal-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  return {
    eventId: event.data.id,
    meetLink: event.data.hangoutLink || event.data.conferenceData?.entryPoints?.[0]?.uri,
    htmlLink: event.data.htmlLink,
  };
}

export async function getFreeBusy({
  accessToken,
  calendarId,
  timeMin,
  timeMax,
}: {
  accessToken: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
}): Promise<Array<{ start: string; end: string }>> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: "America/Argentina/Buenos_Aires",
      items: [{ id: calendarId }],
    },
  });

  const busy = result.data.calendars?.[calendarId]?.busy || [];
  return busy.map((b) => ({
    start: b.start || "",
    end: b.end || "",
  }));
}
