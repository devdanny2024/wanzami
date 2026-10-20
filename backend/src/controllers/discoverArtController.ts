import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { auditLog } from "../utils/audit.js";
import { isArtDoor } from "../utils/discoverTaxonomy.js";

/** Public. Admin-set replacement images, keyed "kind/slug". Doors without one use the website's default photo. */
export const getDiscoverArt = async (_req: Request, res: Response) => {
  const rows = await prisma.categoryArt.findMany({ select: { kind: true, slug: true, imageUrl: true } });
  const art: Record<string, string> = {};
  for (const r of rows) art[`${r.kind}/${r.slug}`] = r.imageUrl;
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return res.json({ art });
};

/** Admin. Set (or replace) the image for one door. */
export const setDiscoverArt = async (req: Request, res: Response) => {
  const { kind, slug, imageUrl } = req.body as { kind?: string; slug?: string; imageUrl?: string };
  if (!isArtDoor(kind, slug)) {
    return res.status(400).json({ message: "Unknown door: kind must be language, genre or collection with a valid slug" });
  }
  const url = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (!url || url.length > 2000 || !(url.startsWith("https://") || url.startsWith("/"))) {
    return res.status(400).json({ message: "imageUrl must be an https:// URL or a site path starting with /" });
  }
  const row = await prisma.categoryArt.upsert({
    where: { kind_slug: { kind, slug: slug as string } },
    create: { kind, slug: slug as string, imageUrl: url },
    update: { imageUrl: url },
  });
  void auditLog({ action: "DISCOVER_ART_SET", resource: `${kind}/${slug}`, detail: { imageUrl: url } });
  return res.json({ art: { kind: row.kind, slug: row.slug, imageUrl: row.imageUrl } });
};

/** Admin. Remove the override so the door goes back to its default photograph. */
export const resetDiscoverArt = async (req: Request, res: Response) => {
  const { kind, slug } = req.params;
  if (!isArtDoor(kind, slug)) return res.status(400).json({ message: "Unknown door" });
  await prisma.categoryArt.deleteMany({ where: { kind, slug } });
  void auditLog({ action: "DISCOVER_ART_RESET", resource: `${kind}/${slug}` });
  return res.json({ ok: true });
};
