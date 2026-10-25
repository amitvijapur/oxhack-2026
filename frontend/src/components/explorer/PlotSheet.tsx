"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Check, ExternalLink, Layers3, Maximize2, X } from "lucide-react";
import { ParcelShape } from "./ParcelShape";
import { landRecordsFor } from "@/lib/canonical-model.js";
import { anomalyClass, formatAssayValue, plotReading, plotStatus, usd, type Geochem, type Market, type Plot } from "@/lib/showcase";

const titleCase = (text: string) => text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bLlc\b/g, "LLC");
const KIND_LABELS: Record<string, string> = { active_claim: "Active claim", closed_claim: "Closed claim", state_land: "State land record" };
type LandRecord = { kind: string; id: string; boundaryDistanceMetres?: number; recordedHolder?: string; claimName?: string; ntpstdt?: string; statusCode?: string };
const CLASS_NAMES = ["Below typical", "Above typical", "Top 10% of sites", "Top 2% of sites"] as const;
const FIRST = 1975;
const LAST = 2026;

/** Everything about one plot: where it is, what's in the ground, who holds it, and what land like it costs. */
export function PlotSheet({ plot, index, total, geochem, market, elevation, onPrev, onNext, onClose, onZoom, onBelow, onElements, onDecision }: {
  plot: Plot;
  index: number;
  total: number;
  geochem: Geochem;
  market: Market;
  /** Metres, sampled from the map's terrain once the plot is in view; null until then. */
  elevation: number | null;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  /** Fly into the close, real-ground view of this plot. */
  onZoom: () => void;
  /** Open the 3D block: terrain on top, bedrock and measured elements below. */
  onBelow: () => void;
  onElements: () => void;
  onDecision: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const gold = plotReading(plot, geochem, "Au");
  const status = plotStatus(plot);
  const acres = plot.acres || 160;
  const [lon, lat] = plot.centre;
  const land = useMemo(() => landRecordsFor(plot.samples), [plot.samples]) as { samples: { sampleId: string; checked: boolean; records: LandRecord[] }[]; provenance: { branch: string | null; revision: string; sourceSnapshotAt: string | null } };

  // Rent for a 160-acre state claim by age band (0-5, 6-10, 11+ years), from Arjin's table.
  const rent = market.rent_160ac.filter((r) => r.new !== null).at(-1);
  const age = plot.start ? LAST - plot.start : 0;
  const yearlyRent = rent ? (age >= 11 ? rent.age_11_plus : age >= 6 ? rent.age_6_10 : rent.new) : null;
  const perAcre = market.comparables.map((c) => c.usd_per_acre).sort((a, b) => a - b);
  const ak = market.comparables.filter((c) => c.region === "AK").map((c) => c.usd_per_acre);

  const copy = () => {
    navigator.clipboard?.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  // DNR case files are keyed by number, e.g. "ADL 729279".
  const dnrNumber = plot.kind === "claim" ? plot.id.match(/(\d+)$/)?.[1] : undefined;
  const pos = (year: number) => `${((year - FIRST) / (LAST - FIRST)) * 100}%`;

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
        <button type="button" className="button secondary small" onClick={copy}>{copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />} {copied ? "Copied" : "Coordinates"}</button>
        <a className="button secondary small" href={`https://www.google.com/maps/@${lat},${lon},1500m/data=!3m1!1e3`} target="_blank" rel="noreferrer">Google Maps <ExternalLink className="size-3" aria-hidden="true" /></a>
        {dnrNumber ? (
          <a className="button secondary small" href={`https://dnr.alaska.gov/projects/las/#filetype/ADL/filenumber/${dnrNumber}/landflag/y/searchtype/casefile/reporttype/abstract`} target="_blank" rel="noreferrer">
            DNR record <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="sheet-hero">
        <div>
          <p className="sheet-label">Gold in the sampled sediment</p>
          <p className="sheet-gold tabular">{gold ? formatAssayValue(gold.value, "ppm") : "—"}</p>
          <p className="sheet-sub">{gold ? CLASS_NAMES[anomalyClass(gold.value, geochem.thresholds.Au)] : ""} · {plot.samples.length} sample{plot.samples.length === 1 ? "" : "s"}</p>
        </div>
        <ParcelShape plot={plot} size={112} />
        <div className="sheet-hero-wide">
          <p className="sheet-label">Travels with it</p>
          <p className="sheet-chips">{plot.pathfinders.length ? plot.pathfinders.map((e) => <span key={e} className="mini-chip">{e}</span>) : <span className="sheet-sub">None in the top 10%</span>}</p>
          <button type="button" className="link-button" onClick={onElements}>All {Object.keys(geochem.elements).length} elements</button>
        </div>
      </div>

      <dl className="sheet-grid">
        <div className="wide">
          <dt>Position</dt>
          <dd>
            <span className="tabular">{lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° W</span>
            <button type="button" className="icon-button tiny" onClick={copy} aria-label="Copy coordinates">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</button>
          </dd>
        </div>
        {plot.mtrs_label ? <div className="wide"><dt>Survey</dt><dd>{plot.mtrs_label}</dd></div> : null}
        <div><dt>Elevation</dt><dd className="tabular">{elevation === null ? "…" : `~${Math.round(elevation).toLocaleString()} m`}</dd></div>
        <div><dt>{plot.kind === "claim" ? "Recorded claim size" : "Illustrative square size"}</dt><dd className="tabular">{acres.toLocaleString()} acres</dd></div>
        <div><dt>To Tok</dt><dd className="tabular">{plot.km_to_tok} km</dd></div>
        <div><dt>To a held claim</dt><dd className="tabular">{plot.km_to_held_claim === 0 ? "Is one" : `${plot.km_to_held_claim} km`}</dd></div>
        <div className="wide">
          <dt>Nearest gold site</dt>
          <dd><a href={plot.nearest_gold_site.url} target="_blank" rel="noreferrer">{plot.nearest_gold_site.name.split(";")[0]}</a> ({plot.nearest_gold_site.type.toLowerCase()}), {plot.nearest_gold_site.km} km</dd>
        </div>
        <div className="wide"><dt>Bedrock</dt><dd>{plot.bedrock.join("; ") || "Not mapped"}</dd></div>
        {plot.notes.source ? <div className="wide"><dt>Sampled from</dt><dd>{plot.notes.source}{plot.notes.stream_width_meters ? `, ${plot.notes.stream_width_meters} m stream` : ""}</dd></div> : null}
      </dl>

      <div className="sheet-block">
        <p className="sheet-label">Claim record</p>
        <div className="owner-line" aria-label={plot.kind === "claim" ? `Staked ${plot.start}${status === "lapsed" ? `, lapsed ${plot.end}` : ", held today"}` : "No overlap in the checked state-claim snapshot"}>
          {plot.kind === "claim" && plot.start ? (
            <i className={`owner-span is-${status}`} style={{ left: pos(plot.start), right: `calc(100% - ${pos(status === "lapsed" && plot.end ? plot.end : LAST)})` }} />
          ) : null}
        </div>
        <div className="owner-axis tabular"><span>{FIRST}</span><span>{LAST}</span></div>
        <p className="sheet-sub">
          {status === "held" ? `Held by ${titleCase(plot.owner ?? "")} since ${plot.start}.` : status === "lapsed" ? `Staked ${plot.start}, lapsed ${plot.end}.` : "No overlap in the checked state-claim snapshot. This square is not a legal or cadastral parcel. The overlap check does not establish availability or mineral rights."}
        </p>
      </div>

      {land.samples.length ? (
        <div className="sheet-block">
          <p className="sheet-label">Land records at the sample point{land.samples.length === 1 ? "" : "s"}</p>
          {land.samples.map((sample) => (
            <div key={sample.sampleId} className="land-records">
              <p className="sheet-sub tabular">Sample {sample.sampleId}{sample.checked ? "" : " · not checked"}{sample.records.length ? "" : " · no record in the checked layers"}</p>
              <ul>
                {sample.records.map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <p><span className={`land-kind is-${r.kind}`}>{KIND_LABELS[r.kind] ?? r.kind}</span> <span className="tabular">{r.id}</span>{r.claimName ? ` · ${r.claimName}` : ""}</p>
                    <p className="land-meta">{[r.recordedHolder ? titleCase(r.recordedHolder) : null, r.ntpstdt ? `from ${r.ntpstdt}` : null, r.statusCode ? `status ${r.statusCode}` : null, r.boundaryDistanceMetres !== undefined ? `${r.boundaryDistanceMetres} m to boundary` : null].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="sheet-sub">Recorded layers at the sample point in the {land.provenance.sourceSnapshotAt} snapshot ({land.provenance.branch} @ {land.provenance.revision.slice(0, 7)}). An overlap does not establish who holds the mineral rights or whether an interest is available.</p>
        </div>
      ) : null}

      <div className="sheet-block">
        <p className="sheet-label">Value context</p>
        <dl className="sheet-grid">
          <div><dt>State rent context</dt><dd className="tabular">{yearlyRent ? `${usd(yearlyRent)}/yr` : "—"}</dd></div>
          <div>
            <dt>Comparable deals</dt>
            <dd className="tabular">{usd(perAcre[0])}–{usd(perAcre[perAcre.length - 1])}/acre</dd>
          </div>
        </dl>
        <p className="sheet-sub">
          Reference rent for a 160-acre state claim{plot.start ? ` aged ${age} years` : ""}. Observed gold project deals ran ${Math.round(perAcre[0])}–${Math.round(perAcre[perAcre.length - 1]).toLocaleString()} an acre
          {ak.length ? ` (Alaska: $${ak.map((v) => Math.round(v)).join(", $")})` : ""}. Original project deals are not option resale evidence or a valuation of this area.
        </p>
        <button type="button" className="signal-line small" onClick={onDecision}>
            <span className="signal-word">Test assumptions</span>
            <span>Inspect the canonical option assignment demo</span>
            <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
