"use client";

import { useState } from "react";

// Small hand-drawn SVG charts for the deep dives: no chart library, gold as the only accent.

const W = 480;

/** One series over years, with a cursor at the selected year. Gaps (null) break the line.
 *  Hovering shows a crosshair with the exact value and what it means; `onHover` lets sibling
 *  charts share the same hovered year. */
export function YearLine({ years, values, year, label, format, accent = false, height = 64, hint, hover, onHover }: {
  years: number[];
  values: (number | null)[];
  year?: number;
  label: string;
  format: (value: number) => string;
  accent?: boolean;
  height?: number;
  /** One line on what the series means, shown in the hover tooltip. */
  hint?: string;
  hover?: number | null;
  onHover?: (year: number | null) => void;
}) {
  const known = values.filter((v): v is number => v !== null);
  const max = Math.max(...known, 1);
  const x = (i: number) => (i / Math.max(1, years.length - 1)) * W;
  const y = (v: number) => height - 4 - (v / max) * (height - 12);
  const path = values.map((v, i) => (v === null ? "" : `${i === 0 || values[i - 1] === null ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)).join("");
  const at = year === undefined ? -1 : years.indexOf(year);
  const now = at >= 0 ? values[at] : null;
  // Every chart shows the shared crosshair; only the one under the pointer shows the tooltip.
  const [inside, setInside] = useState(false);
  const h = hover === undefined || hover === null ? -1 : years.indexOf(hover);
  const hv = h >= 0 ? values[h] : null;
  const prev = h > 0 ? values[h - 1] : null;
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const k = Math.round(((event.clientX - box.left) / box.width) * (years.length - 1));
    onHover?.(years[Math.max(0, Math.min(years.length - 1, k))]);
  };
  return (
    <figure className="mini-chart">
      <figcaption>
        <span>{label}</span>
        <strong className="tabular">{now === null || now === undefined ? (at >= 0 ? "no data" : "") : format(now)}</strong>
      </figcaption>
      <div className="mini-plot">
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label}, ${years[0]} to ${years[years.length - 1]}`}
          onPointerMove={onHover ? (e) => { setInside(true); move(e); } : undefined}
          onPointerLeave={onHover ? () => { setInside(false); onHover(null); } : undefined}>
          <path d={path} className={accent ? "line-gold" : "line-ink"} vectorEffect="non-scaling-stroke" />
          {at >= 0 ? <line x1={x(at)} x2={x(at)} y1={0} y2={height} className="line-cursor" vectorEffect="non-scaling-stroke" /> : null}
          {h >= 0 ? <line x1={x(h)} x2={x(h)} y1={0} y2={height} className="line-hover" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        {h >= 0 ? (
          <span className="mini-dot" style={{ left: `${(h / Math.max(1, years.length - 1)) * 100}%`, top: hv === null ? "50%" : `${(y(hv) / height) * 100}%`, opacity: hv === null ? 0 : 1 }} aria-hidden="true" />
        ) : null}
        {h >= 0 && inside ? (
          <span className="mini-tip" role="tooltip" style={{ left: `${Math.min(80, Math.max(20, (h / Math.max(1, years.length - 1)) * 100))}%` }}>
            <strong className="tabular">{years[h]} · {hv === null ? "no data" : format(hv)}</strong>
            {hv !== null && prev !== null && prev !== undefined && prev !== 0 ? (
              <span className={hv >= prev ? "is-up" : "is-down"}>{hv >= prev ? "▲" : "▼"} {Math.abs(((hv - prev) / prev) * 100).toFixed(0)}% on the year before</span>
            ) : null}
            {hint ? <em>{hint}</em> : null}
          </span>
        ) : null}
      </div>
    </figure>
  );
}

export function YearAxis({ years }: { years: number[] }) {
  return (
    <div className="mini-axis tabular" aria-hidden="true">
      <span>{years[0]}</span><span>{years[Math.floor(years.length / 2)]}</span><span>{years[years.length - 1]}</span>
    </div>
  );
}

/** A horizontal bar out of a total, with the highlighted part in gold. */
export function Bar({ label, value, total, highlight = 0, note }: { label: string; value: number; total: number; highlight?: number; note?: string }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track" aria-hidden="true">
        <span className="bar-fill" style={{ width: `${(value / Math.max(total, 1)) * 100}%` }} />
        <span className="bar-hi" style={{ width: `${(highlight / Math.max(total, 1)) * 100}%` }} />
      </span>
      <span className="bar-value tabular">{note ?? value}</span>
    </div>
  );
}
