# Prototype verification, 25 October 2026

The executable core, React adapter and workbench implement the accepted hackathon model. These checks establish implementation behavior, not predictive accuracy or a feasible real trade.

## Current gold forecast, model v2

The current method applies the assumed swarm response to Au price first, then recomputes material value, interest, assignment proceeds and every monthly sale outcome. The old direct option markup has been removed. The sections below this one retain earlier v1 results and are historical.

- All 126 model tests pass, including 11 focused gold-chain tests and 16 publication tests. The 23 frontend, 21 Convex and 16 Python publisher/transport tests pass.
- Frontend and backend type checks, scoped lint, production Webpack build, 29 updated specification consistency checks and source audit pass.
- Independent direct-equation checks match positive/negative/zero effects, monthly growth, mixed materials and 30/90/180-day calculations. Only Au is affected. No-sale cash, evidence, expiry, risk and original source gates retain their behavior.
- Publication review caught an old-formula relabeling case. Saved v2 values and every monthly interval now match the canonical evaluator. Regression tests reject both old markup and altered interval forecasts. Existing v1 stored summaries remain readable.
- Production browser verifies baseline gold USD2000, assignment USD1500 and cash USD7.60. Recorded approval gives gold USD1996.47 and cash USD5.45; recorded blockage gives gold USD2004.30 and cash USD10.22. Zero cap restores baseline.
- Synthetic +1 yields gold USD2140, assignment USD1675 and cash USD93; synthetic -1 gives gold USD1860, assignment USD1325 and cash USD-77.80/SKIP. Missing tax remains unavailable.
- The new gold summary fits desktop and 320-pixel mobile layouts. Mobile page and model width checks pass. No browser errors were recorded. The current local production server uses port 5182.

The response coefficient and persistence are uncalibrated assumptions, and source research readiness remains failed. No statistical confidence interval or measured predictive edge is claimed. This implementation makes no paid swarm calls and does not deploy, push or merge itself.

## Existing swarm results in the current Next.js website

Follow-up: the website now initializes and resets in hypothetical demo mode
only. Other financial-mode controls were removed, while canonical API defaults
and real/pending guards were preserved. The production browser reproduces
USD157.60 cash at a USD500 premium and USD-142.40/SKIP at USD800, then resets to
USD7.60 and a USD657.60 break-even premium. Recorded approval remains positive
USD6.31 while its change is USD-1.29. The 23 frontend tests, typecheck/build,
scoped lint, independent UI/math review and 320-pixel overflow check pass.

The current implementation adds an explicit actual-post illustration to the
canonical workbench. The sections below this one retain earlier Vite/MapLibre
verification history.

- Canonical model suite: 108 tests pass, including pairwise configuration,
  source/provenance, strict/real/pending boundaries and publication regressions.
- Frontend suite: 23 tests pass. Convex mock suite: 19 pass; backend typecheck
  passes. Python publisher/transport suite: 16 pass with local mock-server
  permission. Two initial sandbox socket errors were resolved by rerunning with
  loopback access.
- Frontend typecheck and production Webpack build pass. Lint has no errors and
  four pre-existing backend warnings. All 29 specification checks pass.
- Independent source/boundary review passes, with 22 targeted model/publication
  checks. No source research check was promoted to pass.
- Browser checks reproduce approval USD6.31 and blockage USD9.17 versus baseline
  USD7.60. Exposure zero gives USD7.60; restoring exposure recalculates the actual
  contrast. Premium USD800 makes approval USD-143.69 and displays a skip result.
- Unsupported tax stays unavailable; real mode leaves both cash columns
  unavailable. Returning to existing results restores approval calculations.
- The existing-results control and cash summary fit 1440, 390 and 320 pixel
  layouts without page/panel overflow. No browser errors were recorded.

The price transfer and contract/liquidity inputs remain hypothetical. Source
run IDs, the Claude sports-placebo reference, unknown cutoff and failed research
checks remain attached to the calculation and optional publication summary.
No new swarm or judge API calls were made.

## Automated checks

- `cd frontend && npm test`: 51 passed, 0 failed. Includes 41 model checks and 10 existing evidence checks.
- `cd frontend && npm run build`: passed. The existing lazy MapLibre chunk still triggers Vite's large-chunk advisory.
- `node model/tok-option/demo.mjs`: passed. Baseline expected cash 7.60 USD; synthetic +1 sensitivity 58.84 USD; synthetic -1 sensitivity -43.64 USD; group-score example 18.00172 USD. A passes with 25/33 qualifying samples; B fails with 16/34.
- Independent numerical review compared 40 deterministic random portfolios with a separate bitmask optimizer and 48 growth/hazard/signal cases with direct equations. No central arithmetic discrepancy was found. Review findings about null ledger fields, unknown upfront obligations and malformed nested inputs were corrected and covered by regression checks.

## Browser checks

Verified on the local Vite server at port 5175:

- Demo opt-in, 30-day negative result, A/B gate, pending swarm with preserved baseline, synthetic positive/negative sensitivity, and real mode with unavailable financial outputs.
- Synthetic group-score example produces 18.00 USD expected cash. Changing industry/fund weights from 40/40 to 20/60 changes it to 19.03 USD.
- Clearing the premium input produces an explicit invalid-input state, not a zero-cost contract.
- Malformed JSON through a browser-created File exercises the file handler, displays a recovery message and retains the last valid import and 18.00 USD result. The browser tool's physical file-picker upload was unavailable because its configured workspace roots rejected local paths. The parser itself is covered by automated tests.
- All model inputs have accessible labels. Keyboard Enter toggles the equations disclosure while retaining focus.
- Desktop at 1440 pixels and mobile emulation at 390 pixels have no horizontal page overflow. Wide financial tables scroll inside their own containers. Inspected the calculation flow, assumptions, comparison, horizon chart, stakeholder table and worked equations.
- No model JavaScript errors observed. Existing external basemap warnings concern a missing road sprite and a boundary filter.
- One scoped design detector run returned no findings. Captures and review notes are under `.impeccable/review/tok-option/`.

The independent numerical reviewer supplied findings and checks before its usage limit ended the session. The final visual review and documentation pass were completed in the parent chat because further reviewer work was unavailable.

## Branch integration follow-up, 25 October 2026

The three diagnostics and pinned branch sources are integrated. All 93 tests and the production build pass. The existing MapLibre chunk advisory remains. `node model/tok-option/audit.mjs` reproduces the actual-source coverage and hypothetical comparisons recorded in `research/tok-option-model/integration-results.json`.

Independent review reproduced 24 source hashes, all 67 land joins, annual gold means and pilot statistics. It checked 48 real-mode combinations for null financial outputs. One malformed `sourceChecks` import crash was corrected, covered by regressions and rechecked as resolved. The browser file handler rejects that import while retaining the last valid synthetic result.

Browser checks confirmed the historical CAGR action changes growth to 14.2201258034% and expected cash to $32.60, real mode keeps monetary outputs unavailable, and switching to B shows 20/34 claim overlaps while retaining its failed assay screen. Expanded source disclosures have no page overflow at 390 px. Four desktop/mobile source and cash captures were independently reviewed with a ship disposition within that scope. Mobile swarm content was source-reviewed but outside the screenshot scope. The design detector returned no findings. Evidence is in `.impeccable/review/tok-integration/`.

## Current boundaries

The UI screens one explicitly hypothetical option associated with the selected comparison area. The core optimizer accepts up to 20 evaluated candidates. Land-source context and annual gold prices are connected, but actual contract terms, recoverable resources and assignment liquidity are missing. Real-input mode deliberately cannot allocate. The swarm branch has a pilot only; the actual scored-report schema is now supported, with missing/failed applicable diagnostics blocking price effects. Historical gold CAGR can be applied explicitly as a demo assumption, not a validated forecast. No real orders, exercise, deployment, push or merge was performed by this integration.
