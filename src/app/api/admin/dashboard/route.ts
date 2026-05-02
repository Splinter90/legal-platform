import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [
    totalLawyers,
    pendingLawyers,
    approvedLawyers,
    suspendedLawyers,
    totalClients,
    totalAppointments,
    completedAppointments,
    admin,
    consultationRevenue,
    subscriptionRevenue,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.lawyer.count(),
    prisma.lawyer.count({ where: { status: "pending" } }),
    prisma.lawyer.count({ where: { status: "approved" } }),
    prisma.lawyer.count({ where: { status: "suspended" } }),
    prisma.client.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "completed" } }),
    prisma.admin.findFirst(),
    prisma.payment.aggregate({
      where: { type: "consultation", status: "completed" },
      _sum: { platformFee: true, amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { type: "subscription", status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.lawyer.count({
      where: {
        subscriptionStatus: "active",
        subscriptionPaidUntil: { gt: new Date() },
      },
    }),
  ]);

  return NextResponse.json({
    totalLawyers,
    pendingLawyers,
    approvedLawyers,
    suspendedLawyers,
    totalClients,
    totalAppointments,
    completedAppointments,
    activeSubscriptions,
    totalConsultationRevenue: consultationRevenue._sum.platformFee || 0,
    totalConsultationAmount: consultationRevenue._sum.amount || 0,
    totalConsultations: consultationRevenue._count,
    totalSubscriptionRevenue: subscriptionRevenue._sum.amount || 0,
    totalSubscriptions: subscriptionRevenue._count,
    consultationFee: admin?.consultationFee || 0,
    subscriptionFee: admin?.subscriptionFee || 0,
    commissionPercent: admin?.commissionPercent || 0,
  });
}
