import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.admin.findFirst({
    select: { totpEnabled: true },
  });
  if (!admin) return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });

  return NextResponse.json({ enabled: admin.totpEnabled });
}
