import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const lawyerId = (session.user as any).id;
  const lawyer = await prisma.lawyer.findUnique({
    where: { id: lawyerId },
    select: { status: true },
  });

  if (!lawyer) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  if (lawyer.status !== "rejected") {
    return NextResponse.json(
      { error: "Solo podés reenviar la solicitud si fue rechazada" },
      { status: 400 }
    );
  }

  const updated = await prisma.lawyer.update({
    where: { id: lawyerId },
    data: { status: "pending", rejectionReason: null },
    select: { status: true, rejectionReason: true },
  });

  return NextResponse.json(updated);
}
