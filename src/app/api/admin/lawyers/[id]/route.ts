import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyer = await prisma.lawyer.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      profilePhoto: true,
      matricula: true,
      titleDocument: true,
      narrative: true,
      experience: true,
      specialties: true,
      province: true,
      city: true,
      address: true,
      latitude: true,
      longitude: true,
      cbuAlias: true,
      rating: true,
      reviewCount: true,
      status: true,
      subscriptionStatus: true,
      subscriptionPaidUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const [appointments, crmClients, payments, reviews] = await Promise.all([
    prisma.appointment.findMany({
      where: { lawyerId: params.id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        caseTracking: true,
      },
      orderBy: { dateTime: "desc" },
      take: 50,
    }),
    prisma.crmClient.findMany({
      where: { lawyerId: params.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { lawyerId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.findMany({
      where: { lawyerId: params.id },
      include: { client: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const earnings = await prisma.payment.aggregate({
    where: { lawyerId: params.id, type: "consultation", status: "completed" },
    _sum: { lawyerAmount: true, platformFee: true, amount: true },
    _count: true,
  });

  const subscriptionPayments = await prisma.payment.aggregate({
    where: { lawyerId: params.id, type: "subscription", status: "completed" },
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({
    lawyer,
    appointments,
    crmClients,
    payments,
    reviews,
    stats: {
      totalConsultations: earnings._count,
      totalConsultationAmount: earnings._sum.amount || 0,
      totalEarningsLawyer: earnings._sum.lawyerAmount || 0,
      totalPlatformFee: earnings._sum.platformFee || 0,
      totalSubscriptionsPaid: subscriptionPayments._count,
      totalSubscriptionAmount: subscriptionPayments._sum.amount || 0,
      totalCrmClients: crmClients.length,
      totalReviews: reviews.length,
    },
  });
}
