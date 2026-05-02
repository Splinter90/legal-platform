import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const specialty = sp.get("specialty");
  const province = sp.get("province");
  const search = sp.get("search");

  const where: any = {
    status: "approved",
    subscriptionStatus: "active",
    subscriptionPaidUntil: { gt: new Date() },
  };

  if (specialty) {
    where.specialties = { contains: specialty };
  }
  if (province) {
    where.province = province;
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const lawyers = await prisma.lawyer.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhoto: true,
      specialties: true,
      province: true,
      city: true,
      narrative: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(lawyers);
}
