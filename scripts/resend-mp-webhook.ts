import crypto from "crypto";

// Simula un reenvío de webhook de Mercado Pago al endpoint en producción.
// Útil para testear idempotency.
//
// Uso: npx tsx scripts/resend-mp-webhook.ts <mpPaymentId> [target-url]

const mpPaymentId = process.argv[2];
const targetBase =
  process.argv[3] || "https://legal-platform-cristian1820.vercel.app";

if (!mpPaymentId) {
  console.error("Uso: npx tsx scripts/resend-mp-webhook.ts <mpPaymentId> [base-url]");
  process.exit(1);
}

const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
if (!secret) {
  console.error("Falta MERCADOPAGO_WEBHOOK_SECRET en el entorno (.env).");
  process.exit(1);
}

const requestId = `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ts = String(Date.now());

const dataId = mpPaymentId.toLowerCase();
const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
const hash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

const signatureHeader = `ts=${ts},v1=${hash}`;

const body = {
  action: "payment.updated",
  api_version: "v1",
  data: { id: mpPaymentId },
  date_created: new Date().toISOString(),
  id: Math.floor(Math.random() * 1_000_000_000),
  live_mode: false,
  type: "payment",
  user_id: 0,
};

const url = `${targetBase}/api/payments/webhook?data.id=${encodeURIComponent(
  mpPaymentId
)}&type=payment`;

async function main() {
  console.log("→ POST", url);
  console.log("  x-request-id:", requestId);
  console.log("  x-signature:", signatureHeader);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signatureHeader,
      "x-request-id": requestId,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`\n← HTTP ${res.status}`);
  console.log(text);

  if (res.status >= 400) process.exit(1);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
