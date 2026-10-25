import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Only this project's Convex deployment, not any Convex host. Unset (static
// previews), none. A local `convex dev` backend is plain http/ws on loopback.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ? new URL(process.env.NEXT_PUBLIC_CONVEX_URL) : null;
const convex = !convexUrl
  ? ""
  : convexUrl.protocol === "http:"
    ? ` http://${convexUrl.host} ws://${convexUrl.host}`
    : ` https://${convexUrl.host} wss://${convexUrl.host}`;

// The basemap (OpenFreeMap: style, tiles, glyphs, sprites) and the Mapzen
// terrain tiles the globe and relief read (src/components/globe/terrain-style.ts).
const MAP_HOSTS = "https://tiles.openfreemap.org https://s3.amazonaws.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next's inline bootstrap scripts; eval only for dev's fast refresh.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${MAP_HOSTS}`,
      "font-src 'self'",
      `connect-src 'self' ${MAP_HOSTS}${convex}`,
      // MapLibre runs its tile workers from a blob URL.
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Evidence snapshots change with each handoff: always revalidate.
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
