import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123", 10);
  const clientPassword = await bcrypt.hash("cliente123", 10);
  const lawyerPassword = await bcrypt.hash("abogado123", 10);

  await prisma.admin.upsert({
    where: { username: "ADMIN" },
    update: {},
    create: {
      username: "ADMIN",
      password: hashedPassword,
      consultationFee: 5000,
      subscriptionFee: 5000,
      commissionPercent: 10,
    },
  });

  await prisma.client.upsert({
    where: { email: "cliente@test.com" },
    update: {},
    create: {
      email: "cliente@test.com",
      name: "Juan Perez",
      password: clientPassword,
      phone: "1155667788",
    },
  });

  const subscriptionPaidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  await prisma.lawyer.upsert({
    where: { email: "abogado@test.com" },
    update: {},
    create: {
      email: "abogado@test.com",
      password: lawyerPassword,
      firstName: "Maria",
      lastName: "Gonzalez",
      phone: "1144332211",
      matricula: "T-12345",
      specialties: "Derecho Civil,Derecho de Familia",
      province: "CABA",
      city: "Buenos Aires",
      address: "Av. Corrientes 1234",
      latitude: -34.6037,
      longitude: -58.3816,
      narrative: "Abogada especialista en derecho civil y familia con mas de 10 anos de experiencia.",
      experience: "10 anos ejerciendo en tribunales de CABA.",
      cbuAlias: "maria.gonzalez.mp",
      rating: 4.8,
      reviewCount: 15,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil,
    },
  });

  await prisma.lawyer.upsert({
    where: { email: "abogado2@test.com" },
    update: {},
    create: {
      email: "abogado2@test.com",
      password: lawyerPassword,
      firstName: "Carlos",
      lastName: "Rodriguez",
      phone: "1133445566",
      matricula: "T-67890",
      specialties: "Derecho Penal,Derecho Laboral",
      province: "Buenos Aires",
      city: "La Plata",
      address: "Calle 7 nro 456",
      latitude: -34.9215,
      longitude: -57.9545,
      narrative: "Penalista y laboralista con amplia trayectoria en defensas exitosas.",
      experience: "15 anos de experiencia en fueros penal y laboral.",
      cbuAlias: "carlos.rodriguez.mp",
      rating: 4.5,
      reviewCount: 22,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionPaidUntil,
    },
  });

  console.log("Seed completed:");
  console.log("  Admin: ADMIN / 123");
  console.log("  Cliente: cliente@test.com / cliente123");
  console.log("  Abogado: abogado@test.com / abogado123");
  console.log("  Abogado: abogado2@test.com / abogado123");
  console.log(`  Suscripciones activas hasta: ${subscriptionPaidUntil.toLocaleDateString("es-AR")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
