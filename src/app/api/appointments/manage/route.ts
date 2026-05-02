import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        client: { select: { id: true, name: true } },
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

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    const statusMessages: Record<string, string> = {
      completed: `Tu consulta con ${appointment.lawyer.firstName} ${appointment.lawyer.lastName} fue marcada como completada.`,
      cancelled: `Tu cita con ${appointment.lawyer.firstName} ${appointment.lawyer.lastName} fue cancelada.`,
    };

    if (statusMessages[status]) {
      await prisma.notification.create({
        data: {
          userId: appointment.client.id,
          userType: "client",
          type: `appointment_${status}`,
          title: status === "completed" ? "Consulta completada" : "Cita cancelada",
          message: statusMessages[status],
          link: "/client/appointments",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Manage appointment error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
