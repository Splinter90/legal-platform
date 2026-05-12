import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendSubscriptionExpired,
  sendSubscriptionExpiringSoon,
} from "@/lib/email";

export const dynamic = "force-dynamic";

const WARN_DAYS_BEFORE = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const warnUntil = new Date(now.getTime() + WARN_DAYS_BEFORE * MS_PER_DAY);

  const expiredCount = await processExpired(now);
  const warnedCount = await processExpiringSoon(now, warnUntil);

  return NextResponse.json({
    ok: true,
    expired: expiredCount,
    warned: warnedCount,
    ranAt: now.toISOString(),
  });
}

async function processExpired(now: Date): Promise<number> {
  const expired = await prisma.lawyer.findMany({
    where: {
      subscriptionStatus: "active",
      subscriptionPaidUntil: { lt: now },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (expired.length === 0) return 0;

  await prisma.$transaction([
    prisma.lawyer.updateMany({
      where: { id: { in: expired.map((l) => l.id) } },
      data: { subscriptionStatus: "expired" },
    }),
    prisma.notification.createMany({
      data: expired.map((l) => ({
        userId: l.id,
        userType: "lawyer",
        type: "subscription_expired",
        title: "Tu suscripcion vencio",
        message:
          "Renovala para volver a aparecer en busquedas y recibir consultas.",
        link: "/lawyer/dashboard",
      })),
    }),
  ]);

  await Promise.allSettled(
    expired.map((l) =>
      sendSubscriptionExpired(l.email, `${l.firstName} ${l.lastName}`.trim())
    )
  );

  return expired.length;
}

async function processExpiringSoon(now: Date, warnUntil: Date): Promise<number> {
  const candidates = await prisma.lawyer.findMany({
    where: {
      subscriptionStatus: "active",
      subscriptionPaidUntil: { gte: now, lte: warnUntil },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      subscriptionPaidUntil: true,
    },
  });

  if (candidates.length === 0) return 0;

  const sinceCutoff = new Date(now.getTime() - WARN_DAYS_BEFORE * MS_PER_DAY);
  const recentlyWarned = await prisma.notification.findMany({
    where: {
      userType: "lawyer",
      type: "subscription_expiring_soon",
      userId: { in: candidates.map((c) => c.id) },
      createdAt: { gte: sinceCutoff },
    },
    select: { userId: true },
  });
  const skip = new Set(recentlyWarned.map((n) => n.userId));

  const toWarn = candidates.filter((c) => !skip.has(c.id));
  if (toWarn.length === 0) return 0;

  await prisma.notification.createMany({
    data: toWarn.map((l) => ({
      userId: l.id,
      userType: "lawyer",
      type: "subscription_expiring_soon",
      title: "Tu suscripcion esta por vencer",
      message: `Vence el ${l.subscriptionPaidUntil!.toLocaleDateString("es-AR")}. Renovala para no perder visibilidad.`,
      link: "/lawyer/dashboard",
    })),
  });

  await Promise.allSettled(
    toWarn.map((l) => {
      const daysLeft = Math.max(
        1,
        Math.ceil((l.subscriptionPaidUntil!.getTime() - now.getTime()) / MS_PER_DAY)
      );
      return sendSubscriptionExpiringSoon(
        l.email,
        `${l.firstName} ${l.lastName}`.trim(),
        l.subscriptionPaidUntil!.toLocaleDateString("es-AR"),
        daysLeft
      );
    })
  );

  return toWarn.length;
}
