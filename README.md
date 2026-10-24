# OXHack 2026

A team hackathon project built around the mandatory **TIME** theme. The project
idea is still being discussed. One candidate uses timestamped cultural or social
data to support a useful prediction and decision.

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

## Soil evidence utility

Amit's Site A pack and Arjin's Site B pack use one deterministic Python 3 extractor, the same USGS soil snapshot and the [frozen Arizona selection](research/site-evidence-selection.json). This utility uses the standard library and does not install an application framework. Read the [shared contract and handoff guide](research/soil-evidence-contract.md) for source acquisition, field meanings and provenance.

Place the exact source snapshot in the ignored data folder shown below, or supply its actual path:

```sh
python3 scripts/soil_evidence.py --source data/raw/us-soil/Appendix_4b_Chorizon_18Sept2013.txt --selection research/site-evidence-selection.json --area A --output data/generated/us-soil/site-a
python3 scripts/soil_evidence.py --source data/raw/us-soil/Appendix_4b_Chorizon_18Sept2013.txt --selection research/site-evidence-selection.json --area B --output data/generated/us-soil/site-b
python3 -m unittest discover -s tests -p 'test_soil_evidence.py' -v
```

Raw sources and generated packs are ignored by Git, so a pull alone does not transfer them. Use the handoff archive or the exact source file with its documented checksum. The pack contains measured soil evidence and explicit unknowns, not a mineral-discovery probability. MiroFish remains a separate workstream.

## Application setup

The language, framework, dependencies, and deployment approach are pending.
Rust and Zed are under consideration, with algorithm runtime as the performance
concern. No application setup or run commands exist yet. Add reproducible setup,
run, demo, and verification commands here when the stack is agreed.

## Open decisions

- Agree the MVP, data sources, success criteria, and team responsibilities.
- Confirm the submission deadline, judging format, repository rules, and exact
  Zed/Delta prize requirements.
- [ ] Review the repository and switch it to public before submission.

See [the repository plan](research/repository-plan.md) and
[the harness comparison](research/harness-comparison.md) for the current approach.
