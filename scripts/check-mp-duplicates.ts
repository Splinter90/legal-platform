import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dupes = await prisma.$queryRawUnsafe<Array<{ mpPaymentId: string; count: bigint }>>(
    `SELECT "mpPaymentId", COUNT(*) as count
     FROM "Payment"
     WHERE "mpPaymentId" IS NOT NULL
     GROUP BY "mpPaymentId"
     HAVING COUNT(*) > 1`
  );

  if (dupes.length === 0) {
    console.log("OK — no hay duplicados de mpPaymentId.");
    return;
  }

  console.error(`HAY ${dupes.length} mpPaymentId duplicados:`);
  for (const d of dupes) {
    console.error(`  ${d.mpPaymentId} -> ${d.count} payments`);
  }
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
