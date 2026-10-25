"use client";

import { ChevronLeft, ChevronRight, ExternalLink, Layers3, Maximize2, X } from "lucide-react";
import { anomalyClass, formatAssayValue, plotReading, plotStatus, usd, type Geochem, type Market, type Plot } from "@/lib/showcase";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");
const CLASS_NAMES = ["Below typical", "Above typical", "Top 10% of sites", "Top 2% of sites"] as const;

/** One plot, cut to what the call needs: its gold, who holds it, how far it is from Tok, what comparable deals paid, and a way to test it. */
export function PlotSheet({ plot, index, total, geochem, market, onPrev, onNext, onClose, onZoom, onBelow, onDecide }: {
  plot: Plot;
  index: number;
  total: number;
  geochem: Geochem;
  market: Market;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  /** Fly into the close, real-ground view of this plot. */
  onZoom: () => void;
  /** Open the 3D block: terrain on top, bedrock and measured elements below. */
  onBelow: () => void;
  onDecide: () => void;
}) {
  const gold = plotReading(plot, geochem, "Au");
  const status = plotStatus(plot);
  const acres = plot.acres || 160;
  const perAcre = market.comparables.map((c) => c.usd_per_acre).sort((a, b) => a - b);
  const ak = market.comparables.filter((c) => c.region === "AK").map((c) => c.usd_per_acre);
  // DNR case files are keyed by number, e.g. "ADL 729279".
  const dnrNumber = plot.kind === "claim" ? plot.id.match(/(\d+)$/)?.[1] : undefined;

  return (
    <section className="sheet" aria-label={`Plot ${plot.label}`}>
      <header className="sheet-head">
        <div>
          <p className="sheet-kind"><i className={`status-dot is-${status}`} aria-hidden="true" />{status === "held" ? "Held mining claim" : status === "lapsed" ? "Lapsed mining claim" : "Illustrative sample square"} · Site {plot.site}</p>
          <h2 className="sheet-title"><span className="tabular">{plot.label}</span> {plot.kind === "claim" ? titleCase(plot.name ?? "") : `${acres.toLocaleString()}-acre sample square`}</h2>
        </div>
        <div className="sheet-nav">
          <button type="button" className="icon-button" onClick={onPrev} aria-label="Previous plot"><ChevronLeft className="size-4" /></button>
          <span className="tabular">{index + 1}/{total}</span>
          <button type="button" className="icon-button" onClick={onNext} aria-label="Next plot"><ChevronRight className="size-4" /></button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close plot"><X className="size-4" /></button>
        </div>
      </header>

      <button type="button" className="button primary wide below-button" onClick={onBelow}>
        <Layers3 className="size-4" aria-hidden="true" /> Terrain and samples in 3D
      </button>
      <div className="sheet-actions">
        <button type="button" className="button secondary small" onClick={onZoom}><Maximize2 className="size-3.5" aria-hidden="true" /> Zoom to plot</button>
      </div>

      <div className="sheet-hero">
        <div>
          <p className="sheet-label">Gold in the sampled sediment</p>
          <p className="sheet-gold tabular">{gold ? formatAssayValue(gold.value, "ppm") : "—"}</p>
          <p className="sheet-sub">{gold ? CLASS_NAMES[anomalyClass(gold.value, geochem.thresholds.Au)] : ""} · {plot.samples.length} sample{plot.samples.length === 1 ? "" : "s"}</p>
        </div>
        <div>
          <p className="sheet-label">To Tok</p>
          <p className="sheet-value tabular">{plot.km_to_tok} km</p>
        </div>
      </div>

      <div className="sheet-block">
        <p className="sheet-label">Claim</p>
        <p className="sheet-value-sm">
          {status === "held" ? `Held by ${titleCase(plot.owner ?? "")} since ${plot.start}.` : status === "lapsed" ? `Staked ${plot.start}, lapsed ${plot.end}.` : "No overlap in the checked state-claim snapshot."}
        </p>
        {status === "open" ? <p className="sheet-sub">This square is not a legal or cadastral parcel. The overlap check does not establish availability or mineral rights.</p> : null}
        {dnrNumber ? (
          <a className="link-button" href={`https://dnr.alaska.gov/projects/las/#filetype/ADL/filenumber/${dnrNumber}/landflag/y/searchtype/casefile/reporttype/abstract`} target="_blank" rel="noreferrer">
            DNR record <ExternalLink className="inline size-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="sheet-block">
        <p className="sheet-label">Comparable deals</p>
        <p className="sheet-value-sm tabular">{usd(perAcre[0])}–{usd(perAcre[perAcre.length - 1])}/acre</p>
        <p className="sheet-sub">
          Observed gold project deals{ak.length ? ` (Alaska: $${ak.map((v) => Math.round(v)).join(", $")} an acre)` : ""}. Original project deals are not option resale evidence or a valuation of this area.
        </p>
        <button type="button" className="signal-line small" onClick={onDecide}>
          <span className="signal-word">Site {plot.site}</span>
          <span>Test this plot in Decide</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
