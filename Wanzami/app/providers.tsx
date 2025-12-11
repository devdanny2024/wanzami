'use client';

import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieConsent />
      <Toaster richColors position="top-right" />
    </>
  );
}
