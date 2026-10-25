"use client";

import { X } from "lucide-react";
import { formatAssay, formatNumber } from "@/lib/evidence.js";
import type { Evidence } from "@/lib/types";
import type { Geochem, Geology, Occurrences } from "@/lib/showcase";
import { Panel } from "./Panel";
import { GeochemDeep } from "./deep/Geochem";

const isMeasured = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export type Depth = { open: boolean; onOpen: () => void; onClose: () => void };

export function Ground({ evidence, geochem, geology, occurrences, element, onElement, deep, selectedId, onPick, onClear, onNext }: {
  evidence: Evidence;
  geochem: Geochem;
  geology: Geology;
  occurrences: Occurrences;
  element: string;
  onElement: (element: string) => void;
  deep: Depth;
  selectedId: string | null;
  onPick: (id: string) => void;
  onClear: () => void;
  onNext: () => void;
}) {
  const { config, features } = evidence;
  const selected = selectedId ? features.find((f) => f.id === selectedId) ?? null : null;
  const measured = features
    .map((f) => f.properties.gold_primary_value_ppm)
    .filter(isMeasured)
    .sort((a, b) => a - b);
  const typical = measured.length ? measured[Math.floor(measured.length / 2)] : null;
  // The richest sample may be above the lab's upper limit, so rank by value or bound and show it as the lab reported it.
  const level = (f: (typeof features)[number]) => f.properties.gold_primary_value_ppm ?? f.properties.gold_primary_bound_ppm ?? 0;
  const richest = features.reduce((best, f) => (level(f) > level(best) ? f : best), features[0]);
  const source = config.source;

  const siteOf = (sampleId: string) => features.find((f) => f.properties.sample_id === sampleId)?.properties.area ?? null;
  return (
    <>
    <Panel
      step={1}
      onDeep={deep.onOpen}
      mode="2016 survey"
      title="Is there gold in the ground?"
      lede={<>Alaska&apos;s geological survey sampled {features.length} stream beds here in 2016. Each gold pin is one sample: the taller it stands, the more gold the lab found.</>}
      next={{ label: "Who owns this land?", onClick: onNext }}
      evidence={[
        { label: `Alaska DGGS ${source.id} ${source.version}`, href: source.doi_url ?? source.publication_url },
        { label: "Stream-sediment gold, −200 mesh, parts per million (ppm); typical is the median of measured samples" },
      ]}
    >
      <dl className="stat-row">
        <div><dt>Samples</dt><dd className="tabular">{features.length}</dd></div>
        <div><dt>Typical</dt><dd className="tabular">{formatNumber(typical, 3)} <small>ppm</small></dd></div>
        <div>
          <dt>Richest</dt>
          <dd className="tabular">
            <button type="button" className="stat-link" onClick={() => onPick(richest.id)} aria-label={`Show the richest sample, ${richest.properties.sample_id}`}>
              {formatAssay(richest.properties, "gold_primary").replace(" ppm", "")} <small>ppm</small>
            </button>
          </dd>
        </div>
      </dl>
      {selected ? (
        <div className="callout" role="status">
          <button type="button" className="callout-close" onClick={onClear} aria-label="Close sample"><X className="size-4" /></button>
          <p className="callout-kicker">Sample {selected.properties.sample_id} · {selected.properties.area === "A" ? "west site" : "east site"}</p>
          <p className="callout-value tabular">{formatAssay(selected.properties, "gold_primary")}</p>
          <p className="callout-note">gold, lab batch {selected.properties.batch_number}</p>
        </div>
      ) : (
        <p className="hint">Tap a pin on the map to read its lab value.</p>
      )}
    </Panel>
    {deep.open ? (
      <GeochemDeep
        geochem={geochem}
        geology={geology}
        occurrences={occurrences}
        element={element}
        onElement={onElement}
        sampleId={selected?.properties.sample_id ?? null}
        occurrenceId={selectedId?.startsWith("occ:") ? selectedId.slice(4) : null}
        siteOf={siteOf}
        onClose={deep.onClose}
      />
    ) : null}
    </>
  );
}
