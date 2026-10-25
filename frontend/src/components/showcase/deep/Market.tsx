"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { claimState, usd, type Claims, type History, type Market as MarketData } from "@/lib/showcase";
import { Bar, YearAxis, YearLine } from "../charts";
import { DeepDive, Section } from "../DeepDive";

const FIRST = 1975;
const LAST = 2026;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
const TOK_REGION = "Richardson, Alaska Highways";

export function MarketDeep({ market, claims, history, year, onClose }: {
  market: MarketData;
  claims: Claims;
  history: History;
  year: number;
  onClose: () => void;
}) {
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
  }, [market, claims, history]);

  const owners = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of claims.features) if (f.properties.status === "active") counts.set(f.properties.owner, (counts.get(f.properties.owner) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [claims]);
  const activeTotal = claims.features.filter((f) => f.properties.status === "active").length;
  const deals = [...market.deals].sort((a, b) => b.deal_date.localeCompare(a.deal_date));

  return (
    <DeepDive
      kicker="Deep dive · The land"
      title="When do people pay, and how much?"
      mode="State records"
      onClose={onClose}
      evidence={[
        { label: `Alaska DNR state mining claims, retrieved ${claims.retrieved}`, href: claims.source },
        { label: "Gold price by year (World Bank)", source: history.source },
        { label: "DNR state land sales, claim rent by year and Alaska gold deals (Arjin)", source: market.sources[0] },
        { label: "State land sales are mostly residential and recreational parcels. No published series prices mineral land at Tok." },
      ]}
    >
      <Section title="Fifty years on one timeline" lede={<>Drag the year on the map&apos;s timeline; every chart follows. Showing <strong>{year}</strong>.</>}>
        <div className="mini-stack">
          <YearLine years={YEARS} values={series.gold} year={year} label="Gold, $/oz" format={(v) => usd(v)} accent />
          <YearLine years={YEARS} values={series.staked} year={year} label="Claims staked near Tok that year" format={(v) => String(v)} />
          <YearLine years={YEARS} values={series.held} year={year} label="Claims held near Tok" format={(v) => String(v)} />
          <YearLine years={YEARS} values={series.tok} year={year} label="Land sold, Tok region: median $/acre" format={(v) => usd(v)} />
          <YearLine years={YEARS} values={series.state} year={year} label="Land sold, statewide: median $/acre" format={(v) => usd(v)} />
          <YearLine years={YEARS} values={series.rent} year={year} label="Rent for a new 160-acre claim, $/yr" format={(v) => usd(v)} />
          <YearAxis years={YEARS} />
        </div>
        <p className="deep-note">The Tok land region has 0–2 sales a year after 2019, so its line is thin there. Across Alaska, yearly changes in claims and gold correlate at only 0.19 (1991–2025).</p>
      </Section>

      <Section title="Who holds it today" lede={`${activeTotal} active claims in the search box, by holder.`}>
        {owners.map(([owner, n]) => <Bar key={owner} label={owner} value={n} total={activeTotal} note={String(n)} />)}
      </Section>

      <Section title="What companies paid nearby" lede="Alaska gold deals, newest first. These buy projects, not raw claims, so they set the ceiling of the market rather than its floor.">
        <ul className="occ-list">
          {deals.map((d) => (
            <li key={`${d.acquirer}-${d.deal_date}`}>
              <a href={d.source_url} target="_blank" rel="noreferrer">
                <strong>{d.acquirer}</strong> → {d.target.split("(")[0].trim()} <ExternalLink className="inline size-3" aria-hidden="true" />
              </a>
              <span className="tabular">{d.deal_date.slice(0, 10)} · {d.price_usd_m ? `$${d.price_usd_m}m` : "price not disclosed"} · {d.stage.split("(")[0].trim()}</span>
              {d.link_to_tok_sites && !d.link_to_tok_sites.startsWith("not measured") ? <span className="occ-model">{d.link_to_tok_sites}</span> : null}
            </li>
          ))}
        </ul>
      </Section>
    </DeepDive>
  );
}
