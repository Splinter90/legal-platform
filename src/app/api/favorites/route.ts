import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;

  const favorites = await prisma.favoriteLawyer.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      lawyer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          specialties: true,
          city: true,
          province: true,
          rating: true,
          reviewCount: true,
          status: true,
          subscriptionStatus: true,
          subscriptionPaidUntil: true,
        },
      },
    },
  });

  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;

  const { lawyerId } = await req.json();
  if (!lawyerId || typeof lawyerId !== "string") {
    return NextResponse.json({ error: "lawyerId requerido" }, { status: 400 });
  }

  const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });
  if (!lawyer || lawyer.status !== "approved") {
    return NextResponse.json({ error: "Abogado no disponible" }, { status: 404 });
  }

  try {
    const fav = await prisma.favoriteLawyer.create({
      data: { clientId, lawyerId },
    });
    return NextResponse.json(fav);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, alreadyFavorite: true });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const clientId = (session.user as any).id as string;
  const lawyerId = req.nextUrl.searchParams.get("lawyerId");
  if (!lawyerId) {
    return NextResponse.json({ error: "lawyerId requerido" }, { status: 400 });
  }

  await prisma.favoriteLawyer.deleteMany({ where: { clientId, lawyerId } });
  return NextResponse.json({ ok: true });
}
