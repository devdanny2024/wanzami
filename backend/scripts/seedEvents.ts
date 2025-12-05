import { prisma } from "../src/prisma.js";

const eventTypes = [
  "PLAY_START",
  "PLAY_END",
  "SCRUB",
  "SKIP",
  "SEARCH",
  "ADD_TO_LIST",
  "THUMBS_UP",
  "THUMBS_DOWN",
  "IMPRESSION",
] as const;

async function main() {
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    console.log("No profile found, skipping seeding events.");
    return;
  }
  const titles = await prisma.title.findMany({ take: 10 });
  if (!titles.length) {
    console.log("No titles found, skipping seeding events.");
    return;
  }

  const rows = Array.from({ length: 50 }, (_, i) => {
    const title = titles[i % titles.length];
    const eventType = eventTypes[i % eventTypes.length];
    const occurredAt = new Date(Date.now() - Math.floor(Math.random() * 6) * 60 * 60 * 1000);
    return {
      profileId: profile.id,
      titleId: title.id,
      eventType,
      occurredAt,
      country: profile.country ?? "NG",
      deviceId: "seed-device",
      metadata:
        eventType === "PLAY_END"
          ? { completionPercent: Math.random() * 0.8 }
          : eventType === "SCRUB"
            ? { position: Math.random() }
            : undefined,
    };
  });

  await prisma.engagementEvent.createMany({ data: rows });
  console.log(`Seeded ${rows.length} engagement events for profile ${profile.id.toString()}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
