import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipLimit = rateLimit({
    key: `admin-reset:ip:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) return rateLimitResponse(ipLimit);

  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token y nueva contrasena son obligatorios" },
      { status: 400 }
    );
  }

  const pwError = validatePassword(newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const admin = await prisma.admin.findFirst({
    where: {
      recoveryTokenHash: tokenHash,
      recoveryTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!admin) {
    return NextResponse.json(
      { error: "Token invalido o expirado" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      password: passwordHash,
      recoveryTokenHash: null,
      recoveryTokenExpiresAt: null,
    },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "admin.password_reset_completed",
    target: "admin",
    targetId: admin.id,
    req,
  });

  return NextResponse.json({ ok: true });
}
