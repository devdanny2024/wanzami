import type { NextFunction, Request, Response } from "express";

type KeyFn = (req: Request) => string;

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyFn?: KeyFn;
};

// Simple in-memory rate limiter for low-volume endpoints like support tickets.
// This is per-process and resets on deploy, which is acceptable for basic abuse protection.
const buckets = new Map<string, number[]>();

export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs;
  const max = options.max;
  const keyFn: KeyFn =
    options.keyFn ??
    ((req: Request) => {
      const ip = (req.ip || req.headers["x-forwarded-for"] || "").toString();
      return ip;
    });

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(req);

    const existing = buckets.get(key) ?? [];
    const recent = existing.filter((ts) => now - ts < windowMs);

    if (recent.length >= max) {
      return res.status(429).json({
        message: "Too many requests. Please wait a bit and try again.",
      });
    }

    recent.push(now);
    buckets.set(key, recent);
    next();
  };
}

export const supportTicketRateLimit = createRateLimiter({
  // Allow up to 5 tickets per email/IP per hour.
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyFn: (req) => {
    const ip = (req.ip || req.headers["x-forwarded-for"] || "").toString();
    const email = typeof (req.body as any)?.email === "string" ? (req.body as any).email.toLowerCase() : "unknown";
    return `support:${ip}:${email}`;
  },
});

