import { Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { resolveCountry } from "../utils/country.js";

const eventTypes = [
  "PLAY_START",
  "PLAY_END",
  "SCRUB",
  "SKIP",
  "SEARCH",
  "ADD_TO_LIST",
  "THUMBS_UP",
  "THUMBS_DOWN",
  "IMPRESSION",
] as const;

const eventSchema = z.object({
  eventType: z.enum(eventTypes),
  profileId: z.union([z.string(), z.number()]).optional(),
  titleId: z.union([z.string(), z.number()]).optional(),
  episodeId: z.union([z.string(), z.number()]).optional(),
  sessionId: z.union([z.string(), z.number()]).optional(),
  occurredAt: z.string().datetime().optional(),
  country: z.string().optional(),
  deviceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const toBigInt = (value?: string | number) => {
  if (value === undefined) return undefined;
  try {
    return BigInt(value);
  } catch (err) {
    return null;
  }
};

export const ingestEvents = async (req: AuthenticatedRequest, res: Response) => {
  const body = Array.isArray((req.body as any)?.events)
    ? (req.body as any).events
    : Array.isArray(req.body)
      ? (req.body as any)
      : [req.body];

  const parsed = z.array(eventSchema).safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid event payload", issues: parsed.error.issues });
  }

  const events = parsed.data;
  const requestCountry = resolveCountry(req);
  if (!events.length) {
    return res.status(400).json({ message: "No events provided" });
  }

  const profileIds = Array.from(
    new Set(
      events
        .map((e) => toBigInt(e.profileId))
        .filter((v): v is bigint => v !== undefined && v !== null)
    )
  );
  if (req.user && profileIds.length) {
    const profileCount = await prisma.profile.count({
      where: { id: { in: profileIds }, userId: req.user.userId },
    });
    if (profileCount !== profileIds.length) {
      return res.status(400).json({ message: "One or more profileIds do not belong to the user" });
    }
  }

  const rows = [];
  for (const e of events) {
    const profileId = toBigInt(e.profileId);
    if (profileId === null) return res.status(400).json({ message: "Invalid profileId" });
    const titleId = toBigInt(e.titleId);
    if (titleId === null) return res.status(400).json({ message: "Invalid titleId" });
    const episodeId = toBigInt(e.episodeId);
    if (episodeId === null) return res.status(400).json({ message: "Invalid episodeId" });
    const sessionId = toBigInt(e.sessionId);
    if (sessionId === null) return res.status(400).json({ message: "Invalid sessionId" });

    const occurredAt = e.occurredAt ? new Date(e.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return res.status(400).json({ message: "Invalid occurredAt" });
    }

    const experiment = (req.headers["x-experiment"] as string | undefined) ?? undefined;
    const variant = (req.headers["x-variant"] as string | undefined) ?? undefined;
    const baseMetadata = e.metadata ?? undefined;
    const metadata =
      experiment || variant
        ? {
            ...((typeof baseMetadata === "object" && baseMetadata !== null ? baseMetadata : {}) as any),
            experiment,
            variant,
          }
        : baseMetadata;

    rows.push({
      profileId: profileId ?? undefined,
      titleId: titleId ?? undefined,
      episodeId: episodeId ?? undefined,
      sessionId: sessionId ?? undefined,
      eventType: e.eventType,
      occurredAt,
      country: e.country ? e.country.toUpperCase() : requestCountry,
      deviceId: e.deviceId ?? req.user?.deviceId,
      metadata,
    });
  }

  await prisma.engagementEvent.createMany({ data: rows });
  return res.status(201).json({ count: rows.length });
};
