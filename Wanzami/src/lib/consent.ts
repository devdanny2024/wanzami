// Single source of truth for cookie consent.
//
// Stores the visitor's decision + per-category preferences in localStorage,
// applies them to Google Analytics via Consent Mode v2, and broadcasts a
// `wanzami:consent-change` event so other client components (e.g. the gated
// Vercel <Analytics/>) can react without prop drilling.

export type ConsentCategory = "essential" | "analytics" | "marketing" | "external";
export type ConsentPrefs = Record<ConsentCategory, boolean>;
export type ConsentDecision = "accepted" | "rejected" | null;

export const CONSENT_CATEGORIES: { key: ConsentCategory; label: string; locked?: boolean }[] = [
  { key: "essential", label: "Essential", locked: true },
  { key: "analytics", label: "Analytics" },
  { key: "marketing", label: "Marketing" },
  { key: "external", label: "External Media" },
];

export const DEFAULT_PREFS: ConsentPrefs = {
  essential: true,
  analytics: false,
  marketing: false,
  external: false,
};

const CONSENT_KEY = "cookieConsent";
const PREFS_KEY = "cookiePreferences";
export const CONSENT_EVENT = "wanzami:consent-change";

export function getStoredDecision(): ConsentDecision {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export function getStoredPrefs(): ConsentPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  const raw = window.localStorage.getItem(PREFS_KEY);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentPrefs>;
    // Essential is always on regardless of what was stored.
    return { ...DEFAULT_PREFS, ...parsed, essential: true };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

type GtagConsentValue = "granted" | "denied";

// Push the preferences into Google's Consent Mode so GA stops/starts setting
// cookies accordingly. Safe to call before gtag has loaded — the command is
// queued on dataLayer and replayed once gtag.js initializes.
export function applyConsentToGtag(prefs: ConsentPrefs) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  const grant = (on: boolean): GtagConsentValue => (on ? "granted" : "denied");
  gtag("consent", "update", {
    analytics_storage: grant(prefs.analytics),
    ad_storage: grant(prefs.marketing),
    ad_user_data: grant(prefs.marketing),
    ad_personalization: grant(prefs.marketing),
  });
}

// Persist a decision, apply it to gtag, and notify listeners.
export function persistConsent(decision: Exclude<ConsentDecision, null>, prefs: ConsentPrefs) {
  if (typeof window === "undefined") return;
  const normalized: ConsentPrefs = { ...prefs, essential: true };
  window.localStorage.setItem(CONSENT_KEY, decision);
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(normalized));
  applyConsentToGtag(normalized);
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, { detail: { decision, prefs: normalized } })
  );
}
