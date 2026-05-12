import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: npx tsx prisma/delete-client.ts <email>");
    console.error("       npx tsx prisma/delete-client.ts --list   (listar todos)");
    process.exit(1);
  }

  if (email === "--list") {
    const clients = await prisma.client.findMany({
      select: {
        email: true,
        name: true,
        googleId: true,
        createdAt: true,
        _count: { select: { appointments: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(`\nTotal de clientes en la base: ${clients.length}\n`);
    clients.forEach((c) => {
      console.log(
        `- ${c.email}  (${c.name})  citas:${c._count.appointments} pagos:${c._count.payments}  google:${c.googleId ? "si" : "no"}  creado:${c.createdAt.toISOString().slice(0, 10)}`
      );
    });
    return;
  }

  const client = await prisma.client.findUnique({
    where: { email },
    include: { _count: { select: { appointments: true, payments: true, messages: true, reviews: true } } },
  });

  if (!client) {
    console.log(`No existe cliente con email ${email}.`);
    return;
  }

  if (
    client._count.appointments > 0 ||
    client._count.payments > 0 ||
    client._count.messages > 0 ||
    client._count.reviews > 0
  ) {
    console.error(
      `El cliente ${email} tiene datos asociados (citas:${client._count.appointments}, pagos:${client._count.payments}, mensajes:${client._count.messages}, reviews:${client._count.reviews}). No lo borro automáticamente. Limpialo a mano si querés borrarlo.`
    );
    process.exit(2);
  }

  await prisma.client.delete({ where: { email } });
  console.log(`Cliente ${email} borrado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
