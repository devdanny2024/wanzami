'use client';

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type Consent = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cookieConsent") : null;
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored as Consent);
    } else {
      setConsent(null);
    }
  }, []);

  const handleChoice = (choice: Consent) => {
    setConsent(choice);
    if (typeof window !== "undefined" && choice) {
      localStorage.setItem("cookieConsent", choice);
    }
  };

  const visible = consent !== "accepted";
  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10010]">
      <div className="w-full bg-neutral-900/95 border-t border-neutral-700 px-4 py-3 md:px-8 md:py-4 text-white shadow-lg">
        <div className="max-w-6xl mx-auto flex items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="font-semibold text-sm md:text-base">Cookies & Preferences</div>
            <p className="text-xs md:text-sm text-neutral-300">
              We use cookies to improve your experience. Accept to allow all, or reject to opt out of non-essential cookies.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white text-sm rounded-lg"
                onClick={() => handleChoice("accepted")}
              >
                Accept
              </button>
              <button
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg"
                onClick={() => handleChoice("rejected")}
              >
                Reject
              </button>
            </div>
          </div>
          <button
            aria-label="Close cookie banner"
            className="p-2 text-neutral-300 hover:text-white"
            onClick={() => handleChoice("rejected")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
