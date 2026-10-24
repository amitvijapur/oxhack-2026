# Improve the frontend

This branch is the team's runnable frontend baseline. The display snapshot is
included, so you can start without regenerating the larger data packs.

## Start

Check out `codex/tok-evidence-frontend`, then use Node.js 24.14.0:

```sh
cd frontend
npm ci --ignore-scripts
npm run dev -- --port 5173
```

Open [localhost:5173](http://127.0.0.1:5173/). If the port is occupied, choose
another port. The basemap/elevation layers need internet access; the evidence
and fonts are local. The optional browser smoke script assumes port 5173.

## Where to work

| Area | Files |
| --- | --- |
| Layout, site cards, sample drawer, timeline and pending panels | `src/App.jsx` |
| Website tokens and responsive styling | `src/styles.css` |
| Map lifecycle, markers, nearby-sample chooser and fallback | `src/MapView.jsx`, `src/map.css` |
| Green map treatment, terrain sources and camera defaults | `src/terrain-style.js` |
| Evidence loader, qualification formatting and asset mapping | `src/evidence.js` |
| Bundled source snapshot | `public/data/` |
| Optional backend connection and status | `src/backend/` |
| Convex schema and functions (see its README) | `convex/` |
| Vercel build and response headers | `vercel.json`, `scripts/vercel-build.sh` |
| Evidence-contract regression checks | `tests/evidence.test.js` |
| Optional interactive browser checks | `tests/browser-smoke.js` |

Start with a short task branch from this frontend branch while its PR is open,
or from updated `main` after it merges. Agree one owner for each file area;
coordinate changes to `App.jsx`, shared data contracts and package files. Keep
source data changes distinct from layout work so they can be reviewed clearly.

## Pending integrations

The existing `gold-frontend-data.json` has null data for three workstreams:

- Arjin owns land/contracts.
- Muhd owns MiroFish/simulation/prediction.
- Salman owns the decision algorithm, currently in planning.

Agree each new output shape before wiring it into `Workstreams`. Keep the
existing Pending/Planning state until an actual output is available. The old
static mockup's probabilities and payoffs are not fixture data for this website.

Preserve these display contracts during UI changes:

- GeoJSON uses `[longitude, latitude]`; bounds frame sample locations.
- Primary gold and separate retests retain their own methods and raw values.
  Sample `16MBW012` is primary `>1 ppm`, with a separate `1.1 ppm` retest.
- Null and not-analyzed values do not become zero. Quantified-only summaries
  retain their denominators and visible censoring notes.
- Collection is June–July 2016 and publication November 2016. No per-sample day
  or daily playback sequence is available.
- Keep source attribution visible and avoid presenting sediment measurements
  as deposits, legal parcels, calibrated probabilities or valuations.

## Check and share

```sh
npm test
npm run typecheck:backend
npm run build
```

Follow [the shared workflow](../docs/team-workflow.md). The PR runs Frontend
checks alongside the existing Repository checks and Secret scan. Share a small
PR with the interface change, real validation results and a screenshot when it
helps. Do not commit dependencies, generated build output, environment secrets
or local browser state. Publishing this source does not deploy the website.

See [the current preview](docs/preview.png), [the setup/provenance guide](README.md),
[the implemented design system](../DESIGN.md) and
[brand draft 02](../design/dashboard/brand-kit-v2-mapbox.md).
