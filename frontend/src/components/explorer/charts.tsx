"use client";

// Small hand-drawn SVG charts for the deep dives: no chart library, gold as the only accent.

const W = 480;

/** One series over years, with a cursor at the selected year. Gaps (null) break the line. */
export function YearLine({ years, values, year, label, format, accent = false, height = 64 }: {
  years: number[];
  values: (number | null)[];
  year?: number;
  label: string;
  format: (value: number) => string;
  accent?: boolean;
  height?: number;
}) {
  const known = values.filter((v): v is number => v !== null);
  const max = Math.max(...known, 1);
  const x = (i: number) => (i / Math.max(1, years.length - 1)) * W;
  const y = (v: number) => height - 4 - (v / max) * (height - 12);
  const path = values.map((v, i) => (v === null ? "" : `${i === 0 || values[i - 1] === null ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)).join("");
  const at = year === undefined ? -1 : years.indexOf(year);
  const now = at >= 0 ? values[at] : null;
  return (
    <figure className="mini-chart">
      <figcaption>
        <span>{label}</span>
        <strong className="tabular">{now === null || now === undefined ? (at >= 0 ? "no data" : "") : format(now)}</strong>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label}, ${years[0]} to ${years[years.length - 1]}`}>
        <path d={path} className={accent ? "line-gold" : "line-ink"} vectorEffect="non-scaling-stroke" />
        {at >= 0 ? <line x1={x(at)} x2={x(at)} y1={0} y2={height} className="line-cursor" vectorEffect="non-scaling-stroke" /> : null}
      </svg>
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

/** Values on a log scale, as dots, with optional labelled markers (e.g. what entry costs). */
export function LogStrip({ groups, markers, min, max, format }: {
  groups: { label: string; values: number[]; accent?: boolean }[];
  markers: { label: string; value: number }[];
  min: number;
  max: number;
  format: (value: number) => string;
}) {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  const pos = (v: number) => `${((Math.log10(Math.max(min, Math.min(max, v))) - lo) / (hi - lo)) * 100}%`;
  const ticks = [];
  for (let p = Math.ceil(lo); p <= Math.floor(hi); p++) ticks.push(10 ** p);
  return (
    <div className="log-strip">
      {groups.map((g) => (
        <div key={g.label} className="log-row">
          <span className="log-label">{g.label}</span>
          <div className="log-track">
            {g.values.map((v, i) => (
              <i key={i} className={g.accent ? "log-dot is-gold" : "log-dot"} style={{ left: pos(v) }} title={format(v)} />
            ))}
          </div>
        </div>
      ))}
      <div className="log-row">
        <span className="log-label" />
        <div className="log-track is-axis">
          {markers.map((m) => (
            <span key={m.label} className="log-marker" style={{ left: pos(m.value) }}>
              <span className="log-marker-label">{m.label}</span>
            </span>
          ))}
          {ticks.map((t) => <span key={t} className="log-tick tabular" style={{ left: pos(t) }}>{format(t)}</span>)}
        </div>
      </div>
    </div>
  );
}
