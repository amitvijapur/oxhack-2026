// Shapes and loaders for the showcase data in public/data/showcase, written by
// scripts/build-showcase-data.py from the team's committed branches.

export type Source = { ref: string; commit: string; paths: string[] };

export type ClaimProps = { id: string; status: "active" | "closed"; owner: string; name: string; start: number | null; end: number | null; acres: number };
type Ring = [number, number][];
export type Claim = {
  type: "Feature";
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
  properties: ClaimProps;
};
export type Claims = { type: "FeatureCollection"; retrieved: string; source: string; features: Claim[] };

export type HistoryRow = { year: string; claims_active: string; claims_closed: string; claims_total: string; gold_usd_per_oz_mean: string };
export type History = { source: Source; rows: HistoryRow[] };

export type Person = { n: number; name: string; role: string; group: string; tier: number };
export type Post = { platform: "twitter" | "reddit"; round: number; name: string; group: string; score: number; text: string };
export type Town = {
  source: Source;
  run: { kind: string; simulated_hours: number; seed: number; news: string; judge_check: string };
  people: Person[];
  posts: Post[];
};

export type World = {
  q: number; acceleration: boolean; action: "BUY" | "SKIP"; value_usd: number;
  expected_over_other_assumptions_usd: number; buy_in: number; of: number;
  p_loss: number; p_gain: number; histogram: number[];
  modal_outcome_usd: number; p_modal: number; lapse_month_if_no_buyer: number | null;
};
export type Decision = {
  source: Source;
  verdict: "BUY" | "SKIP"; verdict_text: string; expected_value_usd: number;
  combinations: number; combinations_buy: number; worst_value_usd: number; best_value_usd: number;
  acceleration_clause_adds_usd: number;
  contract: { stages: { month: number; payment_usd: number }[]; horizon_months: number; acres: number; carry_usd_per_month: number; terms_label: string };
  q_label: string; histogram_edges_usd: number[]; worlds: World[];
  gates: Record<string, string>;
};

export type Showcase = { claims: Claims; history: History; town: Town; decision: Decision };

async function json<T>(path: string): Promise<T> {
  const response = await fetch(`/data/showcase/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function loadShowcase(): Promise<Showcase> {
  const [claims, history, town, decision] = await Promise.all([
    json<Claims>("claims.geojson"), json<History>("history.json"), json<Town>("town.json"), json<Decision>("decision.json"),
  ]);
  return { claims, history, town, decision };
}

/** A claim's state in a given year: not yet staked, held, or lapsed. */
export function claimState(p: ClaimProps, year: number): "none" | "active" | "lapsed" {
  if (p.start === null || p.start > year) return "none";
  if (p.status === "closed" && p.end !== null && p.end <= year) return "lapsed";
  return "active";
}

export const usd = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits }).format(value);

/** "−$9,877" style, with a true minus sign. */
export const signedUsd = (value: number) => `${value < 0 ? "−" : "+"}${usd(Math.abs(value))}`;

/** Support score 0–10 to a colour from cool grey (against) through white to gold (for). */
export function supportColor(score: number) {
  const t = Math.max(0, Math.min(1, score / 10));
  const from = t < 0.5 ? [120, 140, 170] : [235, 238, 242];
  const to = t < 0.5 ? [235, 238, 242] : [232, 176, 75];
  const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * k));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}
