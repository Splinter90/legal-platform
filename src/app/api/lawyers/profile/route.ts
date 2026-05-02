import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/geocode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyer = await prisma.lawyer.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const { password, ...safeData } = lawyer;
  return NextResponse.json(safeData);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyer = await prisma.lawyer.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const body = await req.json();

  const allowedFields = ["phone", "narrative", "experience", "address", "cbuAlias", "profilePhoto"];
  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (body.address !== undefined) {
    const coords = await geocodeAddress(lawyer.city, lawyer.province, body.address);
    if (coords) {
      updateData.latitude = coords.latitude;
      updateData.longitude = coords.longitude;
    }
  }

  const updated = await prisma.lawyer.update({
    where: { id: lawyer.id },
    data: updateData,
  });

  const { password, ...safeData } = updated;
  return NextResponse.json(safeData);
}
