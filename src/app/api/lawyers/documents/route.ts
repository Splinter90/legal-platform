import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireLawyerFeatureAccess } from "@/lib/lawyer-access";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function requireLawyer() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "lawyer") {
    return { ok: false as const, status: 401, error: "No autorizado" };
  }
  const lawyerId = (session.user as any).id as string;
  const access = await requireLawyerFeatureAccess(lawyerId);
  if (!access.ok) {
    return { ok: false as const, status: access.status, error: access.error };
  }
  return { ok: true as const, lawyerId };
}

export async function GET(req: NextRequest) {
  const auth = await requireLawyer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const crmClientId = searchParams.get("crmClientId");
  const caseTrackingId = searchParams.get("caseTrackingId");

  if (!crmClientId && !caseTrackingId) {
    return NextResponse.json(
      { error: "Falta crmClientId o caseTrackingId" },
      { status: 400 }
    );
  }

  if (crmClientId) {
    const client = await prisma.crmClient.findUnique({
      where: { id: crmClientId },
      select: { lawyerId: true },
    });
    if (!client || client.lawyerId !== auth.lawyerId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
  }

  if (caseTrackingId) {
    const ct = await prisma.caseTracking.findUnique({
      where: { id: caseTrackingId },
      include: { appointment: { select: { lawyerId: true } } },
    });
    if (!ct || ct.appointment.lawyerId !== auth.lawyerId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
  }

  const documents = await prisma.caseDocument.findMany({
    where: {
      lawyerId: auth.lawyerId,
      ...(crmClientId ? { crmClientId } : {}),
      ...(caseTrackingId ? { caseTrackingId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const auth = await requireLawyer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const {
    crmClientId,
    caseTrackingId,
    url,
    publicId,
    resourceType,
    type,
    name,
    size,
    description,
  } = body || {};

  if (!url || typeof url !== "string" || !/^https:\/\/res\.cloudinary\.com\//.test(url)) {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (!type || (type !== "pdf" && type !== "image")) {
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  }
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name requerido" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "size inválido" }, { status: 400 });
  }
  if (!crmClientId && !caseTrackingId) {
    return NextResponse.json(
      { error: "Falta crmClientId o caseTrackingId" },
      { status: 400 }
    );
  }
  if (crmClientId && caseTrackingId) {
    return NextResponse.json(
      { error: "Solo uno de crmClientId o caseTrackingId" },
      { status: 400 }
    );
  }

  if (crmClientId) {
    const client = await prisma.crmClient.findUnique({
      where: { id: crmClientId },
      select: { lawyerId: true },
    });
    if (!client || client.lawyerId !== auth.lawyerId) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }
  } else {
    const ct = await prisma.caseTracking.findUnique({
      where: { id: caseTrackingId },
      include: { appointment: { select: { lawyerId: true } } },
    });
    if (!ct || ct.appointment.lawyerId !== auth.lawyerId) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }
  }

  const doc = await prisma.caseDocument.create({
    data: {
      lawyerId: auth.lawyerId,
      crmClientId: crmClientId || null,
      caseTrackingId: caseTrackingId || null,
      url,
      publicId: publicId || null,
      resourceType: resourceType === "raw" ? "raw" : "image",
      type,
      name: name.slice(0, 200),
      size: Math.round(size),
      description: description ? String(description).slice(0, 500) : null,
    },
  });

  return NextResponse.json(doc);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireLawyer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
  }

  const doc = await prisma.caseDocument.findUnique({ where: { id } });
  if (!doc || doc.lawyerId !== auth.lawyerId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (doc.publicId) {
    try {
      await cloudinary.uploader.destroy(doc.publicId, {
        resource_type: doc.resourceType === "raw" ? "raw" : "image",
      });
    } catch (err) {
      console.error("Cloudinary destroy failed:", err);
    }
  }

  await prisma.caseDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
