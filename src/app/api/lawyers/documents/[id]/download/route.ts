import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const lawyerId = (session.user as any).id;

  const doc = await prisma.caseDocument.findUnique({
    where: { id: params.id },
  });

  if (!doc || doc.lawyerId !== lawyerId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const forceDownload = req.nextUrl.searchParams.get("download") === "1";

  if (!doc.publicId) {
    return NextResponse.redirect(doc.url, 302);
  }

  const signed = cloudinary.url(doc.publicId, {
    resource_type: doc.resourceType === "raw" ? "raw" : "image",
    secure: true,
    ...(forceDownload ? { flags: "attachment" } : {}),
  });

  return NextResponse.redirect(signed, 302);
}
