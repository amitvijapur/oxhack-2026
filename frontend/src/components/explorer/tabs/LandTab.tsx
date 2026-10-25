"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { formatAssayValue, plotReading, plotStatus, type Geochem, type Plot, type Plots } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";

export type Sort = "gold" | "tok";
type Filter = "all" | "held";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");

/** The plots in the list's current order: shared with the sheet's previous/next buttons. */
export function orderPlots(plots: Plot[], geochem: Geochem, sort: Sort, filter: Filter = "all") {
  const gold = (p: Plot) => plotReading(p, geochem, "Au")?.level ?? -1;
  return plots
    .filter((p) => filter === "all" || plotStatus(p) === "held")
    .sort((a, b) => (sort === "gold" ? gold(b) - gold(a) : a.km_to_tok - b.km_to_tok));
}

export function LandTab({ plots, geochem, sort, onSort, hoverId, onHover, onPick }: {
  plots: Plots;
  geochem: Geochem;
  sort: Sort;
  onSort: (sort: Sort) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => orderPlots(plots.plots, geochem, sort, filter), [plots, geochem, sort, filter]);
  const top = Math.max(...plots.plots.map((p) => plotReading(p, geochem, "Au")?.level ?? 0));

  return (
    <TabBody
      evidence={[
        { label: `Checked Alaska DNR claim snapshot retrieved ${plots.claims_retrieved}` },
        { label: plots.open_plot_note },
      ]}
    >
      <Section
        title={`${plots.plots.length} sampled areas`}
        lede={<>Each sample glows on the map, brighter where gold runs higher, inside the outline of the checked claim that holds it. Pick one to inspect its context.</>}
      >
        <div className="list-tools">
          <div className="segmented" role="radiogroup" aria-label="Show">
            {(["all", "held"] as Filter[]).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : "Held"}
              </button>
            ))}
          </div>
          <label className="sort">
            Sort
            <select value={sort} onChange={(e) => onSort(e.target.value as Sort)} aria-label="Sort plots">
              <option value="gold">Most gold</option>
              <option value="tok">Nearest Tok</option>
            </select>
          </label>
        </div>
        <ol className="plot-list" aria-label="Plots">
          {rows.map((plot) => {
            const gold = plotReading(plot, geochem, "Au");
            const status = plotStatus(plot);
            return (
              <li key={plot.id}>
                <button
                  type="button"
                  data-hover={hoverId === plot.id || undefined}
                  onMouseEnter={() => onHover(plot.id)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(plot.id)}
                  onBlur={() => onHover(null)}
                  onClick={() => onPick(`plot:${plot.id}`)}
                >
                  <span className="plot-id tabular">{plot.label}</span>
                  <span className="plot-row-main">
                    <span className="plot-row-name">
                      <i className={`status-dot is-${status}`} aria-hidden="true" />
                      {plot.kind === "claim" ? titleCase(plot.name ?? "Claim") : "Stream sample, no claim"}
                    </span>
                    <span className="plot-row-sub">{status === "held" ? titleCase(plot.owner ?? "") : status === "lapsed" ? `Lapsed ${plot.end ?? ""}` : "No checked overlap"} · {plot.km_to_tok} km from Tok</span>
                  </span>
                  <span className="plot-row-gold">
                    <span className="tabular">{gold ? formatAssayValue(gold.value, "").trim() : "—"}</span>
                    <span className="gold-bar" aria-hidden="true"><i style={{ width: `${Math.max(4, (Math.log10(Math.max(gold?.level ?? 0.001, 0.001) / 0.001) / Math.log10(top / 0.001)) * 100)}%` }} data-class={gold?.k ?? 0} /></span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="note">Gold in parts per million (ppm) from the 2016 state survey; bars are on a log scale. ↑ ↓ move through the list.</p>
      </Section>

      <a className="credit" href="https://26.oxhack.net/" target="_blank" rel="noreferrer">
        <Image src="/brand/oxhack-logo.webp" alt="OxHack" width={28} height={28} />
        Built at OxHack 26 for the TIME theme
      </a>
    </TabBody>
  );
}
