# Shared knowledge and separate behavior

Ask whether a business or protocol rule changing in one place would require
the other copy to change too. If yes, a shared source can prevent divergence.
If the resemblance is incidental, keeping the code separate may be clearer.
Do not force a common abstraction solely to reduce line count.

Search for existing standard-library or project utilities before adding one.
Extend a function when the new case fits its existing name and contract. Prefer
a separate function or a smaller common core when merging would require mode
flags that split most of the body or make callers harder to understand.

A shared helper with accumulating caller-specific branches can signal a wrong
abstraction. Separating those paths is a refactor, so assess affected callers
and verify behavior within the agreed scope. Do not rewrite unrelated callers.

Repeated computation may be cheaper and safer than caching once invalidation,
memory, and coupling are considered. Introduce caching only when justified and
already authorized; a cleanup request alone does not authorize a new subsystem.
