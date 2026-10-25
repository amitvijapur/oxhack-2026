# Tok River evidence website

A local React website for Alaska DGGS RDF 2016-10 stream-sediment evidence.
It shows all 67 sample locations, A/B descriptive summaries, clickable sample
details, searchable records and a month-precision timeline. Land/contracts,
MiroFish/prediction and algorithm/output remain pending team handoffs.

See [the team improvement guide](CONTRIBUTING.md) for file ownership boundaries,
pending integrations and the current [desktop preview](docs/preview.png).

## Run locally

Use Node.js 24.14.0 and npm. The package lock pins the dependency tree.

```sh
cd frontend
npm ci --ignore-scripts
npm run dev -- --port 5173 --strictPort
```

Open [127.0.0.1:5173](http://127.0.0.1:5173/). The server listens on loopback.
No backend, account or map API key is required. Fonts and evidence assets are
served locally. The geographic basemap uses the public OpenFreeMap service,
with green land-cover styling and shaded surface elevation from Mapzen terrain
tiles. These external context layers need internet access. Attribution remains visible. If WebGL is
unavailable, a geographic sample plot preserves point selection and the records
table remains usable. A basemap service failure is labelled explicitly.

## Run with the Convex backend

The backend is optional. In a second terminal:

```sh
npm run dev:backend
```

The first run asks you to log in and create or choose a Convex project, then
writes `VITE_CONVEX_URL` to the ignored `.env.local`. Restart `npm run dev` to
pick it up. Without an account,
`CONVEX_AGENT_MODE=anonymous npx convex dev` runs a local backend on
`127.0.0.1:3210` instead. The Workstreams section shows "Backend connected" once
`health.ping` answers, and "Backend not configured" when no URL is set.

Teammates publish their outputs with `scripts/publish_run.py` (from the repository
root). A published run replaces that workstream's Pending card with a Live summary
labelled by its mode (measured snapshot, scenario, and so on), and land records appear in
each sample's details. See [the infrastructure guide](../docs/infrastructure.md) for
secrets and publish commands, and [the backend guide](convex/README.md) for the data model.

## Server API routes

`api/index.js` is the single Vercel Function behind `/api/*`. Routes live in
`server/routes.js` (`GET /api/health` today). Server-only secrets are read with
`requireServerEnv()` from `server/env.js` and set in Vercel without a `VITE_` prefix.
`npm test` covers the router.

## Deploy to Vercel

`vercel.json` holds the build settings and response headers. The build entry is
`scripts/vercel-build.sh`: with `CONVEX_DEPLOY_KEY` set it runs
`npx convex deploy --cmd 'npm run build'`, which pushes the Convex functions and
builds the site with that deployment's `VITE_CONVEX_URL`; without it the static
site is built alone.

One-time setup, by the account owner:

1. Push the functions once from your machine with `npm run dev:backend`, logged in.
2. In Vercel, import the GitHub repository and set **Root Directory** to
   `frontend`. The framework, install and build commands come from `vercel.json`.
3. In the Convex dashboard, generate a **production deploy key** and add it in
   Vercel as `CONVEX_DEPLOY_KEY` for the **Production** environment only. For
   preview deployments, generate a **preview deploy key** and add it as
   `CONVEX_DEPLOY_KEY` for **Preview** only. Convex refuses a production key in
   a non-production Vercel build.
4. Push a branch to get a preview URL; merge to `main` for production.

The Content-Security-Policy allows only this site, OpenFreeMap tiles, the
Mapzen terrain bucket and `*.convex.cloud`. If you add an external service,
extend `vercel.json`; `npm run preview` serves the same headers locally, so a
blocked request shows in the browser console before deployment.

## Verify and preview a production build

```sh
npm test
npm run typecheck:backend
npm run test:backend
npm run build
npm run preview -- --port 4173 --strictPort
```

The production preview is also localhost only. `vite preview` is a local build
check, not a production deployment server. The build may report the size of the
lazy-loaded MapLibre chunk; the map renderer is split from the initial UI code.

Evidence-contract tests verify the actual 67-record fixture, A33/B34 membership,
coordinate order and bounds, stable identities, assay qualification, separate
retests, missing values, summary denominators and failed asset loads.

For a manual browser check, filter A/B/all, open sample `16MBW012`, confirm its
primary gold is `>1 ppm` with raw `-2` and method `PGM-MS23`, and confirm its
separate retest is `1.1 ppm` with method `Au-AA25`. Search the same sample in the
records table and use Enter/Escape to open/close details. Check phone-width
layout, timeline text and all pending owners. No daily playback is defined.

Closely spaced map markers open a nearby-sample chooser, preserving the original
coordinates while allowing an individual record to be selected. Resizing the map
reframes the active sampling-point bounds. The same chooser is available in the
no-WebGL geographic plot.

For the automated browser smoke check, start the website and run the following
from the repository root, using an available `playwright-cli` installation:

```sh
mkdir -p frontend/artifacts
playwright-cli -s=tok-evidence open http://127.0.0.1:5173/
playwright-cli -s=tok-evidence run-code --filename=frontend/tests/browser-smoke.js
```

Screenshots are written under ignored `frontend/artifacts/`. The browser tool is
optional for running the website and is not installed by `npm ci`.

## Snapshot and provenance

The following small assets were copied byte-for-byte from the user-supplied
verified handoff, preserving distinct A/B file names:

- `public/data/gold-frontend-data.json`
- `public/data/gold-source-catalog.json`
- `public/data/tok-gold/site-a/samples.geojson` and `summary.json`
- `public/data/tok-gold/site-b/samples.geojson` and `summary.json`

`src/evidence.js` explicitly maps the handoff's repository-relative paths to
browser asset URLs. Do not fetch local filesystem or repository paths directly.
The full ignored packs can be restored from the private
[gold-evidence-v1 release](https://github.com/amitvijapur/oxhack-2026/releases/tag/gold-evidence-v1)
with repository access. The bundled display snapshot is enough for this website.

Source: [Alaska DGGS RDF 2016-10](https://dggs.alaska.gov/pubs/id/29688),
[DOI 10.14509/29688](https://doi.org/10.14509/29688). Modifications select the
−200-mesh fraction, split by longitude, normalize fields and compute descriptive
summaries. Collection was June–July 2016; publication was November 2016, with no
publication day or per-sample collection date supplied.

These sampling comparison areas are not parcels, deposits or investment choices.
Gold retests never replace primary measurements. Censored bounds and missing
values remain explicit. No land rights, availability, valuation, predictive
skill or decision scores are inferred. The earlier mockup's scenario assumptions
are not used by this website.

## Mapping implementation

The map uses MapLibre GL JS and a green adaptation of the
[OpenFreeMap Liberty style](https://openfreemap.org/quick_start/).
Separate [Mapzen Terrarium elevation sources](https://registry.opendata.aws/terrain-tiles/)
supply terrain and hillshade, with 1.35× visual exaggeration and an initial 48°
pitch. Elevation is surface context, not underground geology or a 2016 land-cover
snapshot. The sample coordinates and assay evidence are unchanged. Terrain can
be toggled with the map's elevation control.

[Terrain attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
includes Mapzen, USGS and relevant ArcticDEM sources. ArcticDEM uses DigitalGlobe
imagery and NSF awards 1043681, 1559691 and 1542736. Map and terrain sources are
separate from the Alaska DGGS sediment evidence.

The interface takes visual inspiration from [Mapbox](https://www.mapbox.com/),
adapted to the user's dark-theme requirement. It uses open DM Sans for UI and
Plex Mono for selected measurement/record values. The desktop map workspace has
a floating right inspector; at 1120 px and below the inspector stacks beneath
the map. Reference extraction and its limits are recorded in
`research/mapbox-reference/DESIGN.md` at the repository root.

Vite bundles the renderer's worker using the explicit worker URL documented by
OpenFreeMap. React controls selected area/sample state; the map is cleaned up
on unmount. Sample positions use the GeoJSON's `[longitude, latitude]` order.
No interpolated heatmap, legal parcel outline or fictional terrain image is used.
