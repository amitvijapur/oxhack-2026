"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { claimState, usd, type Claims, type History } from "@/lib/showcase";
import { Panel } from "./Panel";

const FIRST = 1975;
const LAST = 2026;
const YEARS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);
const STEP_MS = 260;

export function Land({ claims, history, year, onYear, tour, onNext }: {
  claims: Claims;
  history: History;
  year: number;
  onYear: (year: number) => void;
  tour: boolean;
  onNext: () => void;
}) {
  const [playing, setPlaying] = useState(tour);

  // Claims held near Tok each year, from the DNR outlines; gold price per year from Arjin's table.
  const held = useMemo(() => YEARS.map((y) => claims.features.filter((f) => claimState(f.properties, y) === "active").length), [claims]);
  const gold = useMemo(() => {
    const byYear = new Map(history.rows.map((r) => [Number(r.year), Number(r.gold_usd_per_oz_mean)]));
    return YEARS.map((y) => byYear.get(y) ?? null);
  }, [history]);
  const i = YEARS.indexOf(year);

  useEffect(() => {
    if (tour) onYear(FIRST);
  }, [tour, onYear]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const next = year + 1;
      if (next > LAST) { setPlaying(false); return; }
      onYear(next);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [playing, year, onYear]);

  const play = () => {
    if (!playing && year >= LAST) onYear(FIRST);
    setPlaying(!playing);
  };

  return (
    <>
      <Panel
        step={2}
        mode="State records"
        title="Who already owns it?"
        lede="Every shape is a real state mining claim: gold while someone holds it, faint once it lapses. Drag through time. The rushes here don't simply follow the gold price, so price alone can't tell us when to buy."
        next={{ label: "What would the town think?", onClick: onNext }}
        evidence={[
          { label: `Alaska DNR state mining claims, retrieved ${claims.retrieved}`, href: claims.source },
          { label: "Gold price by year (World Bank monthly averages)", source: history.source },
          { label: "Across Alaska, yearly claim changes and gold changes correlate at only 0.19 (1991–2025)" },
        ]}
      >
        <dl className="stat-row">
          <div><dt>Year</dt><dd className="tabular">{year}</dd></div>
          <div><dt>Claims held</dt><dd className="tabular">{held[i] ?? "—"}</dd></div>
          <div><dt>Gold that year</dt><dd className="tabular">{gold[i] ? usd(gold[i]!) : "—"}</dd></div>
        </dl>
      </Panel>
      <Scrubber year={year} onYear={(y) => { setPlaying(false); onYear(y); }} held={held} gold={gold} playing={playing} onPlay={play} />
    </>
  );
}

function Scrubber({ year, onYear, held, gold, playing, onPlay }: {
  year: number; onYear: (year: number) => void; held: number[]; gold: (number | null)[]; playing: boolean; onPlay: () => void;
}) {
  const W = 600;
  const H = 64;
  const x = (k: number) => (k / (YEARS.length - 1)) * W;
  const maxHeld = Math.max(...held, 1);
  const maxGold = Math.max(...gold.map((g) => g ?? 0), 1);
  const goldPath = gold.map((g, k) => (g === null ? "" : `${k === 0 || gold[k - 1] === null ? "M" : "L"}${x(k).toFixed(1)},${(H - (g / maxGold) * (H - 6)).toFixed(1)}`)).join("");
  const heldPath = `M0,${H}` + held.map((h, k) => `L${x(k).toFixed(1)},${(H - (h / maxHeld) * (H - 6)).toFixed(1)}`).join("") + `L${W},${H}Z`;
  const k = YEARS.indexOf(year);

  return (
    <div className="scrubber">
      <button type="button" className="round-button" onClick={onPlay} aria-label={playing ? "Pause" : "Play through the years"}>
        {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
      </button>
      <div className="scrubber-track">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={heldPath} className="scrub-held" />
          <path d={goldPath} className="scrub-gold" vectorEffect="non-scaling-stroke" />
          <line x1={x(k)} x2={x(k)} y1={0} y2={H} className="scrub-now" vectorEffect="non-scaling-stroke" />
        </svg>
        <input
          type="range"
          min={FIRST}
          max={LAST}
          step={1}
          value={year}
          onChange={(e) => onYear(Number(e.target.value))}
          aria-label="Year"
          aria-valuetext={`${year}: ${held[k]} claims held`}
        />
        <div className="scrubber-axis tabular" aria-hidden="true">
          <span>{FIRST}</span>
          <span className="scrub-legend"><i className="key-gold" /> gold price <i className="key-held" /> claims held near Tok</span>
          <span>{LAST}</span>
        </div>
      </div>
    </div>
  );
}
