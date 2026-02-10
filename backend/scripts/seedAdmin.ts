import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma.js";

async function main() {
  const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password =
    process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const name =
    process.env.BOOTSTRAP_SUPER_ADMIN_NAME ||
    process.env.ADMIN_NAME ||
    "Super Admin";

  if (!email || !password) {
    console.error(
      "Missing admin bootstrap env vars. Set BOOTSTRAP_SUPER_ADMIN_EMAIL and BOOTSTRAP_SUPER_ADMIN_PASSWORD."
    );
    process.exit(1);
  }

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
