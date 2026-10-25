# OXHack 2026

A team hackathon project built around the mandatory **TIME** theme. The prototype combines a Tok River, Alaska land and evidence explorer with a
canonical mineral-interest assignment model. The Cesium globe connects historical
claims, 67 measured sediment samples, market context and six swarm score sets.
The Decision tab keeps missing trade inputs and failed simulation diagnostics
visible. Financial calculations require explicitly selected hypothetical assumptions.

## Repository and shared workflow

The repository is [amitvijapur/oxhack-2026](https://github.com/amitvijapur/oxhack-2026), private initially. Amit uses
Codex with Cortex as his personal router. Teammates use Claude Code with their
existing skills. Everyone follows [the shared rules](AGENTS.md); no additional
workflow installation is required. Claude Code imports those rules through
`CLAUDE.md`.

Use short task branches, one owner per task, and frequent integration into a
runnable `main`. Track ownership, plans, and outcomes in [the task list](tasks/todo.md).
Amit owns integration. Module ownership and remaining work are recorded in the task list.

Team GitHub accounts: [amitvijapur](https://github.com/amitvijapur),
[meep-boop](https://github.com/meep-boop), [arjn15](https://github.com/arjn15),
and [iloveclouduk](https://github.com/iloveclouduk). All teammates have accepted
write access.

## Pitch deck

The algorithm is named **Orecast**. The [current deck and editing guide](pitch/orecast/README.md)
includes the [editable PowerPoint](pitch/orecast/output/orecast-pitch.pptx),
[PDF](pitch/orecast/output/orecast-pitch.pdf), speaker notes, rehearsal flow and
source images. The [brand kit](brand/orecast/BRAND.md) includes transparent wordmarks,
fonts and palette tokens. The deck reflects the gold-first model and retains
the approved Palantir presentation style.

## Event brief

Read the [supplied Granola ceremony notes](research/opening-ceremony-notes.md)
for the working event brief and initial brainstorm. Unverified sponsor names,
deadlines, and eligibility details are labelled in those notes. The
[event context](research/event-context.md) adds the official schedule, the
Sunday 12:00 hacking cutoff, prize rubrics, and corrected sponsor names from
the slide deck. Every idea the team has scored so far, with status and the
reasons ideas were dropped, is in [the ideas list](research/all-ideas.md), and the deep check of the
shortlist is in [the idea scores](research/idea-scores.md).

## Checks and merging

Follow the [team workflow and security guide](docs/team-workflow.md).
CI checks repository hygiene, workflow validity, committed secrets, application
tests, type checks and the production build. See the workflow guide for required
check names and merge requirements.
Keep each PR small. Teammate review is optional; merge after the required CI
checks pass on the current branch and all conversations are resolved.

## Deploying

Every push to `main` that passes CI deploys to
<https://oxhack-land-arbitrage.vercel.app> through
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), whoever pushed.
Pull requests never deploy and never receive the credentials. To redeploy by
hand, run **Actions → Deploy → Run workflow** on `main`.

The workflow needs three repository secrets, set once by the repository owner:

```sh
gh secret set VERCEL_TOKEN -R amitvijapur/oxhack-2026   # paste a Vercel token for iloveclouduks-projects
gh secret set VERCEL_ORG_ID -R amitvijapur/oxhack-2026 -b team_E7NK1Ow5swOQOAdaFPLPSri1
gh secret set VERCEL_PROJECT_ID -R amitvijapur/oxhack-2026 -b prj_2XwaSZaMWlOgZ4ULciWz0xAyNyMo
```

The token comes from <https://vercel.com/account/tokens> (scope
`iloveclouduks-projects`); share it privately, never in chat or Git. Vercel's
own Git connection is not used: on the Hobby plan it skips commits by anyone but
the account owner on a private repository.

## Optional local tools

The [selected tools from Muhammad's kit](docs/optional-team-kit.md) provide a
staged secret scan, manual `/oxhack-debug` and `/oxhack-cleanup` skills for Claude
Code, and an explicitly loaded Claude permission profile. The Git hook and deny
profile are inactive until each teammate chooses to enable them. These tools
add no review requirement or separate workflow. Cortex remains Amit's personal
router.

## Gold evidence packs

**Team download:** [Get both gold packs and the original source](research/gold-data-downloads.md). The named release assets include the ignored data files; a Git pull alone does not.

Amit owns both current packs. [The verified build results](research/gold-evidence-results.md) list the data files, archives and checks. [The evidence contract](research/gold-evidence-contract.md) records the official source, exact regeneration commands, field meanings and future land-record join requirements. [The source catalogue](research/gold-source-catalog.json) pins the publication, download, metadata and file hashes; [the selection](research/gold-site-selection.json) freezes A33/B34. The [feasibility report](research/us-gold-dataset-feasibility.md) explains why this source is suitable for the demo and its limits.

Use Python 3 with the standard library. No framework is required. The contract's commands generate `data/generated/tok-gold/site-a` and `site-b` and run the focused gold tests. Each pack includes original records, normalized CSV, GeoJSON points, separately qualified primary/retest gold assays, secondary lithium, source provenance and an unevaluated land-match template.

Raw sources and generated packs are ignored by Git. A pull supplies code and documentation; transfer the portable handoff or download the pinned source separately. Pinned land-source context and MiroFish outputs are integrated separately.
Checked claim overlaps do not establish available contracts or mineral rights.

### Earlier copper prototype

The Arizona soil extractor and its artifacts remain available as the earlier prototype. Their commands and definitions are in [the soil contract](research/soil-evidence-contract.md). They are not the current gold/lithium packs.

## Application setup

The current application uses Next.js 16.4.3, React 19.3.1 and Cesium 1.146.0.
Use Node.js 24 and the committed npm lockfile:

```sh
cd frontend
npm ci --ignore-scripts
npm run dev
```

Open [the local application](http://127.0.0.1:3000/). Development and production
servers bind to loopback. The bundled evidence and showcase snapshots support a
fresh clone without the ignored full packs or a Convex account. Satellite imagery,
terrain, optional geology tiles and the live gold-price observation require
network access. No map key is required for the default globe. See the
[frontend guide](frontend/README.md) for optional configuration and source limits.

From `frontend/`, run the application checks:

```sh
npm test
node --test ../model/tok-option/tests/*.test.mjs
npm run test:backend
npm run typecheck:backend
npm run typecheck
npm run build
npm start
```

From the repository root, check the publisher and inspect canonical outputs:

```sh
python3 -m unittest tests/test_publish_run.py
node model/tok-option/audit.mjs
node model/tok-option/demo.mjs
node model/tok-option/export.mjs > /tmp/tok-pending.json
python3 scripts/publish_run.py decision /tmp/tok-pending.json --dry-run
```

`npm test` covers the frontend evidence, API and presentation contracts. The
separate model suite exercises the shared decision engine. Backend tests use a
local Convex mock. `npm start` serves the built Next.js app locally; it does not
create a hosted deployment. No hosted deployment or credentials are configured
by this repository integration.

## Model, architecture and remaining work

Use the explorer's **Decision** tab for source readiness, hypothetical controls,
cash outcomes and swarm diagnostics. `model/tok-option/` is the sole decision
engine used by the interface and export CLI. It models assignment over 30, 90 or
180 days, with an explicit no-sale branch. It does not exercise an option or
execute trades.

The website option calculator opens and resets to a small-response synthetic
demo. Its headline is **Expected cash return on upfront capital**, calculated as
expected net cash divided by premium, entry fee and unavoidable commitments.
Returns cover the selected holding period and are not annualized. Changes between
returns use percentage points; gold-price changes use their own price denominator.
Price/cost inputs and the worked cash arithmetic retain USD units.

The active demo uses one indivisible whole-contract lot with a US$30,000 initial
payment. This is the scale of two selected historical signing payments, Tibbs
2017 and Northway 2018, rather than a current Tok quote or full contract cost.
The [regional pricing workup](research/orecast-contract-pricing/README.md) records
primary sources, remaining obligations and the comparison limits. An assumed
US$50 entry fee puts US$30,050 upfront at risk before any additional obligations.
The assumed exit fee is US$50. Actual scholarship, work, royalty and recurring
commitments need separate inputs.

Amit selected the existing capital ratios at this lot size. The exact demo fund
is US$1,502,500, with US$30,050 per option (2%), US$150,250 open and whole-cohort
committed limits (10%), and at most five indivisible positions. Exits do not
restore the cohort allowance. This is a demonstration policy, not sourced fund
capital or a measure of safety.

The valuation remains independent of entry price. The original assumed 500
recoverable troy ounces at US$2,000/oz still yield US$1,500 conditional assignment
proceeds. At 90 days, the assumed 48.8% sale probability gives US$-29,342.40
expected net cash and a -97.65% return, so the model skips the lot. The 51.2%
no-sale branch has US$-30,050 cash. Its unsold model mark remains separate.
Increasing the entry basis has not established a higher resale value.

The website's synthetic preset retains its 1% gold-response cap, invented 0.5
support signal, 100% exposure, 50% retention and zero baseline growth. It changes
gold by 0.25% and assignment proceeds to US$1,506.25, yielding US$-29,339.35
expected cash at 90 days. Neither this preset nor the recorded scenarios covers
the new lot's entry cost. The separate real historical pilot retains its negative
result.

The workbench separately displays a required assignment hurdle. At the flat
90-day baseline, cash break-even needs US$61,627.87 in conditional assignment
proceeds and a 25% expected return needs US$77,022.34. These are target-solving
calculations using assumed liquidity and costs, not forecast or observed resale
prices. The earlier US$650 premium, US$700 upfront and US$7.60 expected-cash
example remains an explicitly historical arithmetic fixture only.

To use the actual saved swarm post scores, open **Decision** and choose
**Use existing swarm results**. Approval and court blockage compare days 3–5
with the matching Claude sports-placebo run. The default hypothetical contract
retains the recorded support signs. Under the canonical 7% cap and current lot
basis, approval and blockage remain negative and the decision is SKIP. Selecting
recorded results from the new preset retains the currently displayed pricing and response-cap assumptions; the output
therefore reflects those controls. Weights, exposure, holding period and contract
assumptions recalculate through the same engine. Swarm support changes the
hypothetical gold price first, then mineral value, assignment value and cash.
The adjustable gold response is capped at 7%; the website preset starts at 1%.
It is uncalibrated and source research checks remain failed. Missing scenarios and real-input
financial outputs remain unavailable. No new swarm or judge API call is needed.
See [the no-API method and handoff](research/swarm-no-api-demo-plan.md).

Read the [model guide](model/tok-option/README.md),
[architecture](docs/architecture.md), [remaining work](docs/remaining-work.md),
and [integration findings](research/tok-option-model/integration-review.md).
[Optional Convex publishing](docs/infrastructure.md) stores attributed outputs;
it requires separate account configuration and does not fill missing trade inputs.

## Open decisions

- Complete the trade-input and validation work in [remaining work](docs/remaining-work.md).
- Confirm the submission deadline, judging format, repository rules, and exact
  Zed/Delta prize requirements.
- [ ] Review the repository and switch it to public before submission.

See [the repository plan](research/repository-plan.md) and
[the harness comparison](research/harness-comparison.md) for the current approach.

### Historical event test

Decision now includes a real-data Alaska mining-share pilot above the hypothetical option calculator. It compares a gold-only drift forecast, a simple event adjustment and no change using a frozen 12-announcement ledger, delayed entry and chronological holdouts. The event adjustment performed worse in the five-event test set; the website shows this negative result and its limitations. It is not a validated swarm or option-trading edge. Read [results](research/event-study/RESULTS.md) and [reproduction instructions](research/event-study/README.md).

```sh
node --test research/event-study/evaluate.test.mjs
node research/event-study/evaluate.mjs
```
