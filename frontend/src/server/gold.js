import { json } from './http.js';

/** Keyless spot price (gold-api.com). One upstream call per 30 s per instance, shared by all viewers. */
export const GOLD_URL = 'https://api.gold-api.com/price/XAU';
const FRESH_MS = 30_000;
let last = null; // { usd_per_oz, updated_at, fetched_at }

export async function goldPrice(fetcher = fetch, now = Date.now()) {
  if (last && now - last.fetched_at < FRESH_MS) return json(200, { ...view(last), stale: false });
  try {
    const response = await fetcher(GOLD_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (typeof body.price !== 'number' || !Number.isFinite(body.price)) throw new Error('no price');
    last = { usd_per_oz: body.price, updated_at: body.updatedAt ?? new Date(now).toISOString(), fetched_at: now };
    return json(200, { ...view(last), stale: false });
  } catch {
    // Upstream down: serve the last good price, marked stale, or say there is none.
    return last ? json(200, { ...view(last), stale: true }) : json(503, { error: 'gold price unavailable' });
  }
}

const view = (entry) => ({ usd_per_oz: entry.usd_per_oz, updated_at: entry.updated_at, source: 'gold-api.com (XAU spot)' });

export function resetGoldCache() {
  last = null;
}
