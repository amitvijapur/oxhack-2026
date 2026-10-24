# OXHack shared project rules

## Direction

Build a useful, demonstrable project around the mandatory TIME theme. The idea,
prediction target, and application stack are still open. Read `README.md`,
`research/repository-plan.md`, and `tasks/todo.md` before starting work.

## Collaboration

- Give each task a human owner and a bounded file or module scope. Coordinate
  shared interfaces and dependency files before editing them.
- Preserve other contributors' changes. Avoid unrelated edits and do not revert
  someone else's work to resolve a conflict.
- Use a separate clone per teammate and short task branches. Keep `main`
  runnable, integrate frequently through brief pull requests, and name one
  integration owner. Use separate worktrees for concurrent agents when needed.
- Use the tools and skills available to you. Cortex, OMC, GSD, or another personal
  workflow is not required to contribute. Keep personal machine configuration
  and credentials out of the repository.

## Planning and completion

- Record the current plan, task owners, progress, and outcomes in `tasks/todo.md`.
  Keep plans proportionate to the work and update them when scope changes.
- Put reproducible setup, run, demo, and verification commands in `README.md`
  once the application stack is selected.
- Verify changes using relevant checks. Report the commands run and actual
  results, including any checks that could not run. Do not claim completion
  based only on generated code or an untested assumption.
- Commit placeholders in `.env.example`; keep real credentials and large raw or
  generated datasets outside Git. Document data sources and acquisition steps.
- Follow `docs/team-workflow.md` for CI, security, and merge requirements. Keep
  required check names stable and include relevant application checks when
  introducing a new application stack.

## If prediction is selected

Record when each observation became available, including publication delays.
Use chronological evaluation, fit transformations only on training data, and
compare against a simple baseline. Define the prediction target, horizon,
useful decision, and connection to TIME. Separate measured predictive value
from an interesting correlation.
