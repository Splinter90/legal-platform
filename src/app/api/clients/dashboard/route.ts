import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clientId = (session.user as any).id;

  const [appointments, cases, unreadMessages] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId },
      include: {
        lawyer: {
          select: { id: true, firstName: true, lastName: true, profilePhoto: true },
        },
        caseTracking: true,
      },
      orderBy: { dateTime: "desc" },
      take: 10,
    }),
    prisma.caseTracking.findMany({
      where: { appointment: { clientId } },
      include: {
        appointment: {
          include: {
            lawyer: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.message.count({
      where: { clientId, senderType: "lawyer", read: false },
    }),
  ]);

  return NextResponse.json({
    appointments,
    cases,
    unreadMessages,
  });
}
