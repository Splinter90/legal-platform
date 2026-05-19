import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;

  const rl = rateLimit({
    key: `export:client:${clientId}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const [appointments, reviews, messages, payments, favorites] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId },
      orderBy: { dateTime: "desc" },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.review.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.message.findMany({
      where: { clientId },
      orderBy: { createdAt: "asc" },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.payment.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteLawyer.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const zip = new JSZip();

  zip.file(
    "README.txt",
    [
      "Exportación de tus datos personales — Leyes Digital",
      "==================================================",
      "",
      `Generado el: ${new Date().toISOString()}`,
      `Cliente: ${client.name} (${client.email})`,
      "",
      "Archivos incluidos:",
      "  - perfil.json          → tus datos básicos",
      "  - citas.json           → tus consultas",
      "  - reseñas.json         → tus reseñas a abogados",
      "  - mensajes.json        → historial de mensajes",
      "  - pagos.json           → pagos vía Mercado Pago",
      "  - favoritos.json       → abogados marcados como favoritos",
      "",
      "Este archivo te permite ejercer tu derecho de acceso según la Ley",
      "25.326 de Protección de Datos Personales (Argentina).",
      "",
    ].join("\r\n")
  );

  zip.file("perfil.json", pretty(client));
  zip.file("citas.json", pretty(appointments));
  zip.file("reseñas.json", pretty(reviews));
  zip.file("mensajes.json", pretty(messages));
  zip.file("pagos.json", pretty(payments));
  zip.file("favoritos.json", pretty(favorites));

  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="leyes-digital-mis-datos-${stamp}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
