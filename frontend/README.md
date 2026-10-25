# Tok River application

The Next.js application presents **Land Arbitrage: Gold**, a Cesium explorer for
Tok River, Alaska. The Land, Ground, Market and Decision tabs connect pinned
claim context, historical measurements, market sources and the canonical option
workbench. The opening time slider shows source-derived claim history and annual
gold context. It does not assign daily dates to the 2016 samples.

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
