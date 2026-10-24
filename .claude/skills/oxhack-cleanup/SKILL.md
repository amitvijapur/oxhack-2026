---
name: oxhack-cleanup
description: Manually requested, behavior-preserving cleanup of named files or the current task's diff, using existing project conventions and checks.
disable-model-invocation: true
---

# OXHack cleanup

Invoke `/oxhack-cleanup` with the files or diff to tidy. This optional aid is
adapted from Muhammad's `no-slop` skill. It does not run after every change or
before commits, pushes, PRs, or merges. Follow the shared `AGENTS.md`, the current
task's authorization, and the contributor's existing workflow. It introduces
no review gate, scoring step, or separate planning system.

## Bound the work

Use the named files or the current task's diff as the edit boundary. Read nearby
callers and contracts when needed to understand safety, but report unrelated
findings without changing them. Preserve concurrent edits and do not remove
someone else's work because it looks unfinished.

Identify the project's conventions and existing verification commands. Use
documented input sizes and observed workloads for performance reasoning. If
scale is unknown, state that uncertainty and avoid speculative optimization,
arbitrary growth assumptions, or a redesign.

## Make small, justified improvements

Inspect the relevant code, identify a concrete clarity or correctness benefit,
and change the smallest useful piece. Prefer behavior-preserving edits. For
nontrivial refactoring, a focused characterization check can help establish
equivalence; use verification proportionate to the change. Run relevant
existing checks and distinguish prior failures from regressions. Do not
introduce a test framework, dependency, tool, or new workflow for this skill.

Consider the following within the agreed scope:

- **Comments.** Keep explanations of constraints, invariants, units, and unusual
  decisions. Remove or correct misleading comments and redundant narration
  when it improves the touched code. Preserve useful contract documentation.
- **Names.** Match local vocabulary and language conventions. Choose the
  concept and unit the reader needs, with length suited to scope. Avoid both
  obscure abbreviations and unnecessary words. See [naming](references/naming.md).
- **Duplication.** Search for existing utilities before adding a helper. Share
  repeated knowledge when it has the same reason to change; leave coincidental
  similarity separate. Avoid a new abstraction that obscures distinct behavior.
  See [duplication](references/duplication.md).
- **Leftovers.** Remove your temporary diagnostics and code proved unused in
  this scope. Keep legitimate stubs, TODOs, tests, feature settings, and
  suppression comments unless evidence establishes they are obsolete and safe
  to remove. A missing ticket or an unfamiliar purpose is not that evidence.
- **Errors and boundaries.** Preserve meaningful errors and recovery behavior.
  Validate external input where appropriate. Do not replace a failure with a
  silent default or remove a check merely because types seem to cover it.
- **Structure.** Keep interfaces small and behavior cohesive. Inline wrappers
  that add nothing only when it makes the caller clearer. Keep helpers that
  explain a decision, isolate I/O, or provide a useful test seam.
- **Types and tests.** Clarify public contracts when already in scope. Keep
  tests that protect behavior. Never weaken assertions or disable a check to
  make a cleanup appear successful.
- **Sensitive data.** Keep real credentials, private payloads, raw dumps, and
  personal machine paths out of new code, reports, and Git.

## Performance only where relevant

For a measured concern or an evident hot path in scope, state how time and
extra memory grow with the actual inputs. Look for repeated scans, N+1 I/O,
unnecessary sorting, or unbounded accumulation. Preserve semantics when making
a small improvement. Treat caches, indexes, migrations, concurrency changes,
and wider redesigns as separate decisions unless already authorized.

See [complexity](references/complexity.md) for examples and
[existing tools](references/tooling.md) for bounded checks. Measure with
representative local input when a performance claim matters. Avoid claiming an
algorithmic improvement from a single timing result.

## Decisions and result

Use existing task notes for unresolved questions. Explain any change to public
interfaces, data formats, error contracts, dependencies, security, or semantics
before implementing it outside the agreed scope. Continue safe authorized
cleanup while a genuinely required decision is pending.

Report the scope, what changed and why, actual verification results, and any
relevant uncertainty or out-of-scope findings. Include complexity or timing
only when it contributed to the work. Do not restate unchanged code or imply
that manual use of this skill is required for integration.
