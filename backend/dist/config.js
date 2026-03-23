import dotenv from "dotenv";
dotenv.config();
const numberOrDefault = (value, fallback) => value ? Number(value) : fallback;
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
        accelerate: process.env.S3_ACCELERATE === "true",
    },
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    redis: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
        tls: process.env.REDIS_TLS === "true" ||
            (process.env.REDIS_URL ?? "").toLowerCase().startsWith("rediss://"),
        connectTimeoutMs: numberOrDefault(process.env.REDIS_CONNECT_TIMEOUT_MS, 10000),
        lazyConnect: process.env.REDIS_LAZY_CONNECT !== "false",
        retryBaseDelayMs: numberOrDefault(process.env.REDIS_RETRY_BASE_DELAY_MS, 250),
        retryMaxDelayMs: numberOrDefault(process.env.REDIS_RETRY_MAX_DELAY_MS, 5000),
        maxReconnectAttempts: numberOrDefault(process.env.REDIS_MAX_RECONNECT_ATTEMPTS, 50),
        enqueueOperationTimeoutMs: numberOrDefault(process.env.QUEUE_ENQUEUE_TIMEOUT_MS, 2500),
        enqueueMaxAttempts: numberOrDefault(process.env.QUEUE_ENQUEUE_MAX_ATTEMPTS, 3),
        enqueueRetryBaseDelayMs: numberOrDefault(process.env.QUEUE_ENQUEUE_RETRY_BASE_DELAY_MS, 200),
        enqueueRetryMaxDelayMs: numberOrDefault(process.env.QUEUE_ENQUEUE_RETRY_MAX_DELAY_MS, 2000),
    },
    ffmpegPath: process.env.FFMPEG_PATH,
    uploadMaxConcurrency: numberOrDefault(process.env.UPLOAD_MAX_CONCURRENCY, 10),
    downloadMaxConcurrency: numberOrDefault(process.env.DOWNLOAD_MAX_CONCURRENCY, 10),
    // Allow multiple ffmpeg workers per process; default to 3 so
    // large batches do not get stuck behind a single long-running job.
    transcodeConcurrency: numberOrDefault(process.env.TRANSCODE_CONCURRENCY, 3),
    paystack: {
        secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
        publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? "",
        callbackUrl: process.env.PAYSTACK_CALLBACK_URL ?? "",
        webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
    },
    flutterwave: {
        // V4 keys: Client ID + Client Secret
        publicKey: process.env.FLW_PUBLIC_KEY ?? "",
        secretKey: process.env.FLW_SECRET_KEY ?? "",
        encryptionKey: process.env.FLW_ENCRYPTION_KEY ?? "",
        baseUrl: process.env.FLW_BASE_URL ?? "https://api.flutterwave.com",
        webhookSecret: process.env.FLW_WEBHOOK_SECRET ?? "",
        callbackUrl: process.env.FLW_CALLBACK_URL ?? "",
        appSessionReturnUrl: process.env.FLW_APP_SESSION_RETURN_URL ?? "",
    },
    apiPublicUrl: process.env.API_PUBLIC_URL ?? process.env.BACKEND_URL ?? "",
    fx: {
        apiBase: process.env.FX_API_BASE ?? "https://api.exchangerate.host/latest",
        cacheTtlMs: numberOrDefault(process.env.FX_CACHE_TTL_MS, 6 * 60 * 60 * 1000),
    },
    // Optional CDN base for media playback (e.g., CloudFront): https://cdn.yourdomain.com
    mediaCdnBase: process.env.MEDIA_CDN_BASE?.replace(/\/+$/, ""),
    // PPV access should last at least 30 days; allow higher via env but never lower.
    ppvAccessDays: Math.max(numberOrDefault(process.env.PPV_ACCESS_DAYS, 30), 30),
    supportEmail: process.env.SUPPORT_EMAIL ?? "support@wanzami.com",
    ivs: {
        region: process.env.IVS_REGION ?? process.env.AWS_REGION ?? "us-east-1",
        recordingEnabled: process.env.IVS_RECORDING_ENABLED === "true",
    },
    live: {
        sourceHeartbeatTimeoutMs: numberOrDefault(process.env.LIVE_SOURCE_HEARTBEAT_TIMEOUT_MS, 45000),
    },
};
