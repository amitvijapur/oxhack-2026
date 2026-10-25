"use client";

import type { ColorBy as Mode } from "@/lib/showcase";

const MODES: { id: Mode; label: string }[] = [
  { id: "gold", label: "Gold" },
  { id: "ownership", label: "Ownership" },
  { id: "staked", label: "Staked year" },
];

const legends = ([first, last]: [number, number]): Record<Mode, { label: string; swatch: string }[]> => ({
  gold: [
    { label: "Little", swatch: "radial-gradient(circle, rgb(229 231 235 / 0.6), transparent 70%)" },
    { label: "Above typical", swatch: "radial-gradient(circle, rgb(250 204 21 / 0.8), transparent 70%)" },
    { label: "Top 10%", swatch: "radial-gradient(circle, #fbbf24, transparent 75%)" },
    { label: "Top 2%", swatch: "radial-gradient(circle, #fde047 30%, transparent 80%)" },
  ],
  ownership: [
    { label: "Held claim", swatch: "rgb(255 255 255 / 0.7)" },
    { label: "Lapsed claim", swatch: "rgb(255 255 255 / 0.2)" },
    { label: "Sample, no claim", swatch: "radial-gradient(circle, rgb(250 204 21 / 0.6), transparent 70%)" },
  ],
  staked: [
    { label: String(first), swatch: "rgb(115 115 115 / 0.7)" },
    { label: String(Math.round((first + last) / 2)), swatch: "rgb(74 160 104 / 0.75)" },
    { label: String(last), swatch: "#22c55e" },
  ],
});

/** How the land is coloured on the map, with its legend. Sits on the map, bottom-left. */
export function ColorBy({ value, onChange, range }: {
  value: Mode;
  /** First and last staked year in the claims snapshot. */
  range: [number, number];
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="colorby">
      <div className="segmented" role="radiogroup" aria-label="Colour the land by">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={value === m.id} onClick={() => onChange(m.id)}>{m.label}</button>
        ))}
      </div>
      <ul className="legend" aria-label="Legend">
        {legends(range)[value].map((l) => (
          <li key={l.label}><i style={{ background: l.swatch }} />{l.label}</li>
        ))}
      </ul>
    </div>
  );
}
