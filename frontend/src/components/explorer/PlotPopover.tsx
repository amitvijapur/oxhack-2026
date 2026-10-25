"use client";

import { forwardRef } from "react";
import { ArrowRight, Maximize2, X } from "lucide-react";
import { formatAssayValue, plotReading, plotStatus, type Claim, type Geochem, type Plot } from "@/lib/showcase";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");

/** A quick look at a plot, pinned to it on the map: the map moves it each frame through its ref. */
export const PlotPopover = forwardRef<HTMLDivElement, {
  plot: Plot | null;
  /** Any state claim picked on the map, with the sampled plot it holds, if any. */
  claim?: Claim | null;
  linkedPlot?: Plot | null;
  geochem: Geochem;
  onZoom: () => void;
  onDetails: () => void;
  onClose: () => void;
}>(function PlotPopover({ plot, claim, linkedPlot, geochem, onZoom, onDetails, onClose }, ref) {
  if (claim) {
    const p = claim.properties;
    const held = p.status === "active";
    const dnr = p.id.match(/(\d+)$/)?.[1];
    return (
      <div ref={ref} className="popover-anchor" data-open="true">
        <section className="popover" role="dialog" aria-label={`Claim ${titleCase(p.name)}`}>
          <button type="button" className="icon-button tiny popover-close" onClick={onClose} aria-label="Close"><X className="size-3.5" /></button>
          <p className="popover-kind"><i className={`status-dot is-${held ? "held" : "lapsed"}`} aria-hidden="true" />{held ? "Held state mining claim" : "Lapsed state mining claim"}</p>
          <h2 className="popover-title">{titleCase(p.name)}</h2>
          <dl className="popover-facts">
            <div><dt>{held ? "Held by" : "Was held by"}</dt><dd>{titleCase(p.owner)}</dd></div>
            <div><dt>Staked</dt><dd className="tabular">{p.start ?? "—"}{held ? "" : ` · lapsed ${p.end ?? "—"}`}</dd></div>
            <div><dt>Size</dt><dd className="tabular">{p.acres.toLocaleString()} acres</dd></div>
            <div><dt>Sampled</dt><dd>{linkedPlot ? `Yes: plot ${linkedPlot.label}` : "No 2016 sample inside"}</dd></div>
          </dl>
          <div className="popover-actions">
            <button type="button" className="button secondary small" onClick={onZoom}><Maximize2 className="size-3.5" aria-hidden="true" /> Zoom</button>
            {linkedPlot ? (
              <button type="button" className="button primary small" onClick={onDetails}>Plot {linkedPlot.label} <ArrowRight className="size-3.5" aria-hidden="true" /></button>
            ) : dnr ? (
              <a className="button primary small" href={`https://dnr.alaska.gov/projects/las/#filetype/ADL/filenumber/${dnr}/landflag/y/searchtype/casefile/reporttype/abstract`} target="_blank" rel="noreferrer">DNR record <ArrowRight className="size-3.5" aria-hidden="true" /></a>
            ) : null}
          </div>
        </section>
      </div>
    );
  }
  const gold = plot ? plotReading(plot, geochem, "Au") : null;
  const status = plot ? plotStatus(plot) : "open";
  return (
    <div ref={ref} className="popover-anchor" data-open={plot ? "true" : "false"}>
      {plot ? (
        <section className="popover" role="dialog" aria-label={`Plot ${plot.label}`}>
          <button type="button" className="icon-button tiny popover-close" onClick={onClose} aria-label="Close"><X className="size-3.5" /></button>
          <p className="popover-kind"><i className={`status-dot is-${status}`} aria-hidden="true" />{status === "held" ? "Held claim" : status === "lapsed" ? "Lapsed claim" : "Stream sample, no state claim"}</p>
          <h2 className="popover-title"><span className="tabular">{plot.label}</span> {plot.kind === "claim" ? titleCase(plot.name ?? "") : "No checked claim overlap"}</h2>
          <dl className="popover-facts">
            <div><dt>Gold</dt><dd className="tabular is-gold">{gold ? formatAssayValue(gold.value, "ppm") : "—"}</dd></div>
            <div><dt>{status === "held" ? "Held by" : "Status"}</dt><dd>{status === "held" ? `${titleCase(plot.owner ?? "")} · ${plot.start}` : status === "lapsed" ? `Lapsed ${plot.end}` : "No state claim"}</dd></div>
            <div><dt>To Tok</dt><dd className="tabular">{plot.km_to_tok} km</dd></div>
          </dl>
          <div className="popover-actions">
            <button type="button" className="button secondary small" onClick={onZoom}><Maximize2 className="size-3.5" aria-hidden="true" /> Zoom to plot</button>
            <button type="button" className="button primary small" onClick={onDetails}>Full details <ArrowRight className="size-3.5" aria-hidden="true" /></button>
          </div>
        </section>
      ) : null}
    </div>
  );
});
