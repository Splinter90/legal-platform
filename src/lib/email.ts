import nodemailer from "nodemailer";

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
  meetLink?: string | null
) {
  const meetSection = meetLink
    ? `<p>Link de Google Meet: <a href="${meetLink}">${meetLink}</a></p>`
    : "";

  return sendEmail({
    to: clientEmail,
    subject: "Cita confirmada - LegalConnect",
    body: `<p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu consulta con <strong>${lawyerFullName}</strong> para el <strong>${dateStr}</strong> esta confirmada.</p>
      ${meetSection}
      <p><a href="${process.env.NEXTAUTH_URL}/client/appointments" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Ver mis citas</a></p>`,
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
