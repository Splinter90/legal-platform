import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAppointmentIcs } from "@/lib/ics";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id as string;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      lawyer: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          consultationDuration: true,
          address: true,
          city: true,
          province: true,
        },
      },
      client: { select: { email: true, name: true } },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (role === "client" && appointment.clientId !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (role === "lawyer" && appointment.lawyerId !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (role !== "client" && role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const durationMin = appointment.lawyer.consultationDuration || 60;
  const start = new Date(appointment.dateTime);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const lawyerFullName = `${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`.trim();
  const officeAddress = [appointment.lawyer.address, appointment.lawyer.city, appointment.lawyer.province]
    .filter(Boolean)
    .join(", ");

  const ics = buildAppointmentIcs({
    id: appointment.id,
    startsAt: start,
    endsAt: end,
    title: `Consulta legal con ${lawyerFullName}`,
    description:
      (appointment.notes ? `Notas: ${appointment.notes}\n\n` : "") +
      (appointment.meetLink
        ? `Google Meet: ${appointment.meetLink}\n`
        : "") +
      `Cliente: ${appointment.client.name}\nAbogado: ${lawyerFullName}`,
    location: appointment.meetLink || officeAddress || null,
    url: appointment.meetLink || null,
    organizerEmail: appointment.lawyer.email,
    organizerName: lawyerFullName,
    attendeeEmail: appointment.client.email,
    attendeeName: appointment.client.name,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="consulta-${appointment.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
