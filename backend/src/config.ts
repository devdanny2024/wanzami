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
};
