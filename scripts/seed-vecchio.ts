import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("vecchio123", 10);
  const subscriptionPaidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const lawyer = await prisma.lawyer.upsert({
    where: { email: "vecchioprofe@gmail.com" },
    update: {
      password,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil,
    },
    create: {
      email: "vecchioprofe@gmail.com",
      password,
      firstName: "Cristian",
      lastName: "Vecchio",
      phone: "1199887766",
      matricula: "T-99999",
      specialties: "Derecho Civil,Derecho de Familia",
      province: "CABA",
      city: "Buenos Aires",
      address: "Av. Corrientes 2000",
      latitude: -34.6037,
      longitude: -58.3816,
      narrative:
        "Abogado especialista en derecho civil y familia para pruebas del flujo de pago.",
      experience: "10 anos ejerciendo en tribunales de CABA.",
      cbuAlias: "vecchio.profe.mp",
      rating: 4.7,
      reviewCount: 5,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil,
      consultationDuration: 60,
    },
  });

  console.log("OK:", { id: lawyer.id, email: lawyer.email, status: lawyer.status, subscriptionStatus: lawyer.subscriptionStatus, subscriptionPaidUntil: lawyer.subscriptionPaidUntil });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
