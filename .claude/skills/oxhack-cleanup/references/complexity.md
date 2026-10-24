# Complexity and representative measurements

Use this reference for a performance concern within the requested scope. Name
the growing inputs, for example `n` rows and `k` returned results, and state both
time and extra space. Average, worst-case, and amortized costs can differ.
Constant factors and I/O can dominate at small observed sizes.

Examples to investigate, not automatic rewrite instructions:

| Pattern | Possible cost | Potential local improvement |
|---|---|---|
| Linear lookup inside a loop | O(n * m) | Build a set or map once, trading memory for lookup speed |
| Joining collections with nested scans | O(n * m) | Index one side by a key when semantics permit |
| Query or request per item | Many round trips | Use existing batching or a suitable query |
| Whole-table load for one result | Work proportional to table size | Filter near the data and inspect a query plan |
| Full sort for top `k` items | O(n log n) | Consider a heap, O(n log k), if the actual sizes justify it |
| Front removal from an array queue | Often O(n) per removal | Use an existing appropriate queue structure |
| Same pure work inside a loop | O(n * work) | Hoist the computation when inputs and semantics permit |
| Collection accumulating forever | Memory grows with history | Identify required retention before proposing a bound |

Do not add a cache without understanding invalidation, an index without its
write and storage costs, or batching without its ordering and error semantics.
Do not optimize an unknown workload by assuming an arbitrary future scale.

Measure with realistic local input, record the baseline and conditions, change
one thing, and repeat. Use existing profilers only when needed. Begin SQL
diagnosis with a nonexecuting plan on a disposable local database.
`EXPLAIN ANALYZE` executes the query, so it is appropriate only for an explicitly
safe test with disposable data. Profiles may contain sensitive values; collect
the minimum and keep raw artifacts outside Git.
