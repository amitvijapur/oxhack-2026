"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { ExternalLink, Globe2, MapPinned, RotateCcw, X } from "lucide-react";
import { AREA_LABELS } from "@/lib/copy.js";
import { formatAssay, formatNumber } from "@/lib/evidence.js";
import { LIVE, LandMatchesBridge, LiveBoundary, type LandMatches, type Presence } from "@/lib/live";
import type { Area, AreaKey, AssayPrefix, Bounds, Evidence, Sample } from "@/lib/types";
import type { Stage } from "@/components/globe/GlobeMap";
import { Button } from "@/components/ui/button";
import { Details } from "./Details";
import type { LatestRun } from "@/lib/live";
import type { LandRun } from "./live-types";

const GlobeMap = dynamic(() => import("@/components/globe/GlobeMap"), {
  ssr: false,
  loading: () => <div className="globe-frame" data-map-status="loading" />,
});

export type AreaFilter = "all" | AreaKey;

const STATUS_LABELS: Record<string, string> = {
  quantified: "Quantified",
  above_detection: "Above detection limit",
  below_detection: "Below detection limit",
  not_analyzed: "Not analysed",
};

const ppm = (value: number | null, digits = 3) =>
  typeof value === "number" && Number.isFinite(value) ? `${formatNumber(value, digits)} ppm` : "Not available";

function AreaSummary({ area, landSite, active, onFrame }: {
  area: Area;
  landSite: LandRun["summary"]["sites"]["A"] | null;
  active: boolean;
  onFrame: () => void;
}) {
  const gold = area.measurements.gold_primary;
  const lithium = area.measurements.lithium_secondary;
  const retest = area.measurements.gold_retest;
  const name = AREA_LABELS[area.area] ?? area.name;
  return (
    <article className={`area-card area-${area.area.toLowerCase()}${active ? " is-active" : ""}`}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className="area-swatch" aria-hidden="true" />
          {name} <span className="font-normal text-muted-foreground">({area.area})</span>
        </h3>
        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onFrame} aria-label={`Frame ${name} on map`}>
          Show on map
        </Button>
      </header>
      <dl className="stat-list">
        <div><dt>Typical gold</dt><dd>{ppm(gold.quantified_only.median_ppm)}</dd></div>
        <div><dt>Typical lithium</dt><dd>{ppm(lithium.quantified_only.median_ppm, 1)}</dd></div>
        <div><dt>Samples</dt><dd>{area.sample_count}</dd></div>
        {landSite ? (
          <div><dt>Inside an active claim</dt><dd>{landSite.insideActiveClaim ?? "?"} of {landSite.samples ?? area.sample_count}</dd></div>
        ) : null}
      </dl>
      <Details summary="How these numbers are made">
        <ul className="grid list-disc gap-1 pl-5">
          <li>“Typical” is the median of measured results only: gold n={gold.quantified_only.denominator}, lithium n={lithium.quantified_only.denominator}.</li>
          <li>Gold results beyond the lab’s limits: {gold.counts.above_detection} above, {gold.counts.below_detection} below. They stay out of the median.</li>
          <li>
            Separate gold retests ({retest.method}):{" "}
            {retest.counts.quantified ? `${retest.counts.quantified} measured, median ${ppm(retest.quantified_only.median_ppm)}` : "none measured"};{" "}
            {retest.counts.not_analyzed} not analysed. Retests never replace the first result.
          </li>
          <li>Lab method for gold: {gold.method}. ppm means parts per million.</li>
        </ul>
      </Details>
    </article>
  );
}

function AreaPanel({ areas, area, land, onFrame }: { areas: Area[]; area: AreaFilter; land: LandRun | null; onFrame: (area: AreaKey) => void }) {
  return (
    <div className="panel-body">
      <h2 className="panel-title">Compare the two areas</h2>
      <p className="mb-4 text-sm text-muted-foreground">Select any dot to see that sample.</p>
      <div className="grid gap-3">
        {areas.map((item) => (
          <AreaSummary
            key={item.area}
            area={item}
            active={area === item.area}
            landSite={land?.summary.sites[item.area] ?? null}
            onFrame={() => onFrame(item.area)}
          />
        ))}
      </div>
    </div>
  );
}

function LabRow({ label, properties, prefix }: { label: string; properties: Sample["properties"]; prefix: AssayPrefix }) {
  const raw = properties[`${prefix}_raw`];
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{properties[`${prefix}_method`]}</td>
      <td>{STATUS_LABELS[properties[`${prefix}_status`]] ?? properties[`${prefix}_status`]}</td>
      <td className="font-mono">{raw === "" ? "Blank" : raw ?? "Not provided"}</td>
    </tr>
  );
}

function LandRecords({ matches }: { matches: NonNullable<LandMatches>["matches"] }) {
  return (
    <div className="mt-5">
      <h3 className="answer-subhead">Land today</h3>
      <ul className="grid gap-2 text-sm">
        {matches.map((match, index) => (
          <li key={`${match.contractRecordId ?? match.matchStatus}-${index}`} className="grid">
            <strong>{match.contractRecordId ?? "No record found"}</strong>
            <span className="text-muted-foreground">{match.contractInterestType ?? "Checked layers had no record here"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Records checked {matches[0].contractSnapshotAt ?? "recently"}. They show today’s land, not 2016 ownership.
      </p>
    </div>
  );
}

function SamplePanel({ feature, source, viewers, onClose }: {
  feature: Sample;
  source: Evidence["config"]["source"];
  viewers: number;
  onClose: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const p = feature.properties;
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 1023px)").matches) headingRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [feature.id]);
  return (
    <aside
      className="panel-body sample-drawer"
      aria-labelledby="sample-heading"
      onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{AREA_LABELS[p.area] ?? p.area} ({p.area}) · stream sample</p>
          <h2 id="sample-heading" ref={headingRef} tabIndex={-1} className="panel-title outline-none">{p.sample_id}</h2>
          {viewers > 0 ? <p className="text-xs text-accent-ink">{viewers} other {viewers === 1 ? "person is" : "people are"} looking at this sample</p> : null}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close sample details">
          <X aria-hidden="true" />
        </Button>
      </div>
      <dl className="stat-list">
        <div><dt>Gold</dt><dd>{formatAssay(p, "gold_primary")}</dd></div>
        <div><dt>Gold retest</dt><dd>{formatAssay(p, "gold_retest")}</dd></div>
        <div><dt>Lithium</dt><dd>{formatAssay(p, "lithium_secondary")}</dd></div>
      </dl>
      {LIVE ? (
        <LiveBoundary>
          <LandMatchesBridge sampleKey={feature.id}>
            {(land) => (land && land.matches.length > 0 ? <LandRecords matches={land.matches} /> : null)}
          </LandMatchesBridge>
        </LiveBoundary>
      ) : null}
      <Details summary="Lab details">
        <div className="overflow-x-auto">
          <table className="lab-table">
            <thead>
              <tr><th scope="col">Result</th><th scope="col">Method</th><th scope="col">Status</th><th scope="col">Raw</th></tr>
            </thead>
            <tbody>
              <LabRow label="Gold" properties={p} prefix="gold_primary" />
              <LabRow label="Gold retest" properties={p} prefix="gold_retest" />
              <LabRow label="Lithium" properties={p} prefix="lithium_secondary" />
            </tbody>
          </table>
        </div>
        <dl className="meta-list">
          <div><dt>Longitude, latitude</dt><dd className="font-mono">{feature.geometry.coordinates[0].toFixed(6)}, {feature.geometry.coordinates[1].toFixed(6)}</dd></div>
          <div><dt>Laboratory ID</dt><dd>{p.laboratory_sample_id}</dd></div>
          <div><dt>Batch</dt><dd className="font-mono">{p.batch_number || "Not provided"}</dd></div>
          <div><dt>Source record</dt><dd>{p.source_id} · row {p.source_csv_record_number}</dd></div>
        </dl>
        <a className="mt-3 inline-flex items-center gap-1 text-foreground underline underline-offset-4" href={source.publication_url} target="_blank" rel="noreferrer">
          Alaska DGGS source <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </Details>
    </aside>
  );
}

export function MapSection(props: {
  evidence: Evidence;
  features: Sample[];
  bounds: Bounds;
  frame: number;
  area: AreaFilter;
  stage: Stage;
  selected: Sample | null;
  land: LatestRun | null;
  presence: Presence;
  onStage: (stage: Stage) => void;
  onArea: (area: AreaFilter) => void;
  onReset: () => void;
  onSelect: (feature: Sample) => void;
  onClose: () => void;
}) {
  const { evidence, features, bounds, frame, area, stage, selected, presence, onStage, onArea, onReset, onSelect, onClose } = props;
  const shellRef = useRef<HTMLDivElement>(null);
  const { config } = evidence;
  const land = props.land as LandRun | null;
  const options: { key: AreaFilter; label: string }[] = [
    { key: "all", label: "All" },
    ...config.areas.map((a) => ({ key: a.area, label: `${AREA_LABELS[a.area] ?? a.name} (${a.area})` })),
  ];
  const medians = useMemo(
    () => Object.fromEntries(config.areas.map((a) => [a.area, a.measurements.gold_primary.quantified_only.median_ppm])),
    [config],
  );
  const center = config.overview.map_view_center;
  const beacon = useMemo<[number, number]>(() => [center.longitude, center.latitude], [center]);

  // Scrolling the map into view is the cue to descend from the globe to Tok.
  useEffect(() => {
    const el = shellRef.current;
    if (!el || stage === "tok") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.6) onStage("tok");
    }, { threshold: [0.6] });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage, onStage]);

  return (
    <section className="section" id="map" aria-labelledby="map-heading">
      <div className="section-head">
        <h2 id="map-heading">Where the samples were taken</h2>
        <p>{config.overview.sample_count} stream samples, Tok River, eastern Alaska.</p>
      </div>
      <div className="map-shell" ref={shellRef}>
        <div className="map-toolbar">
          <div className="segmented" role="group" aria-label="Filter and frame sampling area">
            {options.map((option) => (
              <button type="button" key={option.key} aria-pressed={area === option.key} onClick={() => onArea(option.key)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => onStage(stage === "tok" ? "globe" : "tok")}>
              {stage === "tok" ? <Globe2 aria-hidden="true" /> : <MapPinned aria-hidden="true" />}
              {stage === "tok" ? "Back to globe" : "Fly to Tok"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw aria-hidden="true" />Reset view
            </Button>
          </div>
        </div>
        <GlobeMap
          stage={stage}
          features={features}
          bounds={bounds}
          frame={frame}
          selectedId={selected?.id ?? null}
          medians={medians}
          viewerFocus={presence.focus}
          beacon={beacon}
          beaconLabel="Tok, Alaska"
          onSelect={onSelect}
          onArrive={() => {}}
        />
        <div className="map-legend">
          <span><span className="legend-dot area-a" aria-hidden="true" />Tok west (A)</span>
          <span><span className="legend-dot area-b" aria-hidden="true" />Tok east (B)</span>
          <span className="text-muted-foreground">Dots are sample points, not gold deposits.</span>
        </div>
        <div className="map-panel">
          {selected ? (
            <SamplePanel feature={selected} source={config.source} viewers={presence.focus.get(selected.id) ?? 0} onClose={onClose} />
          ) : (
            <AreaPanel areas={config.areas} area={area} land={land} onFrame={onArea} />
          )}
        </div>
      </div>
    </section>
  );
}
