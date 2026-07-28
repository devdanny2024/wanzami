import type { Metadata } from "next";
import { Bebas_Neue, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-smono",
});

export const metadata: Metadata = {
  title: "Wanzami Admin",
  description: "Wanzami production office",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bebas.variable} ${spaceMono.variable} bg-white text-[#161310]`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
