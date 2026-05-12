import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await req.json();
  if (typeof code !== "string") {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
  }

  const admin = await prisma.admin.findFirst();
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  if (admin.totpEnabled) {
    return NextResponse.json({ error: "2FA ya esta activo" }, { status: 400 });
  }

  if (!admin.totpSecret) {
    return NextResponse.json({ error: "Primero corre el setup de 2FA" }, { status: 400 });
  }

  if (!verifyTotp(admin.totpSecret, code)) {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
