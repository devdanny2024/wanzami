import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import { buildPpvThankYouEmail } from "../templates/ppvThankYouTemplate.js";
import { resolveCountry } from "../utils/country.js";
import { localizePrice } from "../utils/pricing.js";
import { getFlutterwaveAccessToken } from "../utils/flutterwaveV4.js";
import { isInternalTestAccount } from "../utils/internalAccounts.js";
import crypto from "crypto";
import { createNotification } from "./notificationController.js";

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

const readFlutterwaveResponse = async (resp: any) => {
  const text = await resp.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
};

const resolveTxRefFromVerifiedTransaction = async (transactionId: string) => {
  if (!config.flutterwave.secretKey) return undefined;
  const resp = await fetch(`${config.flutterwave.baseUrl}/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: {
      Authorization: `Bearer ${config.flutterwave.secretKey}`,
    },
  });
  const parsed = await readFlutterwaveResponse(resp);
  if (!resp.ok || parsed.json?.status !== "success") return undefined;
  const payload = parsed.json?.data ?? {};
  const candidates = [
    payload?.tx_ref,
    payload?.meta?.tx_ref,
    payload?.meta?.txRef,
    payload?.meta?.appSessionId,
    payload?.meta?.app_session_id,
    payload?.meta_data?.tx_ref,
    payload?.meta_data?.txRef,
    payload?.meta_data?.appSessionId,
    payload?.meta_data?.app_session_id,
  ]
    .map((v) => (v == null ? "" : String(v).trim()))
    .filter((v) => v.length > 0);

  return candidates[0];
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

    const bypassAccess = isInternalTestAccount(user.email);

    if (user.ppvBanned && !bypassAccess) {
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

    if (bypassAccess) {
      return res.json({
        isPpv: title.isPpv,
        hasAccess: true,
        priceNaira: null,
        currency: null,
        userPpvBanned: false,
        ppvStrikeCount: user.ppvStrikeCount,
      });
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

const frontendBase = process.env.APP_ORIGIN || process.env.FRONTEND_URL || "https://www.wanzami.tv";

const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const appendQuery = (base: string, params: Record<string, string | undefined>) => {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const resolvePublicApiBase = (req: Request) => {
  if (config.apiPublicUrl) return config.apiPublicUrl.replace(/\/+$/, "");
  const forwardedProto = ((req.headers["x-forwarded-proto"] as string | undefined) ?? "").split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = ((req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host") ?? "").split(",")[0]?.trim();
  if (!host) return "";
  return `${proto}://${host}`;
};

const resolveFlutterwaveCallbackUrl = (req: Request, txRef: string, titleId: number | string) => {
  const apiBase = resolvePublicApiBase(req);
  const defaultReturnPath = "/api/app-session/ppv/flutterwave/return";
  const defaultReturn = apiBase ? joinUrl(apiBase, defaultReturnPath) : "";
  const callbackBase = config.flutterwave.callbackUrl || defaultReturn || undefined;
  if (!callbackBase) return undefined;
  return appendQuery(callbackBase, {
    tx_ref: txRef,
    appSessionId: txRef,
    titleId: String(titleId),
    source: "ppv",
  });
};

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
    const amountNaira = title.ppvPriceNaira;
    const baseCurrency = title.ppvCurrency ?? "NGN";
    const localized = await safeLocalizePrice({
      amount: amountNaira,
      baseCurrency,
      country,
    });
    const gateway = "FLUTTERWAVE";
    const txRef = `PPV-FLW-${titleId}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

    await prisma.ppvPurchase.create({
      data: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        amountNaira,
        currency: localized.currency,
        gateway,
        paystackRef: txRef,
        status: "PENDING",
      },
    });

    const callbackUrl = resolveFlutterwaveCallbackUrl(req, txRef, titleId);
    console.info("[ppv][flutterwave][initiate] created pending purchase", {
      userId: String(req.user.userId),
      titleId: String(titleId),
      txRef,
      callbackConfigured: Boolean(callbackUrl),
    });

    let checkoutUrl: string | undefined;
    if (config.flutterwave.secretKey) {
      const initResp = await fetch(`${config.flutterwave.baseUrl}/v3/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.flutterwave.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: localized.amount,
          currency: localized.currency,
          redirect_url: callbackUrl,
          customer: {
            email: user.email,
            name: user.name ?? user.email ?? "Customer",
          },
          meta: {
            appSessionId: txRef,
            titleId: String(titleId),
            userId: String(req.user.userId),
            source: "ppv",
          },
          customizations: {
            title: "Wanzami PPV",
            description: `PPV purchase for ${title.name}`,
          },
        }),
      });
      const initParsed = await readFlutterwaveResponse(initResp);
      const initJson = initParsed.json ?? {};
      if (initResp.ok && initJson?.status === "success") {
        checkoutUrl = initJson?.data?.link;
      }
    }

    console.info("[ppv][flutterwave][initiate] returning checkout payload", {
      txRef,
      hasCheckoutUrl: Boolean(checkoutUrl),
      verifyEndpoint: "/api/app-session/ppv/flutterwave/verify",
    });

    return res.json({
      flow: "v3-inline", 
      publicKey: config.flutterwave.publicKey,
      txRef,
      appSessionId: txRef,
      amount: localized.amount,
      currency: localized.currency,
      customer: {
        email: user.email,
        name: user.name ?? user.email ?? "Customer",
      },
      title: {
        id: titleId,
        name: title.name,
      },
      redirectUrl: callbackUrl,
      checkoutUrl,
      verifyEndpoint: "/api/app-session/ppv/flutterwave/verify",
      metadata: {
        txRef,
        appSessionId: txRef,
        titleId: String(titleId),
        userId: String(req.user.userId),
      },
    });

  } catch (err) {
    console.error("ppv initiate error", err);
    return res.status(500).json({ message: "Failed to initiate PPV purchase" });
  }
};

export const initiatePaystackPurchase = async (req: AuthenticatedRequest, res: Response) => {
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
    const amountNaira = title.ppvPriceNaira;
    const baseCurrency = title.ppvCurrency ?? "NGN";
    const localized = await safeLocalizePrice({
      amount: amountNaira,
      baseCurrency,
      country,
    });

    if (!config.paystack.secretKey) {
      return res.status(500).json({ message: "Paystack secret key not configured" });
    }

    const reference = `PPV-PAY-${titleId}-${Date.now()}`;
    const initializePayload = {
      email: user.email,
      amount: Math.round(localized.amount * 100),
      currency: localized.currency,
      reference,
      callback_url: config.paystack.callbackUrl || undefined,
    };

    const paystackResp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.paystack.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(initializePayload),
    });
    const paystackParsed = await readFlutterwaveResponse(paystackResp);
    const paystackJson = paystackParsed.json ?? {};
    if (!paystackResp.ok || paystackJson.status !== true) {
      return res.status(502).json({
        message: "Paystack init failed",
        status: paystackResp.status,
        details: paystackJson,
        raw: paystackParsed.text,
      });
    }

    await prisma.ppvPurchase.create({
      data: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        amountNaira,
        currency: localized.currency,
        gateway: "PAYSTACK",
        paystackRef: reference,
        status: "PENDING",
        rawPayload: paystackJson,
      },
    });

    return res.json({
      authorizationUrl: paystackJson?.data?.authorization_url,
      reference,
      currency: localized.currency,
      amount: localized.amount,
    });
  } catch (err) {
    console.error("paystack initiate error", err);
    return res.status(500).json({ message: "Failed to initiate Paystack purchase" });
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

    const callbackUrl = resolveFlutterwaveCallbackUrl(req, reference, titleId);
    const payload: any = {
      amount: localized.amount,
      currency: localized.currency,
      reference,
      redirect_url: callbackUrl,
      customer: customerPayload,
      payment_method: paymentMethod,
      meta: {
        appSessionId: reference,
        titleId: String(titleId),
        userId: String(req.user.userId),
        source: "ppv",
      },
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
      txRef: reference,
      appSessionId: reference,
      gateway,
      currency: localized.currency,
      amountNaira,
      redirectUrl: callbackUrl,
      chargeId: data.id,
      status: data.status,
      nextAction: data.next_action ?? null,
      paymentInstruction: data.payment_instruction ?? data.payment_instructions ?? null,
      verifyEndpoint: "/api/app-session/ppv/flutterwave/verify",
      metadata: {
        txRef: reference,
        appSessionId: reference,
        titleId: String(titleId),
        userId: String(req.user.userId),
      },
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

export const initiateGeneralPurchase = async (req: AuthenticatedRequest, res: Response) => {
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

    if (!method) return res.status(400).json({ message: "Payment method required" });

    const accessToken = await getFlutterwaveAccessToken();
    const traceId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const reference = `PPV-${titleId}-${Date.now()}`;

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

    const customerResp = await fetch(`${config.flutterwave.baseUrl}/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
      },
      body: JSON.stringify(customerPayload),
    });
    const customerParsed = await readFlutterwaveResponse(customerResp);
    const customerJson = customerParsed.json ?? {};
    if (!customerResp.ok || customerJson.status !== "success") {
      return res.status(502).json({
        message: "Flutterwave customer failed",
        status: customerResp.status,
        details: customerJson,
        raw: customerParsed.text,
      });
    }
    const customerId = customerJson?.data?.id;

    let paymentMethodPayload: any = { type: method };
    if (method === "card") {
      if (!card?.number || !card?.cvv || !card?.expiryMonth || !card?.expiryYear) {
        return res.status(400).json({ message: "Missing card details" });
      }
      paymentMethodPayload.card = encryptCardPayload({
        number: card.number,
        cvv: card.cvv,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        pin: card.pin,
      });
    } else if (method === "ussd") {
      paymentMethodPayload.ussd = {
        bank: ussd?.bankCode,
        phone_number: ussd?.phoneNumber,
      };
    } else if (method === "bank_transfer") {
      paymentMethodPayload.bank_transfer = bankTransfer ?? {};
    } else if (method === "opay") {
      paymentMethodPayload.opay = opay?.phoneNumber ? { phone_number: opay.phoneNumber } : undefined;
    } else if (method === "googlepay") {
      paymentMethodPayload.googlepay = {
        card_holder_name: googlepay?.cardHolderName,
      };
    } else if (method === "applepay") {
      paymentMethodPayload.applepay = {
        card_holder_name: applepay?.cardHolderName,
      };
    }

    const pmdResp = await fetch(`${config.flutterwave.baseUrl}/payment-methods`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentMethodPayload),
    });
    const pmdParsed = await readFlutterwaveResponse(pmdResp);
    const pmdJson = pmdParsed.json ?? {};
    if (!pmdResp.ok || pmdJson.status !== "success") {
      return res.status(502).json({
        message: "Flutterwave payment method failed",
        status: pmdResp.status,
        details: pmdJson,
        raw: pmdParsed.text,
      });
    }
    const paymentMethodId = pmdJson?.data?.id;

    const callbackUrl = resolveFlutterwaveCallbackUrl(req, reference, titleId);
    const chargePayload = {
      reference,
      currency: localized.currency,
      amount: localized.amount,
      customer_id: customerId,
      payment_method_id: paymentMethodId,
      redirect_url: callbackUrl,
      meta: {
        appSessionId: reference,
        titleId: String(titleId),
        userId: String(req.user.userId),
        source: "ppv",
      },
    };

    const chargeResp = await fetch(`${config.flutterwave.baseUrl}/charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Trace-Id": traceId,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(chargePayload),
    });
    const chargeParsed = await readFlutterwaveResponse(chargeResp);
    const chargeJson = chargeParsed.json ?? {};
    if (!chargeResp.ok || chargeJson.status !== "success") {
      return res.status(502).json({
        message: "Flutterwave charge failed",
        status: chargeResp.status,
        details: chargeJson,
        raw: chargeParsed.text,
      });
    }

    await prisma.ppvPurchase.create({
      data: {
        userId: req.user.userId,
        titleId: BigInt(titleId),
        amountNaira,
        currency: localized.currency,
        gateway: "FLUTTERWAVE",
        paystackRef: reference,
        status: "PENDING",
        rawPayload: chargeJson,
      },
    });

    const data = chargeJson?.data ?? {};
    return res.json({
      reference,
      txRef: reference,
      appSessionId: reference,
      gateway: "FLUTTERWAVE",
      currency: localized.currency,
      amountNaira,
      redirectUrl: callbackUrl,
      chargeId: data.id,
      customerId,
      paymentMethodId,
      status: data.status,
      nextAction: data.next_action ?? null,
      paymentInstruction: data.payment_instruction ?? data.payment_instructions ?? null,
      verifyEndpoint: "/api/app-session/ppv/flutterwave/verify",
      metadata: {
        txRef: reference,
        appSessionId: reference,
        titleId: String(titleId),
        userId: String(req.user.userId),
      },
    });
  } catch (err: any) {
    console.error("ppv general flow error", err);
    return res.status(500).json({ message: "Failed to initiate PPV payment", error: err?.message });
  }
};

export const authorizeGeneralCharge = async (req: AuthenticatedRequest, res: Response) => {
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
      `${config.flutterwave.baseUrl}/charges/${encodeURIComponent(chargeId)}/authorize`,
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
    console.error("ppv general authorize error", err);
    return res.status(500).json({ message: "Failed to authorize payment", error: err?.message });
  }
};

export const verifyGeneralCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chargeId = (req.query.chargeId as string | undefined) ?? undefined;
    if (!chargeId) return res.status(400).json({ message: "chargeId required" });
    const accessToken = await getFlutterwaveAccessToken();
    const resp = await fetch(`${config.flutterwave.baseUrl}/charges/${encodeURIComponent(chargeId)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok || json.status !== "success") {
      return res.status(502).json({ message: "Flutterwave verify failed", details: json });
    }
    return res.json(json);
  } catch (err: any) {
    console.error("ppv general verify error", err);
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

    console.info("[ppv][flutterwave][webhook] received", {
      txRef,
      reference: directRef,
      resolvedRef: refToFind,
      status: data?.status,
    });

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
        void createNotification({
          userId: purchase.userId,
          type: "RENTAL_EXPIRY",
          title: "Rental confirmed",
          body: `You now have access to "${purchase.title?.name ?? "this title"}". Your rental expires on ${expiresAt.toLocaleDateString()}.`,
          metadata: { titleId: purchase.titleId.toString(), accessExpiresAt: expiresAt.toISOString() },
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

export const flutterwaveAppSessionReturn = async (req: Request, res: Response) => {
  try {
    const txRefRaw =
      (req.query.tx_ref as string | undefined) ??
      (req.query.txRef as string | undefined) ??
      (req.query.reference as string | undefined) ??
      (req.query.appSessionId as string | undefined);
    const transactionIdRaw =
      (req.query.transaction_id as string | undefined) ??
      (req.query.transactionId as string | undefined) ??
      (req.query["transaction-id"] as string | undefined);
    const statusRaw = (req.query.status as string | undefined) ?? undefined;

    let txRef = txRefRaw ? String(txRefRaw).trim() : undefined;
    const transactionId = transactionIdRaw ? String(transactionIdRaw).trim() : undefined;
    const status = statusRaw ? String(statusRaw).trim() : undefined;

    if (!txRef && transactionId) {
      txRef = await resolveTxRefFromVerifiedTransaction(transactionId);
    }

    if (!txRef && !transactionId) {
      return res.status(400).json({ message: "Missing tx_ref/transaction_id" });
    }

    console.info("[ppv][flutterwave][return] received callback", {
      txRef,
      transactionId,
      status,
      hasAppSessionReturnUrl: Boolean(config.flutterwave.appSessionReturnUrl),
    });

    if (config.flutterwave.appSessionReturnUrl) {
      const redirectUrl = appendQuery(config.flutterwave.appSessionReturnUrl, {
        tx_ref: txRef,
        txRef,
        appSessionId: txRef,
        transaction_id: transactionId,
        transactionId,
        status,
        source: "ppv",
      });
      return res.redirect(302, redirectUrl);
    }

    return res.status(200).json({
      message: "Flutterwave return received",
      txRef,
      appSessionId: txRef,
      transactionId,
      status,
      verifyEndpoint: "/api/app-session/ppv/flutterwave/verify",
    });
  } catch (err) {
    console.error("flutterwave app-session return error", err);
    return res.status(500).json({ message: "App-session return handling failed" });
  }
};

export const verifyFlutterwavePurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = (req.query ?? {}) as Record<string, unknown>;

    const transactionIdRaw =
      body.transactionId ?? body.transaction_id ?? body["transaction-id"] ?? query.transactionId ?? query.transaction_id;
    const txRefRaw =
      body.txRef ??
      body.tx_ref ??
      body.reference ??
      body.appSessionId ??
      body.app_session_id ??
      query.txRef ??
      query.tx_ref ??
      query.reference ??
      query.appSessionId ??
      query.app_session_id;

    const transactionId =
      transactionIdRaw === undefined || transactionIdRaw === null || String(transactionIdRaw).trim() === ""
        ? undefined
        : String(transactionIdRaw).trim();
    const txRef =
      txRefRaw === undefined || txRefRaw === null || String(txRefRaw).trim() === ""
        ? undefined
        : String(txRefRaw).trim();

    if (!transactionId && !txRef) {
      return res.status(400).json({
        message:
          "transactionId/transaction_id or txRef/tx_ref required (appSessionId/app_session_id also accepted as tx_ref)",
      });
    }

    console.info("[ppv][flutterwave][verify] request", {
      userId: req.user ? String(req.user.userId) : undefined,
      txRef,
      transactionId,
    });

    if (!config.flutterwave.secretKey) {
      return res.status(500).json({ message: "Flutterwave secret key not configured" });
    }

    const verifyByTransaction = async (id: string) => {
      const resp = await fetch(`${config.flutterwave.baseUrl}/v3/transactions/${encodeURIComponent(id)}/verify`, {
        headers: {
          Authorization: `Bearer ${config.flutterwave.secretKey}`,
        },
      });
      const parsed = await readFlutterwaveResponse(resp);
      const data = parsed.json ?? {};
      return { resp, parsed, data };
    };

    const verifyByReference = async (reference: string) => {
      const resp = await fetch(
        `${config.flutterwave.baseUrl}/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${config.flutterwave.secretKey}`,
          },
        }
      );
      const parsed = await readFlutterwaveResponse(resp);
      const data = parsed.json ?? {};
      return { resp, parsed, data };
    };

    let verification:
      | {
          resp: any;
          parsed: { json: any; text: string };
          data: any;
        }
      | undefined;

    if (transactionId) {
      verification = await verifyByTransaction(transactionId);
      if ((!verification.resp.ok || verification.data?.status !== "success") && txRef) {
        verification = await verifyByReference(txRef);
      }
    } else if (txRef) {
      verification = await verifyByReference(txRef);
    }

    if (!verification || !verification.resp.ok || verification.data?.status !== "success") {
      return res.status(502).json({
        message: "Flutterwave verify failed",
        details: verification?.data ?? null,
        raw: verification?.parsed?.text,
      });
    }

    const payload = verification.data?.data ?? {};
    const candidateRefs = [
      txRef,
      payload?.tx_ref,
      payload?.meta?.tx_ref,
      payload?.meta?.txRef,
      payload?.meta?.appSessionId,
      payload?.meta?.app_session_id,
      payload?.meta_data?.tx_ref,
      payload?.meta_data?.txRef,
      payload?.meta_data?.appSessionId,
      payload?.meta_data?.app_session_id,
    ]
      .map((v) => (v == null ? "" : String(v).trim()))
      .filter((v) => v.length > 0);

    const uniqueRefs = [...new Set(candidateRefs)];
    if (uniqueRefs.length === 0) {
      return res.status(400).json({ message: "Missing tx_ref in verification response" });
    }

    console.info("[ppv][flutterwave][verify] resolved candidate refs", {
      txRef,
      candidateCount: uniqueRefs.length,
    });

    let purchase: any = null;
    let ref: string | undefined;

    for (const candidate of uniqueRefs) {
      const found = await prisma.ppvPurchase.findUnique({
        where: { paystackRef: candidate },
        include: { user: true, title: true },
      });
      if (found) {
        purchase = found;
        ref = candidate;
        break;
      }
    }

    if (!purchase || !ref) {
      console.warn("[ppv][flutterwave][verify] purchase lookup failed", {
        txRef,
        transactionId,
        candidateCount: uniqueRefs.length,
      });
      return res.status(404).json({ message: "Purchase not found" });
    }

    if (String(payload?.status).toLowerCase() === "successful") {
      const expiresAt = new Date(Date.now() + ppvAccessDays * 24 * 60 * 60 * 1000);
      await prisma.ppvPurchase.update({
        where: { paystackRef: ref },
        data: {
          status: "SUCCESS",
          paystackTrxId: String(payload?.id ?? transactionId ?? ""),
          rawPayload: verification.data,
          accessExpiresAt: expiresAt,
        },
      });
      console.info("[ppv][flutterwave][verify] purchase marked success", {
        purchaseId: String(purchase.id),
        txRef: ref,
        userId: String(purchase.userId),
        titleId: String(purchase.titleId),
      });
      if (purchase.status !== "SUCCESS") {
        await sendPpvThankYou({
          userEmail: purchase.user?.email,
          userName: purchase.user?.name,
          titleId: purchase.titleId,
          titleName: purchase.title?.name,
        });
        void createNotification({
          userId: purchase.userId,
          type: "RENTAL_EXPIRY",
          title: "Rental confirmed",
          body: `You now have access to "${purchase.title?.name ?? "this title"}". Your rental expires on ${expiresAt.toLocaleDateString()}.`,
          metadata: { titleId: purchase.titleId.toString(), accessExpiresAt: expiresAt.toISOString() },
        });
      }
    } else if (payload?.status) {
      await prisma.ppvPurchase.update({
        where: { paystackRef: ref },
        data: { status: "FAILED", rawPayload: verification.data },
      });
      console.info("[ppv][flutterwave][verify] purchase marked failed", {
        purchaseId: String(purchase.id),
        txRef: ref,
        status: String(payload?.status),
      });
    }

    return res.json({ verified: true, data: verification.data });
  } catch (err) {
    console.error("flutterwave verify error", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

export const verifyPaystackPurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) return res.status(400).json({ message: "reference required" });
    if (!config.paystack.secretKey) {
      return res.status(500).json({ message: "Paystack secret key not configured" });
    }

    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${config.paystack.secretKey}`,
      },
    });
    const parsed = await readFlutterwaveResponse(resp);
    const data = parsed.json ?? {};
    if (!resp.ok || data.status !== true) {
      return res.status(502).json({ message: "Paystack verify failed", details: data, raw: parsed.text });
    }

    const payload = data?.data ?? {};
    const ref = payload?.reference ?? reference;
    const purchase = await prisma.ppvPurchase.findUnique({
      where: { paystackRef: ref },
      include: { user: true, title: true },
    });
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if (payload?.status === "success") {
      const expiresAt = new Date(Date.now() + ppvAccessDays * 24 * 60 * 60 * 1000);
      await prisma.ppvPurchase.update({
        where: { paystackRef: ref },
        data: {
          status: "SUCCESS",
          paystackTrxId: String(payload?.id ?? ""),
          rawPayload: data,
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
        where: { paystackRef: ref },
        data: { status: "FAILED", rawPayload: data },
      });
    }

    return res.json({ verified: true, data });
  } catch (err) {
    console.error("paystack verify error", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    if (!signature || !config.paystack.webhookSecret) {
      return res.status(401).json({ message: "Invalid signature" });
    }
    const hash = crypto
      .createHmac("sha512", config.paystack.webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const data = (req.body as any)?.data;
    const ref = data?.reference;
    if (!ref) return res.status(400).json({ message: "Missing reference" });

    const purchase = await prisma.ppvPurchase.findUnique({
      where: { paystackRef: ref },
      include: { user: true, title: true },
    });
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });

    if ((req.body as any)?.event === "charge.success") {
      const expiresAt = new Date(Date.now() + ppvAccessDays * 24 * 60 * 60 * 1000);
      await prisma.ppvPurchase.update({
        where: { paystackRef: ref },
        data: {
          status: "SUCCESS",
          paystackTrxId: String(data?.id ?? ""),
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
        void createNotification({
          userId: purchase.userId,
          type: "RENTAL_EXPIRY",
          title: "Rental confirmed",
          body: `You now have access to "${purchase.title?.name ?? "this title"}". Your rental expires on ${expiresAt.toLocaleDateString()}.`,
          metadata: { titleId: purchase.titleId.toString(), accessExpiresAt: expiresAt.toISOString() },
        });
      }
    } else if (data?.status) {
      await prisma.ppvPurchase.update({
        where: { paystackRef: ref },
        data: { status: "FAILED", rawPayload: req.body },
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
