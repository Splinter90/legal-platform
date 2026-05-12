import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cascade = process.argv.includes("--cascade");

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      email: true,
      _count: {
        select: { appointments: true, payments: true, messages: true, reviews: true },
      },
    },
  });

  console.log(`Total clientes encontrados: ${clients.length}\n`);

  const safe = clients.filter(
    (c) =>
      c._count.appointments === 0 &&
      c._count.payments === 0 &&
      c._count.messages === 0 &&
      c._count.reviews === 0
  );
  const linked = clients.filter((c) => !safe.includes(c));

  console.log(`Sin datos asociados (se borran): ${safe.length}`);
  console.log(`Con datos asociados: ${linked.length}`);
  if (linked.length > 0) {
    linked.forEach((c) =>
      console.log(
        `  - ${c.email}  citas:${c._count.appointments} pagos:${c._count.payments} msgs:${c._count.messages} reviews:${c._count.reviews}`
      )
    );
  }

  if (safe.length > 0) {
    const ids = safe.map((c) => c.id);
    const result = await prisma.client.deleteMany({ where: { id: { in: ids } } });
    console.log(`\nBorrados ${result.count} clientes sin datos.`);
  }

  if (cascade && linked.length > 0) {
    console.log(`\nModo --cascade: borrando datos vinculados de los ${linked.length} restantes...`);
    const ids = linked.map((c) => c.id);

    const apptIds = (
      await prisma.appointment.findMany({
        where: { clientId: { in: ids } },
        select: { id: true },
      })
    ).map((a) => a.id);

    if (apptIds.length > 0) {
      await prisma.caseTracking.deleteMany({ where: { appointmentId: { in: apptIds } } });
    }
    await prisma.payment.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.appointment.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.review.deleteMany({ where: { clientId: { in: ids } } });
    await prisma.message.deleteMany({ where: { clientId: { in: ids } } });

    const result = await prisma.client.deleteMany({ where: { id: { in: ids } } });
    console.log(`Borrados ${result.count} clientes con datos vinculados.`);
  } else if (linked.length > 0) {
    console.log(
      `\nPara borrar también los ${linked.length} con datos asociados (y sus citas/pagos/mensajes/reviews), corre:\n  npx tsx prisma/delete-all-clients.ts --cascade`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
