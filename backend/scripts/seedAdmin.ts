import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma.js";

async function main() {
  const email = "Soliupeter@gmail.com";
  const password = "wanzami12#";
  const name = "Super Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password: passwordHash,
      role: "SUPER_ADMIN",
      emailVerified: true,
      name,
    },
    create: {
      email: email.toLowerCase(),
      password: passwordHash,
      name,
      role: "SUPER_ADMIN",
      emailVerified: true,
    },
  });

  console.log("Admin ensured:", {
    id: user.id.toString(),
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
