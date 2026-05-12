import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [clients, allLawyers] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        googleId: true,
        createdAt: true,
        appointments: {
          select: {
            lawyer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
            messages: true,
          },
        },
      },
      take: 200,
    }),
    prisma.lawyer.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const enriched = clients.map((c) => {
    const lawyerMap = new Map<string, { id: string; name: string }>();
    for (const apt of c.appointments) {
      if (!lawyerMap.has(apt.lawyer.id)) {
        lawyerMap.set(apt.lawyer.id, {
          id: apt.lawyer.id,
          name: `${apt.lawyer.firstName} ${apt.lawyer.lastName}`,
        });
      }
    }
    const { appointments, ...rest } = c;
    return {
      ...rest,
      lawyers: Array.from(lawyerMap.values()),
    };
  });

  return NextResponse.json({
    clients: enriched,
    lawyers: allLawyers.map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`,
    })),
  });
}
