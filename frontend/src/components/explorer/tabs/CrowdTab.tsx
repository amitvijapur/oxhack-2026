"use client";

import type { Crowd } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";

const GROUP_NAMES: Record<string, string> = {
  government: "Government", land_industry: "Land industry", land_community: "Land community", funds: "Funds", retail: "Retail",
};
const SCENARIO_NAMES: Record<string, string> = {
  baseline: "Baseline", placebo: "Placebo", mine_approved: "Mine approved", court_blocks_mine: "Court blocks mine",
};
// Close to the charts' rendered width, so the tick labels stay at about their CSS size.
const W = 180;
const H = 112;
const PAD = { left: 18, right: 6, top: 6, bottom: 16 };
// One shared scale so the five charts compare directly. Every judged daily mean sits inside it.
const LOW = 2.5;
const HIGH = 7.5;
const TICKS = [3, 5, 7];

const nameOf = (id: string) => SCENARIO_NAMES[id] ?? id.replaceAll("_", " ");

function MoodChart({ crowd, group }: { crowd: Crowd; group: string }) {
  const x = (i: number) => PAD.left + (i / Math.max(1, crowd.days.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + ((HIGH - v) / (HIGH - LOW)) * (H - PAD.top - PAD.bottom);
  const path = (values: (number | null)[]) =>
    values.map((v, i) => (v === null ? "" : `${i === 0 || values[i - 1] === null ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)).join("");
  const news = crowd.days.indexOf(3);
  const name = GROUP_NAMES[group] ?? group;

  return (
    <figure className="crowd-chart">
      <figcaption>{name}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: mean support for mining by day, one line per scenario. Values are in the table that follows.`}>
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className={t === 5 ? "crowd-mid" : "crowd-grid"} />
            <text x={PAD.left - 5} y={y(t) + 3} textAnchor="end" className="crowd-tick">{t}</text>
          </g>
        ))}
        {news >= 0 ? <line x1={x(news)} x2={x(news)} y1={PAD.top} y2={H - PAD.bottom} className="crowd-news" /> : null}
        {crowd.days.map((d, i) => <text key={d} x={x(i)} y={H - 3} textAnchor="middle" className="crowd-tick">{d}</text>)}
        {crowd.scenarios.map((s) => <path key={s.id} d={path(s.support[group] ?? [])} className="crowd-line" data-s={s.id} />)}
        {crowd.scenarios.flatMap((s) => (s.support[group] ?? []).map((v, i) => (v === null ? null : (
          <circle key={`${s.id}-${i}`} cx={x(i)} cy={y(v)} r={6} className="crowd-hit">
            <title>{`${nameOf(s.id)}, day ${crowd.days[i]}: ${v.toFixed(1)}`}</title>
          </circle>
        ))))}
      </svg>
      <table className="sr-only">
        <caption>{name}: mean support for mining, 0 to 10</caption>
        <thead><tr><th scope="col">Scenario</th>{crowd.days.map((d) => <th key={d} scope="col">Day {d}</th>)}</tr></thead>
        <tbody>
          {crowd.scenarios.map((s) => (
            <tr key={s.id}><th scope="row">{nameOf(s.id)}</th>{(s.support[group] ?? []).map((v, i) => <td key={i}>{v === null ? "no posts" : v.toFixed(1)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** The simulated crowd's mood toward mining, group by group, for every scenario that was judged. */
export function CrowdTab({ crowd }: { crowd: Crowd }) {
  return (
    <TabBody evidence={[{ label: "Swarm scenario runs that were judged, and their pre-registered day-3 news", source: crowd.source }]}>
      <Section
        title="How the crowd's mood moved"
        lede={<>Each group&apos;s mean support for mining, 0 to 10, over five simulated days. The scenario news lands at the start of day 3 (dashed line).</>}
      >
        <p className="note crowd-honest">Exploratory: an unrelated news item moved the mood too, so the call doesn&apos;t use the crowd yet.</p>
        <ul className="crowd-legend">
          {crowd.scenarios.map((s) => (
            <li key={s.id} data-s={s.id}>
              <i aria-hidden="true" />
              <span>
                <strong>{nameOf(s.id)}</strong>
                {s.headline ? <>: &ldquo;{s.headline}&rdquo;</> : <>: no day-3 news{s.runs.length > 1 ? `; the line is the mean of ${s.runs.length} runs` : ""}.</>}
              </span>
            </li>
          ))}
        </ul>
        <div className="crowd-grid-wrap">
          {crowd.groups.map((g) => <MoodChart key={g} crowd={crowd} group={g} />)}
        </div>
      </Section>
    </TabBody>
  );
}
