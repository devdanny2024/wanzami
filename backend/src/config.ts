import dotenv from "dotenv";

dotenv.config();

const numberOrDefault = (value: string | undefined, fallback: number) =>
  value ? Number(value) : fallback;

export const config = {
  port: numberOrDefault(process.env.PORT, 4000),
  accessSecret: process.env.JWT_ACCESS_SECRET ?? "access-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  deviceLimit: numberOrDefault(process.env.DEVICE_LIMIT, 4),
};
