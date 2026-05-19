import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { password, code } = await req.json();
  if (typeof password !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const admin = await prisma.admin.findFirst();
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  if (!admin.totpEnabled || !admin.totpSecret) {
    return NextResponse.json({ error: "2FA no esta activo" }, { status: 400 });
  }

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 400 });
  }

  if (!verifyTotp(admin.totpSecret, code)) {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  await logAdminAction({
    adminId: admin.id,
    action: "admin.2fa_disable",
    target: "admin",
    targetId: admin.id,
    req,
  });

  return NextResponse.json({ ok: true });
}
