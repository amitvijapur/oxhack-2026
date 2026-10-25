# OXHack 2026

A team hackathon project built around the mandatory **TIME** theme. The current
prototype compares two Tok River, Alaska study areas using measured gold, with
lithium secondary, to support an investigation decision under a budget and
deadline. Future outcomes and decision probabilities remain explicit scenarios.

## Repository and shared workflow

The repository is [amitvijapur/oxhack-2026](https://github.com/amitvijapur/oxhack-2026), private initially. Amit uses
Codex with Cortex as his personal router. Teammates use Claude Code with their
existing skills. Everyone follows [the shared rules](AGENTS.md); no additional
workflow installation is required. Claude Code imports those rules through
`CLAUDE.md`.

Use short task branches, one owner per task, and frequent integration into a
runnable `main`. Track ownership, plans, and outcomes in [the task list](tasks/todo.md).
The integration owner and remaining team responsibilities are pending.

Team GitHub accounts: [amitvijapur](https://github.com/amitvijapur),
[meep-boop](https://github.com/meep-boop), [arjn15](https://github.com/arjn15),
and [iloveclouduk](https://github.com/iloveclouduk). All teammates have accepted
write access.

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
The initial CI checks repository hygiene, workflow validity, and committed
secrets. Application build and test checks will be added with the selected stack.
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

Raw sources and generated packs are ignored by Git. A pull supplies code and documentation; transfer the portable handoff or download the pinned source separately. MiroFish remains a separate workstream. No land contracts have been fetched or matched.

### Earlier copper prototype

The Arizona soil extractor and its artifacts remain available as the earlier prototype. Their commands and definitions are in [the soil contract](research/soil-evidence-contract.md). They are not the current gold/lithium packs.

## Application setup

The analysis is standard-library Python 3. The website is React, Vite and
MapLibre on Node.js 24, with an optional Convex backend and Vercel hosting.
These commands assume the decision engine (PR #26), the website (PR #27) and
the publishing layer (PRs #28 and #30) are on `main`. Run every Python command
from the repository root, because the scripts resolve their input paths from
the current directory.

### Decision engine

```sh
python3 -m unittest discover -s tests          # large raw CSVs absent: some tests skip
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json
python3 scripts/claims_forecast.py             # writes forecast_2025.csv
python3 scripts/decision_engine.py research/decision-engine/nv-forecast-demo.json
```

The Tok demo prints a JSON decision: the BUY/WAIT/SKIP signal, its status
(`manual_review` while land status and mineral rights are unconfirmed), the
outcome distribution, the month-by-month hold/sell/lapse plan, and the facts
that flip the result. [The decision engine guide](research/decision-engine/README.md)
explains every number.

### Website

```sh
cd frontend
npm ci --ignore-scripts
npm test                  # display contracts and evidence data
npm run test:backend      # Convex ingest
npm run build
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173/. The site runs without a backend; with
`VITE_CONVEX_URL` set it shows published workstream runs.

### Publishing a run to the website

Each owner publishes with their own secret from `.env.publish` (see
[the infrastructure guide](docs/infrastructure.md)). Check the payload first:

```sh
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json \
  | python3 scripts/publish_run.py decision - --run-id tok-demo-site-b --dry-run
```

Remove `--dry-run` to publish. The Decision card then changes from "Pending" to
"Live". Land and swarm runs use `publish_run.py land research/tok-land` and
`publish_run.py swarm <results.json>`.

### Demo walkthrough

1. Map: the 67 Tok River samples, Site A against Site B, with measured gold.
2. Decision card: the Tok Site B result. It is a conditional BUY under manual
   review, with an 87% chance of a loss and a long right tail.
3. TIME: the contract's payment schedule is the time axis. The plan says when
   to hold, the offer that justifies selling each month, and when to let the
   option lapse.
4. What to check next: the engine names the two facts that flip the decision
   (early completion of the option, and the date of the single 2025 staking
   event) before any money is paid.

## Open decisions

- Agree the MVP, data sources, success criteria, and team responsibilities.
- Confirm the submission deadline, judging format, repository rules, and exact
  Zed/Delta prize requirements.
- [ ] Review the repository and switch it to public before submission.

See [the repository plan](research/repository-plan.md) and
[the harness comparison](research/harness-comparison.md) for the current approach.
