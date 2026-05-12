import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [payments, consultationStats, subscriptionStats, totalPayments, lawyers] =
    await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
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
      prisma.lawyer.findMany({
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);

  const lawyerIds = Array.from(
    new Set(payments.map((p) => p.lawyerId).filter((id): id is string => !!id))
  );
  const clientIds = Array.from(
    new Set(payments.map((p) => p.clientId).filter((id): id is string => !!id))
  );

  const [lawyersById, clientsById] = await Promise.all([
    prisma.lawyer.findMany({
      where: { id: { in: lawyerIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const lawyerMap = new Map(lawyersById.map((l) => [l.id, l]));
  const clientMap = new Map(clientsById.map((c) => [c.id, c]));

  const enriched = payments.map((p) => {
    const lawyer = p.lawyerId ? lawyerMap.get(p.lawyerId) : null;
    const client = p.clientId ? clientMap.get(p.clientId) : null;
    const senderName =
      p.type === "subscription"
        ? lawyer
          ? `${lawyer.firstName} ${lawyer.lastName}`
          : "—"
        : client
        ? client.name
        : "—";
    return {
      id: p.id,
      appointmentId: p.appointmentId,
      lawyerId: p.lawyerId,
      lawyerName: lawyer ? `${lawyer.firstName} ${lawyer.lastName}` : null,
      clientId: p.clientId,
      clientName: client?.name || null,
      senderName,
      type: p.type,
      amount: p.amount,
      platformFee: p.platformFee,
      status: p.status,
      mpPaymentId: p.mpPaymentId,
      createdAt: p.createdAt,
    };
  });

  return NextResponse.json({
    payments: enriched,
    lawyers: lawyers.map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`,
    })),
    stats: {
      totalRevenue:
        (consultationStats._sum.platformFee || 0) +
        (subscriptionStats._sum.amount || 0),
      consultationRevenue: consultationStats._sum.platformFee || 0,
      subscriptionRevenue: subscriptionStats._sum.amount || 0,
      totalConsultations: consultationStats._count,
      totalSubscriptions: subscriptionStats._count,
      totalPayments,
    },
  });
}
