import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidLawyerStatus } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");

  if (status && !isValidLawyerStatus(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const where = status
    ? { status }
    : { status: { not: "incomplete" } };

  const lawyers = await prisma.lawyer.findMany({
    where,
    include: {
      _count: {
        select: { appointments: true, crmClients: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(lawyers);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (!isValidLawyerStatus(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const lawyer = await prisma.lawyer.findUnique({ where: { id } });
  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const validTransitions: Record<string, string[]> = {
    pending: ["approved", "rejected"],
    approved: ["suspended"],
    rejected: ["pending"],
    suspended: ["approved"],
    incomplete: ["rejected"],
  };

  const allowed = validTransitions[lawyer.status];
  if (!allowed || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `No se puede cambiar de "${lawyer.status}" a "${status}"` },
      { status: 400 }
    );
  }

  const updated = await prisma.lawyer.update({
    where: { id },
    data: { status },
  });

  const statusMessages: Record<string, string> = {
    approved: "Tu perfil fue aprobado. Ya podés recibir clientes.",
    rejected: "Tu solicitud fue rechazada. Revisá tu información y volvé a intentar.",
    suspended: "Tu perfil fue suspendido temporalmente.",
  };

  if (statusMessages[status]) {
    await prisma.notification.create({
      data: {
        userId: lawyer.id,
        userType: "lawyer",
        type: `profile_${status}`,
        title: `Perfil ${status === "approved" ? "aprobado" : status === "rejected" ? "rechazado" : "suspendido"}`,
        message: statusMessages[status],
        link: "/lawyer/profile",
      },
    });
  }

  return NextResponse.json(updated);
}
