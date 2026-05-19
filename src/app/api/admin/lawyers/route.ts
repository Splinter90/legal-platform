import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidLawyerStatus } from "@/lib/validations";
import { canTransitionLawyerStatus } from "@/lib/lawyer-status-transitions";
import { sendLawyerStatusUpdate } from "@/lib/email";
import { logAdminAction } from "@/lib/admin-audit";

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
  const { id, status, rejectionReason } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (!isValidLawyerStatus(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (status === "rejected") {
    if (typeof rejectionReason !== "string" || rejectionReason.trim().length < 5) {
      return NextResponse.json(
        { error: "El motivo de rechazo es obligatorio (mínimo 5 caracteres)" },
        { status: 400 }
      );
    }
  }

  const lawyer = await prisma.lawyer.findUnique({ where: { id } });
  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  if (!canTransitionLawyerStatus(lawyer.status, status)) {
    return NextResponse.json(
      { error: `No se puede cambiar de "${lawyer.status}" a "${status}"` },
      { status: 400 }
    );
  }

  const updateData: { status: string; rejectionReason?: string | null } = { status };
  if (status === "rejected") {
    updateData.rejectionReason = rejectionReason.trim();
  } else if (status === "approved" || status === "pending") {
    updateData.rejectionReason = null;
  }

  const updated = await prisma.lawyer.update({
    where: { id },
    data: updateData,
  });

  const adminId = (session.user as any).id as string;
  const actionByStatus: Record<string, string> = {
    approved: "lawyer.approve",
    rejected: "lawyer.reject",
    suspended: "lawyer.suspend",
    pending: "lawyer.set_pending",
  };
  await logAdminAction({
    adminId,
    action: actionByStatus[status] || "lawyer.status_change",
    target: "lawyer",
    targetId: id,
    metadata: {
      previousStatus: lawyer.status,
      newStatus: status,
      rejectionReason: updateData.rejectionReason ?? null,
    },
    req,
  });

  const rejectionMsg = status === "rejected" && updateData.rejectionReason
    ? `Motivo: ${updateData.rejectionReason}. Corregí tus datos y reenviá la solicitud.`
    : "Tu solicitud fue rechazada. Revisá tu información y volvé a intentar.";

  const statusMessages: Record<string, string> = {
    approved: "Tu perfil fue aprobado. Ya podés activar tu suscripción.",
    rejected: rejectionMsg,
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
        link: status === "rejected" ? "/lawyer/dashboard" : "/lawyer/profile",
      },
    });
  }

  if (status === "approved" || status === "rejected" || status === "suspended") {
    sendLawyerStatusUpdate(
      lawyer.email,
      `${lawyer.firstName} ${lawyer.lastName}`.trim(),
      status,
      status === "rejected" ? updateData.rejectionReason : null
    ).catch((err) => console.error("sendLawyerStatusUpdate error:", err));
  }

  return NextResponse.json(updated);
}
