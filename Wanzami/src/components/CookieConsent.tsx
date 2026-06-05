'use client';

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Consent = "accepted" | "rejected" | null;
type Category = {
  key: string;
  label: string;
};

const categories: Category[] = [
  { key: "essential", label: "Essential" },
  { key: "analytics", label: "Analytics" },
  { key: "marketing", label: "Marketing" },
  { key: "external", label: "External Media" },
];

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.key, c.key === "essential"]))
  );

  useEffect(() => {
    const storedConsent = typeof window !== "undefined" ? localStorage.getItem("cookieConsent") : null;
    if (storedConsent === "accepted" || storedConsent === "rejected") {
      setConsent(storedConsent as Consent);
    }
    const storedPrefs = typeof window !== "undefined" ? localStorage.getItem("cookiePreferences") : null;
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs) as Record<string, boolean>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const hiddenRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isAuthRoute = pathname ? hiddenRoutes.some((r) => pathname.startsWith(r)) : false;

  const visible = useMemo(() => consent !== "accepted" && !isAuthRoute, [consent, isAuthRoute]);
  if (!visible) return null;

  const handleAcceptAll = () => {
    const all = Object.fromEntries(categories.map((c) => [c.key, true]));
    setPrefs(all);
    setConsent("accepted");
    if (typeof window !== "undefined") {
      localStorage.setItem("cookieConsent", "accepted");
      localStorage.setItem("cookiePreferences", JSON.stringify(all));
    }
  };

  const handleSave = () => {
    setConsent("accepted");
    if (typeof window !== "undefined") {
      localStorage.setItem("cookieConsent", "accepted");
      localStorage.setItem("cookiePreferences", JSON.stringify(prefs));
    }
  };

  const togglePref = (key: string) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
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
            {categories.map((cat) => (
              <label key={cat.key} className="flex items-center gap-2 cursor-pointer select-none text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 accent-brand"
                  checked={Boolean(prefs[cat.key])}
                  onChange={() => togglePref(cat.key)}
                />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:justify-end">
            <button
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] rounded-full bg-white/5 text-foreground text-sm font-semibold border border-white/10 hover:bg-white/10 transition order-2 sm:order-1"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              className="w-full sm:w-auto px-6 h-11 min-h-[44px] rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition order-1 sm:order-2"
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
