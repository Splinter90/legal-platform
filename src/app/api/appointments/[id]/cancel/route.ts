import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelAppointmentWithRefund } from "@/lib/appointments";
import { canClientCancel } from "@/lib/appointment-policy";
import {
  sendAppointmentRefundedToClient,
  sendAppointmentCancelledByClientToLawyer,
} from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientId = (session.user as any).id;

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, email: true } },
        lawyer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!appointment || appointment.clientId !== clientId) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const policy = canClientCancel(appointment);
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason }, { status: 400 });
    }

    const result = await cancelAppointmentWithRefund(appointment.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason || "No se pudo cancelar" },
        { status: result.status || 400 }
      );
    }

    const lawyerFullName = `${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`.trim();
    const dateStr = new Date(appointment.dateTime).toLocaleDateString("es-AR");

    const refundMsg = result.refund.attempted
      ? result.refund.ok
        ? " Te reembolsamos el pago."
        : " El reembolso quedo pendiente, lo procesamos manualmente."
      : "";

    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.clientId,
          userType: "client",
          type: "appointment_cancelled",
          title: "Cancelaste tu cita",
          message: `Cancelaste la consulta con ${lawyerFullName}.${refundMsg}`,
          link: "/client/appointments",
          appointmentId: appointment.id,
        },
        {
          userId: appointment.lawyerId,
          userType: "lawyer",
          type: "appointment_cancelled_by_client",
          title: "Cita cancelada por el cliente",
          message: `${appointment.client.name} cancelo la consulta del ${dateStr}.`,
          link: "/lawyer/appointments",
          appointmentId: appointment.id,
        },
      ],
    });

    if (result.refund.attempted) {
      sendAppointmentRefundedToClient(
        appointment.client.email,
        appointment.client.name,
        lawyerFullName,
        dateStr,
        result.refund.amount || appointment.amount,
        result.refund.ok
      ).catch((err) => console.error("refund email failed:", err));

      sendAppointmentCancelledByClientToLawyer(
        appointment.lawyer.email,
        appointment.lawyer.firstName,
        appointment.client.name,
        dateStr,
        result.refund.amount || appointment.amount,
        result.refund.ok
      ).catch((err) => console.error("lawyer cancel email failed:", err));
    }

    return NextResponse.json({
      ...result.appointment,
      refund: result.refund,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
