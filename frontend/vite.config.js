import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// `vite preview` serves the same site-wide headers as Vercel, so CSP problems show up locally.
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'));
const siteHeaders = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
);

/** Lets a local preview reach a loopback Convex backend; production CSP is unchanged. */
function previewHeaders(convexUrl) {
  const url = convexUrl ? new URL(convexUrl) : null;
  if (!url || !['127.0.0.1', 'localhost'].includes(url.hostname)) return siteHeaders;
  const origins = `${url.origin} ${url.origin.replace(/^http/, 'ws')}`;
  return {
    ...siteHeaders,
    'Content-Security-Policy': siteHeaders['Content-Security-Policy'].replace('connect-src ', `connect-src ${origins} `),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  preview: { headers: previewHeaders(loadEnv(mode, process.cwd(), 'VITE_').VITE_CONVEX_URL) },
}));
