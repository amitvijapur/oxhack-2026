"use client";

import { useMemo } from "react";
import { evidenceByArea } from "@/lib/canonical-model.js";
import { geologicalScreenLabel } from "@/decide-financial.mjs";
import { anomalyClass, formatAssayValue, plotReading, plotStatus, usd, type Geochem, type Plot, type Plots } from "@/lib/showcase";
import type { Sample } from "@/lib/types";
import type { Gold } from "../LivePill";
import { TabBody } from "../TabBody";
import { orderPlots } from "./LandTab";
import FinancialDecision from "./FinancialDecision";

export type Site = "A" | "B";
const SITE_NAMES: Record<Site, string> = { A: "Tok west", B: "Tok east" };
const CLASS_NAMES = ["below typical", "above typical", "in the top 10% of sites", "in the top 2% of sites"] as const;

type Screen = { gate: string; pass: number; fail: number; unknown: number; total: number; rule: { thresholdPpm: number; minimumClassifiedSamples: number; minimumQualifyingFraction: number } };

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");
const moreSamples = (n: number) => (n === 1 ? "one more sample" : `${n} more samples`);

/** Area-level geological eligibility followed by separate hypothetical contract economics. */
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
  const call = geologicalScreenLabel(screen.gate);
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
        { label: "Observed primary-gold samples, Alaska DGGS RDF 2016-10", href: "https://doi.org/10.14509/29688" },
        { label: `Checked Alaska DNR claim snapshot retrieved ${plots.claims_retrieved}` },
      ]}
    >
      <section className="answer decide" aria-label="Geological screen">
        <p className="eyebrow">Geological screen</p>
        <div className="decide-head">
          <p className="answer-signal">{call}</p>
          <div className="segmented" role="radiogroup" aria-label="Site">
            {(["A", "B"] as Site[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={site === s} onClick={() => onSite(s)}>
                Site {s} · {SITE_NAMES[s]}
              </button>
            ))}
          </div>
        </div>
        <p className="answer-why">
          Site {site} · {call} · {reason} {passes || fails ? `(${screen.pass} of ${screen.total} samples, needs ${needed}).` : `(${screen.pass + screen.fail} classified of ${screen.total} samples; at least ${screen.rule.minimumClassifiedSamples} classified and ${screen.rule.minimumQualifyingFraction * 100}% qualifying are required).`}
          {tested ? ` Testing plot ${tested.label}: this screen covers all of Site ${site}, not this plot alone.` : null}
        </p>
        <dl className="mini-stats">
          <div>
            <dt>Gold</dt>
            <dd className="tabular">{gold ? usd(gold.usd_per_oz) : "—"}<small>{gold ? (gold.stale ? "last spot price" : "live spot") : "connecting"}</small></dd>
          </div>
        </dl>
        <p className="note">This is a geological evidence screen on the 2016 state stream samples, not a buy recommendation. It doesn&apos;t estimate ounces or value. Live gold does not change the screen.</p>
      </section>

      <details className="fold">
        <summary>Why this geological result</summary>
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
          <li>{passes ? "Passing makes the area eligible for further evaluation only. Actual contract terms, recoverable ounces and resale value remain unknown." : fails ? "The financial model cannot enter a site that fails this screen, whatever the hypothetical terms." : "No geological eligibility is established until the evidence is sufficient and unambiguous."}</li>
          <li>The crowd simulation does not feed the geological screen. It can be explored separately in the hypothetical financial scenarios below.</li>
        </ul>
      </details>

      <details className="fold">
        <summary>What would change the screen</summary>
        <ul className="fold-list">
          {fails ? <li>With the same {screen.total} samples, Site {site} would pass if {moreSamples(needed - screen.pass)} qualified ({needed} of {screen.total}). New samples also change the denominator.</li> : null}
          {passes ? <li>With the same sample count, Site {site} would stop passing if fewer than {needed} samples qualified. A definitive failure also requires the unclassified samples to be unable to meet the threshold.</li> : null}
          {!passes && !fails ? <li>The screen needs at least {screen.rule.minimumClassifiedSamples} classified samples and an unambiguous qualifying fraction of {screen.rule.minimumQualifyingFraction * 100}%. Currently {screen.pass + screen.fail} are classified and {screen.unknown} are unknown.</li> : null}
        </ul>
      </details>

      <FinancialDecision features={features} area={site} />
    </TabBody>
  );
}
