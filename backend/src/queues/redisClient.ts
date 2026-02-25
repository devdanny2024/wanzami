import IORedis, { RedisOptions } from "ioredis";
import { config } from "../config.js";

type LogFn = (message: string, details?: Record<string, unknown>) => void;

const logGate = new Map<string, number>();
const LOG_SUPPRESS_WINDOW_MS = 30_000;

const shouldLog = (key: string) => {
  const now = Date.now();
  const nextAllowed = logGate.get(key) ?? 0;
  if (now < nextAllowed) return false;
  logGate.set(key, now + LOG_SUPPRESS_WINDOW_MS);
  return true;
};

const rateLimited = (key: string, fn: LogFn, message: string, details?: Record<string, unknown>) => {
  if (!shouldLog(key)) return;
  fn(message, details);
};

const retryDelayMs = (attempt: number) => {
  if (attempt > config.redis.maxReconnectAttempts) {
    return null;
  }
  const base = config.redis.retryBaseDelayMs * 2 ** Math.max(0, attempt - 1);
  return Math.min(base, config.redis.retryMaxDelayMs);
};

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: config.redis.lazyConnect,
  connectTimeout: config.redis.connectTimeoutMs,
  retryStrategy: retryDelayMs,
  tls: config.redis.tls ? {} : undefined,
};

export const isLikelyRedisNetworkError = (err: unknown) => {
  const anyErr = err as { code?: string; message?: string } | undefined;
  const code = (anyErr?.code ?? "").toUpperCase();
  const message = (anyErr?.message ?? "").toUpperCase();
  return (
    code.includes("ETIMEDOUT") ||
    code.includes("ECONNREFUSED") ||
    code.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("CONNECTION IS CLOSED")
  );
};

export const createRedisConnection = (scope: string) => {
  const client = new IORedis(config.redis.url, redisOptions);

  client.on("ready", () => {
    console.log(`[${scope}] Redis connected`);
  });

  client.on("reconnecting", (time: number) => {
    rateLimited(
      `${scope}:reconnecting`,
      console.warn,
      `[${scope}] Redis reconnecting`,
      { delayMs: time }
    );
  });

  client.on("end", () => {
    rateLimited(`${scope}:end`, console.warn, `[${scope}] Redis connection ended`);
  });

  client.on("error", (err) => {
    const details = {
      message: err?.message,
      code: (err as { code?: string })?.code,
    };
    const key = isLikelyRedisNetworkError(err) ? `${scope}:network-error` : `${scope}:error`;
    rateLimited(key, console.error, `[${scope}] Redis connection error`, details);
  });

  return client;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

export type EnqueueResult =
  | { ok: true; id: string }
  | { ok: false; reason: string; code?: string };

export const resilientEnqueue = async <T extends { id?: string | number }>(
  scope: string,
  enqueue: () => Promise<T>
): Promise<EnqueueResult> => {
  const attempts = Math.max(1, config.redis.enqueueMaxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await withTimeout(
        enqueue(),
        config.redis.enqueueOperationTimeoutMs,
        `Queue operation timed out after ${config.redis.enqueueOperationTimeoutMs}ms`
      );
      return { ok: true, id: String(result.id ?? "") };
    } catch (err) {
      const anyErr = err as { message?: string; code?: string };
      const message = anyErr?.message ?? "Failed to enqueue job";
      const code = anyErr?.code;
      const canRetry = attempt < attempts && isLikelyRedisNetworkError(err);

      if (!canRetry) {
        return { ok: false, reason: message, code };
      }

      const backoff = Math.min(
        config.redis.enqueueRetryBaseDelayMs * 2 ** (attempt - 1),
        config.redis.enqueueRetryMaxDelayMs
      );
      await sleep(backoff);
    }
  }

  return { ok: false, reason: "Failed to enqueue after retries" };
};
