import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendMeetLinkToClient } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "lawyer") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lawyerId = (session.user as any).id;

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (appointment.lawyerId !== lawyerId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.paymentStatus !== "completed") {
      return NextResponse.json(
        { error: "No se puede confirmar una cita sin pago completado" },
        { status: 400 }
      );
    }

    if (appointment.status !== "confirmed") {
      return NextResponse.json(
        { error: "La cita no está en estado confirmado" },
        { status: 400 }
      );
    }

    let meetLink: string | null = null;
    let googleEventId: string | null = null;

    const accessToken = (session as any).accessToken;
    if (accessToken) {
      try {
        const startDate = new Date(appointment.dateTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

        const calendarResult = await createCalendarEvent({
          accessToken,
          summary: `Consulta Legal - ${appointment.client.name}`,
          description: `Consulta legal con ${appointment.client.name}.\n\nNotas: ${appointment.notes || "Sin notas adicionales"}`,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendees: [appointment.client.email, appointment.lawyer.email],
        });

        meetLink = calendarResult.meetLink || null;
        googleEventId = calendarResult.eventId || null;
      } catch (calError) {
        console.error("Error al crear evento en Calendar:", calError);
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        meetLink,
        googleEventId,
      },
    });

    if (meetLink) {
      await prisma.notification.create({
        data: {
          userId: appointment.clientId,
          userType: "client",
          type: "meet_link_ready",
          title: "Link de reunión disponible",
          message: `El link de Google Meet para tu consulta con ${appointment.lawyer.firstName} ${appointment.lawyer.lastName} ya está disponible.`,
          link: "/client/appointments",
        },
      });

      sendMeetLinkToClient(
        appointment.client.email,
        appointment.client.name,
        `${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`,
        meetLink
      ).catch((err) => console.error("Email send failed:", err?.message || err));
    }

    return NextResponse.json({
      appointment: updated,
      meetLink,
      message: meetLink
        ? "Evento creado en Google Calendar con link de Meet."
        : "No se pudo crear el evento en Calendar. Podés compartir el link de reunión manualmente.",
    });
  } catch (error) {
    console.error("Confirm appointment error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
