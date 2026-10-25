# Improve the application

Start from updated `main` in a short task branch. Amit owns integration. Agree a
human owner and bounded module scope in [the task list](../tasks/todo.md) before
editing shared interfaces or dependency files. Preserve other contributors' work.

Use Node.js 24, then run `npm ci --ignore-scripts` and `npm run dev` from
`frontend/`. Open [127.0.0.1:3000](http://127.0.0.1:3000/).

## Where to work

| Area | Files |
| --- | --- |
| Next.js entry, metadata and shared styles | `src/app/page.tsx`, `layout.tsx`, `globals.css` |
| Explorer state, panel and responsive layout | `src/components/explorer/Explorer.tsx`, `Panel.tsx`, `explorer.css` |
| Land, ground, market and decision views | `src/components/explorer/tabs/` |
| Cesium viewer, camera, selection and terrain | `src/components/earth/` |
| Snapshot loaders and presentation contracts | `src/lib/evidence.js`, `showcase.ts`, `canonical-model.js` |
| Decision controls and diagnostics | `src/ModelWorkbench.jsx`, `ModelDiagnostics.jsx`, `model-workbench.css` |
| Sole valuation, liquidity and scenario engine | `../model/tok-option/` |
| Server API and Next.js catch-all | `src/server/`, `src/app/api/[...path]/route.ts` |
| Optional attributed storage | `convex/` |
| Bundled display snapshots | `public/data/` |
| Evidence, API and presentation tests | `tests/` |

Keep data generation changes separate from display changes. The existing dark,
monochrome and green explorer is documented in [DESIGN.md](../DESIGN.md).
Older Mapbox reference drafts are historical research.

## Contracts to preserve

- GeoJSON uses `[longitude, latitude]`. Source sample bounds and identities remain intact.
- Primary gold, separate retests, raw values, methods and censoring stay visible.
  Missing values do not become zero, and summaries keep their denominators.
- The 2016 evidence has month precision. Claim history and price history use
  their own dates and do not manufacture sample chronology.
- Recorded claims, illustrative squares, sediment samples and mineral occurrences
  retain distinct meanings. None establishes a resource estimate or available contract.
- All decisions use the canonical shared engine. Do not add a second solver,
  reuse old monthly/exercise outputs or treat historical stored runs as live controls.
- Demo economics and synthetic swarm imports stay explicit. Failed simulation
  diagnostics cannot become monetary signals.

## Check and share

Run the commands in [the frontend guide](README.md), including the separate
canonical model suite. For a manual check, exercise the time slider, map and list
selection, all four tabs, primary/retest details and narrow-screen bottom sheet.
In Decision, confirm pending mode has no financial quote, explicit demo reproduces
USD7.60 expected 90-day cash, and source diagnostics remain visible. Check keyboard
focus, scrolling, API failure labels and map attribution.

Follow [the team workflow](../docs/team-workflow.md). Share a focused PR with
actual check results and useful screenshots. Keep credentials, dependencies,
Cesium copied assets, build output and browser state out of Git. Source publication
and optional backend setup do not deploy the application.
