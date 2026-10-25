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
  sell_if_offer_at_least_usd: number[]; outlay_usd_by_month: number[];
  break_even: { buyers_per_staking_event_q: number | null; max_first_payment_usd: number | null; min_high_bid_usd: number | null };
  value_if_acceleration_flipped_usd: number;
};
export type Decision = {
  source: Source;
  verdict: "BUY" | "SKIP"; verdict_text: string; expected_value_usd: number;
  combinations: number; combinations_buy: number; worst_value_usd: number; best_value_usd: number;
  acceleration_clause_adds_usd: number;
  contract: { stages: { month: number; payment_usd: number }[]; horizon_months: number; acres: number; carry_usd_per_month: number; terms_label: string };
  q_label: string; histogram_edges_usd: number[]; worlds: World[];
  gates: Record<string, string>;
  exit_offers_usd_per_acre: number[]; bids_label: string;
};

/** A measured value, or a lab flag: below the lower limit or above the upper one. */
export type Assay = number | { below: number } | { above: number } | null;
export type Element = { analysis: string; name: string; unit: "ppm" | "%"; lower: number; upper: number; method: string };
export type GeoSample = { id: string; lon: number; lat: number; values: Record<string, Assay>; notes: Record<string, string> };
export type Geochem = {
  source: { url: string; sha256: string; doi: string; table: string; size_fraction: string };
  key_elements: string[]; order: string[];
  elements: Record<string, Element>;
  thresholds: Record<string, { p50: number; p90: number; p98: number }>;
  samples: GeoSample[];
};
export type Occurrence = {
  id: string; name: string; lon: number; lat: number; commodities: string[]; other: string[];
  type: string; status: string; model: string; production: string; geology: string; url: string;
};
export type Occurrences = { source: string; retrieved: string; records: Occurrence[] };
export type Unit = { name: string; lith: string; description: string; age: string; top_ma: number; bottom_ma: number; color: string };
export type Geology = { source: string; source_url: string; license: string; tiles: string; retrieved: string; units: Record<string, Unit | null> };
export type Market = {
  sources: Source[];
  land_sales: { year: number; scope: string; parcels: number; median_usd_per_acre: number }[];
  rent_160ac: { year: number; new: number | null; age_11_plus: number | null }[];
  deals: { acquirer: string; target: string; asset_location: string; deal_date: string; price_usd_m: string; stage: string; link_to_tok_sites: string; quality_flag: string; source_url: string }[];
  comparables: { id: string; region: string; date: string; acres: number; usd_per_acre: number; type: string; stage: string; url: string }[];
};

export type Showcase = {
  claims: Claims; history: History; town: Town; decision: Decision;
  geochem: Geochem; occurrences: Occurrences; geology: Geology; market: Market; plots: Plots;
};

async function json<T>(path: string): Promise<T> {
  const response = await fetch(`/data/showcase/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function loadShowcase(): Promise<Showcase> {
  const [claims, history, town, decision, geochem, occurrences, geology, market, plots] = await Promise.all([
    json<Claims>("claims.geojson"), json<History>("history.json"), json<Town>("town.json"), json<Decision>("decision.json"),
    json<Geochem>("geochem.json"), json<Occurrences>("occurrences.json"), json<Geology>("geology.json"), json<Market>("market.json"),
    json<Plots>("plots.json"),
  ]);
  return { claims, history, town, decision, geochem, occurrences, geology, market, plots };
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

/** Support score 0–10 to a colour from grey (against) through white to green (for). */
export function supportColor(score: number) {
  const t = Math.max(0, Math.min(1, score / 10));
  const from = t < 0.5 ? [115, 115, 115] : [229, 229, 229];
  const to = t < 0.5 ? [229, 229, 229] : [34, 197, 94];
  const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * k));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/** A value to rank by: measured, or its limit when the lab only reported a bound. */
export function assayLevel(value: Assay): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  return "below" in value ? value.below : value.above;
}

export function formatAssayValue(value: Assay, unit: string) {
  if (value === null) return "not analysed";
  if (typeof value === "number") return `${value} ${unit}`;
  return "below" in value ? `<${value.below} ${unit}` : `>${value.above} ${unit}`;
}

/** Anomaly class against the 50th/90th/98th percentiles of the 67 sites. */
export function anomalyClass(value: Assay, t?: { p50: number; p90: number; p98: number }): 0 | 1 | 2 | 3 {
  const v = assayLevel(value);
  if (v === null || !t) return 0;
  if (typeof value === "object" && value && "below" in value) return 0;
  return v >= t.p98 ? 3 : v >= t.p90 ? 2 : v >= t.p50 ? 1 : 0;
}

/** Great-circle distance in km. */
export function km(lon1: number, lat1: number, lon2: number, lat2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(a));
}

/** A land plot under one or more samples: the real DNR claim that contains them, or a drawn open square. */
export type Plot = {
  kind: "claim" | "open";
  id: string;
  samples: string[];
  geometry: Claim["geometry"];
} & Partial<Pick<ClaimProps, "status" | "owner" | "name" | "start" | "end" | "acres">>;
export type Plots = { claims_retrieved: string; open_plot_note: string; plots: Plot[] };

/** A plot's strongest reading for one element: the sample, its value and its anomaly class. */
export function plotReading(plot: Plot, geochem: Geochem, element: string) {
  const byId = new Map(geochem.samples.map((s) => [s.id, s]));
  let best: { sample: GeoSample; value: Assay; level: number; k: 0 | 1 | 2 | 3 } | null = null;
  for (const id of plot.samples) {
    const sample = byId.get(id);
    if (!sample) continue;
    const value = sample.values[element] ?? null;
    const level = assayLevel(value) ?? -1;
    if (!best || level > best.level) best = { sample, value, level, k: anomalyClass(value, geochem.thresholds[element]) };
  }
  return best;
}
