# Land Arbitrage: Gold

A Next.js website on a live 3D map of the Tok River valley, Alaska.

**The opening is a time-lapse.** It plays 1975 to today by itself:
- real state mining claims appear the year they were staked (green), stay while held, and fade when they lapse
- the year, claims held and the gold price count up with them, over a growth line you can scrub

**"Explore the land" opens one side panel with four tabs:**

- **Overview:** today's signal for the Tok Site B contract (SKIP), why, and the three numbers behind it.
- **Ground:** the 57 sampled 160-acre plots coloured by any of 49 measured elements, which elements travel with gold, and an optional bedrock map with known mines (USGS).
- **Market:** gold price, claims staked and held, land prices and claim rent from 1975 to today, who holds the claims, and recent Alaska gold deals.
- **Decision:** the decision engine's outcome distribution with a buyer-rate slider, its month-by-month sell line, the per-acre arbitrage spread, and the simulated town (61 AI residents) reacting to gold news.

Tap any plot on the map for its card: holder, since when, and the gold found there. A live gold spot price and the time in Tok sit top right. Monochrome, with green only for live data and growth.

See [the team improvement guide](CONTRIBUTING.md) for file ownership boundaries.

## Run locally

Use Node.js 24 and npm. The package lock pins the dependency tree.

```sh
cd frontend
npm ci
npm run dev
```

Open [127.0.0.1:3000](http://127.0.0.1:3000/). `predev` copies Cesium's static
assets into the ignored `public/vendor/`. No account or key is required: the
Earth uses Esri World Imagery and Mapzen Terrarium elevation tiles, and the
gold price comes from the keyless gold-api.com through `GET /api/gold-price`.

For Google Photorealistic 3D Tiles (the Google Earth look), put a Google Maps
Platform key with the Map Tiles API enabled in `.env.local`:

```sh
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Without it, or if the tiles fail, the keyless globe stays. Without WebGL the
screens still work and a note says the 3D map could not start.

### Rebuild the showcase data

`public/data/showcase/` is generated from the team's committed branches (read
with `git show`, so nothing is checked out) plus one fetch of DNR claims:

```sh
git fetch origin
python3 frontend/scripts/build-showcase-data.py            # all four files
python3 frontend/scripts/build-showcase-data.py decision   # just one
# steps: claims history town decision geochem occurrences geology market
```

Each file records its source ref and commit, or its URL, retrieval date and
hash. `geochem` checks the DGGS zip against its pinned sha256. `occurrences`
reads the USGS ARDF WFS, and `geology` asks Macrostrat (CC-BY 4.0) which
SIM 3340 unit lies under each sample. `geology` reads `geochem.json`, so run
`geochem` first. The map's geology overlay uses Macrostrat's tiles. Re-run it when
`arjin/tok-land-data`, `ahmed/gold-society-plan` or `salman/decision-engine`
changes, and commit the result.

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
npm run typecheck
npm run lint
npm run test:backend
npm run build
```

Evidence-contract tests verify the actual 67-record fixture, A33/B34 membership,
coordinate order and bounds, stable identities, assay qualification, separate
retests, missing values, summary denominators and failed asset loads. The API
test covers the gold-price cache and its stale fallback.

For a manual browser check:

1. The arrival globe turns, lit by the real sun, and the ticker shows a gold price.
2. "Go to Tok" flies into the valley. "Richest" selects sample `16MBW012`,
   which must read `>1 ppm`.
3. Dragging the year changes the claim count and the claim shapes on the map.
4. "Play the day" runs to hour 24 with 277 scored posts.
5. The decision shows SKIP; the slider at "1 in 2" with early completion on
   shows BUY at +$1,499, and turning early completion off returns SKIP.
6. The phone layout turns the panel into a bottom sheet with no sideways scroll.

For the automated browser smoke check, start the website and run the following
from the repository root, using an available `playwright-cli` installation:

```sh
mkdir -p frontend/artifacts
playwright-cli -s=tok-evidence open http://127.0.0.1:3000/
playwright-cli -s=tok-evidence run-code --filename=frontend/tests/browser-smoke.js
```

Screenshots are written under ignored `frontend/artifacts/`.

## Snapshot and provenance

The following small assets were copied byte-for-byte from the user-supplied
verified handoff, preserving distinct A/B file names:

- `public/data/gold-frontend-data.json`
- `public/data/gold-source-catalog.json`
- `public/data/tok-gold/site-a/samples.geojson` and `summary.json`
- `public/data/tok-gold/site-b/samples.geojson` and `summary.json`

`src/lib/evidence.js` explicitly maps the handoff's repository-relative paths to
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
values remain explicit. The website itself infers nothing: claim states, swarm
scores and decision values are the team's committed outputs, copied by
`scripts/build-showcase-data.py` with their source commit. The decision applies
real staged terms from a Nevada deal to Tok hypothetically (no such offer
exists), and land status and mineral rights are not yet confirmed.

## Mapping implementation

`src/components/earth/Earth.tsx` runs one Cesium viewer for the whole page;
each screen sets the camera and which layers show. Imagery is Esri World
Imagery. Terrain comes from the
[Mapzen Terrarium tiles](https://registry.opendata.aws/terrain-tiles/), decoded
in `terrarium.ts` and reprojected onto Cesium's geographic grid, so the globe
has no hole at the North Pole. Claims are one batched ground primitive whose
per-claim colour follows the time scrubber. Sample pins are cylinders on the
ground with a log-scaled height. Cesium's credits stay visible bottom left.

[Terrain attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
includes Mapzen, USGS and relevant ArcticDEM sources. Map and terrain sources are
separate from the Alaska DGGS sediment evidence. No interpolated heatmap,
legal parcel outline or fictional terrain is drawn.
