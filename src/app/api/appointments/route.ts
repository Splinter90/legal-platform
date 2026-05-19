import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateFutureDate } from "@/lib/validations";
import { computeConflictWindow } from "@/lib/appointment-conflict";
import { sendAppointmentCreatedToLawyer } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clientIdRl = (session.user as any).id as string;
    const userLimit = rateLimit({
      key: `appointments:client:${clientIdRl}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!userLimit.ok) return rateLimitResponse(userLimit);

    const ipLimit = rateLimit({
      key: `appointments:ip:${getClientIp(req)}`,
      limit: 15,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.ok) return rateLimitResponse(ipLimit);

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

    const appointmentDate = new Date(dateTime);
    const clientId = (session.user as any).id;
    const clientName = session.user?.name || "Un cliente";

    const { appointment, lawyer } = await prisma.$transaction(
      async (tx) => {
        const lawyer = await tx.lawyer.findUnique({ where: { id: lawyerId } });
        if (!lawyer || lawyer.status !== "approved") {
          throw new Error("LAWYER_UNAVAILABLE");
        }

        const { earliest, latest } = computeConflictWindow(
          appointmentDate,
          lawyer.consultationDuration || 60
        );

        const overlapping = await tx.appointment.findFirst({
          where: {
            lawyerId,
            status: { in: ["confirmed", "pending_payment"] },
            dateTime: {
              gt: earliest,
              lt: latest,
            },
          },
        });

        if (overlapping) {
          throw new Error("APPOINTMENT_CONFLICT");
        }

        const admin = await tx.admin.findFirst();
        const consultationFee = admin?.consultationFee || 5000;
        const commissionPercent = admin?.commissionPercent || 10;
        const platformFee = Math.round(consultationFee * (commissionPercent / 100) * 100) / 100;
        const lawyerAmount = Math.round((consultationFee - platformFee) * 100) / 100;

        const appointment = await tx.appointment.create({
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

        const formattedDate = appointmentDate.toLocaleDateString("es-AR");

        await tx.notification.create({
          data: {
            userId: lawyerId,
            userType: "lawyer",
            type: "new_appointment",
            title: "Nueva solicitud de cita",
            message: `${clientName} quiere agendar una consulta para el ${formattedDate}. Pendiente de pago.`,
            link: "/lawyer/appointments",
          },
        });

        return { appointment, lawyer };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    const formattedDate = appointmentDate.toLocaleDateString("es-AR");

    sendAppointmentCreatedToLawyer(
      lawyer.email,
      `${lawyer.firstName} ${lawyer.lastName}`,
      clientName,
      formattedDate
    ).catch((err) => console.error("Email send failed:", err?.message || err));

    return NextResponse.json(appointment);
  } catch (error) {
    if (error instanceof Error && error.message === "LAWYER_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Abogado no encontrado o no disponible" },
        { status: 404 }
      );
    }

    if (
      (error instanceof Error && error.message === "APPOINTMENT_CONFLICT") ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
    ) {
      return NextResponse.json(
        { error: "El abogado ya tiene una cita en ese horario" },
        { status: 409 }
      );
    }

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

    const where =
      role === "client"
        ? { clientId: userId, archivedByClient: false }
        : { lawyerId: userId, archivedByLawyer: false };
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
