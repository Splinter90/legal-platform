import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateFutureDate } from "@/lib/validations";
import { sendAppointmentCreatedToLawyer } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { lawyerId, dateTime, notes } = await req.json();

    if (!lawyerId || !dateTime) {
      return NextResponse.json(
        { error: "Abogado y fecha/hora son obligatorios" },
        { status: 400 }
      );
    }

    const dateError = validateFutureDate(dateTime);
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 });
    }

    const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });
    if (!lawyer || lawyer.status !== "approved") {
      return NextResponse.json(
        { error: "Abogado no encontrado o no disponible" },
        { status: 404 }
      );
    }

    const appointmentDate = new Date(dateTime);
    const durationMs = (lawyer.consultationDuration || 60) * 60 * 1000;
    const earliestConflict = new Date(appointmentDate.getTime() - durationMs);
    const latestConflict = new Date(appointmentDate.getTime() + durationMs);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        lawyerId,
        status: { in: ["confirmed", "pending_payment"] },
        dateTime: {
          gt: earliestConflict,
          lt: latestConflict,
        },
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "El abogado ya tiene una cita en ese horario" },
        { status: 409 }
      );
    }

    const admin = await prisma.admin.findFirst();
    const consultationFee = admin?.consultationFee || 5000;
    const commissionPercent = admin?.commissionPercent || 10;
    const platformFee = Math.round(consultationFee * (commissionPercent / 100) * 100) / 100;
    const lawyerAmount = Math.round((consultationFee - platformFee) * 100) / 100;

    const clientId = (session.user as any).id;

    const appointment = await prisma.appointment.create({
      data: {
        lawyerId,
        clientId,
        dateTime: appointmentDate,
        amount: consultationFee,
        platformFee,
        lawyerAmount,
        notes: notes || null,
        status: "pending_payment",
        paymentStatus: "pending",
      },
      include: {
        lawyer: { select: { firstName: true, lastName: true } },
      },
    });

    const clientName = session.user?.name || "Un cliente";
    const formattedDate = appointmentDate.toLocaleDateString("es-AR");

    await prisma.notification.create({
      data: {
        userId: lawyerId,
        userType: "lawyer",
        type: "new_appointment",
        title: "Nueva solicitud de cita",
        message: `${clientName} quiere agendar una consulta para el ${formattedDate}. Pendiente de pago.`,
        link: "/lawyer/appointments",
      },
    });

    sendAppointmentCreatedToLawyer(
      lawyer.email,
      `${lawyer.firstName} ${lawyer.lastName}`,
      clientName,
      formattedDate
    ).catch((err) => console.error("Email send failed:", err?.message || err));

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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

    if (role !== "client" && role !== "lawyer") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const where = role === "client" ? { clientId: userId } : { lawyerId: userId };
    const include = role === "client"
      ? {
          lawyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          caseTracking: true,
        }
      : {
          client: { select: { id: true, name: true, email: true } },
          caseTracking: true,
        };

    const appointments = await prisma.appointment.findMany({
      where,
      include,
      orderBy: { dateTime: "desc" },
      take: 50,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
