# Evidence for a trading edge, 25 October 2026

Owner: Amit. Scope: bounded evidence audit and no-new-API evaluation. No application changes or paid simulations.

## Finding

The current system is an implemented hypothetical decision model. The current data do not establish incremental predictive value or net trading advantage. Positive expected cash generated under chosen assumptions is not evidence of either.

The strongest candidate hypothesis to investigate is local mineral-interest repricing: dated geological evidence, contract terms and stakeholder reactions might identify a change in project risk or buyer demand before an available contract reflects it. This is a hypothesis about information and timing, not an established inefficiency. Public evidence can already be priced in, and illiquid contracts may be impossible to exit profitably.

## Target mismatch

The recorded numerical score is mining_support, not gold returns, a buyer bid, a permission probability or willingness to pay. The current proportional gold response is an explicitly hypothetical demonstration. A fitted global gold baseline and a separately validated local project response would be a more defensible research design. Do not silently relabel mining_support as either target.

The World Gold Council's [2026 mid-year analysis](https://www.gold.org/goldhub/research/gold-mid-year-outlook-2026) describes broad demand, uncertainty, opportunity-cost and momentum drivers. Its [Qaurum framework](https://www.gold.org/goldhub/tools/gold-valuation-model) generates implied returns under hypothetical macro scenarios. Neither source validates this project's response coefficient.

The primary study [Location matters: Valuing firm-specific nonmarket risk in the global mining industry](https://doi.org/10.1002/smj.3153) finds evidence that stakeholder-related risks affect mining equity valuation around announcements. This supports investigating a local-risk mechanism. It does not prove predictive skill, delayed repricing, a tradeable signal, or transferability to Tok mineral options.

## Minimum empirical test

1. Predeclare a target and timing. For a cheap initial component test, use a public mining-company price response after a dated project announcement, adjusted for gold and broad market movement. A liquid equity proxy is not a land-contract return.
2. Freeze an event inclusion rule and all features using information available before the decision timestamp. Split by time and hold out entire events/issuers where possible. Do not split dependent posts from the same simulation into training and test observations.
3. Compare a no-event or gold-only baseline, a simple event-type baseline, and the same baseline with a genuine pre-outcome swarm signal. Fix weights/thresholds using training data only. If historical swarm predictions are unavailable, the swarm comparison cannot be claimed. LLM knowledge of historical outcomes is an additional leakage concern.
4. Evaluate held-out prediction error, direction and event-level uncertainty. To claim an economic advantage, use a declared executable entry time, transaction costs, slippage, no-sale risk and capital limits. A correct immediate reaction after the move has happened is not a timing edge.
5. Keep gold forecasting, local project response and option-sale validation separate. Evidence for one component does not automatically validate the entire strategy. Require actual option terms and completed assignment outcomes before claiming Tok option returns.

## Useful work without new swarm calls

The existing runs can test sensitivity, disagreement and robustness, retaining failed research diagnostics. Existing public price/event history can support an initial baseline or event component study after its availability is audited. Neither substitutes for missing observed outcomes paired with existing fictional swarm conditions.

The current model can also calculate the maximum premium justified under explicitly chosen stress cases. This makes the entry condition reviewable and identifies fragile outputs. It remains conditional decision support, not discovered alpha or a statistical confidence bound. More favourable assumptions must not be selected simply to obtain a positive answer.

## Audit results from the current repository

There are **zero real dated swarm-feature/realized-financial-outcome pairs**. The seeded Redpoll Ridge project is fictional, the day-one gold jump is stipulated, and day three is simulated hour 48. A run timestamp does not supply an event date or knowledge cutoff. Three matching Claude conditions have one seed each, and two contrasts share one placebo; 3,121 numeric posts do not supply independent financial outcomes.

The showcase includes 57 annual gold/claims rows (1970–2026), of which 56 have complete gold years. The active model has six complete annual gold means plus partial 2026. Publication availability is unverified. Claim counts and changing surface-sale aggregates are not option return labels. Ten Alaska deals and older heterogeneous comparables do not contain standardized Tok assignment resales or time-to-sale outcomes. The 67 assays have no recoverable-resource or geological-success labels. A point-in-time backtest was therefore not asserted.

A bounded canonical economic stress test gives:

| Assumed monthly sale hazard | Baseline expected cash, 90 days |
| --- | ---: |
| 19% | USD-20.59 |
| 20% | USD7.60 |
| 21% | USD35.09 |

The one-percentage-point liquidity stress changes cash by about USD28, larger than the recorded approval contrast's USD-2.15 or blockage contrast's USD2.62. This range is a sensitivity choice, not a confidence interval. At the default 20% hazard, break-even premiums are baseline USD657.60, approval USD655.45 and blockage USD660.22 against the assumed USD650 purchase premium. This is fragile conditional value, not an established edge.

Audit inputs were the pinned land/swarm bundles, showcase history/market, and committed swarm scenarios and seed documents at f2fe2971d9f041a819f7b7ff4a78e10f840884f5. Source research status remained failed in every economic calculation. The machine-readable results are in [edge-audit-results.json](edge-audit-results.json).
