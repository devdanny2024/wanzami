import dotenv from "dotenv";

dotenv.config();

const numberOrDefault = (value: string | undefined, fallback: number) =>
  value ? Number(value) : fallback;

export const config = {
  port: numberOrDefault(process.env.PORT, 4000),
  accessSecret: process.env.JWT_ACCESS_SECRET ?? "access-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
  // Default sessions: 2 hours for regular users, unless overridden by env.
  // Admin access tokens get their own longer TTL (see adminAccessTokenTtl).
  accessTokenTtl: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "2h",
  adminAccessTokenTtl: process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN ?? "365d",
  refreshTokenTtl: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "365d",
  deviceLimit: numberOrDefault(process.env.DEVICE_LIMIT, 4),
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  ffmpegPath: process.env.FFMPEG_PATH,
  uploadMaxConcurrency: numberOrDefault(process.env.UPLOAD_MAX_CONCURRENCY, 10),
  downloadMaxConcurrency: numberOrDefault(process.env.DOWNLOAD_MAX_CONCURRENCY, 10),
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
    publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL ?? "",
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
  },
  flutterwave: {
    publicKey: process.env.FLW_PUBLIC_KEY ?? "",
    secretKey: process.env.FLW_SECRET_KEY ?? "",
    encryptionKey: process.env.FLW_ENCRYPTION_KEY ?? "",
    baseUrl: process.env.FLW_BASE_URL ?? "https://api.flutterwave.com",
    webhookSecret: process.env.FLW_WEBHOOK_SECRET ?? "",
  },
  ppvAccessDays: numberOrDefault(process.env.PPV_ACCESS_DAYS, 30),
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@wanzami.com",
};
