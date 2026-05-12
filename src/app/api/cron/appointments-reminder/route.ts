import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAppointmentReminderToClient,
  sendAppointmentReminderToLawyer,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const WINDOW_HOURS = 27;
const MS_PER_HOUR = 60 * 60 * 1000;
const NOTIFICATION_TYPE = "appointment_reminder_24h";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function formatDate(date: Date): string {
  return date.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const until = new Date(now.getTime() + WINDOW_HOURS * MS_PER_HOUR);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "confirmed",
      dateTime: { gte: now, lte: until },
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      lawyer: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (appointments.length === 0) {
    return NextResponse.json({ ok: true, reminded: 0, ranAt: now.toISOString() });
  }

  const appointmentIds = appointments.map((a) => a.id);

  const alreadySent = await prisma.notification.findMany({
    where: {
      type: NOTIFICATION_TYPE,
      appointmentId: { in: appointmentIds },
    },
    select: { appointmentId: true, userType: true },
  });
  const sentKey = new Set(
    alreadySent.map((n) => `${n.appointmentId}|${n.userType}`)
  );

  const notificationsToCreate: {
    userId: string;
    userType: string;
    type: string;
    title: string;
    message: string;
    link: string;
    appointmentId: string;
  }[] = [];

  const emailJobs: Promise<unknown>[] = [];
  let remindedCount = 0;

  for (const apt of appointments) {
    const dateStr = formatDate(apt.dateTime);
    const lawyerFullName = `${apt.lawyer.firstName} ${apt.lawyer.lastName}`.trim();

    if (!sentKey.has(`${apt.id}|client`)) {
      notificationsToCreate.push({
        userId: apt.client.id,
        userType: "client",
        type: NOTIFICATION_TYPE,
        title: "Recordatorio: tu consulta es manana",
        message: `Consulta con ${lawyerFullName} el ${dateStr}.`,
        link: "/client/appointments",
        appointmentId: apt.id,
      });
      emailJobs.push(
        sendAppointmentReminderToClient(
          apt.client.email,
          apt.client.name,
          lawyerFullName,
          dateStr,
          apt.meetLink
        )
      );
      remindedCount++;
    }

    if (!sentKey.has(`${apt.id}|lawyer`)) {
      notificationsToCreate.push({
        userId: apt.lawyer.id,
        userType: "lawyer",
        type: NOTIFICATION_TYPE,
        title: "Recordatorio: consulta manana",
        message: `Consulta con ${apt.client.name} el ${dateStr}.`,
        link: "/lawyer/appointments",
        appointmentId: apt.id,
      });
      emailJobs.push(
        sendAppointmentReminderToLawyer(
          apt.lawyer.email,
          apt.lawyer.firstName,
          apt.client.name,
          dateStr,
          apt.meetLink
        )
      );
      remindedCount++;
    }
  }

  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({ data: notificationsToCreate });
  }
  if (emailJobs.length > 0) {
    await Promise.allSettled(emailJobs);
  }

  return NextResponse.json({
    ok: true,
    appointments: appointments.length,
    reminded: remindedCount,
    ranAt: now.toISOString(),
  });
}
