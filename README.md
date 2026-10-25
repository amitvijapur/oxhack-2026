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

The [five-minute pitch deck and editing guide](pitch/README.md) includes the
[editable PowerPoint](pitch/oxhack-pitch.pptx), [PDF](pitch/oxhack-pitch.pdf),
speaker notes, rehearsal flow and source images. Start from the PPTX when
revising the deck. The algorithm name remains open.

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

The website option calculator always opens and resets in hypothetical demo
mode. Recorded evidence and simulation scores remain attributed inputs; option
economics remain assumptions. The interface separates total **Expected net
cash** from **Change versus baseline** and shows the break-even entry premium.

The baseline demo assumes 500 recoverable troy ounces at USD2,000/oz and produces
USD1,500 assignment proceeds, a 48.8% sale probability and USD7.60 expected net
cash over 90 days. The 51.2% no-sale branch has cash of USD−700. These are
arithmetic assumptions, not observed resources, contract terms or predictive
performance. Explicitly applying the descriptive 2020–2025 gold CAGR of 14.22%
changes the illustrative expectation to about USD32.60.

With the flat 90-day baseline and other defaults unchanged, a USD500 premium
gives USD157.60 expected cash, USD650 gives USD7.60 and USD800 gives USD-142.40.
The break-even premium is USD657.60. A positive expectation still includes the
no-sale branch; it is not a guaranteed positive outcome.

To use the actual saved swarm post scores, open **Decision** and choose
**Use existing swarm results**. Approval and court blockage compare days 3–5
with the matching Claude sports-placebo run. The default hypothetical contract
returns about USD5.45 and USD10.22 expected cash respectively, alongside USD7.60
without a support adjustment. Weights, exposure, holding period and contract
assumptions recalculate through the same engine. Swarm support changes the
hypothetical gold price first, then mineral value, assignment value and cash.
The adjustable gold response defaults to a 7% maximum at a full-strength signal;
it is uncalibrated and source research checks remain failed. Missing scenarios and real-input
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
