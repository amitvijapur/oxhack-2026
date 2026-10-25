"use client";

import { useEffect, useMemo, useRef } from "react";
import { ArrowRight, Crosshair, RotateCcw } from "lucide-react";
import { claimState, usd, type Claims, type History } from "@/lib/showcase";
import { goldTrend } from "@/lib/canonical-model.js";
import { projectPrice } from "../../../../model/tok-option/commodities.mjs";

export const FIRST = 1975;
export const LAST = 2026;
/** The projection runs five years past today. */
export const FUTURE = LAST + 5;
/** The default history window: the last ten years. */
export const RECENT = LAST - 10;
const yearsFrom = (first: number) => Array.from({ length: FUTURE - first + 1 }, (_, i) => first + i);
const STEP_MS = 340;
/** The playhead rests on today before carrying on into the projection. */
const TODAY_PAUSE_MS = 1_200;
const W = 1000;
const H = 72;
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** The middle half (25th–75th percentile) of every five-year annualised gold growth since 1975. */
function pastFiveYearRange(history: History): [number, number] | null {
  const full = new Map(history.rows.filter((r) => Number(r.gold_months) === 12 && Number(r.gold_usd_per_oz_mean) > 0)
    .map((r) => [Number(r.year), Number(r.gold_usd_per_oz_mean)]));
  const rates = [...full].filter(([y]) => y >= FIRST && full.has(y - 5)).map(([y, p]) => (p / full.get(y - 5)!) ** (1 / 5) - 1).sort((a, b) => a - b);
  if (rates.length < 4) return null;
  const at = (q: number) => rates[Math.round(q * (rates.length - 1))];
  return [at(0.25), at(0.75)];
}

/**
 * Claims held near Tok and the gold price for every year, from the DNR outlines and Arjin's table,
 * then today's live price grown forward by the model's 2020–25 trend. No claims projection.
 * Only full-year averages are kept: this year's part-year average would sit beside the live price
 * as a second gold price for today, so today is the live price and the projection starts from it.
 */
export function useSeries(claims: Claims, history: History, first = FIRST, live: number | null = null) {
  return useMemo(() => {
    const YEARS = yearsFrom(first);
    const gold = new Map(history.rows.filter((r) => Number(r.gold_months) === 12).map((r) => [Number(r.year), Number(r.gold_usd_per_oz_mean)]));
    const trend = goldTrend();
    const growth = trend.annualGrowthRate ?? 0;
    const band = pastFiveYearRange(history);
    const today = live;
    const grow = (rate: number, y: number) => (today === null || y < LAST ? null : projectPrice(today, rate, (y - LAST) * 365));
    return {
      trend,
      band,
      held: YEARS.map((y) => (y > LAST ? null : claims.features.filter((f) => claimState(f.properties, y) === "active").length)),
      gold: YEARS.map((y) => (y > LAST ? null : y === LAST ? today : gold.get(y) ?? null)),
      projected: YEARS.map((y) => grow(growth, y)),
      low: YEARS.map((y) => (band ? grow(band[0], y) : null)),
      high: YEARS.map((y) => (band ? grow(band[1], y) : null)),
    };
  }, [claims, history, first, live]);
}

/** A ticker chip: the change from last year, green up, red down, grey flat. */
function Change({ now, then, money = false, label }: { now: number | null; then: number | null; money?: boolean; label?: string }) {
  if (now === null || then === null) return null;
  const diff = now - then;
  const pct = then ? (diff / then) * 100 : 0;
  const tone = diff > 0 ? "is-up" : diff < 0 ? "is-down" : "is-flat";
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const amount = money ? usd(Math.abs(diff)) : Math.abs(diff).toLocaleString();
  return (
    <span className={`change ${tone}`}>
      {diff > 0 ? "▲" : diff < 0 ? "▼" : "■"} {sign}{amount} {then ? `(${sign}${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%)` : ""}{label ? ` ${label}` : ""}
    </span>
  );
}

/** A line split into one segment per year: green where it rose, red where it fell, like a stock chart. */
function StockLine({ values, upto, max, x, className }: {
  values: (number | null)[]; upto: number; max: number; x: (k: number) => number; className: string;
}) {
  const y = (v: number) => H - 3 - (v / max) * (H - 10);
  const segments = [];
  for (let k = 1; k <= upto; k++) {
    const [a, b] = [values[k - 1], values[k]];
    if (a === null || b === null) continue;
    const tone = b > a ? "tl-up" : b < a ? "tl-down" : "tl-flat";
    segments.push(<line key={k} x1={x(k - 1)} y1={y(a)} x2={x(k)} y2={y(b)} className={`${className} ${tone}`} vectorEffect="non-scaling-stroke" />);
  }
  return <>{segments}</>;
}

/**
 * The opening: the claims and gold price over the last ten years (or since 1975), playing by itself
 * up to today, then the gold price five years on, grown by the model's trend.
 */
export function Timelapse({ claims, history, year, onYear, playing, onPlaying, onExplore, onStory, follow, onFollow, first, onFirst, onNow, live }: {
  claims: Claims;
  history: History;
  year: number;
  onYear: (year: number) => void;
  playing: boolean;
  onPlaying: (playing: boolean) => void;
  onExplore: () => void;
  onStory: () => void;
  /** Whether the map camera follows where claims change while it plays. */
  follow: boolean;
  onFollow: (on: boolean) => void;
  /** The first year shown: the last ten years, or the whole record since 1975. */
  first: number;
  onFirst: (first: number) => void;
  /** Jump to today. */
  onNow: () => void;
  /** Today's spot price, the same one the header shows; null until it arrives. */
  live: number | null;
}) {
  const YEARS = useMemo(() => yearsFrom(first), [first]);
  const series = useSeries(claims, history, first, live);
  // Driven by elapsed time, not ticks, so a busy frame (map tiles loading) can't speed it up or stall it.
  const startYear = useRef(year);
  useEffect(() => {
    if (!playing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onYear(LAST);
      onPlaying(false);
      return;
    }
    const from = startYear.current >= FUTURE ? first : startYear.current;
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      // A frame's timestamp can be slightly earlier than `began`, so never step backwards.
      const elapsed = Math.max(0, now - began);
      let next = from + Math.floor(elapsed / STEP_MS);
      // Rest on today, then carry on into the projection.
      if (from < LAST && next > LAST) next = Math.max(LAST, from + Math.floor((elapsed - TODAY_PAUSE_MS) / STEP_MS));
      next = Math.min(FUTURE, next);
      onYear(next);
      if (next >= FUTURE) onPlaying(false);
      else frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, onYear, onPlaying, first]);
  useEffect(() => { if (!playing) startYear.current = year; }, [playing, year]);
  // Switching the range replays it from its first year.
  const restart = (from: number) => {
    onPlaying(false);
    startYear.current = from;
    onFirst(from);
    onYear(from);
    requestAnimationFrame(() => onPlaying(true));
  };

  const i = Math.max(0, YEARS.indexOf(year));
  const t = YEARS.indexOf(LAST);
  const future = year > LAST;
  const back = Math.max(0, i - 1);
  const held = series.held[Math.min(i, t)] ?? 0;
  const gold = future ? series.projected[i] : series.gold[i];
  // The chart zooms to what has played so far, so early ups and downs are visible, and zooms out as the line climbs.
  const maxHeld = Math.max(...series.held.slice(0, Math.min(i, t) + 1).map((h) => h ?? 0), 5) * 1.12;
  const maxGold = Math.max(...series.gold.slice(0, i + 1).map((g) => g ?? 0), ...series.high.slice(0, i + 1).map((g) => g ?? 0), 1) * 1.12;
  const x = (k: number) => (k / (YEARS.length - 1)) * W;
  const yGold = (v: number) => H - 3 - (v / maxGold) * (H - 10);
  const heldY = H - 3 - (held / maxHeld) * (H - 10);
  const goldY = gold ? yGold(gold) : H;
  // The projection drawn so far: the trend line and the band of past five-year runs around it.
  const ahead = YEARS.map((_, k) => k).filter((k) => k >= t && k <= i);
  const line = ahead.map((k, n) => `${n ? "L" : "M"}${x(k).toFixed(1)},${yGold(series.projected[k]!).toFixed(1)}`).join("");
  const band = series.band && ahead.length > 1
    ? ahead.map((k, n) => `${n ? "L" : "M"}${x(k).toFixed(1)},${yGold(series.high[k]!).toFixed(1)}`).join("")
      + [...ahead].reverse().map((k) => `L${x(k).toFixed(1)},${yGold(series.low[k]!).toFixed(1)}`).join("") + "Z"
    : "";
  const todayAt = (t / (YEARS.length - 1)) * 100;
  const { trend } = series;

  return (
    <section className={`timelapse${future ? " is-future" : ""}`} aria-label={`Claims and gold since ${first}, projected to ${FUTURE}`}>
      <div className="tl-intro">
        <h1 className="tl-title">{future ? "Where could it go from here?" : "How has this area performed?"}</h1>
        <p className="tl-hint">
          History to {LAST}, then today&apos;s live gold price grown by the {trend.startYear}–{trend.endYear} trend ({pct(trend.annualGrowthRate ?? 0)} a year) to {FUTURE}. A projection, not a prediction.
        </p>
        <div className="segmented tl-range" role="radiogroup" aria-label="History range">
          <button type="button" role="radio" aria-checked={first === RECENT} onClick={() => restart(RECENT)}>Last 10 years</button>
          <button type="button" role="radio" aria-checked={first === FIRST} onClick={() => restart(FIRST)}>Since {FIRST}</button>
        </div>
        <div className="tl-actions">
          <button type="button" className="button primary" onClick={onExplore}>
            Explore the land <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          {year !== LAST ? <button type="button" className="button secondary" onClick={onNow}>Jump to today</button> : null}
          <button type="button" className="button secondary" onClick={onStory}>How it works</button>
        </div>
      </div>

      <div className="tl-readout" aria-live="off">
        <div>
          <p className="tl-year tabular">{year}</p>
          {future ? <p className="tl-phase">Projection · map shows today</p>
            : year === LAST ? <p className="tl-phase is-today">Today</p>
            : <p className="tl-map-key"><i className="k-staked" /> staked <i className="k-lapsed" /> lapsed <i className="k-heldsq" /> held</p>}
        </div>
        <dl>
          <div>
            <dt>Claims held near Tok{future ? <small> (today)</small> : null}</dt>
            <dd className="tabular">{held.toLocaleString()}</dd>
            {future ? <span className="tl-sub">no claims projection</span> : <Change now={series.held[i]} then={i ? series.held[back] : null} />}
          </div>
          <div>
            <dt>{future ? "Gold, projected" : year === LAST ? "Gold, live spot" : "Gold, yearly average"}</dt>
            <dd className="tabular is-gold">{gold ? usd(gold) : "—"}</dd>
            {future ? <Change now={gold} then={series.gold[t]} money label="vs today" /> : <Change now={series.gold[i]} then={i ? series.gold[back] : null} money />}
            {future && series.band ? <span className="tl-sub tabular">past runs: {usd(series.low[i]!)}–{usd(series.high[i]!)}</span> : null}
          </div>
        </dl>
      </div>

      <div className="tl-track">
        <button type="button" className="icon-button" onClick={() => { startYear.current = first; onYear(first); onPlaying(true); }} aria-label={`Replay from ${first}`}>
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className={`icon-toggle follow-toggle${follow ? " is-on" : ""}`} aria-pressed={follow} onClick={() => onFollow(!follow)}
          title="Follow the action: zoom to where claims are staked and lapse" aria-label="Follow the action">
          <Crosshair className="size-4" aria-hidden="true" />
        </button>
        <div className="tl-chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <rect x={x(t)} y={0} width={W - x(t)} height={H} className="tl-future-bg" />
            {band ? <path d={band} className="tl-band" /> : null}
            <StockLine values={series.gold} upto={Math.min(i, t)} max={maxGold} x={x} className="tl-line is-gold" />
            <StockLine values={series.held} upto={Math.min(i, t)} max={maxHeld} x={x} className="tl-line" />
            {line ? <path d={line} className="tl-projection" vectorEffect="non-scaling-stroke" /> : null}
            <line x1={x(t)} x2={x(t)} y1={0} y2={H} className="tl-today" vectorEffect="non-scaling-stroke" />
            <line x1={x(i)} x2={x(i)} y1={0} y2={H} className="tl-cursor" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className={`tl-today-label${year === LAST ? " is-on" : ""}`} style={{ left: `${todayAt}%` }} aria-hidden="true">Today</span>
          <i className={`tl-dot${future ? " is-gold" : ""}`} style={{ left: `${(i / (YEARS.length - 1)) * 100}%`, top: `${((future ? goldY : heldY) / H) * 100}%` }} aria-hidden="true" />
          <input type="range" min={first} max={FUTURE} step={1} value={year} aria-label="Year"
            aria-valuetext={future ? `${year}: gold projected ${gold ? usd(gold) : "unknown"}` : `${year}: ${held} claims held`}
            onChange={(e) => { onPlaying(false); onYear(Number(e.target.value)); }} />
          <div className="tl-axis tabular" aria-hidden="true">
            <span>{first}</span>
            <span className="tl-legend">
              <i className="k-up" /> up <i className="k-down" /> down · bold: claims held · faint: gold · dashed: gold trend continued
            </span>
            <span>{FUTURE}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
