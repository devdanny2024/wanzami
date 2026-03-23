import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Wanzami",
  description: "Wanzami streaming platform",
  icons: {
    icon: "/wanzami-logo.png",
    shortcut: "/wanzami-logo.png",
    apple: "/wanzami-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
      <body className="bg-black text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
