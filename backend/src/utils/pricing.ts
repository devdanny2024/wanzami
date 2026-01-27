import { convertCurrency } from "./fx.js";

const EURO_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

const COUNTRY_CURRENCY: Record<string, string> = {
  NG: "NGN",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  ZA: "ZAR",
  GH: "GHS",
  KE: "KES",
  UG: "UGX",
  TZ: "TZS",
  RW: "RWF",
  EG: "EGP",
  MA: "MAD",
  DZ: "DZD",
  TN: "TND",
  SA: "SAR",
  AE: "AED",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  SG: "SGD",
  MY: "MYR",
};

export const currencyForCountry = (
  country: string | null | undefined,
  fallbackCurrency = "USD"
): string => {
  const code = (country ?? "").toUpperCase();
  if (!code || code === "UNKNOWN") return fallbackCurrency.toUpperCase();
  if (COUNTRY_CURRENCY[code]) return COUNTRY_CURRENCY[code];
  if (EURO_COUNTRIES.has(code)) return "EUR";
  return fallbackCurrency.toUpperCase();
};

export const localizePrice = async ({
  amount,
  baseCurrency,
  country,
}: {
  amount: number;
  baseCurrency: string;
  country: string | null | undefined;
}): Promise<{ amount: number; currency: string; rate: number }> => {
  const target = currencyForCountry(country, baseCurrency);
  return convertCurrency(amount, baseCurrency, target);
};
