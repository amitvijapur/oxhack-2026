# Naming within the existing vocabulary

Choose the concepts the reader needs, use the codebase's term for each, and
apply the language's conventions. Include a unit where ambiguity matters, such
as `timeout_ms`. Context already supplied by a type or module need not be
repeated: `Invoice.total` is clearer than `Invoice.invoice_total`.

| Scope or concern | Guidance |
|---|---|
| Short loop or mathematical expression | A conventional `i`, `x`, or `k` can be clear |
| Local value | Name the concept, such as `retry_delay` or `rows` |
| Public symbol or field | Use a stable term understandable outside its immediate body |
| Boolean | Make the positive predicate and meaning clear |
| Established domain abbreviation | Keep familiar terms such as `id`, `url`, and `ms` |
| Several similar names | Name the actual difference rather than adding `2` or `new` |

Avoid vague names that survive far beyond their immediate context and verbose
names that repeat obvious mechanics. Do not rename solely to impose a personal
style. Public names, serialized keys, reflection, and external users can make a
rename a contract change; investigate before treating it as local cleanup.
