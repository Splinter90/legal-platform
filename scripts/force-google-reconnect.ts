import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const affected = await prisma.lawyer.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true, email: true, status: true },
  });

  console.log(`Abogados con googleRefreshToken: ${affected.length}`);
  affected.forEach((l) => {
    console.log(`  - ${l.email} (status=${l.status})`);
  });

  if (affected.length === 0) {
    console.log("Nada para hacer.");
    return;
  }

  if (dryRun) {
    console.log("\n[dry-run] No se modifica la DB. Quita --dry-run para ejecutar.");
    return;
  }

  const result = await prisma.lawyer.updateMany({
    where: { googleRefreshToken: { not: null } },
    data: { googleRefreshToken: null },
  });

  console.log(`\nListo: ${result.count} abogados con refresh token vaciado.`);
  console.log(
    "La próxima vez que cada uno se loguee con Google, NextAuth pide consent (scope calendar.events) y guarda un refresh_token nuevo. Mientras tanto, en el dashboard verán el banner 'Conectá tu Google Calendar'."
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
