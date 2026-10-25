# Strategy and specification verification

25 October 2026. Scope: the consolidated strategy, editable configuration and static arithmetic fixtures. No production model, live offer, completed swarm run, portfolio engine or predictive advantage is verified by this record.

## Files

- [Current strategy and build plan](../tok-option-strategy.md)
- [Defaults and assumption provenance](defaults.json)
- [Static illustrative cases](fixtures.json)
- [Specification verifier](validate-plan.mjs)

## Commands and results

From the repository root:

```sh
node research/tok-option-model/validate-plan.mjs
node --check research/tok-option-model/validate-plan.mjs
git diff --check -- tasks/todo.md tasks/lessons.md
```

Results: 29 specification consistency checks pass; Node syntax check passes; tracked task/lesson whitespace check passes. A separate local scan checked the new Markdown/JSON/JavaScript files for trailing whitespace and the strategy's relative links. This is specification verification, not a substitute for testing the future model implementation.

The verifier covers the declared constants, group weights, weighted signal example, qualified-value and unknown-inclusive threshold rules, cash/probability/residual arithmetic, horizon probabilities, material growth before contract mapping, and declared missing-input/risk/expiry cases. It explicitly does not exercise a real adapter, optimizer, calibrated model, legal gate or transaction.

## Independent arithmetic

The parent recomputed the flat-growth 90-day cases separately using Python exact rational arithmetic. With sale probability `61/125`, entry commitment USD700 and exit fee USD50:

| Case | Conditional assignment proceeds | Expected net cash | Probability-weighted unsold mark |
| --- | ---: | ---: | ---: |
| Baseline | USD1,500 | USD7.60 | USD768 |
| Synthetic +1 signal | USD1,605 | USD58.84 | USD821.76 |
| Synthetic -1 signal | USD1,395 | USD-43.64 | USD714.24 |
| Synthetic weighted signal 0.203 | USD1,521.315 | USD18.00172 | USD778.91328 |

Signals and all financial inputs are invented. The unsold mark is separate from cash and never enters the conservative selection objective. Positive conditional resale profit does not guarantee positive expected cash after an unsold branch.

## Evidence interface audit

A separate read-only explorer inspected the current snapshot and evidence validator. It found 67 distinct sample records, A33/B34, with primary Au, one separate Au retest and secondary Li. It found no additional elemental fields in the compact public snapshot. It confirmed that the A/B boundaries are comparison-area extents, not legal parcels.

At the proposed primary Au threshold of 0.01 ppm, the audit counted A: 25 pass/8 fail/0 unknown and B: 16 pass/18 fail/0 unknown. The B result reported as greater than 1 ppm passes without substituting its separate 1.1 ppm retest. These are effects of an illustrative evidence rule, not resource or investment findings.

## Independent design review

A separate reviewer checked the consolidated strategy against the intake, configuration, fixtures and verifier source. Verdict: ready for the explicitly hypothetical build, with no material blocker. The review covered units, future-buyer information before exercise, hypothetical versus measured quantities, missing-input behavior, fixed-hazard assumptions, cash versus residual value, whole-cohort limits and bounded implementation phases.

Its clarity suggestion was incorporated: specify the fixture's interval-end quote/accept rule rather than merely naming a fixed selling policy. Parent integration also made the success/failure information timing, fixed consideration, same-hazard price comparison and earlier-strategy status explicit.

The independent sizing review had previously identified that open-position caps alone do not bound cumulative losses. The final specification uses one cohort, no reinvestment and a USD10,000 whole-run commitment limit.

## Work not yet verified

- Production engine functions, optimizer and React integration have not been implemented by this consolidation.
- Actual swarm exports, their completeness, diagnostics and exact schema await the teammate handoff.
- Suitable Tok option-price histories, unsold records, available contract terms and a calibrated sale-probability model are not available.
- The theoretical deposit-likelihood layer, hypothetical quantities and monetary conversion are not validated by sediment assays.
- No app deployment, Git publication or merge was performed. Existing frontend tests were not rerun because this task changes documentation/specification support only.
