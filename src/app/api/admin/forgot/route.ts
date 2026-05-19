import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAdminPasswordReset } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

const RESET_TTL_MINUTES = 30;

const GENERIC_OK = {
  ok: true,
  message: "Si la cuenta existe, vas a recibir un email con instrucciones.",
};

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipLimit = rateLimit({
    key: `admin-forgot:ip:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) return rateLimitResponse(ipLimit);

  let body: { username?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!username && !email) {
    return NextResponse.json(
      { error: "Ingresa usuario o email" },
      { status: 400 }
    );
  }

  const identifierLimit = rateLimit({
    key: `admin-forgot:id:${(username || email).toLowerCase()}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!identifierLimit.ok) return rateLimitResponse(identifierLimit);

  const admin = username
    ? await prisma.admin.findUnique({ where: { username } })
    : await prisma.admin.findUnique({ where: { email } });

  if (!admin || !admin.email) {
    return NextResponse.json(GENERIC_OK);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      recoveryTokenHash: tokenHash,
      recoveryTokenExpiresAt: expiresAt,
    },
  });

  const base = process.env.NEXTAUTH_URL || "";
  const link = `${base}/admin-recover/reset/${rawToken}`;

  await sendAdminPasswordReset(
    admin.email,
    admin.username,
    link,
    RESET_TTL_MINUTES
  );

  await logAdminAction({
    adminId: admin.id,
    action: "admin.password_reset_requested",
    target: "admin",
    targetId: admin.id,
    req,
  });

  return NextResponse.json(GENERIC_OK);
}
