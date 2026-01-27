const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  ZAR: "R",
  GHS: "₵",
  KES: "KSh ",
  UGX: "USh ",
  TZS: "TSh ",
  RWF: "RF ",
  EGP: "E£",
  MAD: "MAD ",
  DZD: "DZD ",
  TND: "TND ",
  SAR: "SAR ",
  AED: "AED ",
  QAR: "QAR ",
  KWD: "KWD ",
  BHD: "BHD ",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  SGD: "S$",
  MYR: "RM ",
};

export const getCurrencySymbol = (currency?: string | null) => {
  const code = (currency ?? "USD").toUpperCase();
  return SYMBOLS[code] ?? `${code} `;
};

export const formatMoney = (amount?: number | null, currency?: string | null) => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "";
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};
