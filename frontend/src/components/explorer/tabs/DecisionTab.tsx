"use client";

import { useEffect, useMemo, useRef } from "react";
import { signedUsd, usd, type Decision, type Market, type Town, type World } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";
import { Timing } from "./Timing";
import { Swarm } from "./Swarm";

const DOTS = 300;
export const Q_LABELS: Record<string, string> = { "0.003": "1 in 333", "0.03": "1 in 33", "0.1": "1 in 10", "0.25": "1 in 4", "0.5": "1 in 2" };
const AXIS: Record<number, string> = { [-100000]: "−$100k", [-25000]: "−$25k", [-10000]: "−$10k", 0: "$0", 50000: "+$50k", 200000: "+$200k", 800000: "+$800k" };

/** Split DOTS across bins in proportion to probability (largest remainder), so the pile is the real distribution. */
function allocate(histogram: number[]) {
  const total = histogram.reduce((a, b) => a + b, 0) || 1;
  const raw = histogram.map((p) => (p / total) * DOTS);
  const counts = raw.map(Math.floor);
  let left = DOTS - counts.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
    if (left-- > 0) counts[i]++;
  });
  return counts;
}

/** The world the slider and switch pick out of the engine's precomputed grid. */
export function worldFor(decision: Decision, qIndex: number, early: boolean) {
  const qs = [...new Set(decision.worlds.map((w) => w.q))].sort((a, b) => a - b);
  return { qs, world: decision.worlds.find((w) => w.q === qs[qIndex] && w.acceleration === early)! };
}

export function DecisionTab({ decision, market, town, qIndex, onQIndex, early, onEarly }: {
  decision: Decision;
  market: Market;
  town: Town;
  qIndex: number;
  onQIndex: (index: number) => void;
  early: boolean;
  onEarly: (early: boolean) => void;
}) {
  const { qs, world } = worldFor(decision, qIndex, early);
  const stages = decision.contract.stages;
  return (
    <TabBody
      evidence={[
        { label: "Decision engine: monthly backward induction over buyer arrivals; offers from comparable deals", source: decision.source },
        { label: `${decision.bids_label.split(". ")[0]}.` },
        { label: decision.contract.terms_label },
        { label: "Comparable deals ($/acre)", source: market.sources[1] },
        { label: `Swarm: MiroFish society, ${town.run.kind} run, seed ${town.run.seed}`, source: town.source },
      ]}
    >
      <Section
        title="Play the deal forward"
        lede={<>A four-year staged option on {decision.contract.acres} acres: {stages.map((s) => `$${s.payment_usd / 1000}k`).join(" → ")}. Every dot is one possible future; it lands where the money ends up.</>}
      >
        <div className="control">
          <label htmlFor="q-slider">How often does a new claim nearby bring a buyer?</label>
          <input id="q-slider" type="range" min={0} max={qs.length - 1} step={1} value={qIndex}
            onChange={(e) => onQIndex(Number(e.target.value))} aria-valuetext={Q_LABELS[String(qs[qIndex])]} />
          <div className="control-scale tabular" aria-hidden="true">
            {qs.map((q, i) => <span key={q} data-on={i === qIndex || undefined}>{Q_LABELS[String(q)]}</span>)}
          </div>
        </div>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked={early} onChange={(e) => onEarly(e.target.checked)} />
          <span className="switch" aria-hidden="true" />
          We may pay the rest early to close a sale
        </label>
        <div className="verdict-row" aria-live="polite">
          <span className={`signal${world.action === "BUY" ? " is-buy" : ""}`}>{world.action}</span>
          <span className="tabular">{signedUsd(world.value_usd)} expected · {Math.round(world.p_loss * 100)}% of futures lose money</span>
        </div>
        <Board world={world} edges={decision.histogram_edges_usd} />
        <p className="note">Across all {decision.combinations} assumption sets the engine tested: <strong>{decision.verdict}</strong>, BUY in only {decision.combinations_buy}. Top offer the model draws: {usd(Math.max(...decision.exit_offers_usd_per_acre) * decision.contract.acres)}.</p>
      </Section>

      <Timing decision={decision} market={market} world={world} />

      <Swarm town={town} />
    </TabBody>
  );
}

type Particle = { x: number; y: number; vy: number; tx: number; ty: number; delay: number; gain: boolean };

/** The falling dots: each lands in the outcome bin the engine assigns it, stacking into the real distribution. */
function Board({ world, edges }: { world: World; edges: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const counts = useMemo(() => allocate(world.histogram), [world]);
  const bins = counts.length;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth;
    const h = el.clientHeight;
    el.width = w * dpr;
    el.height = h * dpr;
    const ctx = el.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const floor = h - 34;
    const col = w / bins;
    const size = Math.max(3, Math.min(6, col / 6));
    const perRow = Math.max(1, Math.floor((col - 4) / size));
    const zeroBin = edges.indexOf(0);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Particle[] = [];
    counts.forEach((n, bin) => {
      for (let k = 0; k < n; k++) {
        const tx = bin * col + 2 + (k % perRow) * size + size / 2 + (col - 4 - perRow * size) / 2;
        const ty = floor - Math.floor(k / perRow) * size - size / 2;
        particles.push({ x: w / 2 + (Math.random() - 0.5) * w * 0.5, y: -10 - Math.random() * 40, vy: 0, tx, ty,
          delay: Math.random() * 1400 + Math.floor(k / perRow) * 6, gain: bin >= zeroBin });
      }
    });

    const tallest = counts.indexOf(Math.max(...counts));
    const pile = counts[tallest] > DOTS * 0.4 ? {
      x: tallest * col + col / 2,
      top: floor - Math.ceil(counts[tallest] / perRow) * size,
      title: `${Math.round(world.p_modal * 100)}% of futures: ${signedUsd(world.modal_outcome_usd)}`,
      note: world.lapse_month_if_no_buyer === null ? "" : `pay $10k, no buyer within ${world.lapse_month_if_no_buyer} months, walk away`,
    } : null;

    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      // Axis: zero line and bin labels.
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath(); ctx.moveTo(0, floor + 0.5); ctx.lineTo(w, floor + 0.5); ctx.stroke();
      const zx = zeroBin * col;
      ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(zx, 8); ctx.lineTo(zx, floor); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(230,235,242,0.6)";
      ctx.font = "11px var(--font-plex-mono), ui-monospace, monospace";
      ctx.textAlign = "center";
      edges.forEach((edge, i) => {
        if (!AXIS[edge]) return;
        ctx.textAlign = i === 0 ? "left" : i === edges.length - 1 ? "right" : "center";
        ctx.fillText(AXIS[edge], i * col, floor + 18);
      });
      ctx.textAlign = "left";
      ctx.fillText("lose", 4, 18);
      ctx.textAlign = "right";
      ctx.fillText("gain", w - 4, 18);

      let moving = 0;
      for (const p of particles) {
        if (reduced) { p.x = p.tx; p.y = p.ty; }
        else if (t > p.delay && (p.y < p.ty || Math.abs(p.x - p.tx) > 0.3)) {
          p.vy = Math.min(p.vy + 0.55, 18);
          p.y = Math.min(p.y + p.vy, p.ty);
          p.x += (p.tx - p.x) * 0.09;
          moving++;
        } else if (t <= p.delay) moving++;
        ctx.fillStyle = p.gain ? "#22c55e" : "rgba(229,229,229,0.8)";
        ctx.fillRect(p.x - size / 2 + 0.5, p.y - size / 2 + 0.5, size - 1, size - 1);
      }
      // Name the tallest pile once the dots have landed.
      if (moving === 0 && pile) {
        ctx.fillStyle = "rgba(244,246,249,0.92)";
        ctx.font = "600 13px var(--font-dm-sans), system-ui, sans-serif";
        ctx.textAlign = pile.x < w / 2 ? "left" : "right";
        const x = pile.x < w / 2 ? pile.x + col / 2 + 10 : pile.x - col / 2 - 10;
        ctx.fillText(pile.title, x, pile.top + 14);
        ctx.fillStyle = "rgba(170,179,192,0.95)";
        ctx.font = "12px var(--font-dm-sans), system-ui, sans-serif";
        ctx.fillText(pile.note, x, pile.top + 32);
      }
      if (moving > 0) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [counts, bins, edges, world]);

  return (
    <canvas
      ref={canvas}
      className="board"
      role="img"
      aria-label={`${DOTS} possible futures. ${Math.round(world.p_loss * 100)}% lose money; expected ${signedUsd(world.value_usd)}. Signal: ${world.action}.`}
    />
  );
}
