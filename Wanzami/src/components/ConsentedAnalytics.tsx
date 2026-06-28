'use client';

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CONSENT_EVENT, getStoredDecision, getStoredPrefs } from "@/lib/consent";

// Mounts Vercel Analytics only once the visitor has made a decision AND
// allowed the Analytics category. Re-evaluates whenever consent changes.
export function ConsentedAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => {
      setEnabled(getStoredDecision() !== null && getStoredPrefs().analytics);
    };
    update();
    window.addEventListener(CONSENT_EVENT, update);
    return () => window.removeEventListener(CONSENT_EVENT, update);
  }, []);

  return enabled ? <Analytics /> : null;
}

export default ConsentedAnalytics;
