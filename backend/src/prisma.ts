import { PrismaClient } from "@prisma/client";

const ensureDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return;

  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME;

  if (!host || !name) return;

  const port = process.env.DB_PORT ?? "5432";
  const username = encodeURIComponent(process.env.DB_USER ?? "wanzami");
  const password = process.env.DB_PASSWORD;
  const auth = password ? `${username}:${encodeURIComponent(password)}` : username;

  process.env.DATABASE_URL = `postgresql://${auth}@${host}:${port}/${name}`;
};

ensureDatabaseUrl();

export const prisma = new PrismaClient();
