import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLawyerAccessToken, getFreeBusy } from "@/lib/google-calendar";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const daysParam = req.nextUrl.searchParams.get("days");

    const lawyer = await prisma.lawyer.findUnique({
      where: {
        id: params.id,
        status: "approved",
        subscriptionStatus: "active",
        subscriptionPaidUntil: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        consultationDuration: true,
        googleRefreshToken: true,
        availability: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    if (!lawyer) {
      return NextResponse.json({ error: "Abogado no encontrado" }, { status: 404 });
    }

    if (lawyer.availability.length === 0) {
      return NextResponse.json({
        lawyerId: lawyer.id,
        lawyerName: `${lawyer.firstName} ${lawyer.lastName}`,
        consultationDuration: lawyer.consultationDuration,
        slots: [],
        message: "Este abogado aún no configuró su disponibilidad",
      });
    }

    const startDate = dateParam ? new Date(dateParam) : new Date();
    const days = Math.min(Number(daysParam) || 14, 30);

    const now = new Date();
    if (startDate < now) {
      startDate.setTime(now.getTime());
    }

    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        lawyerId: params.id,
        status: { in: ["pending_payment", "confirmed"] },
        dateTime: { gte: startDate, lte: endDate },
      },
      select: { dateTime: true },
    });

    const bookedTimes = new Set(
      existingAppointments.map((a) => a.dateTime.getTime())
    );

    let gcalBusy: Array<{ start: string; end: string }> = [];
    if (lawyer.googleRefreshToken) {
      const accessToken = await getLawyerAccessToken(lawyer.id);
      if (accessToken) {
        try {
          gcalBusy = await getFreeBusy({
            accessToken,
            calendarId: lawyer.email,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
          });
        } catch (err) {
          console.error("FreeBusy query failed:", err);
        }
      }
    }

    const busyIntervals = gcalBusy.map((b) => ({
      start: new Date(b.start).getTime(),
      end: new Date(b.end).getTime(),
    }));

    const duration = lawyer.consultationDuration;
    const allSlots: Array<{
      date: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      dateTime: string;
      available: boolean;
    }> = [];

    const availByDay = new Map<number, typeof lawyer.availability>();
    for (const a of lawyer.availability) {
      const existing = availByDay.get(a.dayOfWeek) || [];
      existing.push(a);
      availByDay.set(a.dayOfWeek, existing);
    }

    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      const dow = currentDate.getDay();
      const daySlots = availByDay.get(dow);

      if (daySlots) {
        for (const slot of daySlots) {
          const [startH, startM] = slot.startTime.split(":").map(Number);
          const [endH, endM] = slot.endTime.split(":").map(Number);

          const blockStart = new Date(currentDate);
          blockStart.setHours(startH, startM, 0, 0);

          const blockEnd = new Date(currentDate);
          blockEnd.setHours(endH, endM, 0, 0);

          const slotTime = new Date(blockStart);
          while (slotTime.getTime() + duration * 60000 <= blockEnd.getTime()) {
            const slotEnd = new Date(slotTime.getTime() + duration * 60000);

            if (slotTime > now) {
              const isBooked = bookedTimes.has(slotTime.getTime());

              const isGcalBusy = busyIntervals.some(
                (busy) => slotTime.getTime() < busy.end && slotEnd.getTime() > busy.start
              );

              const slotHH = String(slotTime.getHours()).padStart(2, "0");
              const slotMM = String(slotTime.getMinutes()).padStart(2, "0");
              const endHH = String(slotEnd.getHours()).padStart(2, "0");
              const endMM = String(slotEnd.getMinutes()).padStart(2, "0");

              allSlots.push({
                date: currentDate.toISOString().split("T")[0],
                dayOfWeek: dow,
                startTime: `${slotHH}:${slotMM}`,
                endTime: `${endHH}:${endMM}`,
                dateTime: slotTime.toISOString(),
                available: !isBooked && !isGcalBusy,
              });
            }

            slotTime.setMinutes(slotTime.getMinutes() + duration);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      lawyerId: lawyer.id,
      lawyerName: `${lawyer.firstName} ${lawyer.lastName}`,
      consultationDuration: lawyer.consultationDuration,
      googleCalendarConnected: !!lawyer.googleRefreshToken,
      slots: allSlots,
    });
  } catch (error) {
    console.error("Slots error:", error);
    return NextResponse.json({ error: "Error al obtener disponibilidad" }, { status: 500 });
  }
}
