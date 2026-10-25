"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Layers3, Maximize2 } from "lucide-react";
import { anomalyClass, formatAssayValue, plotReading, plotStatus, usd, type Geochem, type Market, type Plot } from "@/lib/showcase";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");
const CLASS_NAMES = ["Below typical", "Above typical", "Top 10% of sites", "Top 2% of sites"] as const;

/** The selected plot stays beside the complete overview. */
export function PlotSheet({ plot, index, total, geochem, market, onPrev, onNext, onZoom, onBelow, onDecide }: {
  plot: Plot;
  index: number;
  total: number;
  geochem: Geochem;
  market: Market;
  onPrev: () => void;
  onNext: () => void;
  onZoom: () => void;
  onBelow: () => void;
  onDecide: () => void;
}) {
  const gold = plotReading(plot, geochem, "Au");
  const status = plotStatus(plot);
  const perAcre = market.comparables.map((c) => c.usd_per_acre).filter(Number.isFinite).sort((a, b) => a - b);
  const dnrNumber = plot.kind === "claim" ? plot.id.match(/(\d+)$/)?.[1] : undefined;

  return (
    <section className="plot-detail" aria-label={`Plot ${plot.label}`}>
      <header className="plot-detail-head">
        <div><h2><span className="tabular">{plot.label}</span> {plot.kind === "claim" ? titleCase(plot.name ?? "Claim") : "Sample square"}</h2><p><i className={`status-dot is-${status}`} aria-hidden="true" />{status === "held" ? "Held mining claim" : status === "lapsed" ? "Lapsed mining claim" : "Illustrative square"} · Site {plot.site}</p></div>
        <div className="plot-stepper">
          <button type="button" className="icon-button" onClick={onPrev} aria-label="Previous plot" disabled={total < 2}><ChevronLeft className="size-4" /></button>
          <span className="tabular">{index + 1}/{total}</span>
          <button type="button" className="icon-button" onClick={onNext} aria-label="Next plot" disabled={total < 2}><ChevronRight className="size-4" /></button>
        </div>
      </header>
      <dl className="plot-facts">
        <div><dt>Gold in sediment</dt><dd className="plot-assay tabular">{gold ? formatAssayValue(gold.value, "ppm") : "Not available"}</dd><small>{gold ? CLASS_NAMES[anomalyClass(gold.value, geochem.thresholds.Au)] : "Unknown"} · {plot.samples.length} sample{plot.samples.length === 1 ? "" : "s"}</small></div>
        <div><dt>To Tok</dt><dd className="tabular">{plot.km_to_tok} km</dd></div>
      </dl>
      <p className="plot-ownership">{status === "held" ? `Held by ${titleCase(plot.owner ?? "Unknown owner")} since ${plot.start ?? "an unknown date"}.` : status === "lapsed" ? `Staked ${plot.start ?? "date unknown"}; lapsed ${plot.end ?? "date unknown"}.` : "No checked claim overlap. This square is not a legal parcel or evidence of available mineral rights."}</p>
      <p className="plot-limit">Sediment evidence, not recoverable ounces or a land valuation.</p>
      <button type="button" className="button primary plot-decide" onClick={onDecide}>Test this plot in Decide<ChevronRight className="size-4" aria-hidden="true" /></button>
      <div className="plot-actions">
        <button type="button" aria-label="Terrain and samples in 3D" onClick={onBelow}><Layers3 className="size-4" aria-hidden="true" />Terrain in 3D</button>
        <button type="button" onClick={onZoom}><Maximize2 className="size-4" aria-hidden="true" />View on map</button>
        {dnrNumber ? <a href={`https://dnr.alaska.gov/projects/las/#filetype/ADL/filenumber/${dnrNumber}/landflag/y/searchtype/casefile/reporttype/abstract`} target="_blank" rel="noreferrer">DNR record<ExternalLink className="size-3" aria-hidden="true" /></a> : null}
      </div>
      <details className="plot-context">
        <summary>Comparable deals</summary>
        <p>{perAcre.length ? <><span className="tabular">{usd(perAcre[0])}–{usd(perAcre.at(-1)!)}/acre</span>. </> : "No comparable values supplied. "}Original gold-project deals are not option resale evidence or a valuation of this area.</p>
      </details>
    </section>
  );
}
