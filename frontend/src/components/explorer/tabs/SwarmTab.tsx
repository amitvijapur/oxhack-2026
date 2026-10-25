"use client";

import { useMemo, useState } from "react";
import { swarmView } from "@/lib/swarm-view.js";
import { SwarmDiagnostics } from "@/ModelDiagnostics.jsx";
import { inspectIntegratedSources } from "../../../../../model/tok-option/workbench.mjs";
import type { Town } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";
import { Swarm } from "./Swarm";
import "@/model-workbench.css";

type View = ReturnType<typeof swarmView>;
type Run = View["runs"][number];

const W = 400;
const H = 180;
const PAD = { l: 28, r: 22, t: 10, b: 22 };
const fixed = (x: number, d = 2) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d);

/** Days 1–5 support for one group: the three baselines as a band, the scenario runs as lines. */
function GroupChart({ view, group }: { view: View; group: string }) {
  const judged = view.runs.filter((r) => r.judged && r.daily);
  const baselines = judged.filter((r) => r.scenario === "baseline");
  const scenarios = judged.filter((r) => r.scenario !== "baseline");
  const values = judged.flatMap((r) => r.daily![group].map((d) => d.support)).filter((v): v is number => v !== null);
  const lo = Math.floor(Math.min(...values) - 0.25);
  const hi = Math.ceil(Math.max(...values) + 0.25);
  const x = (day: number) => PAD.l + ((day - 1) / 4) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const line = (run: Run) => run.daily![group].map((d, i) => (d.support === null ? "" : `${i === 0 ? "M" : "L"}${x(d.day).toFixed(1)},${y(d.support).toFixed(1)}`)).join("");
  const band = [1, 2, 3, 4, 5].map((day) => {
    const v = baselines.map((r) => r.daily![group][day - 1].support).filter((s): s is number => s !== null);
    return { day, min: Math.min(...v), max: Math.max(...v) };
  });
  const bandPath = `M${band.map((b) => `${x(b.day)},${y(b.max)}`).join("L")}L${[...band].reverse().map((b) => `${x(b.day)},${y(b.min)}`).join("L")}Z`;
  const style: Record<string, string> = { placebo: "swarm-run is-placebo", mine_approved: "swarm-run is-up", court_blocks_mine: "swarm-run is-strong" };
  return (
    <figure className="swarm-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mean mining support by day for ${group}, baselines and scenarios`}>
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="swarm-grid" /><text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="swarm-axis">{v.toFixed(1)}</text></g>
        ))}
        {[1, 2, 3, 4, 5].map((d) => <text key={d} x={x(d)} y={H - 6} textAnchor="middle" className="swarm-axis">Day {d}</text>)}
        <rect x={x(3) - 6} y={PAD.t} width={x(5) - x(3) + 12} height={H - PAD.t - PAD.b} className="swarm-window" />
        <path d={bandPath} className="swarm-band" />
        {baselines.map((r) => <path key={r.id} d={line(r)} className="swarm-run is-baseline" vectorEffect="non-scaling-stroke" />)}
        {scenarios.map((r) => <path key={r.id} d={line(r)} className={style[r.scenario] ?? "swarm-run"} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <figcaption className="swarm-legend">
        <span><i className="is-band" />3 baselines (spread)</span>
        {scenarios.map((r) => <span key={r.id}><i className={(style[r.scenario] ?? "").replace("swarm-run ", "")} />{r.label}</span>)}
      </figcaption>
    </figure>
  );
}

/** The MiroFish stakeholder swarm: what was run, what it produced, and which checks it passed. */
export function SwarmTab({ town }: { town: Town }) {
  const view = useMemo(() => swarmView(), []);
  const audit = useMemo(() => inspectIntegratedSources().swarm, []);
  const [group, setGroup] = useState(view.groups[3].key);
  const judged = view.runs.filter((r) => r.judged);
  const missing = view.runs.filter((r) => !r.judged);
  const agents = Object.values(view.runs[0].tiers ?? {}).reduce((a: number, b) => a + Number(b), 0);
  const scenarioEffects = view.effects;
  // The run's news definition: its first sentence is the headline the swarm hears.
  const [headline, ...restParts] = view.news.split(/(?<=\.)\s+/);
  const rest = restParts.join(" ");
  const repo = view.source.repository ? `https://github.com/${view.source.repository}/tree/${view.source.commit}/swarm` : undefined;

  return (
    <TabBody evidence={[
      { label: `Swarm results, ${view.source.branch} @ ${view.source.commit.slice(0, 7)} (committed ${view.source.committedAt.slice(0, 10)})`, href: repo },
      { label: `Judge check: ${view.judge.judgeModel}, ${view.judge.withinTolerance}/${view.judge.sampleSize} within ${view.judge.tolerancePoints} points of human marks` },
      { label: "Town replay: day-1 pilot, a separate earlier run", source: town.source },
    ]}>
      <Section
        title="The stakeholder swarm"
        lede={<>{agents} simulated Tok stakeholders hear the same news, &ldquo;{headline}&rdquo;, and post for five simulated days. A judge model scores each post for support of mining, 0–10. {rest}</>}
      >
        <dl className="mini-stats">
          <div><dt>Runs judged</dt><dd className="tabular">{judged.length}<small>/{view.runs.length}</small></dd></div>
          <div><dt>Scored posts</dt><dd className="tabular">{view.inventory.numericScoredRows.toLocaleString()}</dd></div>
          <div><dt>Judge agreement</dt><dd className="tabular">{view.judge.withinTolerance}<small>/{view.judge.sampleSize}</small></dd></div>
        </dl>
        <p className="note">Simulated opinions, not a survey or a market probability. The team&apos;s model does not let these scores move a price until the checks below pass.</p>
      </Section>

      <Section title="Support by day" lede="Mean mining support per group and day. The grey band is the spread of the three baseline seeds; days 3–5 (shaded) are the window the model compares.">
        <div className="chip-row" role="radiogroup" aria-label="Group">
          {view.groups.map((g) => (
            <button key={g.key} type="button" role="radio" aria-checked={group === g.key} className="chip" onClick={() => setGroup(g.key)}>
              {g.label} <span className="tabular">{Math.round(g.weight * 100)}%</span>
            </button>
          ))}
        </div>
        <GroupChart view={view} group={group} />
        <p className="note">The percentage on each group is its weight in the model&apos;s signal (<code>model/tok-option/config.mjs</code>).</p>
      </Section>

      <Section title="Effect against baseline, days 3–5" lede="Scenario mean minus the seed-1 baseline. It counts as a response only if it is larger than the baseline spread (band).">
        <div className="table-scroll">
          <table className="swarm-table tabular">
            <thead><tr><th>Group</th>{scenarioEffects.map((e) => <th key={e.scenario}>{e.label}</th>)}<th>Band</th></tr></thead>
            <tbody>
              {view.groups.map((g) => (
                <tr key={g.key}>
                  <th>{g.label}</th>
                  {scenarioEffects.map((e) => {
                    const cell = (e.byGroup as Record<string, { effect: number; beyond_band: boolean; expected: string | null }>)[g.key];
                    return <td key={e.scenario} data-beyond={cell?.beyond_band || undefined} title={cell?.expected ? `Expected ${cell.expected}` : undefined}>{cell ? fixed(cell.effect) : "—"}{cell?.expected ? <small> exp. {cell.expected}</small> : null}</td>;
                  })}
                  <td>{(view.bands as Record<string, number>)[g.key].toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Bold: beyond the band. The placebo (sports news) also moves government and industry beyond their bands, so scenario effects can&apos;t be told apart from noise yet.</p>
      </Section>

      <Section title="Checks from the swarm report" lede="Pre-registered checks, as reported by the run itself.">
        <ul className="check-list">
          {view.checks.map((c) => (
            <li key={c.id}>
              <div><strong>{c.id[0].toUpperCase() + c.id.slice(1)}</strong><span className={`model-status model-status-${c.status === "pass" ? "pass" : c.status === "fail" ? "fail" : "unknown"}`}>{c.status === "pass" ? "Pass" : c.status === "fail" ? "Failed" : c.status}</span></div>
              <ul>{c.parts.map((p: { part: string; status: string; detail?: string }) => <li key={p.part}><span className="tabular">{p.status}</span> · {p.part}{p.detail ? <small>{p.detail}</small> : null}</li>)}</ul>
            </li>
          ))}
        </ul>
      </Section>

      <details className="model-detail">
        <summary>The model&apos;s own readiness checks</summary>
        <SwarmDiagnostics diagnostic={audit} />
      </details>

      <Section title="Runs" lede={`${judged.length} of ${view.runs.length} planned runs have scored five-day output; ${missing.length} have input configurations only.`}>
        <div className="table-scroll">
          <table className="swarm-table tabular">
            <thead><tr><th>Run</th><th>Models (tier 1 / 2 / 3)</th><th>Interviews</th><th>Scored posts</th></tr></thead>
            <tbody>
              {view.runs.map((r) => (
                <tr key={r.id} data-missing={!r.judged || undefined}>
                  <th>{r.label}</th>
                  <td>{r.models ? r.models.join(" / ") : "not run"}</td>
                  <td>{r.interviews ? `${r.interviews.parsedAnswers}/${r.interviews.expected}` : "—"}</td>
                  <td>{r.scoredRows ? `${r.scoredRows.numeric}/${r.scoredRows.total}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">Baselines ran on {judged.find((r) => r.scenario === "baseline")?.provider} models, and the scenario runs on {judged.find((r) => r.scenario !== "baseline")?.provider} models with a different simulator revision, so a difference between them mixes the news with the configuration.</p>
      </Section>

      <details className="model-detail">
        <summary>Known limitations ({view.limitations.length})</summary>
        <ul className="limit-list">{view.limitations.map((l: string) => <li key={l}>{l}</li>)}</ul>
      </details>

      <details className="model-detail town-pilot">
        <summary>Replay the earlier day-1 pilot ({town.people.filter((p) => groupLabelOf(p.group)).length} residents)</summary>
        <Swarm town={town} />
      </details>
    </TabBody>
  );
}

/** Pilot residents in the five stakeholder groups; the news wire account is not a resident. */
const groupLabelOf = (group: string) => ["Government", "Land side: industry", "Land side: community", "Funds", "Retail"].includes(group);
