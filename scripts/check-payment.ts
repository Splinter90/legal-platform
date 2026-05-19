import { PrismaClient } from "@prisma/client";

const mpPaymentId = process.argv[2];
if (!mpPaymentId) {
  console.error("Uso: npx tsx scripts/check-payment.ts <mpPaymentId>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const payments = await prisma.payment.findMany({
    where: { mpPaymentId },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      appointmentId: true,
      lawyerId: true,
      clientId: true,
      mpPaymentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  console.log(`\nPayments con mpPaymentId="${mpPaymentId}":`);
  console.log(JSON.stringify(payments, null, 2));
  console.log(`\nTotal: ${payments.length}`);

  if (payments.length === 0) {
    console.warn("\n⚠️  No se encontró ningún Payment con ese mpPaymentId.");
  } else if (payments.length > 1) {
    console.error("\n❌ HAY DUPLICADOS — la idempotency falló.");
    process.exit(1);
  } else {
    console.log("\n✅ Un solo Payment (esperado).");
  }

  if (payments[0]?.appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: payments[0].appointmentId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentId: true,
        dateTime: true,
        meetLink: true,
        updatedAt: true,
      },
    });
    console.log("\nAppointment relacionada:");
    console.log(JSON.stringify(appt, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
