import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRating } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "client") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const clientId = (session.user as any).id;
  const { lawyerId, rating, comment } = await req.json();

  if (!lawyerId) {
    return NextResponse.json({ error: "lawyerId es obligatorio" }, { status: 400 });
  }

  const validRating = validateRating(rating);
  if (validRating === null) {
    return NextResponse.json({ error: "La calificación debe ser un entero entre 1 y 5" }, { status: 400 });
  }

  const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });
  if (!lawyer || lawyer.status !== "approved") {
    return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
  }

  const hasAppointment = await prisma.appointment.findFirst({
    where: {
      clientId,
      lawyerId,
      status: "completed",
    },
  });
  if (!hasAppointment) {
    return NextResponse.json(
      { error: "Solo podés dejar una reseña si tuviste una consulta completada con este abogado" },
      { status: 400 }
    );
  }

  const existing = await prisma.review.findFirst({
    where: { clientId, lawyerId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya dejaste una reseña para este abogado" },
      { status: 400 }
    );
  }

  const review = await prisma.review.create({
    data: {
      lawyerId,
      clientId,
      rating: validRating,
      comment: comment ? comment.trim() : null,
    },
  });

  const stats = await prisma.review.aggregate({
    where: { lawyerId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.lawyer.update({
    where: { id: lawyerId },
    data: {
      rating: Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count.rating,
    },
  });

  await prisma.notification.create({
    data: {
      userId: lawyerId,
      userType: "lawyer",
      type: "new_review",
      title: "Nueva reseña",
      message: `${session.user?.name || "Un cliente"} te dejó una reseña de ${validRating} estrellas`,
      link: "/lawyer/dashboard",
    },
  });

  return NextResponse.json(review);
}

export async function GET(req: NextRequest) {
  const lawyerId = req.nextUrl.searchParams.get("lawyerId");

  if (!lawyerId) {
    return NextResponse.json([]);
  }

  const reviews = await prisma.review.findMany({
    where: { lawyerId },
    include: { client: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(reviews);
}
