import type { Metadata } from "next";

// app/creators/page.tsx is a client component, so it cannot export metadata
// itself. Without this the page inherited the root layout's site-wide title, so
// browser tabs and search results made creator.wanzami.tv look like the
// homepage even though the correct page was being served.
export const metadata: Metadata = {
  title: "Creator Hub — Wanzami",
  description:
    "Bring your film, series or short to Wanzami. How the Creator Hub works, what we look for, and how to apply.",
  alternates: {
    canonical: "https://www.wanzami.tv/creators",
  },
  openGraph: {
    title: "Creator Hub — Wanzami",
    description:
      "Bring your film, series or short to Wanzami. How the Creator Hub works, what we look for, and how to apply.",
    url: "https://www.wanzami.tv/creators",
    siteName: "Wanzami",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator Hub — Wanzami",
    description:
      "Bring your film, series or short to Wanzami. How the Creator Hub works, what we look for, and how to apply.",
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
