"use client";

import Image from "next/image";
import { formatAssayValue, plotReading, plotStatus, type Geochem, type Plot, type Plots } from "@/lib/showcase";

export type Sort = "gold" | "tok";
export type Filter = "all" | "held";

/** Shared visible order for the grid, selected details and previous/next. */
export function orderPlots(plots: Plot[], geochem: Geochem, sort: Sort, filter: Filter = "all") {
  const gold = (p: Plot) => plotReading(p, geochem, "Au")?.level ?? -1;
  return plots
    .filter((p) => filter === "all" || plotStatus(p) === "held")
    .sort((a, b) => (sort === "gold" ? gold(b) - gold(a) : a.km_to_tok - b.km_to_tok));
}

export function LandTab({ plots, geochem, rows, selected, sort, onSort, filter, onFilter, hoverId, onHover, onPick, children }: {
  plots: Plots;
  geochem: Geochem;
  rows: Plot[];
  selected: Plot | null;
  sort: Sort;
  onSort: (sort: Sort) => void;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="land-overview">
      <div className="land-layout">
        <section className="land-picker" aria-label="Sampled areas">
          <div className="land-heading"><h3>{rows.length} sampled areas</h3><span>Gold in sediment</span></div>
          <div className="list-tools">
            <div className="segmented" role="radiogroup" aria-label="Show">
              {(["all", "held"] as Filter[]).map((f) => (
                <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => onFilter(f)}>{f === "all" ? "All" : "Held"}</button>
              ))}
            </div>
            <label className="sort">
              <span className="sr-only">Sort plots</span>
              <select value={sort} onChange={(e) => onSort(e.target.value as Sort)} aria-label="Sort plots">
                <option value="gold">Most gold</option>
                <option value="tok">Nearest Tok</option>
              </select>
            </label>
          </div>
          {rows.length ? <ol className="plot-grid" aria-label="Plots">
            {rows.map((plot) => {
              const gold = plotReading(plot, geochem, "Au");
              const status = plotStatus(plot);
              const description = `${plot.label}: ${gold ? formatAssayValue(gold.value, "ppm") : "gold unavailable"}, ${status === "open" ? "illustrative square, no checked claim overlap" : `${status} claim`}`;
              return <li key={plot.id}><button
                type="button"
                className="plot-tile"
                aria-label={description}
                aria-pressed={selected?.id === plot.id}
                data-gold={gold?.k ?? "unknown"}
                data-hover={hoverId === plot.id || undefined}
                title={description}
                onMouseEnter={() => onHover(plot.id)} onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(plot.id)} onBlur={() => onHover(null)}
                onClick={() => onPick(`plot:${plot.id}`)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  event.stopPropagation();
                  const buttons = Array.from(event.currentTarget.closest(".plot-grid")!.querySelectorAll<HTMLButtonElement>("button"));
                  const current = buttons.indexOf(event.currentTarget);
                  const columns = getComputedStyle(event.currentTarget.closest(".plot-grid")!).gridTemplateColumns.split(" ").length;
                  const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : columns;
                  const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + offset));
                  buttons[next].focus();
                  buttons[next].click();
                }}
              ><span className="tabular">{plot.label}</span></button></li>;
            })}
          </ol> : <div className="land-empty" role="status"><p>No held claims in this set.</p><button type="button" className="link-button" onClick={() => onFilter("all")}>Show all sampled areas</button></div>}
          <p className="land-legend"><span className="land-legend-swatches" aria-hidden="true"><i /><i /><i /><i /></span>Stronger gold reading<span className="land-keyboard"> · Arrow keys select</span></p>
        </section>
        {children}
      </div>
      <footer className="land-footer">
        <details className="land-sources">
          <summary>Sources &amp; context</summary>
          <div><p>Gold: 2016 state stream-sediment survey. Readings are not recoverable gold or a land valuation.</p><p>Alaska DNR claim snapshot retrieved {plots.claims_retrieved}. {plots.open_plot_note}</p></div>
        </details>
        <a className="land-credit" href="https://26.oxhack.net/" target="_blank" rel="noreferrer"><Image src="/brand/oxhack-logo.webp" alt="OxHack" width={18} height={18} /><span>OxHack 26</span></a>
      </footer>
    </div>
  );
}
