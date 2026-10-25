"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { claimState, usd, type Claims, type History, type Market as MarketData } from "@/lib/showcase";
import { Bar, YearAxis, YearLine } from "../charts";
import { Section, TabBody } from "../TabBody";
import { LandCosts } from "./LandCosts";

import { FIRST, LAST, RECENT } from "../Timelapse";
const TOK_REGION = "Richardson, Alaska Highways";
/** Before about 1991 the state held few claims, so yearly % changes in the count swing by hundreds of percent. */
const CORRELATION_FROM = 1991;

function pearson(a: number[], b: number[]) {
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const [ma, mb] = [mean(a), mean(b)];
  const cov = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  return cov / Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0));
}

export function MarketTab({ market, claims, history, year }: {
  market: MarketData;
  claims: Claims;
  history: History;
  year: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [first, setFirst] = useState(RECENT);
  const YEARS = useMemo(() => Array.from({ length: LAST - first + 1 }, (_, i) => first + i), [first]);
  const shared = { hover, onHover: setHover };
  const series = useMemo(() => {
    const gold = new Map(history.rows.map((r) => [Number(r.year), Number(r.gold_usd_per_oz_mean)]));
    const sales = (scope: string) => new Map(market.land_sales.filter((r) => r.scope === scope).map((r) => [r.year, r.median_usd_per_acre]));
    const tok = sales(TOK_REGION);
    const state = sales("Statewide");
    const rent = new Map(market.rent_160ac.filter((r) => r.new !== null).map((r) => [r.year, r.new!]));
    return {
      gold: YEARS.map((y) => gold.get(y) ?? null),
      held: YEARS.map((y) => claims.features.filter((f) => claimState(f.properties, y) === "active").length),
      staked: YEARS.map((y) => claims.features.filter((f) => f.properties.start === y).length),
      tok: YEARS.map((y) => tok.get(y) ?? null),
      state: YEARS.map((y) => state.get(y) ?? null),
      rent: YEARS.map((y) => rent.get(y) ?? null),
    };
  }, [market, claims, history, YEARS]);

  const owners = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of claims.features) if (f.properties.status === "active") counts.set(f.properties.owner, (counts.get(f.properties.owner) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [claims]);
  // The facts under the timeline, computed from the same files.
  const notes = useMemo(() => {
    const tokSales = new Map(market.land_sales.filter((r) => r.scope === TOK_REGION).map((r) => [r.year, r.parcels]));
    const last = Math.max(...market.land_sales.map((r) => r.year));
    const busy = Math.max(...[...tokSales].filter(([, n]) => n > 2).map(([y]) => y));
    const after = Array.from({ length: last - busy }, (_, i) => tokSales.get(busy + 1 + i) ?? 0);
    const rows = history.rows.filter((r) => r.claims_change_pct !== "" && r.gold_change_pct !== "" && Number(r.gold_months) === 12 && Number(r.year) >= CORRELATION_FROM);
    const r = pearson(rows.map((x) => Number(x.claims_change_pct)), rows.map((x) => Number(x.gold_change_pct)));
    const partial = history.rows.find((x) => Number(x.gold_months) < 12);
    return { busy, low: Math.min(...after), high: Math.max(...after), last, r, from: rows[0]?.year, to: rows.at(-1)?.year, partial };
  }, [market, history]);
  const activeTotal = claims.features.filter((f) => f.properties.status === "active").length;
  const deals = [...market.deals].sort((a, b) => b.deal_date.localeCompare(a.deal_date));

  return (
    <TabBody
      evidence={[
        { label: `Alaska DNR state mining claims, retrieved ${claims.retrieved}`, href: claims.source },
        { label: "Gold price by year (World Bank)", source: history.source },
        { label: "DNR state land sales, claim rent by year and Alaska gold deals (Arjin)", source: market.sources[0] },
        { label: "State land sales are mostly residential and recreational parcels. No published series prices mineral land at Tok." },
      ]}
    >
      <Section title={first === RECENT ? "The last ten years" : `Since ${FIRST} on one timeline`} lede={<>Hover any chart: all six follow your pointer, so you can see what moved together.</>}>
        <div className="segmented tl-range" role="radiogroup" aria-label="Timeline range">
          <button type="button" role="radio" aria-checked={first === RECENT} onClick={() => setFirst(RECENT)}>Last 10 years</button>
          <button type="button" role="radio" aria-checked={first === FIRST} onClick={() => setFirst(FIRST)}>Since {FIRST}</button>
        </div>
        <div className="mini-stack">
          <YearLine {...shared} years={YEARS} values={series.gold} year={year} label="Gold, $/oz" format={(v) => usd(v)} accent hint="The yearly average gold price: what makes mining land worth chasing." />
          <YearLine {...shared} years={YEARS} values={series.staked} year={year} label="Claims staked near Tok that year" format={(v) => String(v)} hint="New ground people took that year: a land rush shows as a spike." />
          <YearLine {...shared} years={YEARS} values={series.held} year={year} label="Claims held near Tok" format={(v) => String(v)} hint="Everything still held: rises with rushes, falls as claims lapse." />
          <YearLine {...shared} years={YEARS} values={series.tok} year={year} label="Land sold, Tok region: median $/acre" format={(v) => usd(v)} hint="State land sales near Tok, mostly homes and cabins, not mineral ground." />
          <YearLine {...shared} years={YEARS} values={series.state} year={year} label="Land sold, statewide: median $/acre" format={(v) => usd(v)} hint="The same across Alaska, for a steadier line." />
          <YearLine {...shared} years={YEARS} values={series.rent} year={year} label="Rent for a new 160-acre claim, $/yr" format={(v) => usd(v)} hint="What the state charges each year just to hold a claim." />
          <YearAxis years={YEARS} />
        </div>
        <p className="deep-note">
          The Tok land region has {notes.low}–{notes.high} sales a year after {notes.busy} (to {notes.last}), so its line is thin there. Across Alaska, yearly changes in claims and gold correlate at {notes.r.toFixed(2)} ({notes.from}–{notes.to}).
          {notes.partial ? <> The {notes.partial.year} gold value averages only {notes.partial.gold_months} months.</> : null}
        </p>
      </Section>

      <Section title="Who holds it today" lede={`${activeTotal} active claims in the search box, by holder.`}>
        {owners.map(([owner, n]) => <Bar key={owner} label={owner} value={n} total={activeTotal} note={String(n)} />)}
      </Section>

      <LandCosts market={market} />

      <Section title="What companies paid nearby" lede="Alaska gold deals, newest first. These buy projects, not raw claims, so they set the ceiling of the market rather than its floor.">
        <ul className="occ-list">
          {deals.map((d) => (
            <li key={`${d.acquirer}-${d.deal_date}`}>
              <a href={d.source_url} target="_blank" rel="noreferrer">
                <strong>{d.acquirer}</strong> → {d.target.split("(")[0].trim()} <ExternalLink className="inline size-3" aria-hidden="true" />
              </a>
              <span className="tabular">{d.deal_date.match(/^\d{4}(-\d{2}){0,2}/)?.[0] ?? d.deal_date} · {d.price_usd_m ? `$${d.price_usd_m}m` : "price not disclosed"} · {d.stage.split("(")[0].trim()}</span>
              {d.link_to_tok_sites && !d.link_to_tok_sites.startsWith("not measured") ? <span className="occ-model">{d.link_to_tok_sites}</span> : null}
              {d.quality_flag ? <span className="occ-model">Source quality: {d.quality_flag}</span> : null}
            </li>
          ))}
        </ul>
      </Section>
    </TabBody>
  );
}
