"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { anomalyClass, assayLevel, formatAssayValue, km, type Geochem as GeochemData, type Geology, type Occurrences } from "@/lib/showcase";
import { Bar } from "../charts";
import { DeepDive, Section } from "../DeepDive";

const CLASS_LABELS = ["Below median", "Above median", "Top 10%", "Top 2%"] as const;
const PATHFINDERS = ["As", "Sb", "Bi", "Te", "W", "Mo", "Cu", "Ag"];

export function GeochemDeep({ geochem, geology, occurrences, element, onElement, sampleId, occurrenceId, siteOf, onClose }: {
  geochem: GeochemData;
  geology: Geology;
  occurrences: Occurrences;
  element: string;
  onElement: (element: string) => void;
  /** The selected sample's lab ID (e.g. 16MBW012), if any. */
  sampleId: string | null;
  /** The selected known-mine record (ARDF number), if any. */
  occurrenceId: string | null;
  siteOf: (sampleId: string) => "A" | "B" | null;
  onClose: () => void;
}) {
  const t = geochem.thresholds;
  const info = geochem.elements[element];
  const goldRich = useMemo(() => geochem.samples.filter((s) => anomalyClass(s.values.Au, t.Au) >= 2), [geochem, t]);

  // How many of the gold-rich streams are also in the top 10% for each pathfinder element.
  const together = PATHFINDERS.map((e) => ({
    e,
    both: goldRich.filter((s) => anomalyClass(s.values[e], t[e]) >= 2).length,
  })).sort((a, b) => b.both - a.both);

  // Rock units under the samples, and how many gold-rich samples sit on each.
  const units = useMemo(() => {
    const byName = new Map<string, { name: string; age: string; color: string; all: number; gold: number }>();
    for (const s of geochem.samples) {
      const u = geology.units[s.id];
      if (!u) continue;
      const row = byName.get(u.name) ?? { name: u.name, age: u.age, color: u.color, all: 0, gold: 0 };
      row.all++;
      if (goldRich.includes(s)) row.gold++;
      byName.set(u.name, row);
    }
    return [...byName.values()].sort((a, b) => b.all - a.all);
  }, [geochem, geology, goldRich]);

  // Known gold-bearing mines and prospects, nearest to the sampled area first.
  const centre = useMemo(() => {
    const n = geochem.samples.length;
    return [geochem.samples.reduce((a, s) => a + s.lon, 0) / n, geochem.samples.reduce((a, s) => a + s.lat, 0) / n] as const;
  }, [geochem]);
  const gold = occurrences.records
    .filter((o) => o.commodities.includes("Au") || o.other.includes("Au"))
    .map((o) => ({ ...o, distance: km(centre[0], centre[1], o.lon, o.lat) }))
    .sort((a, b) => a.distance - b.distance);
  const types = occurrences.records.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.type]: (acc[o.type] ?? 0) + 1 }), {});

  const sample = sampleId ? geochem.samples.find((s) => s.id === sampleId) ?? null : null;
  const unit = sample ? geology.units[sample.id] : null;
  const occurrence = occurrenceId ? occurrences.records.find((o) => o.id === occurrenceId) ?? null : null;
  const nearest = sample
    ? occurrences.records.map((o) => ({ o, d: km(sample.lon, sample.lat, o.lon, o.lat) })).sort((a, b) => a.d - b.d)[0]
    : null;

  const median = (site: "A" | "B", e: string) => {
    const values = geochem.samples.filter((s) => siteOf(s.id) === site).map((s) => assayLevel(s.values[e])).filter((v): v is number => v !== null).sort((a, b) => a - b);
    return values.length ? values[Math.floor(values.length / 2)] : null;
  };

  return (
    <DeepDive
      kicker="Deep dive · The ground"
      title="What else is in the dirt?"
      mode="2016 survey"
      onClose={onClose}
      evidence={[
        { label: "Alaska DGGS RDF 2016-10, all ME-MS61 elements and PGM-MS23 gold, −200 mesh", href: geochem.source.doi },
        { label: `Percentile thresholds across the ${geochem.samples.length} sites; lab-limit values rank at their limit` },
        { label: "Bedrock: USGS Geologic Map of Alaska (SIM 3340) via Macrostrat, CC-BY 4.0", href: geology.source_url },
        { label: `Known mines and prospects: USGS Alaska Resource Data File, retrieved ${occurrences.retrieved}`, href: "https://mrdata.usgs.gov/ardf/" },
      ]}
    >
      <Section title="Colour the map by element" lede={<>The lab measured {geochem.order.length} elements in every sample. Pick one; the pins on the map show where it runs high.</>}>
        <div className="chips" role="radiogroup" aria-label="Element">
          {geochem.key_elements.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={element === e} className="chip" onClick={() => onElement(e)} title={geochem.elements[e]?.name}>
              {e}
            </button>
          ))}
        </div>
        <ol className="class-legend" aria-label={`${info.name} classes`}>
          {CLASS_LABELS.map((label, k) => (
            <li key={label} data-class={k}>
              <i aria-hidden="true" />
              <span>{label}</span>
              <span className="tabular">
                {k === 0 ? `< ${t[element]?.p50}` : `≥ ${[t[element]?.p50, t[element]?.p90, t[element]?.p98][k - 1]}`} {info.unit}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {sample ? (
        <Section title={`Sample ${sample.id}`} lede={`${siteOf(sample.id) === "A" ? "West" : "East"} site · ${sample.notes.source ?? "stream sediment"}`}>
          <ul className="profile" aria-label="Element profile">
            {geochem.key_elements.map((e) => {
              const k = anomalyClass(sample.values[e], t[e]);
              return (
                <li key={e} data-class={k}>
                  <span>{e}</span>
                  <span className="tabular">{formatAssayValue(sample.values[e], geochem.elements[e].unit)}</span>
                  <span className="profile-class">{CLASS_LABELS[k]}</span>
                </li>
              );
            })}
          </ul>
          <dl className="facts">
            {unit ? <><dt>Bedrock</dt><dd>{unit.name} ({unit.age})</dd></> : null}
            {nearest ? <><dt>Nearest known site</dt><dd>{nearest.o.name}, {nearest.d.toFixed(1)} km ({nearest.o.type.toLowerCase()})</dd></> : null}
            {sample.notes.stream_width_meters ? <><dt>Stream</dt><dd>{sample.notes.stream_width_meters} m wide, {sample.notes.stream_speed}</dd></> : null}
            {sample.notes.grain_size ? <><dt>Sediment</dt><dd>{sample.notes.sed_color}, {sample.notes.grain_size}</dd></> : null}
          </dl>
        </Section>
      ) : occurrence ? (
        <Section title={occurrence.name} lede={`${occurrence.type} · ${occurrence.status || "status unknown"} · ${[...occurrence.commodities, ...occurrence.other].join(", ")}`}>
          {occurrence.model ? <p className="deep-note">Deposit type: {occurrence.model}</p> : null}
          <p className="deep-text">{occurrence.geology}</p>
          <a className="link-button" href={occurrence.url} target="_blank" rel="noreferrer">Full USGS record {occurrence.id}</a>
        </Section>
      ) : (
        <p className="deep-note">Tap a pin or a mine marker on the map to see its full record here.</p>
      )}

      <Section
        title="What travels with gold here"
        lede={<>{goldRich.length} streams are in the top 10% for gold. This shows how many of them are also in the top 10% for each element that often travels with gold.</>}
      >
        {together.map(({ e, both }) => (
          <Bar key={e} label={`${e} · ${geochem.elements[e].name}`} value={goldRich.length} total={goldRich.length} highlight={both} note={`${both} of ${goldRich.length}`} />
        ))}
        <p className="deep-note">Counts only. Tungsten, tellurium and bismuth alongside gold is a pattern geologists link to intrusion-related gold, which is common in Interior Alaska; this data alone can&apos;t confirm that.</p>
      </Section>

      <Section title="The rock underneath" lede="The coloured layer on the map is the USGS bedrock map. Here is the unit at each sample site, and how many of the gold-rich streams drain it.">
        {units.map((u) => (
          <Bar key={u.name} label={u.name} value={u.all} total={geochem.samples.length} highlight={u.gold} note={`${u.all} sites · ${u.gold} gold-rich`} />
        ))}
      </Section>

      <Section
        title="Known mines and prospects nearby"
        lede={<>The USGS records {occurrences.records.length} sites in and around the area: {Object.entries(types).map(([k, v]) => `${v} ${k.toLowerCase()}${v === 1 ? "" : "s"}`).join(", ")}. Gold-bearing ones, nearest first:</>}
      >
        <ul className="occ-list">
          {gold.slice(0, 6).map((o) => (
            <li key={o.id}>
              <a href={o.url} target="_blank" rel="noreferrer">
                <strong>{o.name}</strong> <ExternalLink className="inline size-3" aria-hidden="true" />
              </a>
              <span className="tabular">{o.distance.toFixed(0)} km · {o.type} · {o.status || "status unknown"} · {o.commodities.join(", ")}</span>
              {o.model ? <span className="occ-model">{o.model}</span> : null}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="West site vs east site" lede="Median of each element across the samples in each area.">
        <table className="deep-table">
          <thead><tr><th scope="col">Element</th><th scope="col">West (A)</th><th scope="col">East (B)</th></tr></thead>
          <tbody>
            {geochem.key_elements.map((e) => (
              <tr key={e}><th scope="row">{e}</th><td className="tabular">{median("A", e) ?? "—"}</td><td className="tabular">{median("B", e) ?? "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

    </DeepDive>
  );
}
