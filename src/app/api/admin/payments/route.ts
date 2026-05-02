import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [payments, stats] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    Promise.all([
      prisma.payment.aggregate({
        where: { type: "consultation", status: "completed" },
        _sum: { platformFee: true },
        _count: true,
      }),
      prisma.payment.aggregate({
        where: { type: "subscription", status: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.payment.count(),
    ]),
  ]);

  const [consultationStats, subscriptionStats, totalPayments] = stats;

  return NextResponse.json({
    payments,
    stats: {
      totalRevenue: (consultationStats._sum.platformFee || 0) + (subscriptionStats._sum.amount || 0),
      consultationRevenue: consultationStats._sum.platformFee || 0,
      subscriptionRevenue: subscriptionStats._sum.amount || 0,
      totalConsultations: consultationStats._count,
      totalSubscriptions: subscriptionStats._count,
      totalPayments,
    },
  });
}
