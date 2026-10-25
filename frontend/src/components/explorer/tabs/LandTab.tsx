"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { formatAssayValue, plotReading, plotStatus, signedUsd, type Decision, type Geochem, type Plot, type Plots } from "@/lib/showcase";
import { Section, TabBody } from "../TabBody";

export type Sort = "gold" | "id" | "tok";
type Filter = "all" | "held" | "open";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");

/** The plots in the list's current order: shared with the sheet's previous/next buttons. */
export function orderPlots(plots: Plot[], geochem: Geochem, sort: Sort, filter: Filter = "all") {
  const gold = (p: Plot) => plotReading(p, geochem, "Au")?.level ?? -1;
  return plots
    .filter((p) => filter === "all" || (filter === "held" ? plotStatus(p) === "held" : plotStatus(p) === "open"))
    .sort((a, b) => (sort === "gold" ? gold(b) - gold(a) : sort === "tok" ? a.km_to_tok - b.km_to_tok : a.label.localeCompare(b.label)));
}

export function LandTab({ plots, geochem, decision, sort, onSort, hoverId, onHover, onPick, onDecision }: {
  plots: Plots;
  geochem: Geochem;
  decision: Decision;
  sort: Sort;
  onSort: (sort: Sort) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  onDecision: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => orderPlots(plots.plots, geochem, sort, filter), [plots, geochem, sort, filter]);
  const top = Math.max(...plots.plots.map((p) => plotReading(p, geochem, "Au")?.level ?? 0));
  const counts = { held: plots.plots.filter((p) => plotStatus(p) === "held").length, open: plots.plots.filter((p) => plotStatus(p) === "open").length };

  return (
    <TabBody
      evidence={[
        { label: `Plots: the Alaska DNR claim containing each 2016 sample (retrieved ${plots.claims_retrieved}); open plots are drawn 160-acre squares` },
        { label: "Decision engine verdict across all assumption sets", source: decision.source },
      ]}
    >
      <button type="button" className="signal-line" onClick={onDecision}>
        <span className="signal-word">{decision.verdict}</span>
        <span>Today&apos;s signal for the Site B contract · {signedUsd(decision.expected_value_usd)} expected</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <Section
        title={`${plots.plots.length} sampled plots`}
        lede={<>Every square on the map is a 160-acre plot where the state measured the stream sediment. {counts.held} are held claims, {counts.open} are open ground. Pick one to inspect it.</>}
      >
        <div className="list-tools">
          <div className="segmented" role="radiogroup" aria-label="Show">
            {(["all", "held", "open"] as Filter[]).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "held" ? "Held" : "Open"}
              </button>
            ))}
          </div>
          <label className="sort">
            Sort
            <select value={sort} onChange={(e) => onSort(e.target.value as Sort)} aria-label="Sort plots">
              <option value="gold">Most gold</option>
              <option value="id">Plot ID</option>
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
                      {plot.kind === "claim" ? titleCase(plot.name ?? "Claim") : "Open ground"}
                    </span>
                    <span className="plot-row-sub">{status === "held" ? titleCase(plot.owner ?? "") : status === "lapsed" ? `Lapsed ${plot.end ?? ""}` : "No state claim"} · {plot.km_to_tok} km from Tok</span>
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
