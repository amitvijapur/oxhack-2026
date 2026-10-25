import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { LiveProvider } from "@/lib/live";
import { Toaster } from "@/components/ui/sonner";
import { HERO } from "@/lib/copy.js";
import "./globals.css";

// next/font self-hosts every face, so the CSP's `font-src 'self'` holds.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Should we buy this piece of Alaska? · Tok River",
  description: HERO.lede,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${dmSans.variable} ${plexMono.variable}`}>
      <body>
        <LiveProvider>{children}</LiveProvider>
        <Toaster />
      </body>
    </html>
  );
}
