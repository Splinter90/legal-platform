import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const lawyers = await prisma.lawyer.findMany({
    where: {
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil: { gt: new Date() },
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialties: true,
      province: true,
      city: true,
      address: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
      narrative: true,
      profilePhoto: true,
      phone: true,
    },
  });

  return NextResponse.json(lawyers);
}
