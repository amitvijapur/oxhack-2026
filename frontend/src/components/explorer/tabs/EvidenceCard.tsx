"use client";

import { useEffect, useState } from "react";
import type { AssayPrefix, EvidenceConfig } from "@/lib/types";
import { Section } from "../TabBody";

type Catalog = {
  citation: string;
  authors: string[];
  evidence_scope: { source_rows: number; unique_sampling_locations: number; excluded_companion_rows: number; excluded_companion_fraction: string; selected_size_fraction: string };
  files: Record<string, { filename: string; sha256: string }>;
};

const ROWS: { key: AssayPrefix; label: string }[] = [
  { key: "gold_primary", label: "Gold, primary assay" },
  { key: "gold_retest", label: "Gold, over-range retest" },
  { key: "lithium_secondary", label: "Lithium (secondary)" },
];

/** The 67-sample A/B gold evidence handoff: per-area measurements, kept separate, with censoring shown. */
export function EvidenceCard({ config }: { config: EvidenceConfig & { interpretation?: string[] } }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    fetch("/data/gold-source-catalog.json").then((r) => (r.ok ? r.json() : null)).then(setCatalog).catch(() => setCatalog(null));
  }, []);
  const cell = (area: EvidenceConfig["areas"][number], key: AssayPrefix) => {
    const m = area.measurements[key];
    const q = m.quantified_only;
    if (!q.denominator) return <span className="muted">not analysed</span>;
    return (
      <>
        <strong>{q.median_ppm} {m.unit}</strong>
        <small>{q.denominator === 1 ? "1 sample" : `${q.minimum_ppm}–${q.maximum_ppm}, n=${q.denominator}`}{m.counts.above_detection ? ` · ${m.counts.above_detection} above range` : ""}{m.counts.below_detection ? ` · ${m.counts.below_detection} below detection` : ""}</small>
      </>
    );
  };

  return (
    <Section
      title="The gold evidence, area by area"
      lede={<>Median of quantified values, with range and count. {config.timeline.collection_months.join(" to ")} sampling, published {config.timeline.publication.value}.</>}
    >
      <div className="table-scroll">
        <table className="swarm-table tabular evidence-table">
          <thead><tr><th>Measurement</th>{config.areas.map((a) => <th key={a.area}>{a.area} · {a.name}<small> {a.sample_count} samples</small></th>)}</tr></thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th>{row.label}<small> {config.areas[0].measurements[row.key].method}</small></th>
                {config.areas.map((a) => <td key={a.area}>{cell(a, row.key)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="limit-list">{(config.interpretation ?? []).filter((line) => !line.startsWith("Use ")).map((line) => <li key={line}>{line}</li>)}</ul>
      {catalog ? (
        <details className="model-detail">
          <summary>Source and checksums</summary>
          <p className="deep-note">{catalog.citation}</p>
          <p className="deep-note">{catalog.evidence_scope.source_rows} source rows → {catalog.evidence_scope.unique_sampling_locations} sampling locations ({catalog.evidence_scope.selected_size_fraction} mesh); {catalog.evidence_scope.excluded_companion_rows} companion {catalog.evidence_scope.excluded_companion_fraction} mesh rows excluded.</p>
          <ul className="hash-list tabular">
            {Object.entries(catalog.files).map(([key, f]) => <li key={key}><span>{f.filename}</span><code>{f.sha256}</code></li>)}
          </ul>
        </details>
      ) : null}
    </Section>
  );
}
