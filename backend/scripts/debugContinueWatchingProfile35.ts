import { prisma } from "../src/prisma.js";

async function main() {
  const profileId = BigInt(35);

  const events = await prisma.engagementEvent.findMany({
    where: { profileId, eventType: "PLAY_END" },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  console.log(
    "Recent PLAY_END events for profile",
    profileId.toString(),
    JSON.stringify(
      events.map((e) => ({
        id: e.id.toString(),
        titleId: e.titleId?.toString(),
        occurredAt: e.occurredAt,
        metadata: e.metadata,
      })),
      null,
      2,
    ),
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

