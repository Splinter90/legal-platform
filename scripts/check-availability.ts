import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lawyer = await prisma.lawyer.findUnique({
    where: { email: "vecchioprofe@gmail.com" },
    include: {
      availability: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!lawyer) {
    console.log("Lawyer not found");
    return;
  }

  console.log({
    id: lawyer.id,
    email: lawyer.email,
    status: lawyer.status,
    subscriptionStatus: lawyer.subscriptionStatus,
    subscriptionPaidUntil: lawyer.subscriptionPaidUntil,
    consultationDuration: lawyer.consultationDuration,
    profilePhoto: lawyer.profilePhoto,
    availabilityCount: lawyer.availability.length,
  });
  console.log("Availability:", lawyer.availability);
}

main().catch(console.error).finally(() => prisma.$disconnect());
