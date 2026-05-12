import nodemailer from "nodemailer";

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Uso: npm run test:smtp -- destino@ejemplo.com");
    process.exit(1);
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass) {
    console.error("Faltan SMTP_HOST / SMTP_USER / SMTP_PASS en .env");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  console.log(`Verificando conexión SMTP con ${host}...`);
  await transporter.verify();
  console.log("Conexión SMTP OK.");

  console.log(`Enviando email de prueba a ${to}...`);
  const info = await transporter.sendMail({
    from: from || user,
    to,
    subject: "LegalConnect - prueba SMTP",
    text: "Si recibís este email, la configuración SMTP funciona.",
    html: "<p>Si recibís este email, la configuración <strong>SMTP funciona</strong>.</p>",
  });
  console.log("Enviado. messageId:", info.messageId);
}

main().catch((err) => {
  console.error("Error SMTP:", err);
  process.exit(1);
});
