import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import { buildPpvThankYouEmail } from "../templates/ppvThankYouTemplate.js";
import { resolveCountry } from "../utils/country.js";
import { localizePrice } from "../utils/pricing.js";
import { getFlutterwaveAccessToken } from "../utils/flutterwaveV4.js";
import crypto from "crypto";

const now = () => new Date();

const ppvAccessDays = config.ppvAccessDays || 30;

const safeLocalizePrice = async (opts: {
  amount: number;
  baseCurrency: string;
  country: string | null | undefined;
}) => {
  try {
    return await localizePrice(opts);
  } catch (err) {
    console.error("ppv price localization failed", err);
    return { amount: opts.amount, currency: opts.baseCurrency, rate: 1 };
  }
};

const resolveCustomerName = (user: { name?: string | null; email?: string | null }) => {
  const raw = (user.name ?? "").trim();
  if (!raw) {
    const email = (user.email ?? "").trim();
    return { first: email || "Customer", last: "" };
  }
  const parts = raw.split(" ").filter(Boolean);
  return {
    first: parts[0] ?? raw,
    last: parts.slice(1).join(" "),
  };
};

const toKeyBytes = (key: string) => {
  try {
    const buf = Buffer.from(key, "base64");
    if (buf.length >= 24) return buf.length >= 32 ? buf.subarray(0, 32) : buf;
  } catch {
    // ignore base64 errors
  }
  return crypto.createHash("sha256").update(key).digest();
};

const encryptField = (value: string, keyBytes: Buffer, nonce: Buffer) => {
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes, nonce);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([encrypted, tag]).toString("base64");
};

const encryptCardPayload = (card: {
  number: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  pin?: string;
}) => {
  const key = config.flutterwave.encryptionKey;
  if (!key) throw new Error("Flutterwave encryption key not configured");
  const keyBytes = toKeyBytes(key);
  const nonce = crypto.randomBytes(12);
  const encryptedCard = {
    nonce: nonce.toString("base64"),
    encrypted_card_number: encryptField(card.number, keyBytes, nonce),
    encrypted_cvv: encryptField(card.cvv, keyBytes, nonce),
    encrypted_expiry_month: encryptField(card.expiryMonth, keyBytes, nonce),
    encrypted_expiry_year: encryptField(card.expiryYear, keyBytes, nonce),
  } as Record<string, string>;
  if (card.pin) {
    encryptedCard.encrypted_pin = encryptField(card.pin, keyBytes, nonce);
  }
  return encryptedCard;
};

export const getAccess = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const titleId = req.params.titleId ? BigInt(req.params.titleId) : null;
    if (!titleId) {
      return res.status(400).json({ message: "Missing title id" });
    }
    const recordViolation = (req.query.record as string | undefined)?.toLowerCase() !== "false";
    const countryOverride = (req.query.country as string | undefined)?.toUpperCase()?.trim();
    const country = countryOverride || resolveCountry(req);
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

    const baseAmount = title.ppvPriceNaira ?? 0;
    const baseCurrency = title.ppvCurrency ?? "NGN";
    const localized = await safeLocalizePrice({ amount: baseAmount, baseCurrency, country });

    if (active) {
      return res.json({
        isPpv: true,
        hasAccess: true,
        priceNaira: localized.amount,
        currency: localized.currency,
        userPpvBanned: false,
        ppvStrikeCount: user.ppvStrikeCount,
        accessExpiresAt: active.accessExpiresAt,
      });
    }

    // Record violation
    let updatedStrikes: number = user.ppvStrikeCount;
    let banned: boolean = !!user.ppvBanned;

    if (recordViolation) {
      const newStrikes = updatedStrikes + 1;
      const willBan = newStrikes >= 3;
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
            ppvStrikeCount: newStrikes,
            ppvLastStrikeAt: now(),
            ppvBanned: willBan,
          },
        }),
      ]);
      updatedStrikes = newStrikes;
      banned = willBan;
    }

    return res.status(403).json({
      isPpv: true,
      hasAccess: false,
      priceNaira: localized.amount,
      currency: localized.currency,
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

const frontendBase =
  process.env.APP_ORIGIN || process.env.FRONTEND_URL || "https://wanzami.vercel.app";

const sendPpvThankYou = async (opts: {
  userEmail?: string | null;
  userName?: string | null;
  titleId?: bigint;
  titleName?: string | null;
}) => {
  if (!opts.userEmail || !opts.titleId || !opts.titleName) return;
  const recs = await prisma.title.findMany({
    where: { isPpv: true, id: { not: opts.titleId } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, name: true, ppvPriceNaira: true },
  });
  const email = buildPpvThankYouEmail({
    userName: opts.userName ?? undefined,
    purchasedTitle: opts.titleName,
    recs: recs.map((r) => ({
      title: r.name,
      priceNaira: r.ppvPriceNaira,
      url: `${frontendBase}/title/${r.id}`,
    })),
  });
  await sendEmail({
    to: opts.userEmail,
    subject: email.subject,
    html: email.html,
  });
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

    const countryOverride = (req.body as any)?.country;
    const country = (countryOverride ? String(countryOverride) : resolveCountry(req))?.toUpperCase();
    const reference = `PPV-${titleId}-${Date.now()}`;
    const amountNaira = title.ppvPriceNaira;
    const baseCurrency = title.ppvCurrency ?? "NGN";
    const localized = await safeLocalizePrice({
      amount: amountNaira,
      baseCurrency,
      country,
    });
    const gateway = "FLUTTERWAVE";
    const txRef = `PPV-FLW-${titleId}-${Date.now()}`;

    return res.status(400).json({
      message: "Use orchestrator endpoint for Flutterwave v4 payments.",
    });

  } catch (err) {
    console.error("ppv initiate error", err);
    return res.status(500).json({ message: "Failed to initiate PPV purchase" });
  }
};

export const initiateOrchestratedPurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      titleId,
      method,
      card,
      customer,
      bankTransfer,
      ussd,
      opay,
      googlepay,
      applepay,
    } = req.body as {
      titleId?: number;
      method?: "card" | "bank_transfer" | "ussd" | "opay" | "googlepay" | "applepay";
      card?: { number: string; cvv: string; expiryMonth: string; expiryYear: string; pin?: string };
      customer?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        country?: string;
        address?: {
          line1?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
        };
      };
      bankTransfer?: Record<string, any>;
      ussd?: { bankCode?: string; phoneNumber?: string };
      opay?: { phoneNumber?: string };
      googlepay?: { cardHolderName?: string };
      applepay?: { cardHolderName?: string };
    };

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

    const country = resolveCountry(req);
    const baseCurrency = title.ppvCurrency ?? "NGN";
    const amountNaira = title.ppvPriceNaira;
    const localized = await safeLocalizePrice({
      amount: amountNaira,
      baseCurrency,
      country,
    });

    const reference = `PPV-${titleId}-${Date.now()}`;
    const gateway = "FLUTTERWAVE";

    const accessToken = await getFlutterwaveAccessToken();
    const traceId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();

    const { first, last } = resolveCustomerName(user);
    const customerPayload = {
      email: customer?.email ?? user.email,
      name: {
        first: customer?.firstName ?? first,
        last: customer?.lastName ?? last,
      },
      phone: customer?.phone
        ? {
            country_code: customer?.phone?.startsWith("+")
              ? customer.phone.replace("+", "").slice(0, 3)
              : undefined,
            number: customer.phone,
          }
        : undefined,
      address: customer?.address
        ? {
            line1: customer.address.line1,
            city: customer.address.city,
            state: customer.address.state,
            postal_code: customer.address.postalCode,
            country: customer.address.country ?? customer.country ?? country,
          }
        : undefined,
    };

    let paymentMethod: any;
    if (method === "card") {
      if (!card?.number || !card?.cvv || !card?.expiryMonth || !card?.expiryYear) {
        return res.status(400).json({ message: "Missing card details" });
      }
      const encryptedCard = encryptCardPayload({
        number: card.number,
        cvv: card.cvv,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        pin: card.pin,
      });
      paymentMethod = {
        type: "card",
        card: encryptedCard,
      };
    } else if (method === "bank_transfer") {
      paymentMethod = {
        type: "bank_transfer",
        bank_transfer: bankTransfer ?? {},
      };
    } else if (method === "ussd") {
      paymentMethod = {
        type: "ussd",
        ussd: {
          bank: ussd?.bankCode,
          phone_number: ussd?.phoneNumber,
        },
      };
    } else if (method === "opay") {
      paymentMethod = {
        type: "opay",
        opay: opay?.phoneNumber ? { phone_number: opay.phoneNumber } : undefined,
      };
    } else if (method === "googlepay") {
      paymentMethod = {
        type: "googlepay",
        googlepay: {
          card_holder_name: googlepay?.cardHolderName,
        },
      };
    } else if (method === "applepay") {
      paymentMethod = {
        type: "applepay",
        applepay: {
          card_holder_name: applepay?.cardHolderName,
        },
      };
    } else {
      return res.status(400).json({ message: "Unsupported payment method" });
    }

    const payload: any = {
      amount: localized.amount,
      currency: localized.currency,
      reference,
      redirect_url: config.paystack.callbackUrl || config.flutterwave.callbackUrl || undefined,
      customer: customerPayload,
      payment_method: paymentMethod,
    };

    const resp = await fetch(`${config.flutterwave.baseUrl}/orchestration/direct-charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.status !== "success") {
      return res.status(502).json({ message: "Flutterwave orchestrator failed", details: json });
    }

    await prisma.ppvPurchase.create({
      data: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        amountNaira,
        currency: localized.currency,
        gateway,
        paystackRef: reference,
        status: "PENDING",
        rawPayload: json,
      },
    });

    const data = json.data ?? {};
    return res.json({
      reference,
      gateway,
      currency: localized.currency,
      amountNaira,
      chargeId: data.id,
      status: data.status,
      nextAction: data.next_action ?? null,
      paymentInstruction: data.payment_instruction ?? data.payment_instructions ?? null,
    });
  } catch (err: any) {
    console.error("ppv orchestrator error", err);
    return res.status(500).json({ message: "Failed to initiate PPV payment", error: err?.message });
  }
};

export const authorizeOrchestratedCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chargeId, authorization } = req.body as {
      chargeId?: string;
      authorization?: Record<string, any>;
    };
    if (!chargeId || !authorization) {
      return res.status(400).json({ message: "chargeId and authorization required" });
    }
    let authPayload = authorization;
    if (authorization.type === "pin" && typeof authorization.pin === "string") {
      const key = config.flutterwave.encryptionKey;
      if (!key) return res.status(500).json({ message: "Encryption key not configured" });
      const keyBytes = toKeyBytes(key);
      const nonce = crypto.randomBytes(12);
      const encryptedPin = encryptField(authorization.pin, keyBytes, nonce);
      authPayload = {
        type: "pin",
        pin: {
          nonce: nonce.toString("base64"),
          encrypted_pin: encryptedPin,
        },
      };
    }
    const accessToken = await getFlutterwaveAccessToken();
    const resp = await fetch(
      `${config.flutterwave.baseUrl}/orchestration/direct-charges/${encodeURIComponent(chargeId)}/authorize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authorization: authPayload }),
      }
    );
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.status !== "success") {
      return res.status(502).json({ message: "Flutterwave authorization failed", details: json });
    }
    return res.json(json);
  } catch (err: any) {
    console.error("ppv orchestrator authorize error", err);
    return res.status(500).json({ message: "Failed to authorize payment", error: err?.message });
  }
};

export const verifyOrchestratedCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chargeId = (req.query.chargeId as string | undefined) ?? undefined;
    if (!chargeId) return res.status(400).json({ message: "chargeId required" });
    const accessToken = await getFlutterwaveAccessToken();
    const resp = await fetch(
      `${config.flutterwave.baseUrl}/orchestration/direct-charges/${encodeURIComponent(chargeId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.status !== "success") {
      return res.status(502).json({ message: "Flutterwave verify failed", details: json });
    }
    return res.json(json);
  } catch (err: any) {
    console.error("ppv orchestrator verify error", err);
    return res.status(500).json({ message: "Failed to verify payment", error: err?.message });
  }
};

export const flutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["verif-hash"] as string;
    const secret = config.flutterwave.webhookSecret;
    if (!secret || signature !== secret) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const data = (req.body as any)?.data;
    const txRef = data?.tx_ref as string | undefined;
    const metaRef = (data?.meta as any)?.reference as string | undefined;
    const directRef = data?.reference as string | undefined;
    const refToFind = txRef || metaRef || directRef;
    if (!refToFind) return res.status(400).json({ message: "Missing tx_ref" });

    const purchase = await prisma.ppvPurchase.findUnique({
      where: { paystackRef: refToFind },
      include: { user: true, title: true },
    });
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (data?.status === "successful") {
      const expiresAt = new Date(Date.now() + ppvAccessDays * 24 * 60 * 60 * 1000);
      await prisma.ppvPurchase.update({
        where: { paystackRef: refToFind },
        data: {
          status: "SUCCESS",
          paystackTrxId: String(data.id ?? ""),
          rawPayload: req.body,
          accessExpiresAt: expiresAt,
        },
      });
      if (purchase.status !== "SUCCESS") {
        await sendPpvThankYou({
          userEmail: purchase.user?.email,
          userName: purchase.user?.name,
          titleId: purchase.titleId,
          titleName: purchase.title?.name,
        });
      }
    } else {
      await prisma.ppvPurchase.update({
        where: { paystackRef: refToFind },
        data: { status: "FAILED", rawPayload: req.body },
      });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("flutterwave webhook error", err);
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
    const activeRaw = purchases.filter((p) => p.accessExpiresAt && p.accessExpiresAt > nowDate);
    const expiredRaw = purchases.filter((p) => !p.accessExpiresAt || p.accessExpiresAt <= nowDate);

    const serializePurchase = (p: typeof purchases[number]) => ({
      id: p.id?.toString?.() ?? String(p.id),
      userId: p.userId?.toString?.() ?? String(p.userId),
      titleId: p.titleId?.toString?.() ?? String(p.titleId),
      amountNaira: p.amountNaira,
      currency: p.currency,
      gateway: p.gateway,
      paystackRef: p.paystackRef,
      paystackTrxId: p.paystackTrxId,
      status: p.status,
      accessExpiresAt: p.accessExpiresAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      title: p.title
        ? {
            ...p.title,
            id: p.title.id?.toString?.() ?? String(p.title.id),
          }
        : null,
    });

    const active = activeRaw.map(serializePurchase);
    const expired = expiredRaw.map(serializePurchase);

    return res.json({ active, expired });
  } catch (err) {
    console.error("my titles error", err);
    return res.status(500).json({ message: "Failed to load purchases" });
  }
};

export const adminListPurchases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Admin-only in routes
    const limit = Math.min(Number(req.query.limit ?? 200), 500);
    const offset = Number(req.query.offset ?? 0);
    const status = (req.query.status as string | undefined)?.toUpperCase();
    const gateway = (req.query.gateway as string | undefined)?.toUpperCase();
    const where: any = {};
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;

    const [rows, totalCount, totalSuccess] = await Promise.all([
      prisma.ppvPurchase.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true } },
          title: { select: { id: true, name: true, type: true, ppvPriceNaira: true, ppvCurrency: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.ppvPurchase.count({ where }),
      prisma.ppvPurchase.aggregate({
        _sum: { amountNaira: true },
        where: { ...where, status: "SUCCESS" },
      }),
    ]);

    const items = rows.map((p) => ({
      id: p.id?.toString?.() ?? String(p.id),
      userId: p.userId?.toString?.() ?? String(p.userId),
      titleId: p.titleId?.toString?.() ?? String(p.titleId),
      amountNaira: p.amountNaira,
      currency: p.currency,
      gateway: p.gateway,
      paystackRef: p.paystackRef,
      paystackTrxId: p.paystackTrxId,
      status: p.status,
      accessExpiresAt: p.accessExpiresAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.user
        ? {
            id: p.user.id?.toString?.() ?? String(p.user.id),
            email: p.user.email,
            name: p.user.name,
          }
        : null,
      title: p.title
        ? {
            id: p.title.id?.toString?.() ?? String(p.title.id),
            name: p.title.name,
            type: p.title.type,
            ppvPriceNaira: p.title.ppvPriceNaira,
            ppvCurrency: p.title.ppvCurrency,
          }
        : null,
    }));

    return res.json({
      totalCount,
      totalSuccessAmountNaira: totalSuccess._sum.amountNaira ?? 0,
      items,
    });
  } catch (err) {
    console.error("admin purchases error", err);
    return res.status(500).json({ message: "Failed to load PPV purchases" });
  }
};
