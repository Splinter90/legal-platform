import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx prisma/add-test-lawyer.ts <email>");
    process.exit(1);
  }

  const existing = await prisma.lawyer.findUnique({ where: { email } });
  if (existing) {
    await prisma.lawyer.update({
      where: { email },
      data: { status: "approved", subscriptionStatus: "active" },
    });
    console.log(`Lawyer ${email} ya existía: actualizado a approved + suscripción active.`);
    return;
  }

  await prisma.client.deleteMany({ where: { email } });

  const lawyer = await prisma.lawyer.create({
    data: {
      email,
      firstName: "Test",
      lastName: "Abogado",
      matricula: "TEST-0001",
      specialties: "Derecho Civil",
      province: "Buenos Aires",
      city: "Mar del Plata",
      narrative: "Abogado de testeo creado desde script.",
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`Lawyer creado: ${lawyer.email} (id: ${lawyer.id}) — status approved.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
