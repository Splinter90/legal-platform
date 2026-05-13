import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signedMessageAttachmentUrl, MessageAttachmentType } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (role !== "client" && role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const message = await prisma.message.findUnique({
    where: { id: params.id },
    select: {
      lawyerId: true,
      clientId: true,
      attachmentPublicId: true,
      attachmentType: true,
      attachmentUrl: true,
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }

  const isParty =
    (role === "client" && message.clientId === userId) ||
    (role === "lawyer" && message.lawyerId === userId);
  if (!isParty) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!message.attachmentPublicId) {
    if (message.attachmentUrl) {
      return NextResponse.redirect(message.attachmentUrl, 302);
    }
    return NextResponse.json({ error: "Mensaje sin adjunto" }, { status: 404 });
  }

  if (message.attachmentType !== "image" && message.attachmentType !== "pdf") {
    return NextResponse.json({ error: "Tipo de adjunto inválido" }, { status: 400 });
  }

  const forceDownload = req.nextUrl.searchParams.get("download") === "1";
  const signed = signedMessageAttachmentUrl(
    message.attachmentPublicId,
    message.attachmentType as MessageAttachmentType,
    { forceDownload }
  );

  return NextResponse.redirect(signed, 302);
}
