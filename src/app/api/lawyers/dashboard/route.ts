import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;

  const [lawyer, appointments, crmClientsCount, reviews, unreadMessages, totalEarnings] =
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
          rating: true,
          reviewCount: true,
          subscriptionStatus: true,
          subscriptionPaidUntil: true,
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
    ]);

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    lawyer,
    appointments,
    crmClientsCount,
    reviews,
    unreadMessages,
    totalEarnings: totalEarnings._sum.lawyerAmount || 0,
  });
}
