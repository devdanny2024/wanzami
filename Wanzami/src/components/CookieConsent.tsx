'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CONSENT_CATEGORIES,
  ConsentPrefs,
  ConsentDecision,
  DEFAULT_PREFS,
  getStoredDecision,
  getStoredPrefs,
  persistConsent,
} from "@/lib/consent";

/* Cookie notice, in the Call Sheet identity: paper panel, hard ink border and
   offset shadow, mono labels, square controls. Decline and Accept carry equal
   weight. It never appears until the stored choice has been read, so returning
   visitors do not see it flash. */

const HIDDEN_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/player"];

export function CookieConsent() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [decision, setDecision] = useState<ConsentDecision>(null);
  const [prefs, setPrefs] = useState<ConsentPrefs>({ ...DEFAULT_PREFS });

  useEffect(() => {
    setDecision(getStoredDecision());
    setPrefs(getStoredPrefs());
    setReady(true);
  }, []);

  const hiddenHere = pathname ? HIDDEN_ROUTES.some((r) => pathname.startsWith(r)) : false;
  if (!ready || decision !== null || hiddenHere) return null;

  const commit = (next: ConsentPrefs, d: Exclude<ConsentDecision, null>) => {
    setPrefs(next);
    setDecision(d);
    persistConsent(d, next);
  };

  const handleAcceptAll = () => commit({ essential: true, analytics: true, marketing: true, external: true }, "accepted");
  const handleDecline = () => commit({ ...DEFAULT_PREFS }, "rejected");
  const handleSave = () => {
    const anyNonEssential = prefs.analytics || prefs.marketing || prefs.external;
    commit(prefs, anyNonEssential ? "accepted" : "rejected");
  };
  const togglePref = (key: keyof ConsentPrefs, locked?: boolean) => {
    if (locked) return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const btn =
    "min-h-[44px] w-full sm:w-auto px-5 font-mono text-xs font-bold uppercase tracking-widest border-[2.5px] border-cs-ink transition-transform active:translate-y-px focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cs-rust";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[10010] p-3 sm:p-5">
      <section
        role="region"
        aria-label="Cookie notice"
        className="pointer-events-auto mx-auto max-w-5xl border-[3px] border-cs-ink bg-cs-paper text-cs-ink cs-shadow-lg"
      >
        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="cs-slug mb-1">Wanzami / Cookies</p>
            <h2 className="font-heading text-2xl uppercase leading-none tracking-wide sm:text-3xl">A word about cookies</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cs-muted">
              We use cookies to keep the site working and to understand how it is used. Essential cookies are always on; you choose the
              rest. Details are in our{" "}
              <a className="font-semibold text-cs-rust underline underline-offset-2 hover:text-cs-ink" href="/policy#privacy">
                privacy policy
              </a>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
              {CONSENT_CATEGORIES.map((cat) => (
                <label
                  key={cat.key}
                  className={`flex select-none items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider ${
                    cat.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-[18px] w-[18px] shrink-0 accent-[#fd7e14]"
                    checked={Boolean(prefs[cat.key])}
                    disabled={cat.locked}
                    onChange={() => togglePref(cat.key, cat.locked)}
                  />
                  <span>
                    {cat.label}
                    {cat.locked ? <span className="ml-1 font-normal normal-case text-cs-muted">(always on)</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
            <button type="button" className={`${btn} order-3 bg-cs-paper text-cs-ink hover:bg-cs-panel sm:order-1`} onClick={handleDecline}>
              Decline
            </button>
            <button type="button" className={`${btn} order-2 bg-cs-paper text-cs-ink hover:bg-cs-panel`} onClick={handleSave}>
              Save choices
            </button>
            <button type="button" className={`${btn} order-1 bg-brand text-cs-ink cs-shadow-sm hover:bg-brand-light sm:order-3`} onClick={handleAcceptAll}>
              Accept all
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CookieConsent;
