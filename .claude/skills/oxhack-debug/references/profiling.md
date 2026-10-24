# Local profiling and hang diagnosis

Measure a baseline, change one thing, then measure again with the same workload.
Start with the resource under pressure: CPU, memory, disk, network, locks,
connections, or queues. Record representative input size, runtime version,
build mode, and the measurement's limits.

These are options for an owned local test process. Check official documentation
for the installed version and use existing tools. Attaching a profiler or
debugger can pause or slow a process. Profiles and snapshots may contain paths,
private values, or credentials. Prefer synthetic input, collect the minimum,
and keep raw artifacts outside Git. Do not expose an inspector or profiling
endpoint on a public interface.

## CPU

| Existing runtime/tool | Local option |
|---|---|
| Python standard library | `python -m cProfile -s cumtime script.py` |
| Node.js | `node --cpu-prof script.js` |
| Go | A bounded test or benchmark with a CPU profile, inspected with `pprof` |
| JVM | An existing local JFR or sampling-profiler setup |
| Native code | An existing sampling profiler for the local build/platform |

Distinguish expensive individual calls from cheap calls repeated too often.
Inspect collection sizes, nested scans, unnecessary work, and repeated I/O.
Use representative data rather than treating a toy benchmark as a scale claim.

For SQL, begin with a nonexecuting query plan against a disposable local
database. `EXPLAIN ANALYZE` executes the query, including its side effects; use
it only for an explicitly safe local test with disposable data. Consider query
counts, filters, row estimates, and applicable indexes before proposing changes.

## Memory

Warm the local process, capture a baseline, repeat the suspect operation a
bounded number of times, and compare at equivalent points. Look for both the
allocation site and the object retaining the allocation. Common causes include
unbounded caches, listeners not removed, closures, growing queues, and resources
not released.

Python's `tracemalloc`, a local browser's memory tools, or an already-configured
runtime heap profiler can help. Managed-heap tools may miss native allocations.
Memory increasing during warmup is not by itself proof of a leak. Avoid heap or
core dumps with real user input; use synthetic data and aggregate measurements.

## Hangs

Compare two local thread/task stack observations at different times. Look for
locks held in conflicting order, unresolved futures, blocked I/O, a full queue,
or a consumer that has stopped. Use an existing debugger or runtime stack
diagnostic only after accounting for process pauses and sensitive stack data.
Avoid locals dumps and terminating signals as routine diagnostics. In
particular, Go's `SIGQUIT` terminates the process; it is omitted from this
playbook's suggested actions.

Report the measured improvement and the conditions under which it was observed.
Do not claim causality or a complexity improvement from timing alone.
