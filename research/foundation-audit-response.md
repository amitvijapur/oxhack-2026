# Response to the strategy review

25 October 2026. Owner: Salman. This answers the [review of PR #23](https://github.com/amitvijapur/oxhack-2026/pull/24) (`research/salman-strategy-review.md` and amendments A1–A8 on `codex/combined-gold-land-strategy`). The review is right on almost every point, and the design is stronger for it.

**One design, not two.** The combined strategy in PR #24 (`research/gold-land-strategy.md`) is the current design for valuation, the decision ledger and the first deliverable. My [foundation document](gold-land-algorithm-foundation.md) stays as the research record, with each correction marked in place.

## Amendment by amendment

| ID | Review finding | Response | What changed |
|---|---|---|---|
| A1 | Identify the interest, rights, fraction and position; drop the universal surface floor | **Accepted.** An unpatented claim conveys mineral-development rights, not surface ownership ([BLM](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims)) | Floor withdrawn; surface value counts only when a contract conveys it |
| A2 | `area × geology × option factor` isn't dollars | **Accepted, with one nuance.** I dropped Kilburn's base acquisition cost per area (its own worked example is $500/km² × area × ratings), and the extra option factor counted gold twice. With the base cost restored, Kilburn is a recognised secondary method, so I keep it as a labelled cross-check beside comparables, not as the main value | Formula replaced. The development option is a later module that needs project inputs sediment assays don't give |
| A3 | Separate cash, shares, work, royalties and milestones; don't treat commitments as sale prices | **Accepted.** My catalogue had one agreement twice (AZ-08 and AZ-11), outcomes dated at the agreement (NV-03, AZ-03 and others) and royalty rows next to land rows | 10 normalization columns added and a check script committed. See [the catalogue README](gold-contract-comparables/README.md#normalization-for-modelling) |
| A4 | Dated cash-flow ledger, no extra waiting-value line, check funding before receipts, unknown ≠ SKIP | **Accepted.** My dollar breakdown added waiting value on top of an optimised payoff | The ledger must sum to the NPV; waiting value, risk and swarm deltas are shown beside it. Unknown gates give `manual_review` |
| A5 | Fix the swarm target and its five-day clock; map events to economics explicitly | **Accepted.** Ahmed's revised plan makes this concrete | [Input contract §1](foundation-input-contracts.md#1-swarm-prediction) rewritten around the seven Tok scenarios |
| A6 | Use the swarm as labelled stress scenarios; no precision fusion | **Accepted for the first version.** Seed spread isn't calibrated error | Black-Litterman fusion switched off; with/without comparisons instead |
| A7 | Validate activity, monetary and decision claims separately | **Accepted.** I overstated claim activity as the strongest proof of value | Validation text corrected |
| A8 | First milestone = exact fixture calculator; count the families actually used | **Accepted.** Two families can't pass a four-of-five rule. My worked example's $190/acre anchor (an antimony option and a bundled deal) and its instant resale are withdrawn as evidence | Rule now uses the families enabled; example marked illustrative |

## What the review keeps, and I agree should stay

- Forecasts and decisions stay separate, and the engine runs without the swarm.
- Time drives the product. Expiries, fees, waiting and buyer arrival are modelled through options. The review's own fixture is an option with an exercise decision, so real-options thinking remains the core TIME mechanism.
- Partial pooling across regions, now scoped to the **activity** target (claim bursts), where NV/AZ has data. Alaska transfer still needs Alaska outcomes.
- Gates, explanations, `available_at` discipline and baselines.

## The acceptance case, re-derived

I recomputed the review's [fixture](https://github.com/amitvijapur/oxhack-2026/blob/codex/combined-gold-land-strategy/research/strategy-amendments/decision-fixture.json) by hand and got the same numbers:

- Purchase: 0.6 × (130,000 − 2,000 − 500) + 0.4 × (90,000 − 2,000 − 500) − 102,000 = **$9,500**. The worst case is −$14,500, which breaks the $5,000 loss limit.
- Option: −3,000 + 0.6 × max(130,000 − 104,000, 0) + 0.4 × 0 = **$12,600**. The worst case is −$3,000, and $105,000 is needed before any receipts. **BUY the option.**
- At a $16,000 premium the option's expectation is −16,000 + 0.6 × 26,000 = **−$400**, so the result is SKIP.

This is the first thing the engine must reproduce.

## New since the review

- **Licensing changes what the engine may recommend.** Principal trades are fine. Brokerage for others is state-dependent, and selling fractions to passive investors can be a securities offering. See [land-contract licensing](land-contract-licensing.md).
- **Typed extraction.** Jev and OpenAI Decisions both exist and have nearly the same shape. One adapter supports either, plus a rules fallback. See [Jev extraction and images](jev-extraction-and-images.md).
