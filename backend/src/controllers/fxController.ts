import { Response } from "express";
import { prisma } from "../prisma.js";
import { getRates } from "../utils/fx.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const CURRENCY_RE = /^[A-Z]{3}$/;

export const listFxRates = async (_req: AuthenticatedRequest, res: Response) => {
  const overrides = await prisma.fxRateOverride.findMany({ orderBy: { currency: "asc" } });
  let liveRates: Record<string, number> = {};
  try {
    liveRates = await getRates("NGN");
  } catch {
    // Live provider may be down; overrides still work, just no reference column.
  }
  return res.json({
    overrides: overrides.map((o) => ({
      currency: o.currency,
      rate: o.rate,
      updatedAt: o.updatedAt,
    })),
    liveRates,
  });
};

export const upsertFxRate = async (req: AuthenticatedRequest, res: Response) => {
  const { currency, rate } = req.body as { currency?: string; rate?: number };
  const code = (currency ?? "").toUpperCase();
  const numericRate = Number(rate);
  if (!CURRENCY_RE.test(code)) {
    return res.status(400).json({ message: "currency must be a 3-letter ISO code" });
  }
  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    return res.status(400).json({ message: "rate must be a positive number" });
  }

  const saved = await prisma.fxRateOverride.upsert({
    where: { currency: code },
    update: { rate: numericRate },
    create: { currency: code, rate: numericRate },
  });
  return res.json({ currency: saved.currency, rate: saved.rate, updatedAt: saved.updatedAt });
};

export const deleteFxRate = async (req: AuthenticatedRequest, res: Response) => {
  const code = String(req.params.currency ?? "").toUpperCase();
  try {
    await prisma.fxRateOverride.delete({ where: { currency: code } });
  } catch {
    return res.status(404).json({ message: "No override set for that currency" });
  }
  return res.status(204).send();
};
