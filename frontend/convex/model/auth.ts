import type { WorkstreamKey } from "./validators";

/** Each workstream has its own publish secret, so one leaked key cannot overwrite another team's output. */
export function secretEnvName(workstream: WorkstreamKey): string {
  return `INGEST_SECRET_${workstream.toUpperCase()}`;
}

export type AuthResult = "ok" | "unauthorized" | "not_configured";

/**
 * Compares the bearer token with the configured secret in constant time.
 * The Convex runtime has no timingSafeEqual, so both values are hashed to a fixed
 * length and compared byte by byte without an early exit.
 */
export async function checkBearer(request: Request, workstream: WorkstreamKey): Promise<AuthResult> {
  const expected = process.env[secretEnvName(workstream)];
  if (!expected) return "not_configured";
  const header = request.headers.get("Authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(presented)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let difference = presented.length === 0 ? 1 : 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0 ? "ok" : "unauthorized";
}
