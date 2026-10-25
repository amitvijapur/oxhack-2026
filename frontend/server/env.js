import { HttpError } from './http.js';

/**
 * Reads a server-only secret set in Vercel's Environment Variables (never a VITE_ name,
 * which would be bundled into the browser). A missing value is a 503, not a crash.
 */
export function requireServerEnv(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(503, `${name} is not configured for this deployment`);
  return value;
}
