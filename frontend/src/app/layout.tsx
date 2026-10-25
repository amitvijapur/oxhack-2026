import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { LiveProvider } from "@/lib/live";
import { Toaster } from "@/components/ui/sonner";
import { HERO, SITE_DESCRIPTOR, SITE_NAME, SITE_PLACE } from "@/lib/copy.js";
import "./globals.css";

// Pinned local faces keep builds offline and preserve font-src 'self'.
const dmSans = localFont({ src: [
  { path: "./fonts/dm-sans-300.woff2", weight: "300", style: "normal" },
  { path: "./fonts/dm-sans-400.woff2", weight: "400", style: "normal" },
  { path: "./fonts/dm-sans-500.woff2", weight: "500", style: "normal" },
  { path: "./fonts/dm-sans-600.woff2", weight: "600", style: "normal" },
  { path: "./fonts/dm-sans-700.woff2", weight: "700", style: "normal" },
  { path: "./fonts/dm-sans-800.woff2", weight: "800", style: "normal" },
], variable: "--font-dm-sans", display: "swap" });
const plexMono = localFont({ src: [
  { path: "./fonts/ibm-plex-mono-400.woff2", weight: "400", style: "normal" },
  { path: "./fonts/ibm-plex-mono-500.woff2", weight: "500", style: "normal" },
  { path: "./fonts/ibm-plex-mono-600.woff2", weight: "600", style: "normal" },
], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: `${SITE_NAME} · ${SITE_PLACE}`,
  description: `${SITE_DESCRIPTOR}. ${HERO.lede}`,
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
