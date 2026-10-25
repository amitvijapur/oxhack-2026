"use client";

import type { ColorBy as Mode } from "@/lib/showcase";

const MODES: { id: Mode; label: string }[] = [
  { id: "gold", label: "Gold" },
  { id: "ownership", label: "Ownership" },
  { id: "staked", label: "Staked year" },
];

const LEGENDS: Record<Mode, { label: string; swatch: string }[]> = {
  gold: [
    { label: "Little", swatch: "rgb(255 255 255 / 0.18)" },
    { label: "Above typical", swatch: "rgb(250 204 21 / 0.45)" },
    { label: "Top 10%", swatch: "rgb(250 204 21 / 0.75)" },
    { label: "Top 2%", swatch: "#fde047" },
  ],
  ownership: [
    { label: "Held", swatch: "rgb(255 255 255 / 0.7)" },
    { label: "Lapsed", swatch: "rgb(255 255 255 / 0.2)" },
    { label: "Illustrative square", swatch: "transparent" },
  ],
  staked: [
    { label: "1977", swatch: "rgb(115 115 115 / 0.7)" },
    { label: "2000s", swatch: "rgb(74 160 104 / 0.75)" },
    { label: "2025", swatch: "#22c55e" },
  ],
};

/** How the land is coloured on the map, with its legend. Sits on the map, bottom-left. */
export function ColorBy({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="colorby">
      <div className="segmented" role="radiogroup" aria-label="Colour the land by">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={value === m.id} onClick={() => onChange(m.id)}>{m.label}</button>
        ))}
      </div>
      <ul className="legend" aria-label="Legend">
        {LEGENDS[value].map((l) => (
          <li key={l.label}><i style={{ background: l.swatch }} className={l.swatch === "transparent" ? "is-dashed" : undefined} />{l.label}</li>
        ))}
      </ul>
    </div>
  );
}
