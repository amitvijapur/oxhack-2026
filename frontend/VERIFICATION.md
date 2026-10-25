# Local evidence-website verification

24 October 2026. The local development checks below preceded publication of
the frontend branch. That initial session made no deployment or Git publication.
The publication pull request records the branch and current hosted checks.

## Fresh publication checkout

The complete website and small display snapshot were copied into a clean
checkout of current `main` for the team publication branch. The original
development checkout and localhost session were preserved.

- `npm test`: all 10 frontend contract tests passed.
- `npm run build`: passed; the existing MapLibre chunk-size warning remains.
- `python3 -m unittest discover -s tests -v`: 40 tests ran successfully, with
  8 expected skips because the larger pinned raw source CSV files are absent
  from a clean clone. The frontend's bundled 67-record tests did not skip.
- actionlint, staged whitespace validation and the redacted staged secret scan
  passed. The publication PR records the hosted check results.

The team guide and `docs/preview.png` are included in the source publication.

## Data and build

- All six copied public JSON/GeoJSON assets match the supplied handoff files
  byte-for-byte using SHA-256 comparisons.
- `cd frontend && npm test`: 10 tests passed. Covers all 67 samples, A33/B34,
  coordinate order/bounds, identities, status counts, primary qualification,
  separate retests, missing values, safe public asset URLs and load failures.
- `cd frontend && npm run build`: passed with React 19.3.1, Vite 8.3.5 and
  MapLibre 6.15.0. Vite reports the lazy-loaded MapLibre renderer chunk exceeds
  500 kB. Its compressed size is approximately 290 kB; the worker is separate.
- A localhost production preview on port 4173 also reached map-ready state,
  rendered all 67 markers and had no runtime page exceptions. The development
  preview remains available on port 5173.
- Dependency installation reported zero known vulnerabilities at installation.
- `git diff --check`: passed.
- The existing actionlint 1.7.12 binary passed `.github/workflows/ci.yml`.
  `Frontend checks` was added without renaming existing required jobs. Hosted
  CI had not run at the initial local-verification milestone. See the frontend
  publication pull request for current hosted results.

## Browser checks

The script in `tests/browser-smoke.js` passed in Chromium against localhost:

- Geographic basemap reached ready state with all 67 sample markers.
- All/B/A/all filters produced marker counts 67/34/33/67.
- Clicking a group of nearby markers exposed a chooser. Sample `16MBW012`
  retained primary `>1 ppm`, raw `-2`, method `PGM-MS23`, and a separate
  `1.1 ppm` retest using `Au-AA25`.
- Sample coordinates and source details were present; closing details restored
  focus. Search, empty-search feedback and Enter/Escape interaction worked.
- Timeline preserved collection June–July 2016 and publication November 2016.
- Pending owners and statuses matched the handoff, with no fabricated results.
- Viewport widths 1440, 390 and 320 px had no document horizontal overflow.
  All sample centres remained framed after mobile resizing.
- A simulated 503 data response showed a retry state and recovered afterward.
- A deliberately unavailable WebGL context displayed all 67 locations in the
  geographic plot; keyboard selection and the nearby chooser still worked.
- No unexpected runtime page exceptions occurred. Deliberate failure checks
  can produce expected network/WebGL console messages.

Final screenshots: ignored `artifacts/desktop.png`, `mobile.png` and
`sample-details.png`. The mechanical design detector reported no findings for
the four JSX/CSS targets.

## Independent review

A fresh read-only reviewer inspected the handoff, final screenshots, UI/map code
and evidence mapping. Disposition: ship for the localhost demo, no material fixes.
The reviewer did not independently rerun the parent's browser or build checks.

## Limits

This is an evidence website, not a validated mineral-discovery or valuation
system. The basemap and terrain need external services; the data and fonts
are local. No underground model, interpolated heatmap, parcel boundary, land join,
MiroFish run, predictive score or algorithm decision has been fabricated.
Production hosting and broader browser/performance audits remain outside the
localhost scope.

## Green terrain and Mapbox-inspired redesign

The later design revision uses Mapbox's homepage as a visual reference while
retaining the dark-theme requirement. Green land cover and real Mapzen Terrarium
surface relief replace the near-black flat basemap. A Tok River centre tile at
z10/x103/y278 returned PNG data successfully, with varying decoded heights of
approximately 638–2234 m within that tile. This is a tile coverage check, not a
measured elevation range for every sample or the whole study area.

The complete derived Liberty style validated against the installed style schema
with zero errors. The terrain helper does not mutate its base style. Sample
assets, coordinates and evidence fields were not changed.

The full browser smoke script passed again after terrain/UI integration, including
67/34/33/67 marker counts, the qualified sample and separate retest, keyboard
focus, search, timeline, pending owners, 1440/390/320 px widths, all marker centres
framed after resizing, data-load retry and the no-WebGL geographic fallback.
The mechanical detector returned no findings. One optional base-style road-shield
sprite warning was observed; it did not prevent map or sample rendering.

Final visual confirmation checked the compacted comparison panel: B's
above-detection note is visible without scrolling at the default desktop size,
and source attribution is positioned to the left of the inspector. A fresh
independent reviewer inspected the final reference and website captures plus
the map/UI code, returning ship with no material findings. That reviewer did
not independently rerun the parent's interaction or build commands.

The Mapbox reference's actual computed font was Cera Pro. The website uses
open DM Sans as an adaptation, not an exact font copy. The automated Firecrawl
capture timed out; inspected Chromium pixels and computed styles supplied the
reference evidence instead. No Mapbox account, provider migration or deployment
was introduced.
