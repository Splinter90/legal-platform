import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/haversine";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const specialty = sp.get("specialty");
  const province = sp.get("province");
  const search = sp.get("search");
  const language = sp.get("language");
  const gender = sp.get("gender");
  const minRating = sp.get("minRating");
  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const radiusKm = sp.get("radiusKm");
  const availableOn = sp.get("availableOn"); // YYYY-MM-DD

  const where: any = {
    status: "approved",
    subscriptionStatus: "active",
    subscriptionPaidUntil: { gt: new Date() },
  };

  if (specialty) where.specialties = { contains: specialty };
  if (province) where.province = province;
  if (gender) where.gender = gender;
  if (language) where.languages = { contains: language };
  if (minRating) {
    const minR = Number(minRating);
    if (!isNaN(minR) && minR > 0) where.rating = { gte: minR };
  }
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const includeAvailability = !!availableOn;
  const includeAppointments = !!availableOn;

  let lawyers = await prisma.lawyer.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhoto: true,
      specialties: true,
      languages: true,
      gender: true,
      province: true,
      city: true,
      narrative: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
      consultationDuration: true,
      availability: includeAvailability,
      appointments: includeAppointments
        ? {
            where: { status: { in: ["confirmed", "pending_payment"] } },
            select: { dateTime: true },
          }
        : false,
    },
    orderBy: { rating: "desc" },
  });

  if (lat && lng && radiusKm) {
    const userLat = Number(lat);
    const userLng = Number(lng);
    const radius = Number(radiusKm);
    if (!isNaN(userLat) && !isNaN(userLng) && !isNaN(radius) && radius > 0) {
      lawyers = lawyers
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          ...l,
          _distanceKm: haversineKm(
            { lat: userLat, lng: userLng },
            { lat: l.latitude!, lng: l.longitude! }
          ),
        }))
        .filter((l) => (l as any)._distanceKm <= radius)
        .sort(
          (a, b) => (a as any)._distanceKm - (b as any)._distanceKm
        ) as typeof lawyers;
    }
  }

  if (availableOn) {
    const date = new Date(`${availableOn}T00:00:00`);
    if (!isNaN(date.getTime())) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayOfWeek = date.getDay();

      lawyers = lawyers.filter((l: any) => {
        const slots = (l.availability || []).filter(
          (a: any) => a.dayOfWeek === dayOfWeek
        );
        if (slots.length === 0) return false;

        const duration = (l.consultationDuration as number) || 60;
        const appointments: { dateTime: Date }[] = (l.appointments || []).filter(
          (a: { dateTime: Date }) => {
            const t = new Date(a.dateTime);
            return t >= dayStart && t < dayEnd;
          }
        );

        for (const slot of slots) {
          const [sH, sM] = String(slot.startTime).split(":").map(Number);
          const [eH, eM] = String(slot.endTime).split(":").map(Number);
          const start = new Date(date);
          start.setHours(sH, sM, 0, 0);
          const end = new Date(date);
          end.setHours(eH, eM, 0, 0);

          for (
            let cursor = new Date(start);
            cursor.getTime() + duration * 60 * 1000 <= end.getTime();
            cursor = new Date(cursor.getTime() + duration * 60 * 1000)
          ) {
            const cursorEnd = new Date(cursor.getTime() + duration * 60 * 1000);
            const conflict = appointments.some((a) => {
              const t = new Date(a.dateTime);
              return t >= cursor && t < cursorEnd;
            });
            if (!conflict) return true;
          }
        }
        return false;
      });
    }
  }

  const sanitized = lawyers.map(({ availability, appointments, ...rest }: any) => rest);

  return NextResponse.json(sanitized);
}
