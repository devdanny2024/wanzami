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

/* The choice is stored twice: in a first-party cookie (1 year, shared across
   every *.wanzami.tv subdomain, and kept by browsers that wipe localStorage) and
   in localStorage (what older visits wrote). Either one is enough to remember
   the visitor; reading migrates one into the other so they never disagree. */

const COOKIE_NAME = "wz_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type StoredConsent = { decision: Exclude<ConsentDecision, null>; prefs: ConsentPrefs };

function cookieDomain(): string | null {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  return host === "wanzami.tv" || host.endsWith(".wanzami.tv") ? ".wanzami.tv" : null;
}

function readCookie(): StoredConsent | null {
  if (typeof document === "undefined") return null;
  try {
    const part = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!part) return null;
    const parsed = JSON.parse(decodeURIComponent(part.slice(COOKIE_NAME.length + 1))) as {
      d?: string;
      p?: Partial<ConsentPrefs>;
    };
    if (parsed.d !== "accepted" && parsed.d !== "rejected") return null;
    return { decision: parsed.d, prefs: { ...DEFAULT_PREFS, ...(parsed.p ?? {}), essential: true } };
  } catch {
    return null;
  }
}

function writeCookie(decision: Exclude<ConsentDecision, null>, prefs: ConsentPrefs) {
  if (typeof document === "undefined") return;
  try {
    const value = encodeURIComponent(JSON.stringify({ d: decision, p: prefs }));
    const domain = cookieDomain();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}${domain ? `; Domain=${domain}` : ""}`;
  } catch {
    // cookies blocked; localStorage below still remembers the choice
  }
}

function readLocal(): StoredConsent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v !== "accepted" && v !== "rejected") return null;
    const raw = window.localStorage.getItem(PREFS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ConsentPrefs>) : {};
    return { decision: v, prefs: { ...DEFAULT_PREFS, ...parsed, essential: true } };
  } catch {
    return null;
  }
}

function writeLocal(decision: Exclude<ConsentDecision, null>, prefs: ConsentPrefs) {
  try {
    window.localStorage.setItem(CONSENT_KEY, decision);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // storage blocked; the cookie above still remembers the choice
  }
}

function readStored(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  const fromCookie = readCookie();
  const fromLocal = readLocal();
  const found = fromCookie ?? fromLocal;
  if (!found) return null;
  // Heal whichever copy is missing (e.g. a choice made before the cookie existed).
  if (!fromCookie) writeCookie(found.decision, found.prefs);
  if (!fromLocal) writeLocal(found.decision, found.prefs);
  return found;
}

export function getStoredDecision(): ConsentDecision {
  return readStored()?.decision ?? null;
}

export function getStoredPrefs(): ConsentPrefs {
  return readStored()?.prefs ?? { ...DEFAULT_PREFS };
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
  writeLocal(decision, normalized);
  writeCookie(decision, normalized);
  applyConsentToGtag(normalized);
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT, { detail: { decision, prefs: normalized } })
  );
}
