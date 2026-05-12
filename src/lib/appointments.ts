import { prisma } from "@/lib/prisma";
import { refundMpPayment } from "@/lib/mercadopago";
import { deleteCalendarEvent, getLawyerAccessToken } from "@/lib/google-calendar";

export type CancelRefundOutcome = {
  attempted: boolean;
  ok: boolean;
  amount: number;
  refundId: string | null;
  error: string | null;
};

export type CancelResult = {
  ok: boolean;
  reason?: string;
  status?: number;
  refund: CancelRefundOutcome;
  appointment?: Awaited<ReturnType<typeof prisma.appointment.update>>;
};

export async function cancelAppointmentWithRefund(
  appointmentId: string
): Promise<CancelResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    return {
      ok: false,
      reason: "Cita no encontrada",
      status: 404,
      refund: emptyRefund(),
    };
  }

  if (appointment.status !== "confirmed" && appointment.status !== "pending_payment") {
    return {
      ok: false,
      reason: `No se puede cancelar una cita en estado "${appointment.status}"`,
      status: 400,
      refund: emptyRefund(),
    };
  }

  const shouldRefund =
    appointment.status === "confirmed" && appointment.paymentStatus === "completed";

  const refund: CancelRefundOutcome = emptyRefund();

  if (shouldRefund) {
    refund.attempted = true;

    const paidPayment = await prisma.payment.findFirst({
      where: {
        appointmentId: appointment.id,
        type: "consultation",
        status: "completed",
      },
    });

    if (paidPayment?.mpPaymentId) {
      const result = await refundMpPayment(paidPayment.mpPaymentId);
      if (result.ok) {
        refund.ok = true;
        refund.amount = result.amount || paidPayment.amount;
        refund.refundId = result.refundId;
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            lawyerId: appointment.lawyerId,
            clientId: appointment.clientId,
            type: "refund",
            amount: refund.amount,
            platformFee: 0,
            lawyerAmount: 0,
            status: "completed",
            mpPaymentId: result.refundId,
          },
        });
      } else {
        refund.error = result.error;
        console.error("[cancelAppointment] refund failed:", result.error);
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            lawyerId: appointment.lawyerId,
            clientId: appointment.clientId,
            type: "refund",
            amount: paidPayment.amount,
            platformFee: 0,
            lawyerAmount: 0,
            status: "failed",
          },
        });
      }
    } else {
      refund.error = "No se encontro el pago original";
    }

    if (appointment.googleEventId) {
      const accessToken = await getLawyerAccessToken(appointment.lawyerId);
      if (accessToken) {
        deleteCalendarEvent({
          accessToken,
          eventId: appointment.googleEventId,
        }).catch((err) =>
          console.error("[cancelAppointment] calendar delete failed:", err)
        );
      }
    }
  }

  const updateData: {
    status: string;
    paymentStatus?: string;
    meetLink?: string | null;
    googleEventId?: string | null;
  } = { status: "cancelled" };

  if (shouldRefund) {
    updateData.paymentStatus = refund.ok ? "refunded" : "refund_failed";
    updateData.meetLink = null;
    updateData.googleEventId = null;
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
  });

  return { ok: true, refund, appointment: updated };
}

function emptyRefund(): CancelRefundOutcome {
  return { attempted: false, ok: false, amount: 0, refundId: null, error: null };
}
