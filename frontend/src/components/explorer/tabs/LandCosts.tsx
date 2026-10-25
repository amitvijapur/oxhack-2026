"use client";

import { ExternalLink } from "lucide-react";
import { usd, type Market } from "@/lib/showcase";
import { Section } from "../TabBody";
import { LOT_BASIS } from "../../../../../model/tok-option/lot-basis.mjs";

/** Log scale for $/acre, framed by the recorded comparables. */
function scale(values: number[]) {
  const lo = 10 ** Math.floor(Math.log10(Math.min(...values)));
  const hi = 10 ** Math.ceil(Math.log10(Math.max(...values)));
  const pos = (v: number) => `${(Math.log(v / lo) / Math.log(hi / lo)) * 100}%`;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t *= 10) ticks.push(t);
  return { pos, ticks };
}

/** What holding and buying mineral ground has cost: recorded $/acre deals and the state's claim rent. */
export function LandCosts({ market }: { market: Market }) {
  const comparables = [...market.comparables].sort((a, b) => a.usd_per_acre - b.usd_per_acre);
  const { pos, ticks } = scale(comparables.map((c) => c.usd_per_acre));
  const regions = [...new Set(comparables.map((c) => c.region))];
  // Only the years the state's schedule changed, so each rent step reads at a glance.
  const rent = market.rent_160ac.filter((r) => r.new !== null);
  const steps = rent.filter((r, i) => i === 0 || r.new !== rent[i - 1].new || r.age_6_10 !== rent[i - 1].age_6_10 || r.age_11_plus !== rent[i - 1].age_11_plus);
  const latest = rent.at(-1);
  const source = market.sources.find((s) => s.paths.some((p) => p.includes("bid-comparables")));

  return (
    <Section
      title="What mineral ground has cost"
      lede={<>{comparables.length} recorded transactions with a price per acre ({regions.join(", ")}), and the yearly state rent to hold a 160-acre claim. Mixed stages and states: context, not a value for Tok land or an option.</>}
    >
      <p className="deep-note">The Decision demo uses {usd(LOT_BASIS.initialPremiumUsd)} per whole contract as a selected historical initial-payment reference. These price-per-acre transactions do not set that payment or the model&apos;s assignment proceeds. The historical reference is not a current Tok quote and excludes further obligations.</p>
      <div className="lab-strip">
        <div className="lab-track" role="img" aria-label={`Price per acre of ${comparables.length} recorded deals, ${usd(comparables[0].usd_per_acre)} to ${usd(comparables.at(-1)!.usd_per_acre)}`}>
          {comparables.map((c) => (
            <i key={c.id} className={`lab-dot${c.region === "AK" ? " is-ak" : ""}`} style={{ left: pos(c.usd_per_acre) }} title={`${c.id} · ${c.date} · ${usd(c.usd_per_acre)}/acre · ${c.stage}`} />
          ))}
        </div>
        <div className="lab-axis tabular" aria-hidden="true">{ticks.map((t) => <span key={t}>{usd(t)}</span>)}</div>
        <p className="deep-note"><i className="lab-key is-ak" /> Alaska <i className="lab-key" /> elsewhere · $ per acre, log scale</p>
      </div>

      <details className="model-detail">
        <summary>All {comparables.length} transactions</summary>
        <ul className="occ-list">
          {comparables.map((c) => (
            <li key={c.id}>
              <a href={c.url} target="_blank" rel="noreferrer"><strong className="tabular">{c.id}</strong> · {usd(c.usd_per_acre)}/acre <ExternalLink className="inline size-3" aria-hidden="true" /></a>
              <span className="tabular">{c.date} · {c.acres.toLocaleString()} acres · {c.type} · {c.stage}</span>
            </li>
          ))}
        </ul>
        {source ? <p className="deep-note">From {source.paths.join(", ")} @ {source.commit.slice(0, 7)}.</p> : null}
      </details>

      {latest ? (
        <div className="table-scroll">
          <table className="swarm-table tabular">
            <caption>State rent per 160-acre claim, $/year, by claim age</caption>
            <thead><tr><th>From</th><th>Years 1–5</th><th>6–10</th><th>11+</th></tr></thead>
            <tbody>
              {steps.map((r) => <tr key={r.year}><th>{r.year}</th><td>{usd(r.new!)}</td><td>{r.age_6_10 === null ? "—" : usd(r.age_6_10)}</td><td>{r.age_11_plus === null ? "—" : usd(r.age_11_plus)}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="deep-note">Rent is the state&apos;s schedule for mining claims; its current legal applicability to a given parcel is not verified here.</p>
    </Section>
  );
}
