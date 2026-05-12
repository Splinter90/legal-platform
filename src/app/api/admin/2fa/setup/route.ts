import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, buildOtpauthUri } from "@/lib/totp";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.admin.findFirst();
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  if (admin.totpEnabled) {
    return NextResponse.json({ error: "2FA ya esta activo. Desactivalo antes de regenerar." }, { status: 400 });
  }

  const secret = generateTotpSecret();
  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpSecret: secret },
  });

  const otpauth = buildOtpauthUri(secret, admin.username);
  const qrDataUrl = await QRCode.toDataURL(otpauth, { margin: 1, width: 256 });

  return NextResponse.json({ secret, otpauth, qrDataUrl });
}
