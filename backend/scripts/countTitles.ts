import { prisma } from "../src/prisma.js";

async function main() {
  const count = await prisma.title.count();
  console.log("Title count:", count);
  const sample = await prisma.title.findMany({ take: 5 });
  console.log("Sample titles:", sample.map((t) => ({ id: t.id, name: t.name, type: t.type, countries: t.countryAvailability })));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
