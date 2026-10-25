# Tok River application

The Next.js application presents **Land Arbitrage: Gold**, a Cesium explorer for
Tok River, Alaska. The Land, Ground, Market, Swarm and Decision tabs connect pinned
claim context, historical measurements, market sources and the canonical option
workbench. The site opens on today: claims held now and the gold spot, then
plays the next 12 months forward using the model's descriptive 2020–25 gold
trend (`historicalGoldTrend`, `projectPrice`) and its 30/90/180-day horizons on
the hypothetical demo contract (`projectionHorizons` in `src/lib/canonical-model.js`).
It is labelled as a projection, not a prediction. **History** opens the claims
time-lapse for the last ten years, or since 1975. Only the current Esri imagery
is used; dated satellite layers were removed for speed and consistency.

## Swarm workflow

Open `/swarm` for a visual replay of the recorded workflow. Connected layers
show context, stakeholder groups, scores, matched comparisons, gold forecasts
and option valuation before one model output. The existing kit is preserved. Click or keyboard-select a node
for optional detail; compact controls choose the run, speed and simulated day.
On narrow screens, pan inside the labelled graph to follow every layer.

The six scored runs remain recorded simulation output. Three planned runs stay
unavailable. Strict research readiness retains failed or unknown checks, while
the labelled hypothetical calculation snapshot remains available. The graph is
a workflow schematic, not a display of neural-network training or weights. No
new agents run during playback.

To preview the workflow locally, use `npm run dev -- --port 5183` or a verified
production build with `npm start -- --port 5183`, then open
[the workflow](http://127.0.0.1:5183/swarm). The optional browser harness uses
the origin of its open localhost tab and saves local review captures under
ignored `.impeccable/review/`. See
[workflow verification](WORKFLOW-VERIFICATION.md) for the checked scope.

## Run locally

Use Node.js 24 and npm from this directory:

```sh
npm ci --ignore-scripts
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000/). Next.js binds to loopback. The
`predev` and `prebuild` scripts copy Cesium's workers and static assets to an
ignored, versioned public directory. The committed source snapshots are enough
to browse evidence and use the hypothetical workbench without Convex.

The keyless globe uses Esri satellite imagery and Terrarium terrain. Ground
context can show Macrostrat geology tiles and known mineral occurrences.
External layers need internet access and retain attribution. Optional
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` enables Google photorealistic tiles; its absence
uses the default globe. Configure API restrictions before supplying a browser key.

`/api/health` reports runtime status. `/api/gold-price` retrieves an attributed
XAU observation through the server, caches it for 30 seconds and marks stale
cached results. An unavailable provider can return 503. This live observation
never becomes a model price automatically.

## Verify and serve a build

```sh
npm test
node --test ../model/tok-option/tests/*.test.mjs
npm run test:backend
npm run typecheck:backend
npm run typecheck
npm run build
npm start
```

The production server is also local at port 3000; an alternate port can be
selected with `npm start -- --port 5182`. The build script uses Next's Webpack
builder. DM Sans and IBM Plex Mono WOFF2 files are bundled under `src/app/fonts/`,
with font licences and a hash manifest, so builds do not fetch Google Fonts.
`npm run lint` is available for ESLint. Build and runtime success do not establish a hosted deployment.
See [the contribution guide](CONTRIBUTING.md) for modules and manual checks.

## Evidence and interpretation

The original small handoff assets remain under `public/data/`: the frontend
manifest, source catalogue and separate A/B GeoJSON and summary files. The
`src/lib/evidence.js` loader validates and maps those browser URLs. All 67
samples are retained, with A33/B34 membership, primary gold qualification,
separate retests and missing values. Sample `16MBW012` has primary `>1 ppm`
with raw `-2` and method `PGM-MS23`; its separate retest is `1.1 ppm` by `Au-AA25`.

Source: [Alaska DGGS RDF 2016-10](https://dggs.alaska.gov/pubs/id/29688),
[DOI 10.14509/29688](https://doi.org/10.14509/29688). Transformations select the
−200-mesh fraction, split by longitude and compute descriptive summaries.
Collection was June–July 2016 and publication November 2016. No publication day
or per-sample collection day is supplied. Full ignored packs can be restored via
[the gold downloads guide](../research/gold-data-downloads.md).

`public/data/showcase/` adds pinned claims, plots, geochemistry, geology,
occurrences, market history and town simulation display bundles. The builder
and source references preserve their separate provenance. Illustrative sample
squares are labelled separately from recorded claims. Neither an overlap check
nor a historical claim status establishes available land, mineral rights,
recoverable resources or an investable opportunity.

## Swarm view

The Swarm tab (`src/components/explorer/tabs/SwarmTab.tsx`) reads the pinned
MiroFish bundle `../model/tok-option/data/swarm-source.json` through one adapter,
`src/lib/swarm-view.js`, and the model's own `inspectSwarmSource` checks. It
shows support by group and day for every judged run, the three-baseline spread,
day 3–5 effects against that band, the report's checks, run configurations and
interview coverage, and the bundle's limitations. The separate day-1 town pilot
replay stays in the same tab, labelled with its own commit and judge check.

To show a newer swarm run, replace `swarm-source.json` with the new attributed
bundle, then run `node --test ../model/tok-option/tests/*.test.mjs` and the
browser smoke check. No component holds swarm numbers of its own.

## Where each view reads from

| View | Source |
| --- | --- |
| Time-lapse, Market timeline | `showcase/claims.geojson` (DNR), `history.json`, `market.json` (Arjin's land branch) |
| Plot sheet land records | `inspectLandSource` over `../model/tok-option/data/land-source.json` |
| Ground, A/B evidence card | `geochem.json`, `gold-frontend-data.json`, `gold-source-catalog.json` |
| What mineral ground has cost | `market.json` comparables and rent schedule |
| How it works | data counts above, `runWorkbench` evidence gate and model gaps |
| 3D terrain view | Terrarium and Esri tiles; beads only at real sample points, ranked against all sites |

## Canonical decision model

The Decision tab embeds `src/ModelWorkbench.jsx`, importing the pure
`../model/tok-option/workbench.mjs` engine. The website always opens and resets
in hypothetical demo mode, with no alternative financial modes. Total expected
cash and change versus baseline are separate, and the current break-even
premium comes from the canonical cash diagnostics. The engine's programmatic
pending/real modes still retain null financial outputs.

**Use existing swarm results** compares the recorded Claude approval/blockage
posts with matching sports placebo inside hypothetical economics. It retains
failed research checks and source identity. Strict source imports still require
readiness; no missing event is filled with an invented simulation. Historical
CAGR is an optional assumption, not a forecast.

Read [the model guide](../model/tok-option/README.md),
[architecture](../docs/architecture.md) and [remaining work](../docs/remaining-work.md).
[Optional Convex storage and publishing](../docs/infrastructure.md) can provide
attributed workstream publications, but no backend account or secrets are
configured by this integration.

### Hypothetical gold forecast

The Decision calculator exposes model v2 gold forecasts before mineral and option valuation. Baseline and scenario gold prices, the assumed response cap, and cash deltas come from the same canonical model. The cap defaults to 7%, affects gold once at each sale date, and is not a cap on option movement or loss. Recorded swarm scores retain their failed research checks; the support-to-gold relationship is uncalibrated.

### Current algorithm calculation snapshot

The `/swarm` graph now reads a source-pinned snapshot of `tok-option-demo-v2`
from the newer local integration revision `8399adb6`. It is a display of default
hypothetical calculations, not live synchronization with the explorer's model
controls. Select A/B and a 30/90/180-day horizon to inspect its recorded output.
Approval/blockage compare against the matching Claude placebo. The assumed
response changes Au price once before material and option valuation. Land
context and assays feed evidence eligibility, not an inferred land price.

Regenerate from a trusted canonical checkout, using Node 24:

```sh
node scripts/update-algorithm-workflow.mjs /path/to/canonical/checkout
```

The script verifies executed source/input bytes against that checkout's commit,
records hashes, calls its actual workbench and checks the inputs again. It does
not copy financial formulas or modify the source checkout. Unsupported scenarios
remain unavailable. The snapshot does not validate the assumed price response,
change the failed research checks, or populate real option terms/resources.

The graph now ends at one Model output panel. It shows expected option return
(expected net cash divided by upfront amount at risk), the denominator, forecast
values and the illustrative model action. On mobile the output appears before
the pannable network. The page opens paused at the completed replay window;
Play still animates the recorded workflow.

One expandable Validation summary retains simulation checks, historical equity
pilot errors and unavailable swarm lift. These findings remain separate from
the financial calculation. The study's trading-session horizon does not change
the option holding period. Inspection retains full-precision source outputs and
intermediate valuation formulas.
