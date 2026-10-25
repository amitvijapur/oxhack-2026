"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { algorithmSnapshot, getAlgorithmFrame } from "@/lib/algorithm-workflow.mjs";
import { buildWorkflowData } from "@/lib/swarm-workflow.mjs";
import swarmSource from "../../../../../model/tok-option/data/swarm-source.json";
import { TabBody } from "../TabBody";

const frameFor = (scenarioId: string) => getAlgorithmFrame(algorithmSnapshot, { area: "A", scenarioId, horizonDays: 90 });
const usd = (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? "—" : `$${value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`);
const signed = (value: number | null | undefined) => (value === null || value === undefined ? "—" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(3)}`);

/**
 * The swarm workflow as six short steps, read from the same pinned source and calculation snapshot as
 * the full /swarm page, so the numbers match it. The dollar figures rest on the model's assumed gold
 * price and economics, so they are labelled hypothetical.
 */
export function WorkflowTab() {
  const data = useMemo(() => buildWorkflowData(swarmSource), []);
  // Only scenarios the snapshot can contrast against the matched placebo have a signal to show.
  const runs = useMemo(() => data.runs.filter((r) => r.available && r.scenario !== "baseline" && frameFor(r.scenario).signal?.value != null), [data]);
  const [scenarioId, setScenarioId] = useState(() => (runs.find((r) => r.scenario === "mine_approval") ?? runs[0])?.scenario ?? "mine_approval");
  const run = runs.find((r) => r.scenario === scenarioId) ?? null;
  const frame = useMemo(() => frameFor(scenarioId), [scenarioId]);
  const signal = frame.signal;
  const result = frame.mapped;
  const label = (id: string) => data.groups.find((g) => g.id === id)?.label ?? id;

  return (
    <TabBody evidence={[
      { label: `Pinned swarm source${data.source.commit ? ` @ ${data.source.commit.slice(0, 7)}` : ""}: ${data.counts.availableRuns} of ${data.counts.plannedRuns} planned runs scored` },
      { label: `Canonical calculation snapshot, model ${algorithmSnapshot.source.commit.slice(0, 7)}` },
    ]}>
      <section className="section">
        <h3>How the swarm workflow runs</h3>
        <p className="section-lede">Simulated stakeholders hear the news, their posts are scored, and the scores become one signal. A recorded replay, not a survey.</p>
        <Link href="/swarm" className="button primary wide wf-open">Open the full swarm workflow <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
        <label className="wf-pick">
          Scenario
          <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)} aria-label="Swarm scenario">
            {runs.map((r) => <option key={r.id} value={r.scenario}>{r.label}</option>)}
          </select>
        </label>
        <ol className="wf-steps">
          <li>
            <strong>Inputs</strong>
            <p>{data.counts.availableRuns} of {data.counts.plannedRuns} planned runs were recorded. This one is {run?.label ?? "—"}, seed {run?.seed ?? "—"}, with its scenario news on day 3.</p>
          </li>
          <li>
            <strong>Stakeholders</strong>
            <p>{data.counts.agents} simulated people in {data.counts.groups} groups.</p>
            <p className="wf-values">{data.groups.map((g) => <span key={g.id}>{g.label} <b>{g.agents}</b></span>)}</p>
          </li>
          <li>
            <strong>Support scores</strong>
            <p>A judge scores every post for support of mining, 0 to 10. Mean of days 3–5:</p>
            <p className="wf-values">{(signal?.groups ?? []).map((g) => <span key={g.group}>{label(g.group)} <b>{g.scenarioMean === null ? "—" : g.scenarioMean.toFixed(2)}</b></span>)}</p>
          </li>
          <li>
            <strong>Swarm signal</strong>
            <p>Each group&apos;s change against the matched placebo run, weighted toward funds and industry.</p>
            <p className="wf-values"><span>Weighted signal <b>{signed(signal?.value)}</b></span></p>
          </li>
          <li>
            <strong>Gold forecast</strong>
            <p>The signal nudges an assumed gold price by at most 7%. The link is uncalibrated, so the call doesn&apos;t use it yet.</p>
            <p className="wf-values"><span>Assumed price <b>{usd(frame.controls?.price, 0)}</b></span><span>Gold forecast <b>{usd(result?.goldForecast?.scenarioPriceUsdPerOz)}</b>/oz</span></p>
          </li>
          <li>
            <strong>Option value</strong>
            <p>That price feeds the model&apos;s hypothetical option, {frame.horizonDays} days out. Hypothetical economics, not a quote.</p>
            <p className="wf-values"><span>Option assignment <b>{usd(result?.assignmentValueUsd)}</b></span><span>Expected net cash <b>{usd(result?.expectedNetCashUsd)}</b> on <b>{usd(result?.amountAtRiskUsd, 0)}</b> at risk</span></p>
          </li>
        </ol>
      </section>
    </TabBody>
  );
}
