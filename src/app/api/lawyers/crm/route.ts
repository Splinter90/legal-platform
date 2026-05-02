import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRequired, isValidCrmStatus } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const clients = await prisma.crmClient.findMany({
    where: { lawyerId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const body = await req.json();

  const requiredError = validateRequired({ nombre: body.name });
  if (requiredError) {
    return NextResponse.json({ error: requiredError }, { status: 400 });
  }

  const status = body.status || "in_progress";
  if (!isValidCrmStatus(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const client = await prisma.crmClient.create({
    data: {
      lawyerId,
      name: body.name.trim(),
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      situation: body.situation || null,
      caseType: body.caseType || null,
      status,
      source: body.source === "platform" ? "platform" : "external",
      notes: body.notes || null,
    },
  });

  return NextResponse.json(client);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
  }

  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.lawyerId !== lawyerId) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (data.status && !isValidCrmStatus(data.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const allowedFields = ["name", "phone", "email", "address", "situation", "caseType", "status", "notes"];
  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  const client = await prisma.crmClient.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
  }

  const existing = await prisma.crmClient.findUnique({ where: { id } });
  if (!existing || existing.lawyerId !== lawyerId) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  await prisma.crmClient.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
