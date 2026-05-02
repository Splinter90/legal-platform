import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

export async function createPaymentPreference({
  title,
  description,
  amount,
  externalReference,
  payerEmail,
}: {
  title: string;
  description: string;
  amount: number;
  externalReference: string;
  payerEmail: string;
}) {
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: externalReference,
          title,
          description,
          quantity: 1,
          unit_price: amount,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: payerEmail,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=approved`,
        failure: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=failure`,
        pending: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
    },
  });

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  };
}

export async function createSubscriptionPreference({
  lawyerId,
  lawyerEmail,
  amount,
}: {
  lawyerId: string;
  lawyerEmail: string;
  amount: number;
}) {
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: `sub-${lawyerId}`,
          title: "Suscripcion Mensual - LegalConnect",
          description: "Suscripcion mensual para aparecer en la plataforma LegalConnect",
          quantity: 1,
          unit_price: amount,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: lawyerEmail,
      },
      external_reference: `subscription:${lawyerId}`,
      back_urls: {
        success: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=approved&type=subscription`,
        failure: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=failure&type=subscription`,
        pending: `${process.env.NEXTAUTH_URL}/api/payments/callback?status=pending&type=subscription`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
    },
  });

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point,
  };
}
