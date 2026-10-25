"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { signedUsd, usd, type Decision as DecisionData, type Market, type World } from "@/lib/showcase";
import { Panel } from "./Panel";
import type { Depth } from "./Ground";
import { TimingDeep } from "./deep/Timing";

const DOTS = 300;
const Q_LABELS: Record<string, string> = { "0.003": "1 in 333", "0.03": "1 in 33", "0.1": "1 in 10", "0.25": "1 in 4", "0.5": "1 in 2" };
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

export function Decision({ decision, market, deep, tour, onRestart }: {
  decision: DecisionData;
  market: Market;
  deep: Depth;
  tour: boolean;
  onRestart: () => void;
}) {
  const qs = useMemo(() => [...new Set(decision.worlds.map((w) => w.q))].sort((a, b) => a - b), [decision]);
  const [qIndex, setQIndex] = useState(2);
  const [early, setEarly] = useState(true);
  const [settled, setSettled] = useState(false);
  const [run, setRun] = useState(0);
  const world = decision.worlds.find((w) => w.q === qs[qIndex] && w.acceleration === early)!;

  // In the tour: let the dots land, slide to the most optimistic world until it flips to BUY,
  // then return to the default, so the tour ends on the real answer rather than the best case.
  useEffect(() => {
    if (!tour) return;
    const timers = [[5000, 3], [8000, 4], [13_500, 2]].map(([ms, index]) => window.setTimeout(() => setQIndex(index), ms));
    return () => timers.forEach(window.clearTimeout);
  }, [tour]);

  const stages = decision.contract.stages;
  return (
    <>
      <Panel
        step={4}
        onDeep={deep.onOpen}
        mode="Model"
        title="So, do we buy?"
        lede={<>Every dot is one possible future for a four-year, {usd(stages.reduce((a, s) => a + s.payment_usd, 0))} staged deal on {decision.contract.acres} acres. The algorithm plays each one month by month, and the dots land where the money ends up.</>}
        evidence={[
          { label: "Decision engine: monthly backward induction over buyer arrivals, offers from comparable deals", source: decision.source },
          { label: decision.contract.terms_label },
          { label: `Across all ${decision.combinations} assumption sets: ${decision.verdict_text}; average ${signedUsd(decision.expected_value_usd)}` },
          { label: "Land status and mineral rights are not yet confirmed, so any BUY would go to manual review" },
        ]}
      >
        <ol className="ladder" aria-label="Payments">
          {stages.map((s) => (
            <li key={s.month}><span className="tabular">{usd(s.payment_usd / 1000)}k</span><small>{s.month === 0 ? "now" : `year ${s.month / 12}`}</small></li>
          ))}
        </ol>
        <div className="control">
          <label htmlFor="q-slider">How often does a new claim nearby bring a buyer?</label>
          <input
            id="q-slider"
            type="range"
            min={0}
            max={qs.length - 1}
            step={1}
            value={qIndex}
            onChange={(e) => setQIndex(Number(e.target.value))}
            aria-valuetext={Q_LABELS[String(qs[qIndex])]}
          />
          <div className="control-scale tabular" aria-hidden="true">
            {qs.map((q, i) => <span key={q} data-on={i === qIndex || undefined}>{Q_LABELS[String(q)]}</span>)}
          </div>
        </div>
        <label className="switch-row">
          <input type="checkbox" role="switch" checked={early} onChange={(e) => setEarly(e.target.checked)} />
          <span className="switch" aria-hidden="true" />
          We may pay the rest early to close a sale
        </label>
      </Panel>

      {deep.open ? <TimingDeep decision={decision} market={market} world={world} onClose={deep.onClose} /> : null}
      <div className="stage stage-decision">
        <Board world={world} edges={decision.histogram_edges_usd} run={run} onSettled={setSettled} />
        <AnimatePresence mode="wait">
          {settled ? (
            <motion.div
              key={`${world.action}-${world.q}-${world.acceleration}`}
              className="verdict"
              initial={{ opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <span className={`stamp${world.action === "BUY" ? " is-buy" : ""}`}>{world.action}</span>
              <span className="verdict-line tabular">Expected {signedUsd(world.value_usd)} in this world</span>
              <span className="verdict-sub">{Math.round(world.p_loss * 100)}% of futures lose money</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="board-foot">
          <p className="board-overall">
            Across all {decision.combinations} worlds we tested: <strong>{decision.verdict}</strong>, BUY in only {decision.combinations_buy}.
          </p>
          <button type="button" className="ghost-button small" onClick={() => setRun((r) => r + 1)}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Drop again
          </button>
          <button type="button" className="ghost-button small" onClick={onRestart}>Start over</button>
        </div>
      </div>
    </>
  );
}

type Particle = { x: number; y: number; vy: number; tx: number; ty: number; delay: number; gain: boolean };

/** The falling dots: each lands in the outcome bin the engine assigns it, stacking into the real distribution. */
function Board({ world, edges, run, onSettled }: { world: World; edges: number[]; run: number; onSettled: (done: boolean) => void }) {
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
    onSettled(false);

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
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
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
        ctx.fillStyle = p.gain ? "#e8b04b" : "rgba(226,232,240,0.85)";
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
      else onSettled(true);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [counts, bins, edges, run, onSettled, world]);

  return (
    <canvas
      ref={canvas}
      className="board"
      role="img"
      aria-label={`${DOTS} possible futures. ${Math.round(world.p_loss * 100)}% lose money; expected ${signedUsd(world.value_usd)}. Signal: ${world.action}.`}
    />
  );
}
