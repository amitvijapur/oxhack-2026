# Orecast developer guide

Setup, verification, model context and source material for contributors.
For the product overview and live demo, start with [Orecast](../README.md).

## Local development

Use Node.js 24 and the committed npm lockfile:

```sh
git clone https://github.com/amitvijapur/oxhack-2026.git
cd oxhack-2026/frontend
npm ci --ignore-scripts
npm run dev
```

Development and production servers bind to `127.0.0.1`, default port 3000.
The committed evidence and showcase snapshots support a fresh clone without
API keys, a Convex account or the ignored full data packs. Satellite imagery,
terrain and live gold observations require network access. The default globe
needs no map key. See [the frontend guide](../frontend/README.md) for optional
configuration, source limits, browser checks and alternate ports.

The application uses Next.js, React, TypeScript and Cesium. The lifecycle scripts
copy the locked Cesium runtime assets. Bundled fonts avoid a build-time request
to Google Fonts. [Optional Convex publishing](infrastructure.md) requires separate
account configuration; it stores attributed outputs without filling missing trade inputs.

## Verification

From `frontend/`, run the application, independent model and backend checks:

```sh
npm test
node --test ../model/tok-option/tests/*.test.mjs
npm run test:backend
npm run typecheck:backend
npm run typecheck
npm run lint
npm run build
npm start
```

`npm test` covers frontend evidence, API and presentation contracts. The model
suite exercises the shared engine. Backend tests use a local Convex mock.
`npm start` serves the production build locally; it does not publish a deployment.

From the repository root, check the publisher and inspect canonical outputs:

```sh
python3 -m unittest discover -s tests -p test_publish_run.py
node model/tok-option/audit.mjs
node model/tok-option/demo.mjs
node model/tok-option/export.mjs > /tmp/tok-pending.json
python3 scripts/publish_run.py decision /tmp/tok-pending.json --dry-run
node --test research/event-study/evaluate.test.mjs
```

The export without a request emits pending state. The dry run validates an
attributed publication without writing to a configured service. Read
[model verification](../model/tok-option/VERIFICATION.md) for numerical checks,
[frontend workflow verification](../frontend/WORKFLOW-VERIFICATION.md) for browser
coverage, and [the historical pilot guide](../research/event-study/README.md)
before reproducing the research outputs.

## Application and model boundaries

| Path | Responsibility |
| --- | --- |
| [`frontend/`](../frontend/README.md) | Explorer, Next.js API routes and optional Convex integration. |
| [`model/tok-option/`](../model/tok-option/README.md) | Pure JavaScript evidence, gold, assignment, liquidity and portfolio engine. |
| [`research/`](../research/) | Source contracts, acquisition steps, experiments and preserved planning history. |
| [`pitch/orecast/`](../pitch/orecast/README.md) | Current deck, speaker notes, source images and rehearsal guide. |
| [`brand/orecast/`](../brand/orecast/BRAND.md) | Wordmarks, bundled DM Sans fonts, tokens and usage rules. |
| [`docs/`](architecture.md) | Architecture, infrastructure, collaboration and remaining work. |

The shared model powers the interface, saved calculation snapshots and export
CLI. It models assignment before expiry over 30, 90 or 180 days, including costs
and a separate no-sale branch. Unsold model value remains separate from cash;
the app neither exercises an option nor executes trades.

Decide separates the comparison area's geological screen from its hypothetical
financial outcome. A selected plot supplies context rather than an individual
valuation. Detailed controls recalculate through the same engine. The separate
`/swarm` workflow replays pinned results; its saved calculations do not follow
edits in the live calculator. Read [the architecture](architecture.md) and
[model guide](../model/tok-option/README.md) for the implementation and equations.

## Evidence and model limits

| Layer | Meaning |
| --- | --- |
| **Observed** | Historical sediment assays, checked claim records and attributed commodity history. The 67 samples form A33/B34 comparison areas. Concentration does not establish recoverable ounces, available land or mineral rights. |
| **Simulated** | Six scored swarm runs across five stakeholder groups, including three baseline seeds. Recorded scores are not surveyed opinion. Missing scenarios and failed research checks remain visible. |
| **Assumed** | Contract economics, recoverable quantity, sale probability and the support-to-gold response. They make the mechanism reproducible without establishing calibrated predictive skill. |

### Current synthetic example

The approved example is **one synthetic whole contract** with **US$30,000 assumed
premium**, **US$50 entry fee** and **US$50 exit fee**. The initial-payment scale comes
from two selected historical signing payments, Tibbs and Northway. It is not a
current Tok market average, available quote or full contract cost.

Its exposure is frozen once from the original invented ratio, `s = 30,000 / 650`:
**23,076.9230769 assumed troy ounces** and **US$184,615.38 remaining buyer
consideration**. These inputs do not establish measured resources or market value.
Ownership is 50%, conversion 2% and geological success 25%. Editing the premium
never resizes the exposure.

At US$2,000/oz model gold, zero growth and an assumed 20% sale hazard per 30 days,
the no-event 90-day baseline gives **US$69,230.77 conditional assignment proceeds**,
**US$3,710.22 expected net cash** and **12.35% expected option return** on
US$30,050 upfront capital. Area A is a conditional model candidate; Area B fails
the evidence screen. Candidate is not a trade or measured edge. The website's
small-response startup preset is a separate sensitivity case. Live gold is separate
from these assumed inputs.

At 90 days, **51.2% of paths have no sale**. No-sale cash and median cash are
**−US$30,050**; an unsold model mark stays separate from cash. The higher headline
return depends on the fixed US$50 fees. Scaling each reference fee proportionally
to **US$2,307.69** instead gives **1.09% return** and **US$32,307.69 upfront**, which
**fails the US$30,050 per-option risk cap**. Neither fee policy is calibrated to
actual costs.

The assumed fund is US$1,502,500, with US$30,050 per option, US$150,250 open and
lifetime commitment caps, and at most five whole positions. This capacity does not
establish available contracts. Actual work, royalty, scholarship and recurring
obligations need separate inputs.

The **US$77,022.34** assignment amount required for a **25% expected 90-day return**
is a target hurdle, separate from the US$69,230.77 model valuation. It did not
determine exposure. Returns are non-annualized. The [model guide](../model/tok-option/README.md)
and [contract-pricing research](../research/orecast-contract-pricing/README.md) explain
the arithmetic and limitations.

The [approved ten-slide deck and handoff](../pitch/orecast/README.md) use this consistent synthetic interest. The [results report](../research/orecast-contract-pricing/consistent-lot-review.md) records the reviewed economics and limitations.

The [model guide](../model/tok-option/README.md) covers the synthetic UI preset,
recorded-run comparison, risk gates and alternative assumptions. Its gold response
remains uncalibrated. The historical initial-payment reference does not establish
resources, assignment proceeds or available contracts.

### Earlier cost-only comparison

The previous, unscaled 500-ounce example produced US$1,500 conditional assignment
proceeds and −US$29,342.40 expected cash (−97.65%) on US$30,050 upfront at 90 days,
so it returned SKIP. This is the earlier cost-only comparison shown in the README
screenshot, not the active synthetic exposure. Its unsold cash and model mark
were separate. The current profile and fee sensitivity above supersede it.

A separate [12-announcement historical pilot](../research/event-study/RESULTS.md)
compared an event adjustment with simple baselines using chronological holdouts.
The event adjustment performed worse in the five-event test set. This negative
result remains visible; it does not establish a swarm or option-trading edge.
[Remaining work](remaining-work.md) records the inputs and validation needed
for a useful real trade assessment.

## Data packs and research

Raw sources and full generated packs remain outside Git. Release downloads and
pinned acquisition commands supply them separately; compact display snapshots
are committed. Use Python 3 with the standard library for the documented pack
regeneration. Preserve original/retest identities, qualifiers, source hashes and
availability dates when extending the data.

- **Gold packs:** [download both packs](../research/gold-data-downloads.md), [evidence contract](../research/gold-evidence-contract.md), [verified build results](../research/gold-evidence-results.md), [source catalogue](../research/gold-source-catalog.json), [frozen A33/B34 selection](../research/gold-site-selection.json), [feasibility](../research/us-gold-dataset-feasibility.md).
- **Swarm:** [no-API method and handoff](../research/swarm-no-api-demo-plan.md), [integration findings](../research/tok-option-model/integration-review.md).
- **Model:** [strategy and historical amendments](../research/tok-option-strategy.md), [historical pilot reproduction](../research/event-study/README.md), [contract-pricing primary sources](../research/orecast-contract-pricing/README.md).
- **Earlier work:** [copper soil contract](../research/soil-evidence-contract.md), [ideas list](../research/all-ideas.md), [idea scores](../research/idea-scores.md).
- **Event:** [supplied Granola ceremony notes](../research/opening-ceremony-notes.md), [event context](../research/event-context.md).
- **Collaboration:** [repository plan](../research/repository-plan.md), [harness comparison](../research/harness-comparison.md), [task ownership and progress](../tasks/todo.md).

For canonical JSON export requests and attributed publication, follow the
[model guide](../model/tok-option/README.md) and [infrastructure guide](infrastructure.md).

## Deployment

Successful CI on a push to `main` triggers the
[Vercel deployment workflow](../.github/workflows/deploy.yml).
PRs do not deploy or receive deployment credentials. The repository owner
configures `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub Actions
secrets. Manual redeployment is available through
**Actions → Deploy → Run workflow** on `main`.

The public application is at [oxhack-land-arbitrage.vercel.app](https://oxhack-land-arbitrage.vercel.app),
with the [full swarm workflow](https://oxhack-land-arbitrage.vercel.app/swarm) at `/swarm`.

## Contributing

Use bounded task branches and follow [the shared rules](../AGENTS.md) and
[team workflow](team-workflow.md). Required checks are **Frontend checks**,
**Repository checks** and **Secret scan**. Teammate review is optional; current
required checks must pass and conversations must be resolved. Amit owns integration.
[Optional team tools](optional-team-kit.md) add manual debugging, cleanup and
secret scanning without another required workflow.

## Presentation and brand

Use the approved ten-slide [pitch and editing guide](../pitch/orecast/README.md),
[PowerPoint](../pitch/orecast/output/orecast-consistent-lot-review.pptx) and
[PDF](../pitch/orecast/output/orecast-consistent-lot-review.pdf). Earlier
[PowerPoint](../pitch/orecast/output/orecast-pitch.pptx) and
[PDF](../pitch/orecast/output/orecast-pitch.pdf) artifacts remain archived. The
[Orecast brand kit](../brand/orecast/BRAND.md) defines the wordmark, palette and typography.
The README cover generator is
[`build-cover.cjs`](../brand/orecast/readme/build-cover.cjs). With Node.js and
`@napi-rs/canvas` available in the authoring environment, run from the repository root:

```sh
node brand/orecast/readme/build-cover.cjs
```

The generator uses the committed tokens and fonts without a network request;
its renderer is an authoring tool, not an application dependency.
