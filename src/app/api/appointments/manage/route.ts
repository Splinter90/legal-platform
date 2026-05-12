import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelAppointmentWithRefund } from "@/lib/appointments";
import { sendAppointmentRefundedToClient } from "@/lib/email";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "lawyer") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lawyerId = (session.user as any).id;
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        lawyer: { select: { firstName: true, lastName: true } },
      },
    });

    if (!appointment || appointment.lawyerId !== lawyerId) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const validTransitions: Record<string, string[]> = {
      pending_payment: ["cancelled"],
      confirmed: ["completed", "cancelled"],
    };

    const allowed = validTransitions[appointment.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `No se puede cambiar de "${appointment.status}" a "${status}"` },
        { status: 400 }
      );
    }

    const lawyerFullName = `${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`.trim();
    const dateStr = new Date(appointment.dateTime).toLocaleDateString("es-AR");

    if (status === "cancelled") {
      const result = await cancelAppointmentWithRefund(appointment.id);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.reason || "No se pudo cancelar" },
          { status: result.status || 400 }
        );
      }

      const refundMsg = result.refund.attempted
        ? result.refund.ok
          ? " Te reembolsamos el pago."
          : " El reembolso quedo pendiente, lo procesamos manualmente."
        : "";

      await prisma.notification.create({
        data: {
          userId: appointment.client.id,
          userType: "client",
          type: "appointment_cancelled",
          title: "Cita cancelada",
          message: `Tu cita con ${lawyerFullName} fue cancelada.${refundMsg}`,
          link: "/client/appointments",
          appointmentId: appointment.id,
        },
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
      }

      return NextResponse.json({
        ...result.appointment,
        refund: result.refund,
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    if (status === "completed") {
      await prisma.notification.create({
        data: {
          userId: appointment.client.id,
          userType: "client",
          type: "appointment_completed",
          title: "Consulta completada",
          message: `Tu consulta con ${lawyerFullName} fue marcada como completada.`,
          link: "/client/appointments",
          appointmentId: appointment.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Manage appointment error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
