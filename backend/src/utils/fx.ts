import { config } from "../config.js";
import { prisma } from "../prisma.js";

type FxCacheEntry = {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
};

const cache = new Map<string, FxCacheEntry>();

const toNumber = (value: any): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeRates = (raw: any): Record<string, number> => {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) {
    const num = toNumber(value);
    if (num !== undefined) result[key.toUpperCase()] = num;
  }
  return result;
};

const fetchRates = async (base: string): Promise<Record<string, number>> => {
  const baseUpper = base.toUpperCase();
  const url = `${config.fx.apiBase.replace(/\/+$/, "")}/${baseUpper}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FX rates request failed (${res.status})`);
  }
  const data = await res.json().catch(() => ({}));
  return normalizeRates(data?.rates ?? data?.data?.rates);
};

export const getRates = async (base: string): Promise<Record<string, number>> => {
  const baseUpper = base.toUpperCase();
  const ttl = Math.max(60 * 1000, config.fx.cacheTtlMs || 0);
  const cached = cache.get(baseUpper);
  if (cached && Date.now() - cached.fetchedAt < ttl) {
    return cached.rates;
  }
  const rates = await fetchRates(baseUpper);
  cache.set(baseUpper, { base: baseUpper, rates, fetchedAt: Date.now() });
  return rates;
};

const zeroDecimalCurrencies = new Set([
  "JPY",
  "KRW",
  "UGX",
  "RWF",
  "XOF",
  "XAF",
  "CLP",
  "VND",
  "IDR",
]);

export const roundMoney = (amount: number, currency: string): number => {
  const decimals = zeroDecimalCurrencies.has(currency.toUpperCase()) ? 0 : 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
};

const getOverrideRate = async (currency: string): Promise<number | undefined> => {
  try {
    const row = await prisma.fxRateOverride.findUnique({ where: { currency } });
    return row?.rate;
  } catch {
    return undefined;
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount: number; currency: string; rate: number }> => {
  const fromUpper = fromCurrency.toUpperCase();
  const toUpper = toCurrency.toUpperCase();
  if (!amount || amount <= 0) {
    return { amount, currency: toUpper || fromUpper, rate: 1 };
  }
  if (fromUpper === toUpper || !toUpper) {
    return { amount: roundMoney(amount, fromUpper), currency: fromUpper, rate: 1 };
  }
  // An admin-set rate always wins over the live API, since it's the only way
  // to keep pricing correct when the free FX provider is down or wrong.
  const rate = (await getOverrideRate(toUpper)) ?? (await getRates(fromUpper))[toUpper];
  if (!rate) {
    return { amount: roundMoney(amount, fromUpper), currency: fromUpper, rate: 1 };
  }
  const converted = amount * rate;
  return { amount: roundMoney(converted, toUpper), currency: toUpper, rate };
};
