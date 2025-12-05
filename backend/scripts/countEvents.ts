import { prisma } from "../src/prisma.js";

async function main() {
  const count = await prisma.engagementEvent.count();
  const recent = await prisma.engagementEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 10,
  });
  console.log("Event count:", count);
  console.log(
    "Recent:",
    recent.map((e) => ({
      id: e.id.toString(),
      type: e.eventType,
      occurredAt: e.occurredAt,
      profileId: e.profileId?.toString(),
      titleId: e.titleId?.toString(),
    }))
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
