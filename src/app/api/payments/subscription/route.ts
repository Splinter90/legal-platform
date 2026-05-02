import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscriptionPreference } from "@/lib/mercadopago";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "lawyer") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lawyerId = (session.user as any).id;
    const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });

    if (!lawyer) {
      return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
    }

    if (lawyer.status !== "approved") {
      return NextResponse.json(
        { error: "Solo abogados aprobados pueden suscribirse" },
        { status: 400 }
      );
    }

    if (lawyer.subscriptionPaidUntil && lawyer.subscriptionPaidUntil > new Date()) {
      return NextResponse.json(
        { error: `Ya tenés suscripción activa hasta el ${lawyer.subscriptionPaidUntil.toLocaleDateString("es-AR")}` },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findFirst();
    const subscriptionAmount = admin?.subscriptionFee || 5000;

    const result = await createSubscriptionPreference({
      lawyerId: lawyer.id,
      lawyerEmail: lawyer.email,
      amount: subscriptionAmount,
    });

    await prisma.payment.create({
      data: {
        lawyerId: lawyer.id,
        type: "subscription",
        amount: subscriptionAmount,
        status: "pending",
        mpPreferenceId: result.preferenceId,
      },
    });

    return NextResponse.json({
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "lawyer") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const lawyerId = (session.user as any).id;
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId },
      select: {
        subscriptionStatus: true,
        subscriptionPaidUntil: true,
      },
    });

    const isActive = lawyer?.subscriptionPaidUntil
      ? lawyer.subscriptionPaidUntil > new Date()
      : false;

    const admin = await prisma.admin.findFirst();

    return NextResponse.json({
      status: isActive ? "active" : "expired",
      paidUntil: lawyer?.subscriptionPaidUntil,
      amount: admin?.subscriptionFee || 5000,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
