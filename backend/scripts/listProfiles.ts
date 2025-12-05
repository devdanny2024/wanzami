import { prisma } from "../src/prisma.js";

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, country: true },
  });
  console.log("Profiles:", profiles);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
