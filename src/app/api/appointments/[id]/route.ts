import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id as string;
  if (role !== "client" && role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (role === "client" && appointment.clientId !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (role === "lawyer" && appointment.lawyerId !== userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (appointment.status !== "completed" && appointment.status !== "cancelled") {
    return NextResponse.json(
      { error: "Solo se pueden ocultar citas completadas o canceladas" },
      { status: 400 }
    );
  }

  const data =
    role === "client"
      ? { archivedByClient: true }
      : { archivedByLawyer: true };

  await prisma.appointment.update({ where: { id: params.id }, data });

  return NextResponse.json({ ok: true });
}
