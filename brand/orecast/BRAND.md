# Orecast

Final algorithm name selected by Amit. This identity kit supports the revised deck and teammate handoff. It does not rename the application.

**Draft descriptor:** Mineral intelligence over time.

Orecast connects a gold-price forecast, material and interest assumptions, option assignment and time-adjusted cash outcomes. This descriptor identifies the subject; it is not a promise of predictive accuracy or investment returns.

## Wordmark

Write **Orecast** in title case. Use the standalone typographic wordmark in DM Sans Regular, weight 400, with natural spacing. It is a plain name, without a symbol or suffix. Keep **Ore** and **cast** in the same colour and weight. Do not copy or reconstruct the reference company's logo.

| Asset | Use |
| --- | --- |
| `orecast-wordmark-ink.svg` | Editable typographic SVG, dark ink on transparent background |
| `orecast-wordmark-white.svg` | Editable typographic SVG, white on transparent background |
| `orecast-wordmark-ink.png` | Transparent high-resolution raster fallback for light pages |
| `orecast-wordmark-white.png` | Transparent high-resolution raster fallback for charcoal pages |
| `wordmark.txt` | Exact plain-text identity for native editable slide text |
| `brand-board.png` | A compact visual handoff, not a presentation slide template |

The SVG files retain a `<text>` element and embed the bundled open font for portability. Some slide/image importers ignore SVG font embedding; use the PNG in those applications or recreate **Orecast** as native text. In a slide deck, native editable DM Sans text is preferred. Keep the SVG aspect ratio intact.

Use at least one quarter of the visible capital-O height as clear space on every side. The assets already include more clear space than this minimum. Keep the primary visible wordmark at least **100px wide on screen** or **26mm wide in print**. This minimum applies to the primary identity and placed logo assets. The approved deck may use a tiny native-text **Orecast** folio as metadata; it is not a placed logo asset. A descriptor needs enough additional space to remain at least 14px on a 1280-wide slide; omit it at small sizes. Never stretch, outline, skew or add a glow/shadow to the wordmark.

## Palette

| Token | Value | Role |
| --- | --- | --- |
| Paper | `#fafafa` | Main editorial pages and reversed text |
| Ink | `#0a0a0a` | Main text, cover and chart panels |
| Signal | `#22c55e` | Sparse selected or active signal |
| Secondary | `#737373` | Supporting text on paper |
| Quiet | `#a3a3a3` | Supporting text on charcoal |
| Rule | `#b6b6b6` | Fine diagrams and rules on paper |
| Dark rule | `#262626` | Fine rules on charcoal |
| Measured gold | `#facc15` | Optional measured-gold reference only |

The standard wordmark stays ink or white. Green belongs to a selected ring segment, one active chart datum or a meaningful signal. Do not scatter green across all headlines or turn the identity into a gold-luxury style. Yellow is not the general brand colour.

## Type

- **DM Sans 300** for large, light focal numbers or selected display lines.
- **DM Sans 400** for the wordmark, main statements, body copy and most labels.
- **IBM Plex Mono** is optional application typography that may appear in small technical readouts or dates. It is not the dominant headline face and is not a supplied font dependency of this new deck or brand kit.
- Alliance No.1 and No.2 are the commercial reference families, not kit dependencies. The supplied DM Sans is the deliberate local equivalent. Do not substitute a heavy 700/800-weight headline style.

`fonts/` contains the open DM Sans 300/400 faces and their original license. Install these faces for editing, or use a renderer that supports the supplied WOFF2 files. If an editor cannot load WOFF2, obtain the equivalent DM Sans desktop font from its official open-font distribution. Arial Regular is an emergency fallback only; recheck every line break and metric before presenting.

## Apply the approved deck language

Use the layouts in `../../pitch/palantir-rebuild.md` and the approved local presentation. The public reference supplies spatial composition, not source claims, branding or artwork.

1. Preserve white editorial pages. Use charcoal for the ring cover, evidence/chart panels and selected image compositions.
2. Keep quiet upper-left section furniture: small outlined section number, fine arrow and a short section label. Orecast can replace the neutral identity where the new deck requires it. OXHack remains the event name.
3. At 1280 by 720, typical left text starts near x42. The asymmetric right panel is approximately x648/y16/w616/h688, with about 24px corners. Match the selected layout instead of forcing this split on every page.
4. Write regular-weight editorial statements around 30–38px. Make meaningful metrics large and light, around 90–115px, with a simple fine underline. Put one clear argument on each page.
5. Use real terrain and actual prototype captures as evidence windows. Keep their crops deliberate and do not hide a diagram label behind an inset.
6. Keep charts, text, rings, diagrams and tables native and editable. Use hollow/outlined historical bars and one selected filled datum where appropriate. Align every probability label with its own horizon.
7. Preserve observed, simulated and assumed distinctions. A forecast is not an observation; a hypothetical financial transfer is not a measured price effect. Do not invent traction or performance claims to fill a layout.
8. Use the existing large, thin ring motif if the cover needs a temporal graphic. A separate icon is not required. Do not import Palantir's name, logo, mark, copyright line or business claims.

## Files and regeneration

All asset references are relative to this folder. `tokens.json` is the machine-readable source for colour, typography and usage values. `build-brand.cjs` regenerates only this kit's wordmarks and brand-board PNG using `@napi-rs/canvas`; use a Node environment where that package is available. It copies the already supplied DM Sans files from `../../pitch/assets/fonts/` if they are absent here. No account, image service or network request is required.

This is the Orecast naming and visual identity handoff. The descriptor remains draft copy. Applying these assets to the application or a deployment is a separate task.
