"use client";

import { useMemo, useState } from "react";
import ModelWorkbench from "@/ModelWorkbench.jsx";
import { DEFAULT_CONTROLS } from "../../../../../model/tok-option/workbench.mjs";
import { CAPITAL } from "../../../../../model/tok-option/config.mjs";
import { LOT_BASIS } from "../../../../../model/tok-option/lot-basis.mjs";
import { EventStudy } from "./EventStudy";
import { evidenceByArea, wholeLotBaseline } from "@/lib/canonical-model.js";
import { anomalyClass, formatAssayValue, plotReading, plotStatus, usd, type Geochem, type Plot, type Plots } from "@/lib/showcase";
import type { Sample } from "@/lib/types";
import type { Gold } from "../LivePill";
import { TabBody } from "../TabBody";
import { orderPlots } from "./LandTab";

export type Site = "A" | "B";
const SITE_NAMES: Record<Site, string> = { A: "Tok west", B: "Tok east" };
const CLASS_NAMES = ["below typical", "above typical", "in the top 10% of sites", "in the top 2% of sites"] as const;

type Screen = { gate: string; pass: number; total: number; rule: { thresholdPpm: number; minimumClassifiedSamples: number; minimumQualifyingFraction: number } };

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");
const money = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "Unavailable";
const percent = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "Unavailable";
const moreSamples = (n: number) => (n === 1 ? "one more qualifying sample" : `${n} more qualifying samples`);

/** Keep the observed evidence screen distinct from an explicitly assumed whole-contract cash decision. */
export function DecideTab({ features, gold, plots, geochem, site, onSite, plot }: {
  features: Sample[];
  gold: Gold | null;
  plots: Plots;
  geochem: Geochem;
  site: Site;
  onSite: (site: Site) => void;
  /** The plot sent here from the Land tab, if any. */
  plot: Plot | null;
}) {
  const screens = useMemo(() => evidenceByArea(features) as Screen[], [features]);
  const screen = screens[site === "A" ? 0 : 1];
  const needed = Math.ceil(screen.rule.minimumQualifyingFraction * screen.total);
  const passes = screen.gate === "PASS";
  const fails = screen.gate === "FAIL";
  const [modelOpen, setModelOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const baseline = useMemo(() => wholeLotBaseline(features, site), [features, site]);
  const call = baseline?.entryAction === "SKIP" ? "SKIP" : baseline?.entryAction === "BUY_CANDIDATE" ? "DEMO CANDIDATE" : "NO CALL";
  const expectedReturn = typeof baseline?.expectedNetCashUsd === "number" && typeof baseline?.amountAtRiskUsd === "number" && baseline.amountAtRiskUsd > 0 ? baseline.expectedNetCashUsd / baseline.amountAtRiskUsd : null;
  const evidenceLabel = passes ? "Evidence passes" : fails ? "Evidence fails" : "Evidence incomplete";
  const reason = passes ? "passes the gold-evidence screen" : fails ? "fails the gold-evidence screen" : "the gold-evidence screen is incomplete";

  // The plot sent from Land, or else the site's richest plot, so Why always names real ground.
  const tested = plot && plot.site === site ? plot : null;
  const focus = tested ?? orderPlots(plots.plots, geochem, "gold").find((p) => p.site === site) ?? null;
  const reading = focus ? plotReading(focus, geochem, "Au") : null;
  const status = focus ? plotStatus(focus) : null;

  return (
    <TabBody
      evidence={[
        { label: gold ? `Gold: ${gold.source}, through /api/gold-price every 30 s` : "Gold: /api/gold-price, connecting" },
        { label: "Gold-evidence screen: canonical Tok option model (model/tok-option), observed samples only" },
        { label: "Whole-contract economics: hypothetical canonical 90-day baseline; live spot does not set the model gold input" },
        ...LOT_BASIS.sources.map((source) => ({ label: `${source.project}: selected historical initial payment, ${source.agreementDate}`, href: source.url })),
        { label: "Observed primary-gold samples, Alaska DGGS RDF 2016-10", href: "https://doi.org/10.14509/29688" },
        { label: `Checked Alaska DNR claim snapshot retrieved ${plots.claims_retrieved}` },
      ]}
    >
      <section className="answer decide" aria-label="The call">
        <div className="decide-head">
          <p className="answer-signal">{call} <span>hypothetical lot</span></p>
          <div className="segmented" role="radiogroup" aria-label="Site">
            {(["A", "B"] as Site[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={site === s} onClick={() => onSite(s)}>
                Site {s} · {SITE_NAMES[s]}
              </button>
            ))}
          </div>
        </div>
        <p className="answer-why">
          Site {site} · {evidenceLabel} · {reason} ({screen.pass} of {screen.total} samples, needs {needed}).
          {tested ? ` Testing plot ${tested.label}: the call covers all of Site ${site}.` : null}
        </p>
        <dl className="mini-stats">
          <div>
            <dt>Gold spot</dt>
            <dd className="tabular">{gold ? usd(gold.usd_per_oz) : "—"}<small>{gold ? (gold.stale ? "last spot price" : "live spot") : "connecting"}</small></dd>
          </div>
          <div><dt>90-day expected lot return</dt><dd className="tabular">{percent(expectedReturn)}<small>{money(baseline?.expectedNetCashUsd)} expected net cash</small></dd></div>
        </dl>
        <p className="note">{usd(LOT_BASIS.initialPremiumUsd)} historical initial-payment reference + {usd(DEFAULT_CONTROLS.entryFeeUsd)} assumed entry fee = {money(baseline?.amountAtRiskUsd)} per whole contract. Not a current quote or full historical contract cost.</p>
        <p className="note">The fixed {usd(DEFAULT_CONTROLS.price)}/oz model assumption yields {money(baseline?.assignmentValueUsd)} assignment proceeds. Live spot is separate. This baseline fails the cash test even when evidence passes.</p>
      </section>

      <details className="fold">
        <summary>Why</summary>
        <ul className="fold-list">
          <li>Gold-evidence screen: {screen.pass} of {screen.total} stream samples at Site {site} carry at least {screen.rule.thresholdPpm} ppm gold, and the screen needs {needed}.</li>
          {focus && reading ? (
            <li>{tested ? "Plot" : `Richest plot at Site ${site}:`} {focus.label} {focus.kind === "claim" ? titleCase(focus.name ?? "") : "(illustrative square)"}, {formatAssayValue(reading.value, "ppm")} gold, {CLASS_NAMES[anomalyClass(reading.value, geochem.thresholds.Au)]}.</li>
          ) : null}
          {focus ? (
            <li>
              {status === "held" ? `Its claim is held by ${titleCase(focus.owner ?? "")} since ${focus.start}.` : status === "lapsed" ? `Its claim was staked in ${focus.start} and lapsed in ${focus.end}.` : "No overlap in the checked state-claim snapshot. The square isn't a parcel, and the check doesn't establish availability or mineral rights."}
            </li>
          ) : null}
          <li>{passes ? "Passing evidence does not establish a profitable contract. The hypothetical whole lot still fails its cash test." : "A failed evidence screen independently rejects entry, whatever the hypothetical economics."}</li>
          <li>Recoverable ounces, contract terms and assignment liquidity remain assumptions. Other upfront obligations are set to zero in this demo, not verified absent from a real agreement.</li>
          <li>Hypothetical fund {usd(CAPITAL.startingFundUsd)}. Limits are {usd(CAPITAL.maxRiskPerOptionUsd)} per contract, {usd(CAPITAL.maxOpenRiskUsd)} open risk, {usd(CAPITAL.maxWholeCohortCommittedUsd)} lifetime cohort commitments and {CAPITAL.maxPositions} positions.</li>
          <li>The crowd simulation does not adjust this no-event baseline. Recorded hypothetical comparisons remain available in <a href="/swarm">the swarm workflow</a>.</li>
        </ul>
      </details>

      <details className="fold">
        <summary>What would flip it</summary>
        <ul className="fold-list">
          {fails ? <li>The evidence screen for Site {site} would pass with {moreSamples(needed - screen.pass)} ({needed} of {screen.total}).</li> : null}
          {passes ? <li>The evidence screen for Site {site} would fail if its qualifying samples dropped below {needed}: it has {screen.pass} of {screen.total}.</li> : null}
          <li>A financial entry also needs positive expected cash, verified assignment terms and passing risk and expiry checks. The detailed workbench separates those gates and shows the required resale hurdle.</li>
          {!passes && !fails ? <li>The screen needs at least {screen.rule.minimumClassifiedSamples} classified samples.</li> : null}
        </ul>
      </details>
      <details className="fold" onToggle={(event) => setModelOpen(event.currentTarget.open)}>
        <summary>Detailed hypothetical model</summary>
        {modelOpen ? <ModelWorkbench key={site} features={features} initialArea={site} /> : null}
      </details>
      <details className="fold" onToggle={(event) => setStudyOpen(event.currentTarget.open)}>
        <summary>Historical validation · event model did not beat baseline</summary>
        {studyOpen ? <EventStudy /> : null}
      </details>
    </TabBody>
  );
}
