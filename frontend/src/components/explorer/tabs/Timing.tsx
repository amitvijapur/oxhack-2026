"use client";

import { signedUsd, usd, type Decision, type Market, type World } from "@/lib/showcase";
import { LogStrip, YearAxis, YearLine } from "../charts";
import { Section } from "../TabBody";

const H = 200;
const W = 480;
const Q_WORDS: Record<string, string> = { "0.003": "1 in 333", "0.03": "1 in 33", "0.1": "1 in 10", "0.25": "1 in 4", "0.5": "1 in 2" };

export function Timing({ decision, market, world }: { decision: Decision; market: Market; world: World }) {
  const acres = decision.contract.acres;
  const offers = decision.exit_offers_usd_per_acre.map((v) => v * acres);
  const bar = world.sell_if_offer_at_least_usd;
  const months = bar.length;
  const top = Math.max(...bar, ...offers) * 1.08;
  const x = (m: number) => (m / Math.max(1, months)) * W;
  const y = (v: number) => H - (v / top) * (H - 10);
  const clearing = offers.filter((o) => o >= bar[0]).length;
  const totalOption = decision.contract.stages.reduce((a, s) => a + s.payment_usd, 0);
  const lapse = world.lapse_month_if_no_buyer;
  const nextStage = decision.contract.stages.find((s) => s.month === lapse);
  const be = world.break_even;

  const byRegion = (regions: string[]) => market.comparables.filter((c) => regions.includes(c.region)).map((c) => c.usd_per_acre);

  return (
    <>
      {world.acceleration ? (
      <Section
        title="The sell line, month by month"
        lede={<>For this world ({Q_WORDS[String(world.q)]} new claims bring a buyer{world.acceleration ? ", early completion allowed" : ""}), the algorithm sells only if an offer clears the white line. Each thin line is one offer a buyer might make (green if it clears); <strong>{clearing} of {offers.length}</strong> clear it.</>}
      >
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="sell-chart" role="img" aria-label={`Sell if an offer is at least ${usd(bar[0])} in month 0; ${clearing} of ${offers.length} possible offers clear it.`}>
          {offers.map((o, i) => (
            <line key={i} x1={0} x2={W} y1={y(o)} y2={y(o)} className={o >= bar[0] ? "offer-line is-above" : "offer-line"} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={bar.map((v, m) => `${m ? "L" : "M"}${x(m)},${y(v)}`).join("") + `L${x(months)},${y(bar[months - 1])}`} className="sell-line" vectorEffect="non-scaling-stroke" />
          {lapse !== null ? (
            <g>
              <line x1={x(lapse)} x2={x(lapse)} y1={0} y2={H} className="lapse-line" vectorEffect="non-scaling-stroke" />
              <text x={x(lapse) - 6} y={14} textAnchor="end" className="chart-note">month {lapse}: {nextStage ? `${usd(nextStage.payment_usd)} due` : "payment due"}, walk away</text>
            </g>
          ) : null}
          <text x={4} y={y(bar[0]) - 6} className="chart-note is-gold">sell if offer ≥ {usd(bar[0])}</text>
          <text x={0} y={H + 16} className="chart-axis">month 0</text>
          <text x={W} y={H + 16} textAnchor="end" className="chart-axis">month {months}</text>
        </svg>
        <p className="deep-note">With no buyer, the plan holds for {months} months and then lets the option lapse rather than pay the next stage.</p>
      </Section>
      ) : (
        <Section title="The sell line, month by month" lede="Without early completion, the option can't be sold until every stage is paid (year 4), so there is no sell line before then.">
          <p className="deep-note">
            {lapse !== null ? `With no buyer, the plan walks away at month ${lapse} rather than pay the next ${nextStage ? usd(nextStage.payment_usd) : "stage"}.` : ""} Turn on early completion in the panel to see when the algorithm would sell.
          </p>
        </Section>
      )}

      <Section title="Cash at risk over time" lede="What we would have paid in, month by month, on the path where no buyer comes (stages plus claim carrying costs).">
        <div className="mini-stack">
          <YearLine years={world.outlay_usd_by_month.map((_, m) => m)} values={world.outlay_usd_by_month} year={world.outlay_usd_by_month.length - 1} label="Paid in so far" format={(v) => usd(v)} accent height={80} />
          <YearAxis years={world.outlay_usd_by_month.map((_, m) => m)} />
        </div>
      </Section>

      <Section
        title="The land arbitrage spread"
        lede="Dollars per acre on a log scale. The markers show what it costs us to control the block; the dots show what buyers have actually paid per acre for comparable gold ground."
      >
        <LogStrip
          min={5}
          max={5000}
          format={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${Math.round(v)}`)}
          groups={[
            { label: "Alaska deals", values: byRegion(["AK"]), accent: true },
            { label: "Nevada & Arizona deals", values: byRegion(["NV", "AZ"]) },
            { label: "Offers the model draws", values: decision.exit_offers_usd_per_acre },
          ]}
          markers={[
            { label: "first payment", value: decision.contract.stages[0].payment_usd / acres },
            { label: "whole option", value: totalOption / acres },
          ]}
        />
        <p className="deep-note">These are original deal prices, not resale prices of an option position, so the spread is an upper bound on what a flip could earn.</p>
      </Section>

      <Section title="What would flip it to BUY" lede={`In this world the expected value is ${signedUsd(world.value_usd)}. Any one of these would change the answer:`}>
        <ul className="flip-list">
          {be.buyers_per_staking_event_q !== null ? (
            <li><strong>About 1 buyer per {Math.max(1, Math.round(1 / be.buyers_per_staking_event_q))} new claims nearby</strong> (break-even rate {be.buyers_per_staking_event_q.toFixed(2)}). Public deal records suggest about 1 per 333, before allowing for unrecorded deals.</li>
          ) : null}
          {be.max_first_payment_usd !== null ? <li><strong>A first payment under {usd(be.max_first_payment_usd)}</strong> instead of {usd(decision.contract.stages[0].payment_usd)}.</li> : null}
          {be.min_high_bid_usd !== null ? <li><strong>A top offer of {usd(be.min_high_bid_usd)}</strong> or more for the block.</li> : null}
          <li>Reversing the early-completion term changes this world to {signedUsd(world.value_if_acceleration_flipped_usd)}.</li>
        </ul>
      </Section>
    </>
  );
}
