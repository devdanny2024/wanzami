import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Wanzami Admin",
  description: "Wanzami admin dashboard (Next.js)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-white">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
