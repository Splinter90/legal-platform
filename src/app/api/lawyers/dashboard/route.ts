import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deriveAccess } from "@/lib/lawyer-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;

  const [lawyer, appointments, crmClientsCount, reviews, unreadMessages, totalEarnings, earningsByClientRaw] =
    await Promise.all([
      prisma.lawyer.findUnique({
        where: { id: lawyerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePhoto: true,
          specialties: true,
          province: true,
          city: true,
          status: true,
          rejectionReason: true,
          rating: true,
          reviewCount: true,
          subscriptionStatus: true,
          subscriptionPaidUntil: true,
          googleRefreshToken: true,
        },
      }),
      prisma.appointment.findMany({
        where: { lawyerId },
        include: {
          client: { select: { id: true, name: true, email: true } },
          caseTracking: true,
        },
        orderBy: { dateTime: "desc" },
        take: 10,
      }),
      prisma.crmClient.count({ where: { lawyerId } }),
      prisma.review.findMany({
        where: { lawyerId },
        include: { client: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.message.count({
        where: { lawyerId, senderType: "client", read: false },
      }),
      prisma.appointment.aggregate({
        where: { lawyerId, paymentStatus: "completed" },
        _sum: { lawyerAmount: true },
      }),
      prisma.appointment.groupBy({
        by: ["clientId"],
        where: { lawyerId, paymentStatus: "completed" },
        _sum: { lawyerAmount: true },
        _count: { _all: true },
      }),
    ]);

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const access = deriveAccess(lawyer);

  const clientIds = earningsByClientRaw.map((g) => g.clientId);
  const clientsInfo = clientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const clientById = new Map(clientsInfo.map((c) => [c.id, c]));

  const earningsByClient = earningsByClientRaw
    .map((g) => ({
      clientId: g.clientId,
      clientName: clientById.get(g.clientId)?.name || "Cliente",
      clientEmail: clientById.get(g.clientId)?.email || null,
      total: g._sum.lawyerAmount || 0,
      appointments: g._count._all,
    }))
    .sort((a, b) => b.total - a.total);

  const { googleRefreshToken, ...lawyerSafe } = lawyer;

  return NextResponse.json({
    lawyer: {
      ...lawyerSafe,
      googleCalendarConnected: Boolean(googleRefreshToken),
    },
    access,
    appointments,
    crmClientsCount,
    reviews,
    unreadMessages,
    totalEarnings: totalEarnings._sum.lawyerAmount || 0,
    earningsByClient,
  });
}
