import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLawyerAccessToken, createCalendarEvent } from "@/lib/google-calendar";
import { verifyMpWebhookSignature } from "@/lib/mp-webhook-signature";
import {
  sendPaymentConfirmedToLawyer,
  sendPaymentConfirmedToClient,
  sendSubscriptionActivated,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();

    const verification = verifyMpWebhookSignature({
      signatureHeader: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      body: bodyText,
      queryDataId: req.nextUrl.searchParams.get("data.id"),
      queryId: req.nextUrl.searchParams.get("id"),
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    });

    if (!verification.ok) {
      console.error("[mp-webhook] verification failed", {
        reason: verification.reason,
        url: req.nextUrl.toString(),
        bodySnippet: bodyText.slice(0, 500),
        ...(verification.debug ?? {}),
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const queryType = req.nextUrl.searchParams.get("type") || req.nextUrl.searchParams.get("topic");
    const queryId = req.nextUrl.searchParams.get("data.id") || req.nextUrl.searchParams.get("id");
    const eventType = body.type || body.topic || queryType;
    const eventId = body.data?.id || body.id || queryId;

    console.log("[mp-webhook] received", { eventType, eventId, action: body.action });

    if (eventType !== "payment") {
      console.log("[mp-webhook] ignoring non-payment event", { eventType });
      return NextResponse.json({ received: true, ignored: eventType });
    }

    if (eventId) {
      const mpPaymentId = String(eventId);

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        const errBody = await mpResponse.text().catch(() => "");
        console.error("[mp-webhook] Failed to fetch payment from MP", {
          status: mpResponse.status,
          mpPaymentId,
          errBody: errBody.slice(0, 300),
        });
        return NextResponse.json({ error: "Payment not found in MP" }, { status: 404 });
      }

      const paymentData = await mpResponse.json();
      const externalRef = paymentData.external_reference || "";
      const status = paymentData.status;

      if (externalRef.startsWith("appointment:")) {
        await handleAppointmentPayment(externalRef, status, mpPaymentId);
      } else if (externalRef.startsWith("subscription:")) {
        await handleSubscriptionPayment(externalRef, status, mpPaymentId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

async function handleAppointmentPayment(externalRef: string, status: string, mpPaymentId: string) {
  const appointmentId = externalRef.replace("appointment:", "");

  const alreadyProcessed = await prisma.payment.findUnique({
    where: { mpPaymentId },
  });
  if (alreadyProcessed) {
    console.log("[mp-webhook] already processed", { mpPaymentId, appointmentId });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: { appointmentId, status: "pending" },
  });
  if (!payment) return;

  const nextStatus =
    status === "approved" ? "completed" : status === "rejected" ? "failed" : status;

  let claimed: { count: number };
  try {
    claimed = await prisma.payment.updateMany({
      where: { id: payment.id, mpPaymentId: null },
      data: { status: nextStatus, mpPaymentId },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      console.log("[mp-webhook] race condition resolved by DB unique constraint", {
        mpPaymentId,
        appointmentId,
      });
      return;
    }
    throw e;
  }

  if (claimed.count === 0) {
    console.log("[mp-webhook] payment ya fue reclamado por un evento concurrente", {
      mpPaymentId,
      appointmentId,
    });
    return;
  }

  if (status === "approved") {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        lawyer: { select: { id: true, firstName: true, lastName: true, email: true, consultationDuration: true } },
        client: { select: { id: true, name: true, email: true } },
      },
    });

    if (!appointment) return;

    let meetLink: string | null = null;
    let googleEventId: string | null = null;

    const accessToken = await getLawyerAccessToken(appointment.lawyerId);
    if (accessToken) {
      try {
        const startDate = new Date(appointment.dateTime);
        const duration = appointment.lawyer.consultationDuration || 60;
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

        const calendarResult = await createCalendarEvent({
          accessToken,
          summary: `Consulta Legal - ${appointment.client.name}`,
          description: `Consulta legal con ${appointment.client.name}.\nNotas: ${appointment.notes || "Sin notas adicionales"}`,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          attendees: [appointment.client.email, appointment.lawyer.email],
        });

        meetLink = calendarResult.meetLink || null;
        googleEventId = calendarResult.eventId || null;
      } catch (calError) {
        console.error("Error creating calendar event from webhook:", calError);
      }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "confirmed",
        paymentStatus: "completed",
        paymentId: mpPaymentId,
        meetLink,
        googleEventId,
      },
    });

    const meetMsg = meetLink
      ? ` Link de Meet: ${meetLink}`
      : "";

    await prisma.notification.createMany({
      data: [
        {
          userId: appointment.lawyerId,
          userType: "lawyer",
          type: "payment_confirmed",
          title: "Pago confirmado - Nueva cita",
          message: `${appointment.client.name} pagó la consulta para el ${new Date(appointment.dateTime).toLocaleDateString("es-AR")}.${meetMsg}`,
          link: "/lawyer/appointments",
        },
        {
          userId: appointment.clientId,
          userType: "client",
          type: "payment_success",
          title: "Pago aprobado - Cita confirmada",
          message: `Tu consulta con ${appointment.lawyer.firstName} ${appointment.lawyer.lastName} está confirmada.${meetMsg}`,
          link: "/client/appointments",
        },
      ],
    });

    const dateStr = new Date(appointment.dateTime).toLocaleDateString("es-AR");
    const lawyerFullName = `${appointment.lawyer.firstName} ${appointment.lawyer.lastName}`;

    sendPaymentConfirmedToLawyer(
      appointment.lawyer.email,
      lawyerFullName,
      appointment.client.name,
      dateStr,
      meetLink
    ).catch((err) => console.error("Email send failed:", err?.message || err));

    const startDate = new Date(appointment.dateTime);
    const durationMin = appointment.lawyer.consultationDuration || 60;
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

    sendPaymentConfirmedToClient(
      appointment.client.email,
      appointment.client.name,
      lawyerFullName,
      dateStr,
      meetLink,
      {
        appointmentId: appointment.id,
        startsAt: startDate,
        endsAt: endDate,
        lawyerEmail: appointment.lawyer.email,
      }
    ).catch((err) => console.error("Email send failed:", err?.message || err));
  }
}

async function handleSubscriptionPayment(externalRef: string, status: string, mpPaymentId: string) {
  const lawyerId = externalRef.replace("subscription:", "");

  const alreadyProcessed = await prisma.payment.findUnique({
    where: { mpPaymentId },
  });
  if (alreadyProcessed) {
    console.log("[mp-webhook] subscription already processed", { mpPaymentId, lawyerId });
    return;
  }

  const payment = await prisma.payment.findFirst({
    where: {
      lawyerId,
      type: "subscription",
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) return;

  const nextStatus =
    status === "approved" ? "completed" : status === "rejected" ? "failed" : status;

  let claimed: { count: number };
  try {
    claimed = await prisma.payment.updateMany({
      where: { id: payment.id, mpPaymentId: null },
      data: { status: nextStatus, mpPaymentId },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      console.log("[mp-webhook] subscription race condition resolved by DB unique constraint", {
        mpPaymentId,
        lawyerId,
      });
      return;
    }
    throw e;
  }

  if (claimed.count === 0) {
    console.log("[mp-webhook] subscription payment ya fue reclamado por un evento concurrente", {
      mpPaymentId,
      lawyerId,
    });
    return;
  }

  if (status === "approved") {
    const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });
    if (!lawyer) return;

    const baseDate = lawyer.subscriptionPaidUntil && lawyer.subscriptionPaidUntil > new Date()
      ? lawyer.subscriptionPaidUntil
      : new Date();
    const paidUntil = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.lawyer.update({
      where: { id: lawyerId },
      data: {
        subscriptionStatus: "active",
        subscriptionPaidUntil: paidUntil,
      },
    });

    await prisma.notification.create({
      data: {
        userId: lawyerId,
        userType: "lawyer",
        type: "subscription_active",
        title: "Suscripción activada",
        message: `Tu suscripción está activa hasta el ${paidUntil.toLocaleDateString("es-AR")}`,
        link: "/lawyer/profile",
      },
    });

    sendSubscriptionActivated(
      lawyer.email,
      `${lawyer.firstName} ${lawyer.lastName}`,
      paidUntil.toLocaleDateString("es-AR")
    ).catch((err) => console.error("Email send failed:", err?.message || err));
  }
}
