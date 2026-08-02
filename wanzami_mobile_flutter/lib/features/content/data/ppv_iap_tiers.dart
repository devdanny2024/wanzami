// Mirrors backend/src/utils/ppvIapTiers.ts. Used to query StoreKit for a
// title's localized price before the user commits to a purchase; the
// authoritative product id for the actual purchase still comes from
// ContentRepository.createIapIntent.
const Map<int, String> ppvIapProductIds = {
  1500: 'tv.wanzami.app.ppv.tier1500',
  2000: 'tv.wanzami.app.ppv.tier2000',
  2500: 'tv.wanzami.app.ppv.tier2500',
  3500: 'tv.wanzami.app.ppv.tier3500',
};

String? productIdForPriceNaira(num? priceNaira) {
  if (priceNaira == null) return null;
  return ppvIapProductIds[priceNaira.round()];
}
