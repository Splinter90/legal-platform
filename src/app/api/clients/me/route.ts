import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOptionalPhoneARValid } from "@/lib/phone";

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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "client") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const clientId = (session.user as any).id as string;

    const existing = await prisma.client.findUnique({ where: { id: clientId } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json(
          { error: "El nombre debe tener entre 2 y 80 caracteres" },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (body.phone !== undefined) {
      if (!isOptionalPhoneARValid(body.phone)) {
        return NextResponse.json(
          { error: "Formato de celular inválido. Usá +54 9 11 1234-5678." },
          { status: 400 }
        );
      }
      updateData.phone = body.phone || null;
    }

    if (body.image !== undefined) {
      if (body.image !== null && typeof body.image !== "string") {
        return NextResponse.json({ error: "image inválida" }, { status: 400 });
      }
      if (typeof body.image === "string" && !/^https:\/\/res\.cloudinary\.com\//.test(body.image)) {
        return NextResponse.json({ error: "image debe ser de Cloudinary" }, { status: 400 });
      }
      updateData.image = body.image;
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/clients/me error:", err);
    return NextResponse.json(
      { error: "Error interno al actualizar el perfil" },
      { status: 500 }
    );
  }
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
