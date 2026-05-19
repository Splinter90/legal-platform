import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      createdAt: true,
      deletedAt: true,
    },
  });
  if (!client || client.deletedAt) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || client.deletedAt) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const blockingAppointments = await prisma.appointment.count({
    where: {
      clientId,
      status: "confirmed",
      dateTime: { gt: new Date() },
    },
  });

  if (blockingAppointments > 0) {
    return NextResponse.json(
      {
        error:
          "Tenés citas confirmadas a futuro. Cancelalas o esperá a que pasen antes de eliminar tu cuenta.",
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.appointment.updateMany({
      where: {
        clientId,
        status: { in: ["pending_payment"] },
      },
      data: { status: "cancelled" },
    }),
    prisma.client.update({
      where: { id: clientId },
      data: {
        deletedAt: new Date(),
        email: `deleted-${clientId}@deleted.local`,
        name: "Usuario eliminado",
        phone: null,
        image: null,
        googleId: null,
        password: null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
