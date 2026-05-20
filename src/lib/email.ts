import nodemailer from "nodemailer";
import { buildAppointmentIcs } from "./ics";

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM = process.env.SMTP_FROM || "LegalConnect <noreply@legalconnect.com>";

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: EmailParams): Promise<boolean> {
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html: wrapTemplate(subject, body),
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

function wrapTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:24px 32px;border-radius:16px 16px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">LegalConnect</h1>
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
      <h2 style="color:#1e293b;margin:0 0 16px;font-size:18px">${title}</h2>
      <div style="color:#475569;font-size:15px;line-height:1.6">${content}</div>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px">
      Este email fue enviado automaticamente por LegalConnect.
    </p>
  </div>
</body>
</html>`;
}

export async function sendAppointmentCreatedToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  clientName: string,
  dateStr: string
) {
  return sendEmail({
    to: lawyerEmail,
    subject: "Nueva solicitud de cita - LegalConnect",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p><strong>${clientName}</strong> quiere agendar una consulta para el <strong>${dateStr}</strong>.</p>
      <p>El pago esta pendiente de confirmacion. Te notificaremos cuando se acredite.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
  });
}

export async function sendPaymentConfirmedToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  clientName: string,
  dateStr: string,
  meetLink?: string | null
) {
  const meetSection = meetLink
    ? `<p>Link de Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : "";

  return sendEmail({
    to: lawyerEmail,
    subject: "Pago confirmado - Nueva cita",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p><strong>${clientName}</strong> pago la consulta para el <strong>${dateStr}</strong>. La cita esta confirmada.</p>
      ${meetSection}
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
  });
}

export async function sendPaymentConfirmedToClient(
  clientEmail: string,
  clientName: string,
  lawyerFullName: string,
  dateStr: string,
  meetLink?: string | null,
  icsContext?: {
    appointmentId: string;
    startsAt: Date;
    endsAt: Date;
    lawyerEmail?: string | null;
  } | null
) {
  const meetSection = meetLink
    ? `<p>Link de Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : "";

  const subject = "Cita confirmada - LegalConnect";
  const body = `<p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu consulta con <strong>${lawyerFullName}</strong> para el <strong>${dateStr}</strong> esta confirmada.</p>
      ${meetSection}
      <p>Adjuntamos un archivo <strong>.ics</strong> para que lo agregues a Google Calendar, Outlook o Apple Calendar.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/client/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`;

  if (!icsContext) {
    return sendEmail({ to: clientEmail, subject, body });
  }

  const ics = buildAppointmentIcs({
    id: icsContext.appointmentId,
    startsAt: icsContext.startsAt,
    endsAt: icsContext.endsAt,
    title: `Consulta legal con ${lawyerFullName}`,
    description: meetLink ? `Google Meet: ${meetLink}` : "",
    location: meetLink || null,
    url: meetLink || null,
    organizerEmail: icsContext.lawyerEmail || null,
    organizerName: lawyerFullName,
    attendeeEmail: clientEmail,
    attendeeName: clientName,
  });

  return sendEmailWithIcs({
    to: clientEmail,
    subject,
    body,
    ics,
    icsFileName: `consulta-${icsContext.appointmentId}.ics`,
  });
}

export async function sendSubscriptionActivated(
  lawyerEmail: string,
  lawyerName: string,
  paidUntilStr: string
) {
  return sendEmail({
    to: lawyerEmail,
    subject: "Suscripcion activada - LegalConnect",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p>Tu suscripcion esta activa hasta el <strong>${paidUntilStr}</strong>.</p>
      <p>Ya podes recibir clientes a traves de la plataforma.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ir al Dashboard</a></p>`,
  });
}

export async function sendLawyerStatusUpdate(
  lawyerEmail: string,
  lawyerName: string,
  status: "approved" | "rejected" | "suspended",
  rejectionReason?: string | null
) {
  if (status === "approved") {
    return sendEmail({
      to: lawyerEmail,
      subject: "Tu perfil fue aprobado - LegalConnect",
      body: `<p>Hola <strong>${lawyerName}</strong>,</p>
        <p>Tu perfil profesional fue <strong style="color:#059669">aprobado</strong>. Ya podes activar tu suscripcion mensual y empezar a recibir clientes a traves de la plataforma.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/lawyer/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Activar suscripcion</a></p>`,
    });
  }

  if (status === "rejected") {
    const reasonBlock = rejectionReason
      ? `<p style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:16px 0;border-radius:6px"><strong>Motivo:</strong> ${rejectionReason}</p>`
      : "";
    return sendEmail({
      to: lawyerEmail,
      subject: "Tu solicitud fue rechazada - LegalConnect",
      body: `<p>Hola <strong>${lawyerName}</strong>,</p>
        <p>Tu solicitud fue <strong style="color:#dc2626">rechazada</strong>.</p>
        ${reasonBlock}
        <p>Podes corregir tus datos y reenviar la solicitud desde tu panel.</p>
        <p><a href="${process.env.NEXTAUTH_URL}/lawyer/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Revisar mi perfil</a></p>`,
    });
  }

  if (status === "suspended") {
    return sendEmail({
      to: lawyerEmail,
      subject: "Tu perfil fue suspendido - LegalConnect",
      body: `<p>Hola <strong>${lawyerName}</strong>,</p>
        <p>Tu perfil fue <strong style="color:#d97706">suspendido</strong> temporalmente. Durante la suspension no vas a aparecer en busquedas ni recibir nuevas consultas.</p>
        <p>Para mas informacion contactanos respondiendo este email.</p>`,
    });
  }

  return false;
}

export async function sendSubscriptionExpired(
  lawyerEmail: string,
  lawyerName: string
) {
  return sendEmail({
    to: lawyerEmail,
    subject: "Tu suscripcion vencio - LegalConnect",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p>Tu suscripcion mensual <strong style="color:#dc2626">vencio</strong>. Mientras no la renueves no vas a aparecer en busquedas ni en el mapa, y los clientes no podran reservar consultas con vos.</p>
      <p>Renovala desde el dashboard para volver a estar visible.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Renovar suscripcion</a></p>`,
  });
}

export async function sendSubscriptionExpiringSoon(
  lawyerEmail: string,
  lawyerName: string,
  paidUntilStr: string,
  daysLeft: number
) {
  return sendEmail({
    to: lawyerEmail,
    subject: `Tu suscripcion vence en ${daysLeft} dia${daysLeft === 1 ? "" : "s"}`,
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p>Tu suscripcion mensual <strong style="color:#d97706">vence el ${paidUntilStr}</strong> (en ${daysLeft} dia${daysLeft === 1 ? "" : "s"}).</p>
      <p>Renovala antes para no perder visibilidad en la plataforma.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Renovar ahora</a></p>`,
  });
}

export async function sendAppointmentReminderToClient(
  clientEmail: string,
  clientName: string,
  lawyerFullName: string,
  dateStr: string,
  meetLink?: string | null
) {
  const meetSection = meetLink
    ? `<p>Link de Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : "";
  return sendEmail({
    to: clientEmail,
    subject: "Recordatorio: tu consulta es manana",
    body: `<p>Hola <strong>${clientName}</strong>,</p>
      <p>Te recordamos que tenes una consulta con <strong>${lawyerFullName}</strong> el <strong>${dateStr}</strong>.</p>
      ${meetSection}
      <p>Asegurate de tener buena conexion y los documentos relevantes a mano.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/client/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
  });
}

export async function sendAppointmentReminderToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  clientName: string,
  dateStr: string,
  meetLink?: string | null
) {
  const meetSection = meetLink
    ? `<p>Link de Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : "";
  return sendEmail({
    to: lawyerEmail,
    subject: "Recordatorio: consulta manana",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p>Manana tenes una consulta con <strong>${clientName}</strong> el <strong>${dateStr}</strong>.</p>
      ${meetSection}
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
  });
}

export async function sendAppointmentRefundedToClient(
  clientEmail: string,
  clientName: string,
  lawyerFullName: string,
  dateStr: string,
  amount: number,
  refundOk: boolean
) {
  const amountStr = amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
  const refundBlock = refundOk
    ? `<p>Te <strong>reembolsamos ${amountStr}</strong> a tu medio de pago. Puede demorar entre 1 y 10 dias habiles en aparecer segun tu banco o tarjeta.</p>`
    : `<p>El reembolso de <strong>${amountStr}</strong> quedo pendiente y lo vamos a procesar manualmente. Te contactamos a la brevedad si necesitamos algun dato.</p>`;
  return sendEmail({
    to: clientEmail,
    subject: "Tu consulta fue cancelada - LegalConnect",
    body: `<p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu consulta con <strong>${lawyerFullName}</strong> del <strong>${dateStr}</strong> fue cancelada por el abogado.</p>
      ${refundBlock}
      <p><a href="${process.env.NEXTAUTH_URL}/client/lawyers" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Buscar otro abogado</a></p>`,
  });
}

export async function sendAppointmentCancelledByClientToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  clientName: string,
  dateStr: string,
  amount: number,
  refundOk: boolean
) {
  const amountStr = amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
  const refundBlock = refundOk
    ? `<p>Se le reembolsaron <strong>${amountStr}</strong> al cliente.</p>`
    : `<p>El reembolso de <strong>${amountStr}</strong> al cliente quedo <strong style="color:#d97706">pendiente</strong> y lo vamos a procesar manualmente.</p>`;
  return sendEmail({
    to: lawyerEmail,
    subject: "Una cita fue cancelada por el cliente - LegalConnect",
    body: `<p>Hola <strong>${lawyerName}</strong>,</p>
      <p><strong>${clientName}</strong> cancelo la consulta que tenian agendada para el <strong>${dateStr}</strong>.</p>
      ${refundBlock}
      <p>El espacio en tu agenda quedo liberado.</p>
      <p><a href="${process.env.NEXTAUTH_URL}/lawyer/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
  });
}

export async function sendReviewRequestToClient(
  clientEmail: string,
  clientName: string,
  lawyerFullName: string,
  appointmentId: string
) {
  const link = `${process.env.NEXTAUTH_URL}/client/appointments?review=${appointmentId}`;
  return sendEmail({
    to: clientEmail,
    subject: "Como fue tu consulta? - LegalConnect",
    body: `<p>Hola <strong>${clientName}</strong>,</p>
      <p>Esperamos que tu consulta con <strong>${lawyerFullName}</strong> haya ido bien.</p>
      <p>Te tomas un minuto para dejarle una reseña? A otros clientes les sirve muchisimo para elegir.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Calificar mi consulta</a></p>`,
  });
}

export async function sendEmailWithIcs({
  to,
  subject,
  body,
  ics,
  icsFileName,
}: {
  to: string;
  subject: string;
  body: string;
  ics: string;
  icsFileName: string;
}): Promise<boolean> {
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html: wrapTemplate(subject, body),
      attachments: [
        {
          filename: icsFileName,
          content: ics,
          contentType: "text/calendar; charset=utf-8; method=PUBLISH",
        },
      ],
    });
    return true;
  } catch (err) {
    console.error("Email (.ics) send error:", err);
    return false;
  }
}

export async function sendAdminPasswordReset(
  adminEmail: string,
  adminUsername: string,
  resetLink: string,
  expiresInMinutes: number
) {
  return sendEmail({
    to: adminEmail,
    subject: "Restablecer contrasena de admin - LegalConnect",
    body: `<p>Hola <strong>${adminUsername}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contrasena del panel de administracion.</p>
      <p>El link es valido por <strong>${expiresInMinutes} minutos</strong> y solo puede usarse una vez.</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Restablecer contrasena</a></p>
      <p style="color:#94a3b8;font-size:13px;margin-top:16px">Si no fuiste vos, ignora este email. Tu contrasena no va a cambiar.</p>`,
  });
}

export async function sendMeetLinkToClient(
  clientEmail: string,
  clientName: string,
  lawyerFullName: string,
  meetLink: string
) {
  return sendEmail({
    to: clientEmail,
    subject: "Link de reunion disponible - LegalConnect",
    body: `<p>Hola <strong>${clientName}</strong>,</p>
      <p>El link de Google Meet para tu consulta con <strong>${lawyerFullName}</strong> ya esta disponible:</p>
      <p><a href="${meetLink}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Unirse a Google Meet</a></p>`,
  });
}
