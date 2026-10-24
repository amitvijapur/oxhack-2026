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
deadlines, and eligibility details are labelled in those notes.

## Checks and merging

Follow the [team workflow and security guide](docs/team-workflow.md).
The initial CI checks repository hygiene, workflow validity, and committed
secrets. Application build and test checks will be added with the selected stack.
Keep each PR small. Teammate review is optional; merge after the required CI
checks pass on the current branch and all conversations are resolved.

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
