import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;

  const availability = await prisma.availability.findMany({
    where: { lawyerId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const lawyer = await prisma.lawyer.findUnique({
    where: { id: lawyerId },
    select: { consultationDuration: true, googleRefreshToken: true },
  });

  return NextResponse.json({
    availability,
    consultationDuration: lawyer?.consultationDuration || 60,
    googleCalendarConnected: !!lawyer?.googleRefreshToken,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const { slots, consultationDuration } = await req.json();

  if (!Array.isArray(slots)) {
    return NextResponse.json({ error: "slots debe ser un array" }, { status: 400 });
  }

  const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

  for (const slot of slots) {
    if (typeof slot.dayOfWeek !== "number" || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      return NextResponse.json(
        { error: "dayOfWeek debe ser un número entre 0 (Domingo) y 6 (Sábado)" },
        { status: 400 }
      );
    }
    if (!TIME_REGEX.test(slot.startTime) || !TIME_REGEX.test(slot.endTime)) {
      return NextResponse.json(
        { error: "startTime y endTime deben estar en formato HH:MM" },
        { status: 400 }
      );
    }
    if (slot.startTime >= slot.endTime) {
      return NextResponse.json(
        { error: "startTime debe ser anterior a endTime" },
        { status: 400 }
      );
    }
  }

  if (consultationDuration !== undefined) {
    const dur = Number(consultationDuration);
    if (isNaN(dur) || dur < 15 || dur > 240) {
      return NextResponse.json(
        { error: "La duración de consulta debe ser entre 15 y 240 minutos" },
        { status: 400 }
      );
    }

    await prisma.lawyer.update({
      where: { id: lawyerId },
      data: { consultationDuration: dur },
    });
  }

  await prisma.availability.deleteMany({ where: { lawyerId } });

  if (slots.length > 0) {
    await prisma.availability.createMany({
      data: slots.map((slot: any) => ({
        lawyerId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
  }

  const updated = await prisma.availability.findMany({
    where: { lawyerId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(updated);
}
