# Intermittent failures and environment differences

Use only the parts relevant to the requested investigation. Work in an owned
local test environment and follow the parent skill's scope and privacy rules.

## Flaky tests

Measure the failure rate over a bounded number of repetitions. Compare an
isolated run with the relevant suite and, if already supported, shuffled order.
Record the command, repetition count, failures, and runtime. Use existing test
runner options; check their installed version rather than installing a plugin
or assuming a flag exists.

Common causes include:

- Async operations observed before a real completion condition.
- Races, lock ordering, or unordered results compared as ordered.
- Globals, database rows, files, environment settings, or fixtures leaking
  between tests.
- Network services, rate limits, DNS, or unavailable dependencies.
- Clock boundaries, timezones, DST, precision, or slow CI machines.
- Unseeded randomness and assumptions about hash or set order.
- Ports, connections, file descriptors, or temporary files not released.
- OS, path case, locale, and encoding differences.

When failures cluster, inspect shared fixtures and dependencies. Stabilize the
cause with explicit completion conditions, isolated state, a fixed seed, a
controlled clock, or a local network stub where appropriate. Repeatedly passing
does not prove a rare race is absent. Retries and longer sleeps are not evidence
that the underlying cause has been fixed.

## Concurrency

Use a race detector already available for the selected language and toolchain
when it fits the task. Exercise representative interleavings with a bounded
local workload, allowing for instrumentation overhead. Fewer threads and an
explicit barrier can help confirm a suspected ordering problem.

Breakpoints and logging can alter scheduling. Keep observations small and
redacted. Look for check-then-act races, missing waits, callbacks after teardown,
shared collections without synchronization, and conflicting lock order.

## Environment and configuration

Compare one difference at a time between the working and failing setups:

- Runtime and dependency versions, lockfiles, and build artifacts.
- Which configuration files and variable names were loaded. Compare presence
  or redacted metadata instead of dumping values or full files.
- OS, architecture, timezone, locale, permissions, line endings, and path case.
- Test data shape, feature settings, network endpoints, and local caches.

Use an existing clean local environment if helpful. Do not delete a teammate's
cache, replace shared data, install tooling, or change service configuration as
an implicit part of this comparison.

## An issue observed in a deployed service

A deployed-only symptom is evidence to investigate, not permission to operate
the deployment. Use already-authorized redacted logs and aggregate metrics,
compare recent changes, and construct a synthetic local reproduction. Any
rollback, traffic change, capture of private data, or production access needs
its own authorization. Keep private diagnostic artifacts outside Git.

For device issues, begin with safe observations of power, connection, selected
port, ownership, protocol settings, and parsing boundaries. Only exercise or
reconfigure hardware within the user's authorized test context.
