import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SupportChatBubble } from "@/components/SupportChatBubble";

export const metadata: Metadata = {
  title: "Wanzami",
  description: "Wanzami streaming platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Providers>
          {children}
          <SupportChatBubble />
        </Providers>
      </body>
    </html>
  );
}
