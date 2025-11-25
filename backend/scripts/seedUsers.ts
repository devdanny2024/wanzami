import { prisma } from "../src/prisma.js";
import bcrypt from "bcryptjs";

const users = [
  { name: "Demo User One", email: "demo1@example.com" },
  { name: "Demo User Two", email: "demo2@example.com" },
  { name: "Demo User Three", email: "demo3@example.com" },
];

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: passwordHash,
        role: "USER",
        emailVerified: true,
      },
    });
    console.log("Ensured user:", user.email);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
