import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentPreference } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId es obligatorio" }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        lawyer: { select: { firstName: true, lastName: true, email: true } },
        client: { select: { name: true, email: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    if (appointment.clientId !== (session.user as any).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (appointment.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Esta cita ya fue pagada o no está en estado de pago pendiente" },
        { status: 400 }
      );
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { appointmentId, status: "completed" },
    });
    if (existingPayment) {
      return NextResponse.json(
        { error: "Esta cita ya tiene un pago completado" },
        { status: 400 }
      );
    }

    const result = await createPaymentPreference({
      title: `Consulta Legal - ${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`,
      description: `Consulta legal con ${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`,
      amount: appointment.amount,
      externalReference: `appointment:${appointment.id}`,
      payerEmail: appointment.client.email,
    });

    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        lawyerId: appointment.lawyerId,
        clientId: appointment.clientId,
        type: "consultation",
        amount: appointment.amount,
        platformFee: appointment.platformFee,
        lawyerAmount: appointment.lawyerAmount,
        status: "pending",
        mpPreferenceId: result.preferenceId,
      },
    });

    return NextResponse.json({
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let where: any = {};
    if (role === "client") where.clientId = userId;
    else if (role === "lawyer") where.lawyerId = userId;
    else if (role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
