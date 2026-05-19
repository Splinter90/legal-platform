import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireLawyerFeatureAccess } from "@/lib/lawyer-access";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { canChat, CHAT_GATE_MESSAGE } from "@/lib/messaging";
import { publishToUser } from "@/lib/message-stream";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role !== "lawyer" && role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (role === "lawyer") {
    const access = await requireLawyerFeatureAccess(userId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
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

  const rl = rateLimit({
    key: `messages:${role}:${userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  if (role === "lawyer") {
    const access = await requireLawyerFeatureAccess(userId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
  }

  const {
    content,
    recipientId,
    attachmentPublicId,
    attachmentType,
    attachmentName,
  } = await req.json();

  const trimmedContent = typeof content === "string" ? content.trim() : "";
  const hasAttachment =
    typeof attachmentPublicId === "string" && attachmentPublicId.trim().length > 0;

  if (!trimmedContent && !hasAttachment) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }

  if (!recipientId) {
    return NextResponse.json({ error: "recipientId es obligatorio" }, { status: 400 });
  }

  if (trimmedContent.length > 5000) {
    return NextResponse.json({ error: "El mensaje no puede superar los 5000 caracteres" }, { status: 400 });
  }

  if (hasAttachment) {
    if (attachmentType !== "image" && attachmentType !== "pdf") {
      return NextResponse.json({ error: "Tipo de adjunto inválido" }, { status: 400 });
    }
    if (!/^legal-platform\/message-attachments\//.test(attachmentPublicId)) {
      return NextResponse.json({ error: "publicId de adjunto inválido" }, { status: 400 });
    }
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

  const allowed = await canChat(lawyerId, clientId);
  if (!allowed) {
    return NextResponse.json({ error: CHAT_GATE_MESSAGE }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      content: trimmedContent,
      senderId: userId,
      senderType: role,
      lawyerId,
      clientId,
      attachmentPublicId: hasAttachment ? attachmentPublicId : null,
      attachmentType: hasAttachment ? attachmentType : null,
      attachmentName: hasAttachment
        ? (typeof attachmentName === "string" && attachmentName.trim().length > 0
            ? attachmentName.trim().slice(0, 200)
            : null)
        : null,
    },
  });

  const senderName = session.user?.name || "Usuario";
  const attachmentLabel = hasAttachment
    ? attachmentType === "image"
      ? "📷 Imagen"
      : "📎 Archivo"
    : "";
  const previewBase = trimmedContent.length > 0 ? trimmedContent : attachmentLabel;
  const preview = previewBase.substring(0, 80);

  await prisma.notification.create({
    data: {
      userId: recipientId,
      userType: role === "lawyer" ? "client" : "lawyer",
      type: "new_message",
      title: "Nuevo mensaje",
      message: `${senderName}: ${preview}${previewBase.length > 80 ? "..." : ""}`,
      link: role === "lawyer" ? "/client/messages" : "/lawyer/messages",
    },
  });

  const recipientRole: "client" | "lawyer" = role === "lawyer" ? "client" : "lawyer";
  publishToUser(recipientRole, recipientId, "message", {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderType: message.senderType,
    senderName,
    lawyerId: message.lawyerId,
    clientId: message.clientId,
    attachmentPublicId: message.attachmentPublicId,
    attachmentType: message.attachmentType,
    attachmentName: message.attachmentName,
    createdAt: message.createdAt.toISOString(),
  });
  publishToUser(role, userId, "message", {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderType: message.senderType,
    lawyerId: message.lawyerId,
    clientId: message.clientId,
    attachmentPublicId: message.attachmentPublicId,
    attachmentType: message.attachmentType,
    attachmentName: message.attachmentName,
    createdAt: message.createdAt.toISOString(),
  });

  return NextResponse.json(message);
}
