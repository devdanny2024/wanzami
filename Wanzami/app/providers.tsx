'use client';

import { CookieConsent } from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/toaster";
import NextTopLoader from "nextjs-toploader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#fd7e14"
        height={3}
        showSpinner={false}
        crawl
        easing="ease"
        speed={400}
      />
      {children}
      <CookieConsent />
      <Toaster richColors position="top-right" />
    </>
  );
}
