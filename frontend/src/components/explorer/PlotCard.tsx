"use client";

import { X } from "lucide-react";
import { formatAssayValue, plotReading, type Geochem, type Plot } from "@/lib/showcase";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");

/** The selected land plot: whose it is, since when, and what the lab found in it. */
export function PlotCard({ plot, geochem, onClose }: { plot: Plot; geochem: Geochem; onClose: () => void }) {
  const gold = plotReading(plot, geochem, "Au");
  const held = plot.kind === "claim" && plot.status === "active";
  return (
    <section className="plot-card" aria-label="Selected plot" role="status">
      <button type="button" className="icon-button" onClick={onClose} aria-label="Close plot"><X className="size-4" /></button>
      <p className="plot-kind">{plot.kind === "claim" ? `Mining claim · ${held ? "held" : "lapsed"}` : "Open ground"}</p>
      <h2 className="plot-name">{plot.kind === "claim" ? titleCase(plot.name ?? "Unnamed claim") : "Unclaimed plot"}</h2>
      <dl className="plot-facts">
        <div><dt>Gold</dt><dd className="tabular">{gold ? formatAssayValue(gold.value, "ppm") : "—"}</dd></div>
        <div>
          <dt>{held ? "Held by" : plot.kind === "claim" ? "Lapsed" : "Status"}</dt>
          <dd>{held ? `${titleCase(plot.owner ?? "")} since ${plot.start}` : plot.kind === "claim" ? `${plot.end ?? "—"}` : "No state claim on record"}</dd>
        </div>
        <div><dt>Samples</dt><dd className="tabular">{plot.samples.join(", ")}</dd></div>
      </dl>
    </section>
  );
}
