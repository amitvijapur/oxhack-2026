---
name: oxhack-debug
description: Manually requested, evidence-first debugging of a named bug, failing test, unexpected output, or measured performance issue.
disable-model-invocation: true
---

# OXHack debug

Invoke `/oxhack-debug` with the symptom and the files or component to investigate.
This is an optional aid adapted from Muhammad's team kit. It does not run
automatically or add a commit, push, review, or merge requirement. Follow the
shared `AGENTS.md`, the current task's authorization, and the contributor's
existing workflow. Record useful findings in the existing task notes rather
than creating a separate ledger or workflow.

## Start with evidence

1. State the expected and actual behavior. Read the complete error and relevant
   code before editing. Identify the first incorrect value or state, which may
   precede the line that fails.
2. Find a small reproduction, preferably one command or an existing failing
   test. Record the input, environment, and observed result. If it cannot be
   reproduced, say what evidence is available and keep that limitation visible.
3. Check the active branch, saved files, build, runtime, dependency versions,
   configuration names, ports, and time settings. Verify API names and flags
   against the installed version and official documentation when needed.
4. Inspect recent changes with a targeted diff or history. Use redacted types,
   shapes, counts, and synthetic examples when inspecting inputs. Avoid printing
   credentials, complete environment values, private records, or request bodies.
5. Form a hypothesis with a prediction that could disprove it. Run the cheapest
   useful experiment and record what happened. Change one relevant thing at a
   time so the result is interpretable.

For a clear local failure, this may be enough to find and make a small fix.
When the result is ambiguous, deepen the investigation rather than stacking
speculative changes. Undo only an identified experiment you introduced, after
checking the current diff. Preserve teammates' and concurrent agents' work.

## Narrow an uncertain cause

- Compare independent evidence that fits the problem, such as a failing test,
  a redacted log, a metric, history, or a local profile. A fixed number of
  sources or failed hypotheses is not a stopping rule.
- Rank plausible explanations and test the one with the cheapest falsifying
  experiment. Keep rejected explanations in the existing notes to avoid loops.
- Bisect the input, code path, or environment difference. If history bisection
  helps, use a separate disposable worktree so other work is undisturbed.
- Walk backward from the failure to where the state was last correct. Repair
  the source of the bad state instead of suppressing its downstream symptom.

For **wrong output**, inspect intermediate values, units, boundaries, timezones,
clock changes, ordering, precision, and shared mutable state. For **slowness or
memory growth**, measure a baseline at a representative input size, locate the
cost or retained objects, then measure again. For **hangs**, inspect waits and
resource ownership in a local test process. See [profiling](references/profiling.md)
for bounded diagnostic options.

For intermittent failures, machine differences, or timing issues, see
[nondeterminism](references/nondeterminism.md). Diagnostics can change timing;
prefer a controlled reproduction and low-overhead observations.

## Fix and verify proportionately

Make the smallest authorized change that explains the evidence. Re-run the
reproduction and relevant existing checks. A focused regression test is useful
when it protects nontrivial behavior; a repeatable manual command may be enough
for a small reversible change. Compare before and after results when possible.
Inspect affected callers or contracts, remove your temporary diagnostics, and
report other occurrences outside the agreed scope instead of expanding it.

Do not weaken a test, hard-code its expected output, swallow an error, or add
retries or sleeps just to hide a failure. If the test or specification appears
wrong, explain the evidence before changing the expected behavior.

If progress stalls, reassess the facts and choose a different experiment.
Ask only when critical information or authorization is missing, or a necessary
decision falls outside the agreed scope. Continue useful authorized work in
parallel with that question. Never make production changes, capture private
dumps, or obtain credentials merely because this skill mentions diagnostics.

## Report

Keep the result brief and suited to the task:

- Cause or current best hypothesis, with the evidence and remaining uncertainty.
- Changes made and the relevant scope or callers checked.
- Verification commands and actual results, including checks not run.
- Useful follow-ups that remain outside scope.
