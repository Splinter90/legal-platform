import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userType = (session.user as any).role;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, userType },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({
      where: { userId, userType, read: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userType = (session.user as any).role;
  const { notificationId } = await req.json();

  if (notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId || notification.userType !== userType) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId, userType, read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
