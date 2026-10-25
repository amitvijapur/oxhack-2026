import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { LiveProvider } from "@/lib/live";
import { Toaster } from "@/components/ui/sonner";
import { HERO } from "@/lib/copy.js";
import "./globals.css";

// next/font self-hosts every face, so the CSP's `font-src 'self'` holds.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });
/** Display serif for headings; the SOFT axis rounds it towards hand-set type. */
const fraunces = Fraunces({ subsets: ["latin"], axes: ["SOFT", "opsz"], variable: "--font-fraunces", display: "swap" });
/** Handwriting for margin notes only, never for data. */
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: "Tok River gold, through time",
  description: HERO.lede,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${dmSans.variable} ${plexMono.variable} ${fraunces.variable} ${caveat.variable}`}>
      <body>
        <LiveProvider>{children}</LiveProvider>
        <Toaster />
      </body>
    </html>
  );
}
