# Application architecture

The application connects historical Tok River evidence to an explicitly
hypothetical mineral-interest assignment workbench. Time enters through source
availability, claim history, observed gold-price windows and 30/90/180-day holding
horizons. This is a demonstrator; no validated investment edge is established.

## Runtime and data flow

1. Next.js 16.4.3 and React 19.3.1 serve the app from `frontend/`.
   `src/app/page.tsx` opens the client-side Explorer.
2. `src/lib/showcase.ts` loads pinned display bundles from
   `public/data/showcase/`. `src/lib/evidence.js` independently loads and validates
   the 67-sample A/B handoff. Source identities and dates stay attached.
3. `src/components/earth/Earth.tsx` creates the Cesium 1.146.0 viewer. Esri imagery,
   Terrarium terrain and optional Macrostrat geology add geographic context.
   The Decide, Land, Crowd and Swarm panels share plot selection with the globe.
   Land keeps a compact grid of all plots beside the selected plot context;
   desktop uses a wider panel and phones stack the same content.
4. Decide separates the area-level geological screen from a hypothetical
   financial decision and cash-risk diagnostics. All financial evaluation flows
   through `model/tok-option/workbench.mjs`, also used by the offline demo and
   export CLI. A selected plot inherits its area's screen; it is not individually
   valued. The Detailed hypothetical model disclosure embeds `ModelWorkbench.jsx`
   for the selected area. Both views preserve the shared whole-contract lot basis.
5. The Next.js `src/app/api/[...path]/route.ts` delegates to one server route table
   in `src/server/routes.js`. `GET /api/health` reports runtime status;
   `GET /api/gold-price` exposes cached, attributed XAU data. Neither route runs a
   separate solver or writes model controls.
6. Optional Convex queries display attributed historical workstream publications.
   The local app remains usable without a configured Convex deployment.

Next's lifecycle scripts copy Cesium runtime assets from the locked package.
The production build uses the supported Webpack builder. Bundled DM Sans and
IBM Plex Mono WOFF2 files, licences and a hash manifest under
`frontend/src/app/fonts/` remove the Google Fonts build-time request.
Development and production servers bind to `127.0.0.1`, default port 3000.
The current local source does not imply a hosted deployment.

## Canonical model boundary

`model/tok-option/` contains pure evidence, valuation, commodity growth, swarm,
liquidity, cash-diagnostic and portfolio modules. `workbench.mjs` composes them
for React. Inputs preserve provenance and unknown values. Pending and real modes
cannot fill absent trade economics. Explicit demo mode uses invented contract,
quantity and liquidity inputs.

The model estimates assignment proceeds and expected cash with a dated sale
policy and a separate no-sale outcome. The unsold mark is separate from cash.
It neither exercises the option nor borrows, reinvests or executes trades.
Observed sediment values are an evidence screen, not recoverable ounces.
Historical gold CAGR can be selected explicitly as an assumption.

The website initializes and resets only hypothetical demo economics. It does
not expose the shared API's real/pending financial modes. Those API guards
remain intact for programmatic use. Total expected cash, changes versus baseline
and the break-even premium retain their distinct meanings.

The six pinned swarm score sets are partial simulated evidence. Missing scenarios,
incomplete interviews, failed placebo/mirror/grounding checks, provider/configuration
confounds and unknown input cutoff block strict monetary use. Diagnostic day means
remain inspectable. Synthetic imports are available only as labelled demonstrations.

An explicit **Use existing swarm results** selection enables a separate
illustrative policy inside demo mode. It compares approval/blockage with the
matching Claude sports-placebo run, preserves simulated source identities and
failed research diagnostics, and applies the selected support contrast to an assumed gold-price forecast.
The engine then recomputes material value, mineral-interest value, assignment
value and every monthly sale outcome. The response is applied once to gold;
there is no separate option markup. Each outcome retains a `goldForecast` trace
with baseline/scenario prices and uncalibrated method provenance. Pairwise configuration matching
establishes demo eligibility only. Strict imports and real mode keep their
original gates. Exports carry the comparison policy, run IDs, source revision,
unknown cutoff and research status so stored outputs retain their meaning.

## Publication boundary

`node model/tok-option/export.mjs [request.json]` produces a canonical decision
publication without credentials or network writes. No request exports pending
state. `scripts/publish_run.py` validates and dry-runs or publishes the attributed
envelope to a configured Convex HTTP endpoint. Convex authenticates each
workstream, validates payloads and stores immutable run data with checksums.
Stored publications do not overwrite live controls or establish current validity.
See [infrastructure](infrastructure.md) for exact setup and migration limits.

## Verification and provenance

Frontend tests cover evidence/API/presentation contracts; the independent model
suite covers arithmetic, risk gates, source adapters and unknown states. Convex
mock tests and publisher tests cover ingestion boundaries. Type checks and the
Next.js production build check integration. Browser checks cover the globe,
selection, panel navigation, responsive layout and explicit demo flow. The
commands are in [README](../README.md) and [the frontend guide](../frontend/README.md).

Historical research and source-branch references remain in `research/`. The
integrated path retains useful work from PRs 27, 29, 36, 37 and 38 and the latest
UI source. Superseded solver and deployment proposals are historical context,
not supported runtime instructions. See [remaining work](remaining-work.md).

## Retrospective event component

`research/event-study/evaluate.mjs` evaluates a frozen primary-source announcement ledger against attributed daily adjusted prices. It writes `frontend/public/data/event-study.json`, loaded by `EventStudy.tsx` in Decide’s Historical validation disclosure. This is a separate retrospective equity assessment; it neither changes option controls nor supplies a fabricated historical swarm score. Predictions use only pre-entry information and matured earlier training outcomes. The current negative comparison and source limitations remain visible. See [pilot results](../research/event-study/RESULTS.md).

The website return presentation divides canonical cash outputs by positive finite
upfront capital at risk. It never changes the canonical USD calculation or
publisher schema. Return deltas are percentage points, gold changes use starting
or baseline gold as labelled, and zero/missing denominators are unavailable. The
small-response synthetic UI preset is distinct from both recorded swarm inputs
and the retrospective historical test; selecting it does not alter either source.

## Shared whole-contract lot basis

`model/tok-option/lot-basis.mjs` owns the selected historical US$30,000 initial-payment
reference. Workbench defaults, publication context and UI consumers share this
basis. Entry/exit fees and additional obligations remain separately assumed.
Capital policy preserves 2% per position, 10% open/cohort risk and five whole
positions using a US$1,502,500 demo fund. A separate versioned synthetic exposure
profile freezes quantity and remaining buyer consideration by scaling the original
invented unit economics together once. The historical initial payment supplies no
resource or assignment valuation. Later premium edits never change exposure.
`compareFeePolicies` reuses the canonical evaluator on the same interest with
fixed and proportional reference fees, including the resulting risk failure.

The canonical diagnostics solve a required resale amount separately from the
valuation output. The 25% target does not feed back into gold, quantity or
assignment forecasts. The generated Swarm snapshot is rebuilt from committed
model inputs and retains source hashes. Historical small-dollar arithmetic
fixtures use explicit fixture controls rather than inheriting current defaults.
