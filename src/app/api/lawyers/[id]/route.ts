import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lawyer = await prisma.lawyer.findUnique({
      where: {
        id: params.id,
        status: "approved",
        subscriptionStatus: "active",
        subscriptionPaidUntil: { gt: new Date() },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialties: true,
        province: true,
        city: true,
        address: true,
        narrative: true,
        experience: true,
        rating: true,
        reviewCount: true,
        profilePhoto: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!lawyer) {
      return NextResponse.json(
        { error: "Abogado no encontrado" },
        { status: 404 }
      );
    }

    const admin = await prisma.admin.findFirst();
    const consultationFee = admin?.consultationFee || 5000;

    return NextResponse.json({ lawyer, consultationFee });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
