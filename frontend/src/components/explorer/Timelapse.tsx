"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { claimState, usd, type Claims, type History } from "@/lib/showcase";

export const FIRST = 1975;
export const LAST = 2026;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
const STEP_MS = 260;
const W = 1000;
const H = 72;

/** Claims held near Tok and the gold price for every year, from the DNR outlines and Arjin's table. */
export function useSeries(claims: Claims, history: History) {
  return useMemo(() => {
    const gold = new Map(history.rows.map((r) => [Number(r.year), Number(r.gold_usd_per_oz_mean)]));
    return {
      held: YEARS.map((y) => claims.features.filter((f) => claimState(f.properties, y) === "active").length),
      gold: YEARS.map((y) => gold.get(y) ?? null),
    };
  }, [claims, history]);
}

function Change({ now, then }: { now: number | null; then: number | null }) {
  if (now === null || then === null || then === 0) return null;
  const pct = Math.round(((now - then) / then) * 100);
  return <span className={`change ${pct >= 0 ? "is-up" : "is-down"}`}>{pct >= 0 ? "▲" : "▼"} {Math.abs(pct)}% <small>in 10 yrs</small></span>;
}

/** The opening: 1975 → today plays by itself; the readout and growth line follow the year. */
export function Timelapse({ claims, history, year, onYear, playing, onPlaying, onExplore }: {
  claims: Claims;
  history: History;
  year: number;
  onYear: (year: number) => void;
  playing: boolean;
  onPlaying: (playing: boolean) => void;
  onExplore: () => void;
}) {
  const series = useSeries(claims, history);
  // Driven by elapsed time, not ticks, so a busy frame (map tiles loading) can't speed it up or stall it.
  const startYear = useRef(year);
  useEffect(() => {
    if (!playing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onYear(LAST);
      onPlaying(false);
      return;
    }
    const from = startYear.current;
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      // A frame's timestamp can be slightly earlier than `began`, so never step backwards.
      const next = Math.min(LAST, from + Math.max(0, Math.floor((now - began) / STEP_MS)));
      onYear(next);
      if (next >= LAST) onPlaying(false);
      else frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, onYear, onPlaying]);
  useEffect(() => { if (!playing) startYear.current = year; }, [playing, year]);

  const i = Math.max(0, YEARS.indexOf(year));
  const back = Math.max(0, i - 10);
  const maxHeld = Math.max(...series.held, 1);
  const maxGold = Math.max(...series.gold.map((g) => g ?? 0), 1);
  const x = (k: number) => (k / (YEARS.length - 1)) * W;
  const upto = (values: (number | null)[], max: number) =>
    values.slice(0, i + 1).map((v, k) => (v === null ? "" : `${k === 0 || values[k - 1] === null ? "M" : "L"}${x(k).toFixed(1)},${(H - 2 - (v / max) * (H - 8)).toFixed(1)}`)).join("");
  const heldArea = `M0,${H}` + series.held.slice(0, i + 1).map((v, k) => `L${x(k).toFixed(1)},${(H - 2 - (v / maxHeld) * (H - 8)).toFixed(1)}`).join("") + `L${x(i).toFixed(1)},${H}Z`;

  return (
    <section className="timelapse" aria-label="Claims and gold since 1975">
      <div className="tl-intro">
        <h1 className="tl-title">Buy the land before the miners do, and know when to sell.</h1>
        <button type="button" className="button primary" onClick={onExplore}>
          Explore the land <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="tl-readout" aria-live="off">
        <p className="tl-year tabular">{year}</p>
        <dl>
          <div>
            <dt>Claims held near Tok</dt>
            <dd className="tabular">{series.held[i].toLocaleString()}</dd>
            <Change now={series.held[i]} then={series.held[back]} />
          </div>
          <div>
            <dt>Gold, yearly average</dt>
            <dd className="tabular">{series.gold[i] ? usd(series.gold[i]!) : "—"}</dd>
            <Change now={series.gold[i]} then={series.gold[back]} />
          </div>
        </dl>
      </div>

      <div className="tl-track">
        <button type="button" className="icon-button" onClick={() => { startYear.current = FIRST; onYear(FIRST); onPlaying(true); }} aria-label="Replay from 1975">
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <div className="tl-chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={heldArea} className="tl-held" />
            <path d={upto(series.gold, maxGold)} className="tl-gold" vectorEffect="non-scaling-stroke" />
            <line x1={x(i)} x2={x(i)} y1={0} y2={H} className="tl-cursor" vectorEffect="non-scaling-stroke" />
          </svg>
          <input type="range" min={FIRST} max={LAST} step={1} value={year} aria-label="Year"
            aria-valuetext={`${year}: ${series.held[i]} claims held`}
            onChange={(e) => { onPlaying(false); onYear(Number(e.target.value)); }} />
          <div className="tl-axis tabular" aria-hidden="true">
            <span>{FIRST}</span>
            <span className="tl-legend"><i className="k-held" /> claims held <i className="k-gold" /> gold price</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </section>
  );
}
