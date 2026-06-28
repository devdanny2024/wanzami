'use client';

import { useEffect, useMemo, useState } from "react";
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

export function CookieConsent() {
  const pathname = usePathname();
  const [decision, setDecision] = useState<ConsentDecision>(null);
  const [prefs, setPrefs] = useState<ConsentPrefs>({ ...DEFAULT_PREFS });

  useEffect(() => {
    setDecision(getStoredDecision());
    setPrefs(getStoredPrefs());
  }, []);

  const hiddenRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthRoute = pathname ? hiddenRoutes.some((r) => pathname.startsWith(r)) : false;

  // Only show until the visitor makes a choice. Accepting OR declining hides it
  // and keeps it hidden across reloads.
  const visible = useMemo(() => decision === null && !isAuthRoute, [decision, isAuthRoute]);
  if (!visible) return null;

  const commit = (next: ConsentPrefs, d: Exclude<ConsentDecision, null>) => {
    setPrefs(next);
    setDecision(d);
    persistConsent(d, next);
  };

  const handleAcceptAll = () => {
    commit({ essential: true, analytics: true, marketing: true, external: true }, "accepted");
  };

  const handleDecline = () => {
    commit({ ...DEFAULT_PREFS }, "rejected");
  };

  const handleSave = () => {
    const anyNonEssential = prefs.analytics || prefs.marketing || prefs.external;
    commit(prefs, anyNonEssential ? "accepted" : "rejected");
  };

  const togglePref = (key: keyof ConsentPrefs, locked?: boolean) => {
    if (locked) return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10010] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-card/95 text-foreground border border-white/10 shadow-2xl shadow-black/60 backdrop-blur-xl p-4 sm:p-6">
        <div className="space-y-3">
          <div className="font-heading text-lg sm:text-xl tracking-wide text-foreground">This website uses cookies</div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We use cookies to provide the best experience on our website. This includes cookies for website functionality, to manage
            our commercial objectives and optimization. You can decide which cookie categories you would like to permit. See our{" "}
            <a className="text-brand underline hover:text-brand-light" href="/privacy-policy">
              privacy policy
            </a>{" "}
            and{" "}
            <a className="text-brand underline hover:text-brand-light" href="/imprint">
              imprint
            </a>
            .
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5 text-sm">
            {CONSENT_CATEGORIES.map((cat) => (
              <label
                key={cat.key}
                className={`flex items-center gap-2 select-none text-foreground ${
                  cat.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 accent-brand disabled:opacity-100"
                  checked={Boolean(prefs[cat.key])}
                  disabled={cat.locked}
                  onChange={() => togglePref(cat.key, cat.locked)}
                />
                <span>
                  {cat.label}
                  {cat.locked && <span className="ml-1 text-xs text-muted-foreground">(always on)</span>}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:justify-end">
            <button
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] rounded-full bg-transparent text-muted-foreground text-sm font-semibold border border-white/10 hover:bg-white/5 hover:text-foreground transition order-3 sm:order-1"
              onClick={handleDecline}
            >
              Decline
            </button>
            <button
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] rounded-full bg-white/5 text-foreground text-sm font-semibold border border-white/10 hover:bg-white/10 transition order-2"
              onClick={handleSave}
            >
              Save choices
            </button>
            <button
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition order-1 sm:order-3"
              onClick={handleAcceptAll}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
