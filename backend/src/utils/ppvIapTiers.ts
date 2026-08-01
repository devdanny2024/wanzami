// Apple only lets a fixed set of products exist per app, so PPV pricing is
// mapped onto a small number of shared tiers rather than one product per
// title. Every PPV title's ppvPriceNaira must be one of these keys, or an
// iOS purchase for it cannot be offered. Keep this in sync with the
// products actually created in App Store Connect under this bundle ID.
export const PPV_IAP_TIERS: Record<number, string> = {
  1500: "tv.wanzami.app.ppv.tier1500",
  2000: "tv.wanzami.app.ppv.tier2000",
  2500: "tv.wanzami.app.ppv.tier2500",
  3500: "tv.wanzami.app.ppv.tier3500",
};

export const productIdForPriceNaira = (priceNaira: number): string | null =>
  PPV_IAP_TIERS[priceNaira] ?? null;

export const priceNairaForProductId = (productId: string): number | null => {
  for (const [price, pid] of Object.entries(PPV_IAP_TIERS)) {
    if (pid === productId) return Number(price);
  }
  return null;
};
