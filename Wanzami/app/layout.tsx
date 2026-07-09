import type { Metadata } from "next";
import { Inter, Bebas_Neue, Space_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { ConsentedAnalytics } from "@/components/ConsentedAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Typewriter face for Call Sheet slugs, stamps and tabular figures.
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wanzami.tv"),
  title: "Wanzami — Stream the stories. Feel the culture.",
  description:
    "Premium African streaming. Originals, series, films — everywhere you are. Personalized picks, seamless playback, kid-friendly profiles.",
  icons: {
    icon: "/wanzami-logo.png",
    shortcut: "/wanzami-logo.png",
    apple: "/wanzami-logo.png",
  },
  openGraph: {
    title: "Wanzami — Stream the stories. Feel the culture.",
    description:
      "Premium African streaming. Originals, series, films — everywhere you are.",
    url: "https://wanzami.tv",
    siteName: "Wanzami",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Wanzami" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanzami — Stream the stories. Feel the culture.",
    description:
      "Premium African streaming. Originals, series, films — everywhere you are.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} ${spaceMono.variable}`}>
      <head>
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GBHNL5BZJX"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Consent Mode v2 — deny analytics/ads storage until the visitor
            // makes a choice in the cookie banner. GA will not set cookies
            // while denied.
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });

            // Re-apply a returning visitor's stored choice so it survives reloads.
            try {
              var d = localStorage.getItem('cookieConsent');
              if (d === 'accepted' || d === 'rejected') {
                var p = JSON.parse(localStorage.getItem('cookiePreferences') || '{}');
                gtag('consent', 'update', {
                  analytics_storage: p.analytics ? 'granted' : 'denied',
                  ad_storage: p.marketing ? 'granted' : 'denied',
                  ad_user_data: p.marketing ? 'granted' : 'denied',
                  ad_personalization: p.marketing ? 'granted' : 'denied'
                });
              }
            } catch (e) {}

            gtag('config', 'G-GBHNL5BZJX');
          `}
        </Script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var search = window.location && window.location.search;
                  var forceLegacy = false;
                  if (search && typeof URLSearchParams !== 'undefined') {
                    var params = new URLSearchParams(search);
                    if (params.get('legacy') === '1') {
                      forceLegacy = true;
                    }
                  }

                  if (!forceLegacy) {
                    if (window.CSS && CSS.supports && CSS.supports('color', 'oklch(59% 0.19 264)')) {
                      return;
                    }
                  }
                } catch (e) {
                  // ignore
                }
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/legacy.css';
                document.head.appendChild(link);
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} ${bebasNeue.variable} bg-black text-white`}>
        <Providers>{children}</Providers>
        <ConsentedAnalytics />
      </body>
    </html>
  );
}
