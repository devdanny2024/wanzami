import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { config } from "../config.js";

const LeadSchema = z.object({
  name: z.string().trim().min(1).max(300),
  domain: z.string().trim().max(255).optional().nullable(),
  siteUrl: z.string().trim().max(1000).optional().nullable(),
  contactType: z.enum(["EMAIL", "WHATSAPP"]),
  contactValue: z.string().trim().min(3).max(320),
  contactSource: z.string().trim().max(40),
  verification: z.string().trim().max(40),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  country: z.string().trim().length(2).optional().nullable(),
  sourceUrl: z.string().trim().max(1000).optional().nullable(),
  scrapedAt: z.string().datetime({ offset: true }).optional().nullable(),
});

const ImportSchema = z.object({
  leads: z.array(LeadSchema).min(1).max(1000),
});

/** Constant-time compare so the token can't be recovered by timing the response. */
const tokenMatches = (provided: string) => {
  const expected = config.filmmakerImportToken;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

/**
 * POST /api/admin/filmmaker-leads/import
 *
 * Bulk upsert from the filmmaker-scraper. Authenticated by a shared token
 * rather than an admin session, because the caller is a script, not a person.
 * Upserts on (contactType, contactValue) so re-running the scraper refreshes
 * existing rows instead of duplicating them.
 */
export const importFilmmakerLeads = async (req: Request, res: Response) => {
  const provided =
    (req.headers["x-import-token"] as string | undefined) ??
    (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");

  if (!tokenMatches(provided)) {
    return res.status(401).json({ message: "Invalid import token" });
  }

  const parsed = ImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  // Counting before and after costs two queries; checking each row's existence
  // would cost one per lead. Not transactional on purpose: upserts are
  // idempotent, so a partial import is simply re-runnable.
  const before = await prisma.filmmakerLead.count();

  for (const lead of parsed.data.leads) {
    const data = {
      name: lead.name,
      domain: lead.domain ?? null,
      siteUrl: lead.siteUrl ?? null,
      contactSource: lead.contactSource,
      verification: lead.verification,
      confidence: lead.confidence,
      country: lead.country ? lead.country.toUpperCase() : null,
      sourceUrl: lead.sourceUrl ?? null,
      scrapedAt: lead.scrapedAt ? new Date(lead.scrapedAt) : null,
    };

    await prisma.filmmakerLead.upsert({
      where: {
        contactType_contactValue: {
          contactType: lead.contactType,
          contactValue: lead.contactValue,
        },
      },
      create: { ...data, contactType: lead.contactType, contactValue: lead.contactValue },
      update: data,
    });
  }

  const total = await prisma.filmmakerLead.count();
  const created = total - before;
  return res.status(200).json({
    message: "Import complete",
    received: parsed.data.leads.length,
    created,
    refreshed: parsed.data.leads.length - created,
    total,
  });
};

const ListQuerySchema = z.object({
  contactType: z.enum(["EMAIL", "WHATSAPP"]).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  country: z.string().trim().length(2).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
});

/**
 * GET /api/admin/filmmaker-leads
 *
 * Paginated list for the admin table, plus the facet counts the UI needs to
 * render its filter chips without a second round trip.
 */
export const listFilmmakerLeads = async (req: Request, res: Response) => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.issues });
  }
  const { contactType, confidence, country, search, page, pageSize } = parsed.data;

  const where: Prisma.FilmmakerLeadWhereInput = {
    ...(contactType ? { contactType } : {}),
    ...(confidence ? { confidence } : {}),
    ...(country ? { country: country.toUpperCase() } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { contactValue: { contains: search, mode: "insensitive" as const } },
            { domain: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total, byConfidence, byType] = await Promise.all([
    prisma.filmmakerLead.findMany({
      where,
      orderBy: [{ confidence: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.filmmakerLead.count({ where }),
    prisma.filmmakerLead.groupBy({ by: ["confidence"], _count: true }),
    prisma.filmmakerLead.groupBy({ by: ["contactType"], _count: true }),
  ]);

  return res.status(200).json({
    leads: rows.map((r) => ({ ...r, id: r.id.toString() })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      confidence: Object.fromEntries(byConfidence.map((r) => [r.confidence, r._count])),
      contactType: Object.fromEntries(byType.map((r) => [r.contactType, r._count])),
    },
  });
};
