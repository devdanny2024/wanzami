'use client';

import { useEffect, useMemo, useState } from "react";

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
  const [consent, setConsent] = useState<Consent>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.key, c.key === "essential"]))
  );

  useEffect(() => {
    const hasToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!hasToken) {
      setConsent("accepted"); // hide when not logged in
      return;
    }
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

  const visible = useMemo(() => consent !== "accepted", [consent]);
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
    <div className="fixed bottom-0 left-0 right-0 z-[10010]">
      <div className="w-full bg-[#fcd68f] text-black px-4 py-6 md:px-10 md:py-8 shadow-2xl border-t border-black/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="text-lg md:text-xl font-semibold text-black">This website uses cookies</div>
            <p className="text-sm leading-relaxed">
              We use cookies to provide the best experience on our website. This includes cookies for website functionality, to manage
              our commercial objectives and optimization. You can decide which cookie categories you would like to permit.
            </p>
            <p className="text-sm leading-relaxed">
              Please note that depending on your settings, the full functionality of our website may no longer be available. For more
              detailed information about our cookies, and to change your preferences at a later time, see our{" "}
              <a className="underline" href="/privacy-policy">
                privacy policy
              </a>{" "}
              and{" "}
              <a className="underline" href="/imprint">
                imprint
              </a>
              .
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
              {categories.map((cat) => (
                <label key={cat.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 border border-black"
                    checked={Boolean(prefs[cat.key])}
                    onChange={() => togglePref(cat.key)}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <button
              className="w-full lg:w-48 h-12 rounded-full bg-[#fd7e14] text-white text-sm font-semibold hover:opacity-90 transition"
              onClick={handleAcceptAll}
            >
              Accept All
            </button>
            <button
              className="w-full lg:w-48 h-12 rounded-full bg-white text-black text-sm font-semibold border border-black/20 hover:bg-black/5 transition"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
