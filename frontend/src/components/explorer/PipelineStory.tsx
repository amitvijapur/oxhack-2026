"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { anomalyClass, type Showcase } from "@/lib/showcase";
import type { Sample } from "@/lib/types";
import { swarmView } from "@/lib/swarm-view.js";
import { inspectIntegratedSources } from "../../../../model/tok-option/workbench.mjs";
import { evidenceByArea } from "@/lib/canonical-model.js";
import type { Tab } from "./Panel";
import { FIRST, useSeries } from "./Timelapse";

const STEPS = ["The ground", "The land, over time", "The people", "The evidence gate", "What's missing"] as const;
const PATHFINDERS = ["W", "Te", "Cu", "As", "Bi", "Ag"];

/** "How it works": the pipeline, one screen per step, every number read from the data or the team model. */
export function PipelineStory({ data, features, onClose, onOpen }: { data: Showcase; features: Sample[]; onClose: () => void; onOpen: (tab: Tab) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const series = useSeries(data.claims, data.history);
  const swarm = useMemo(() => swarmView(), []);
  const gaps = useMemo(() => inspectIntegratedSources().modelGaps, []);
  const gate = useMemo(() => {
    const areas = evidenceByArea(features);
    return { areas, rule: areas[0].rule!, interpretation: areas[0].interpretation };
  }, [features]);

  // Step facts, all computed from the loaded files.
  const facts = useMemo(() => {
    const g = data.geochem;
    const goldRich = g.samples.filter((s) => anomalyClass(s.values.Au, g.thresholds.Au) >= 2);
    const travel = PATHFINDERS.map((e) => ({ e, n: goldRich.filter((s) => anomalyClass(s.values[e], g.thresholds[e]) >= 2).length }));
    const baseline = swarm.runs.find((r) => r.scenario === "baseline" && r.seed === 1);
    const groups = swarm.groups.map((g) => ({ label: g.label, mood: (baseline?.days3to5 as Record<string, number> | null)?.[g.key] ?? null }));
    const agents = Object.values(swarm.runs[0].tiers ?? {}).reduce((a: number, b) => a + Number(b), 0);
    const firstStaked = Math.min(...data.claims.features.map((f) => f.properties.start ?? Infinity));
    return { goldRich: goldRich.length, travel, groups, agents, firstStaked, judged: swarm.runs.filter((r) => r.judged).length };
  }, [data, swarm]);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setStep(Number((entry.target as HTMLElement).dataset.step));
    }, { root, threshold: 0.55 });
    sections.forEach((s) => seen.observe(s));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowLeft") {
        if ((event.target as HTMLElement).closest("input")) return;
        event.preventDefault();
        const next = Math.max(0, Math.min(STEPS.length - 1, step + (event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1)));
        sections[next]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { seen.disconnect(); window.removeEventListener("keydown", onKey); };
  }, [onClose, step]);

  const go = (k: number) => scroller.current?.querySelector<HTMLElement>(`[data-step="${k}"]`)?.scrollIntoView({ behavior: "smooth" });
  const W = 520;
  const H = 90;
  // History only: the claims series stops at today.
  const held = series.held.filter((v): v is number => v !== null);
  const maxHeld = Math.max(...held);
  const xy = (k: number, v: number) => `${(k / (held.length - 1)) * W},${H - 4 - (v / maxHeld) * (H - 12)}`;

  return (
    <div className="story" role="dialog" aria-modal="true" aria-label="How it works">
      <nav className="story-rail" aria-label="Steps">
        {STEPS.map((label, k) => (
          <button key={label} type="button" aria-current={step === k ? "step" : undefined} onClick={() => go(k)}>
            <span className="tabular">{k + 1}</span><span className="story-rail-label">{label}</span>
          </button>
        ))}
      </nav>
      <button type="button" className="icon-button story-close" onClick={onClose} aria-label="Close the story"><X className="size-5" /></button>

      <div className="story-scroll" ref={scroller}>
        <section className="story-step" data-step={0}>
          <p className="story-kicker">1 · The ground</p>
          <h2>Start with what&apos;s actually in the dirt.</h2>
          <p className="story-lede">Alaska&apos;s state survey (DGGS RDF 2016-10) sampled <strong className="tabular">{data.geochem.samples.length} stream beds</strong> near Tok and measured <strong className="tabular">{data.geochem.order?.length ?? Object.keys(data.geochem.thresholds).length} elements</strong> in each. {facts.goldRich} of them are in the top 10% for gold, and the elements that travel with gold run high at the same sites:</p>
          <div className="story-bars">
            {facts.travel.map(({ e, n }) => (
              <div key={e}><span className="tabular">{e}</span><i style={{ width: `${(n / facts.goldRich) * 100}%` }} /><span className="tabular">{n}/{facts.goldRich}</span></div>
            ))}
          </div>
          <button type="button" className="button secondary" onClick={() => onOpen("land")}>See it on the map <ArrowRight className="size-4" aria-hidden="true" /></button>
        </section>

        <section className="story-step" data-step={1}>
          <p className="story-kicker">2 · The land, over time</p>
          <h2>Then who owns the land, and when they rushed in.</h2>
          <p className="story-lede"><strong>{data.claims.features.length.toLocaleString()} real state claims</strong> near Tok, the first staked in {facts.firstStaked}. Green years gained claims, red years lost them. The rushes don&apos;t simply follow the gold price, so timing needs more than price.</p>
          <svg viewBox={`0 0 ${W} ${H}`} className="story-line" role="img" aria-label={`Claims held near Tok, ${FIRST} to today`}>
            {held.slice(1).map((v, k) => (
              <line key={k} x1={xy(k, held[k]).split(",")[0]} y1={xy(k, held[k]).split(",")[1]} x2={xy(k + 1, v).split(",")[0]} y2={xy(k + 1, v).split(",")[1]}
                className={v > held[k] ? "tl-up" : v < held[k] ? "tl-down" : "tl-flat"} />
            ))}
          </svg>
          <div className="story-axis tabular"><span>{FIRST}</span><span>today: {held.at(-1)?.toLocaleString()} held</span></div>
          <button type="button" className="button secondary" onClick={() => onOpen("land")}>Explore the land <ArrowRight className="size-4" aria-hidden="true" /></button>
        </section>

        <section className="story-step" data-step={2}>
          <p className="story-kicker">3 · The people</p>
          <h2>Ask simulated stakeholders how they would react.</h2>
          <p className="story-lede">A MiroFish swarm of <strong className="tabular">{facts.agents}</strong> simulated stakeholders hears the same day-1 gold news and posts for five simulated days. A judge model scores each post for support of mining, 0–10. <strong className="tabular">{facts.judged}</strong> of {swarm.runs.length} planned runs are scored.</p>
          <div className="story-bars is-mood">
            {facts.groups.map((g) => (
              <div key={g.label}><span>{g.label}</span><i style={{ width: `${((g.mood ?? 0) / 10) * 100}%` }} /><span className="tabular">{g.mood?.toFixed(1) ?? "—"}</span></div>
            ))}
          </div>
          <p className="story-note">Baseline seed 1, days 3–5 mean support. Simulated, not a survey. The placebo, mirror and grounding checks fail. Decide can explore matched recorded contrasts with an explicitly hypothetical gold response; those research failures remain unchanged.</p>
          <button type="button" className="button secondary" onClick={() => onOpen("crowd")}>See the crowd <ArrowRight className="size-4" aria-hidden="true" /></button>
        </section>

        <section className="story-step" data-step={3}>
          <p className="story-kicker">4 · The evidence gate</p>
          <h2>Screen each area on measured gold first.</h2>
          <p className="story-lede">The team model classifies every primary gold assay against <strong className="tabular">{gate.rule.thresholdPpm} ppm</strong>. An area needs at least {gate.rule.minimumClassifiedSamples} classified samples, with at least {Math.round(gate.rule.minimumQualifyingFraction * 100)}% of all its samples confirmed to clear the threshold.</p>
          <div className="story-bars">
            {gate.areas.map((a) => (
              <div key={a.area}><span>Area {a.area}</span><i style={{ width: `${(a.pass / (a.total || 1)) * 100}%` }} /><span className="tabular">{a.pass}/{a.total} · {a.gate}</span></div>
            ))}
          </div>
          <p className="story-note">{gate.interpretation}</p>
          <button type="button" className="button secondary" onClick={() => onOpen("decide")}>See the screen and financial demo <ArrowRight className="size-4" aria-hidden="true" /></button>
        </section>

        <section className="story-step" data-step={4}>
          <p className="story-kicker">5 · What the model still needs</p>
          <h2>A passed geological screen is only the first gate.</h2>
          <p className="story-lede">With observed data only, the model returns no money figures. Its 30/90/180-day assignment arithmetic runs only on clearly labelled hypothetical inputs, until these are supplied:</p>
          <ol className="story-flow">
            {gaps.map((g) => <li key={g.id}><strong>{g.label}.</strong> {g.detail}</li>)}
          </ol>
          <button type="button" className="button primary" onClick={() => onOpen("land")}>Explore the land <ArrowRight className="size-4" aria-hidden="true" /></button>
        </section>
      </div>
    </div>
  );
}
