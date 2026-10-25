# Prototype verification, 25 October 2026

The executable core, React adapter and workbench implement the accepted hackathon model. These checks establish implementation behavior, not predictive accuracy or a feasible real trade.

## Current local synthetic same-interest review, 25 October 2026

This local profile is `synthetic-same-interest-whole-contract-v1`. The frozen factor 30,000/650 scales both the invented reference quantity and buyer consideration. Quantity is 23,076.9231 assumed troy ounces and remaining buyer consideration is USD184,615.3846; ownership, conversion, geological probability and starting gold price are unchanged. It is not an estimate of resources, fair value or exit proceeds derived from historical contract prices. There is one assumed indivisible interest, not 46.15 tradable contracts. Entry-premium edits do not rescale the interest.

- Model suite: 140 tests passed, including independent Q-and-consideration linearity, premium/assignment invariance, custom exposure provenance, legacy publication compatibility and forged gate/metadata rejection.
- All 30 specification consistency checks passed. Convex ingestion: 16 tests passed with exposure context and legacy summary compatibility. Backend typecheck passed (`tsc --noEmit`, exit zero). Python publisher adapter tests: 8 passed. Full transport/browser/deck checks are reported by their owners; this lane made no network publication.
- Fixed fees USD50/50: baseline 90-day assignment USD69,230.7692; expected cash USD3,710.2154; upfront capital USD30,050; non-annualized return 12.3468%. Thirty days SKIP; 90/180 days are hypothetical candidates at Area A. Area B still fails evidence. No-sale probability remains 51.2% and median cash remains USD-30,050.
- `compareFeePolicies` runs the same selected interest through the existing evaluator. Proportional reference fees USD2,307.6923 each give USD350.7692 expected cash and 1.085714% return, but USD32,307.6923 risk exceeds the approved limit, so this variant SKIPS. The higher fixed-fee return is an assumption effect, not validated economic improvement.
- The 25% constant-assignment hurdle remains USD77,022.3361, above the selected profile's assignment value. It is neither a forecast nor an inserted target value.
- Real/pending financial values remain null. Strict failed research checks remain failed. No actual option/assignment outcome, calibrated return, historical-price-based resource mapping or investment edge is claimed.

This review is local only. No push, pull request, merge or deployment was performed by this lane. Earlier cost-only and low-premium checks below are retained as historical checkpoints.

## Historical cost-only whole-contract checkpoint, 25 October 2026

The active shared basis is `regional-initial-payment-whole-contract-v1`: USD30,000 selected historical initial-payment reference, plus separate assumed USD50 entry and USD50 exit fees and zero additional obligations. It is not a current Tok average, complete contract cost or available option. The existing 500-ounce valuation is unchanged and gives USD1,500 assignment proceeds. At 90 days, USD30,050 upfront capital and 48.8% sale probability give USD-29,342.40 expected cash and a SKIP. The approved hypothetical fund is USD1,502,500 with USD30,050 per-option and USD150,250 open/lifetime limits, preserving 2%/10% ratios and five whole lots.

- `node --test model/tok-option/tests/*.test.mjs`: 132 passed, zero failed. This includes whole-lot costs, fee-inclusive risk boundaries, nonreplenishing whole-position capacity, unchanged valuation/SKIP, historical arithmetic fixtures, canonical publication context and zero/multi-period hurdle cases.
- `node research/tok-option-model/validate-plan.mjs`: all 29 specification checks passed. The USD650/700 fixture and its original USD2,000 risk policy remain explicitly historical examples.
- `npm exec vitest run convex/ingest.test.ts`: 16 passed. Current summaries preserve the whole-lot basis and required-proceeds diagnostic; immutable historical v1 summaries remain readable.
- `npm run typecheck:backend`: exit zero, `tsc --noEmit` passed.
- Parent's full Python publisher/transport run: 16 passed with loopback permission. This lane also reproduced the 14 non-socket successes; two initial sandbox socket errors were environmental.
- `requiredAssignmentProceeds(result, {targetReturnRatio: 0.25})` reconciles through the existing monthly cash engine. The 90-day constant gross proceeds hurdle is USD77,022.3361; cash break-even is USD61,627.8689. Neither replaces the USD1,500 model assignment or establishes a resale price.
- Historical publication fixtures retain their original controls and material provenance. The active candidate has a new whole-contract identity; its unchanged assumed material exposure retains its original fixture source ID. New publication summaries label custom premiums separately from the historical reference.

These checks establish implementation consistency only. Source research checks remain failed or unknown, real mode still has null economics, and no assignment outcome, return calibration or trading edge is established. Frontend/browser and deck verification is recorded by their integration owners after this model/input checkpoint.

## Historical gold forecast verification before whole-contract alignment

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
