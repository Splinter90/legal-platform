import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "lawyer" && role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const otherUserId = req.nextUrl.searchParams.get("userId");

  const where: any = role === "lawyer" ? { lawyerId: userId } : { clientId: userId };
  if (otherUserId) {
    where[role === "lawyer" ? "clientId" : "lawyerId"] = otherUserId;
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      lawyer: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  if (otherUserId) {
    await prisma.message.updateMany({
      where: {
        ...where,
        senderType: role === "lawyer" ? "client" : "lawyer",
        read: false,
      },
      data: { read: true },
    });
  }

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "lawyer" && role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { content, recipientId } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }

  if (!recipientId) {
    return NextResponse.json({ error: "recipientId es obligatorio" }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: "El mensaje no puede superar los 5000 caracteres" }, { status: 400 });
  }

  const lawyerId = role === "lawyer" ? userId : recipientId;
  const clientId = role === "client" ? userId : recipientId;

  if (role === "lawyer") {
    const client = await prisma.client.findUnique({ where: { id: recipientId } });
    if (!client) return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 });
  } else {
    const lawyer = await prisma.lawyer.findUnique({ where: { id: recipientId } });
    if (!lawyer) return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: userId,
      senderType: role,
      lawyerId,
      clientId,
    },
  });

  const senderName = session.user?.name || "Usuario";
  const preview = content.trim().substring(0, 80);

  await prisma.notification.create({
    data: {
      userId: recipientId,
      userType: role === "lawyer" ? "client" : "lawyer",
      type: "new_message",
      title: "Nuevo mensaje",
      message: `${senderName}: ${preview}${content.length > 80 ? "..." : ""}`,
      link: role === "lawyer" ? "/client/messages" : "/lawyer/messages",
    },
  });

  return NextResponse.json(message);
}
