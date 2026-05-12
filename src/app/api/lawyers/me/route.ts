import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLawyerAccess } from "@/lib/lawyer-access";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const access = await getLawyerAccess((session.user as any).id);
  if (!access) {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ access });
}
