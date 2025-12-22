import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const now = () => new Date();

const africanCountries = new Set([
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CM",
  "CV",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "CI",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
]);

const ppvAccessDays = config.ppvAccessDays || 30;

export const getAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const titleId = req.params.titleId ? BigInt(req.params.titleId) : null;
    if (!titleId) {
      return res.status(400).json({ message: "Missing title id" });
    }
    const recordViolation = (req.query.record as string | undefined)?.toLowerCase() !== "false";
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (user.ppvBanned) {
      return res.json({
        isPpv: true,
        hasAccess: false,
        userPpvBanned: true,
        ppvStrikeCount: user.ppvStrikeCount,
      });
    }

    const title = await prisma.title.findUnique({ where: { id: titleId } });
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }

    if (!title.isPpv) {
      return res.json({
        isPpv: false,
        hasAccess: true,
        priceNaira: null,
        currency: null,
        userPpvBanned: false,
        ppvStrikeCount: user.ppvStrikeCount,
      });
    }

    const active = await prisma.ppvPurchase.findFirst({
      where: {
        userId,
        titleId,
        status: "SUCCESS",
        accessExpiresAt: { gt: now() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (active) {
      return res.json({
        isPpv: true,
        hasAccess: true,
        priceNaira: title.ppvPriceNaira,
        currency: title.ppvCurrency ?? "NGN",
        userPpvBanned: false,
        ppvStrikeCount: user.ppvStrikeCount,
        accessExpiresAt: active.accessExpiresAt,
      });
    }

    // Record violation
    let updatedStrikes = user.ppvStrikeCount;
    let banned = user.ppvBanned;

    if (recordViolation) {
      await prisma.$transaction([
        prisma.ppvViolation.create({
          data: {
            userId,
            titleId,
            path: req.originalUrl,
            ipAddress: (req.headers["x-forwarded-for"] as string) ?? req.ip,
            userAgent: req.headers["user-agent"],
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            ppvStrikeCount: { increment: 1 },
            ppvLastStrikeAt: now(),
            ppvBanned: user.ppvStrikeCount + 1 >= 3,
          },
        }),
      ]);
      updatedStrikes = user.ppvStrikeCount + 1;
      banned = updatedStrikes >= 3;
    }

    return res.status(403).json({
      isPpv: true,
      hasAccess: false,
      priceNaira: title.ppvPriceNaira,
      currency: title.ppvCurrency ?? "NGN",
      userPpvBanned: banned,
      ppvStrikeCount: updatedStrikes,
      message: banned
        ? "PPV access blocked due to repeated violations."
        : "Purchase required to access this title.",
    });
  } catch (err) {
    console.error("ppv access error", err);
    return res.status(500).json({ message: "PPV access check failed" });
  }
};

const computeUsdFromNaira = (naira: number) => {
  const usd = naira * (5 / 3000);
  return Math.round(usd * 100) / 100;
};

export const initiatePurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { titleId } = req.body as { titleId?: number };
    if (!titleId) return res.status(400).json({ message: "titleId required" });
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const title = await prisma.title.findUnique({ where: { id: BigInt(titleId) } });
    if (!title) return res.status(404).json({ message: "Title not found" });
    if (!title.isPpv) return res.status(400).json({ message: "Title is not PPV" });
    if (!title.ppvPriceNaira || title.ppvPriceNaira <= 0) {
      return res.status(400).json({ message: "PPV price not configured" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.ppvBanned) return res.status(403).json({ message: "PPV access barred" });

    const active = await prisma.ppvPurchase.findFirst({
      where: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        status: "SUCCESS",
        accessExpiresAt: { gt: now() },
      },
    });
    if (active) {
      return res.status(409).json({ message: "Already purchased" });
    }

    const country = (req.headers["x-country"] as string | undefined)?.toUpperCase();
    const isAfrican = country ? africanCountries.has(country) : true;
    const gateway = isAfrican ? "PAYSTACK" : "FLUTTERWAVE";

    const reference = `PPV-${titleId}-${Date.now()}`;
    const amountNaira = title.ppvPriceNaira;
    const currency = gateway === "PAYSTACK" ? "NGN" : "USD";

    let authorizationUrl = "";

    if (gateway === "PAYSTACK") {
      const initPayload = {
        amount: amountNaira * 100,
        currency: "NGN",
        email: user.email,
        reference,
        callback_url: config.paystack.callbackUrl || undefined,
        metadata: { titleId, userId: req.user.userId.toString() },
      };
      const resp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initPayload),
      });
      const json = await resp.json();
      if (!resp.ok || !json.status) {
        return res.status(502).json({ message: "Paystack init failed", details: json });
      }
      authorizationUrl = json.data?.authorization_url;
    } else {
      const usdAmount = computeUsdFromNaira(amountNaira);
      const txRef = `PPV-FLW-${titleId}-${Date.now()}`;
      const initPayload = {
        tx_ref: txRef,
        amount: usdAmount,
        currency: "USD",
        redirect_url: config.paystack.callbackUrl || undefined,
        customer: { email: user.email, name: user.name },
        meta: { titleId, userId: req.user.userId.toString(), reference },
      };
      const resp = await fetch(`${config.flutterwave.baseUrl}/v3/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.flutterwave.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initPayload),
      });
      const json = await resp.json();
      if (!resp.ok || json.status != "success") {
        return res.status(502).json({ message: "Flutterwave init failed", details: json });
      }
      authorizationUrl = json.data?.link;
    }

    await prisma.ppvPurchase.create({
      data: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        amountNaira,
        currency,
        gateway,
        paystackRef: reference,
        status: "PENDING",
      },
    });

    return res.json({ authorizationUrl, reference, gateway, currency, amountNaira });
  } catch (err) {
    console.error("ppv initiate error", err);
    return res.status(500).json({ message: "Failed to initiate PPV purchase" });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;
    const secret = config.paystack.webhookSecret;
    const raw = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    if (signature !== expected) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;
    const data = event?.data;
    const reference = data?.reference as string | undefined;
    if (!reference) return res.status(400).json({ message: "Missing reference" });

    const purchase = await prisma.ppvPurchase.findUnique({ where: { paystackRef: reference } });
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (event.event === "charge.success" || data?.status === "success") {
      const expiresAt = new Date(Date.now() + ppvAccessDays * 24 * 60 * 60 * 1000);
      await prisma.ppvPurchase.update({
        where: { paystackRef: reference },
        data: {
          status: "SUCCESS",
          paystackTrxId: String(data.id ?? ""),
          rawPayload: event,
          accessExpiresAt: expiresAt,
        },
      });
    } else {
      await prisma.ppvPurchase.update({
        where: { paystackRef: reference },
        data: { status: "FAILED", rawPayload: event },
      });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("paystack webhook error", err);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const myTitles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const purchases = await prisma.ppvPurchase.findMany({
      where: { userId: req.user.userId, status: "SUCCESS" },
      include: { title: true },
      orderBy: { updatedAt: "desc" },
    });
    const nowDate = now();
    const active = purchases.filter((p) => p.accessExpiresAt && p.accessExpiresAt > nowDate);
    const expired = purchases.filter((p) => !p.accessExpiresAt || p.accessExpiresAt <= nowDate);
    return res.json({ active, expired });
  } catch (err) {
    console.error("my titles error", err);
    return res.status(500).json({ message: "Failed to load purchases" });
  }
};
