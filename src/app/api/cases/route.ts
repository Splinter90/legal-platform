import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidCaseStatus } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "client" && role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const where = role === "client"
    ? { appointment: { clientId: userId } }
    : { appointment: { lawyerId: userId } };

  const cases = await prisma.caseTracking.findMany({
    where,
    include: {
      appointment: {
        include: {
          lawyer: { select: { firstName: true, lastName: true } },
          client: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const { appointmentId, description, status } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId es obligatorio" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: { select: { id: true, name: true } } },
  });

  if (!appointment || appointment.lawyerId !== lawyerId) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const caseStatus = status || "initiated";
  if (!isValidCaseStatus(caseStatus)) {
    return NextResponse.json({ error: "Estado de caso inválido" }, { status: 400 });
  }

  const existing = await prisma.caseTracking.findUnique({
    where: { appointmentId },
  });

  if (existing) {
    const updated = await prisma.caseTracking.update({
      where: { appointmentId },
      data: { description, status: caseStatus },
    });

    await prisma.notification.create({
      data: {
        userId: appointment.client.id,
        userType: "client",
        type: "case_updated",
        title: "Actualización de trámite",
        message: `Tu trámite fue actualizado a: ${caseStatus}`,
        link: "/client/cases",
      },
    });

    return NextResponse.json(updated);
  }

  const caseTracking = await prisma.caseTracking.create({
    data: {
      appointmentId,
      description: description || null,
      status: caseStatus,
    },
  });

  await prisma.notification.create({
    data: {
      userId: appointment.client.id,
      userType: "client",
      type: "case_created",
      title: "Nuevo trámite creado",
      message: `Se inició el seguimiento de tu caso. Estado: ${caseStatus}`,
      link: "/client/cases",
    },
  });

  return NextResponse.json(caseTracking);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id, status, description, updates } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
  }

  if (status && !isValidCaseStatus(status)) {
    return NextResponse.json({ error: "Estado de caso inválido" }, { status: 400 });
  }

  const caseTracking = await prisma.caseTracking.findUnique({
    where: { id },
    include: {
      appointment: {
        include: { client: { select: { id: true } } },
      },
    },
  });

  if (!caseTracking || caseTracking.appointment.lawyerId !== (session.user as any).id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updateData: Record<string, any> = {};
  if (status) updateData.status = status;
  if (description !== undefined) updateData.description = description;
  if (updates !== undefined) updateData.updates = updates;

  const updated = await prisma.caseTracking.update({
    where: { id },
    data: updateData,
  });

  if (status) {
    await prisma.notification.create({
      data: {
        userId: caseTracking.appointment.client.id,
        userType: "client",
        type: "case_updated",
        title: "Actualización de trámite",
        message: `El estado de tu trámite cambió a: ${status}`,
        link: "/client/cases",
      },
    });
  }

  return NextResponse.json(updated);
}
