# Salman PR 26, reuse review

25 October 2026. Requested by Amit. Reviewed [PR 26](https://github.com/amitvijapur/oxhack-2026/pull/26), **Add the land-contract decision engine, claim forecast and Tok demo**, at `b34eff6ad1ce023d4440c114a290fe3c82a269c6`. The head was unchanged on the final check and the PR remained open. This is a targeted reuse review, not merge approval. The current Tok option engine and UI were not changed.

## Recommended integration order

| Priority | Take or adapt | Integration into our model |
| --- | --- | --- |
| 1 | Outcome distribution and downside display | Derive sale-interval cash outcomes and the no-sale branch from our existing dated cash model. Show probability of negative cash by the selected horizon, median cash and worst cash commitment alongside expectation. Keep the unsold contract mark separate; a cash shortfall while the option remains held is not necessarily a realized economic loss. |
| 2 | Break-even and fragility diagnostics | Show maximum entry premium, minimum sale probability and the assumption changes that flip selection. Start with deterministic sensitivity under the chosen assumptions, not a new fitted model or additional confidence score. |
| 3 | Swarm diagnostic checks | Add placebo, baseline-run sensitivity and scenario/mirror checks around the existing weighted signal. Preserve their status and reasons. Missing checks should remain unknown; an unstable simulation should not silently become an admissible news adjustment. These checks diagnose the simulator, not market predictiveness. |
| 4 | Source manifests and evaluation structure | Reuse source IDs, retrieval timestamps, hashes, chronological splits, baselines, calibration tables and trial logs when actual commodity, contract and sale outcomes arrive. Preserve fact availability separately from download time. |
| Later | Dynamic buyer learning, waiting and risk utility | Keep as a separately scoped research extension. Our approved first version has constant assumed sale hazard, upfront-only obligations, no exercise and a 30/90/180-day horizon. |

Source anchors: [outcome summary and break-even search](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/decision_engine.py#L559), [fragility analysis](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/decision_engine.py#L668), [swarm checks](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/swarm_adapter.py#L30), and [source manifests](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/claims_fetch.py#L256).

## What these additions reveal in our current fixture

Using the unchanged current baseline, with zero growth and constant 20% conditional sale chance per 30 days:

- Expected net cash by day 90 is **7.60 USD**.
- Sale probability is **48.8%**. The no-sale cash branch has probability **51.2%** and cash outcome **-700 USD**. The unsold option remains distinct from that cash outcome.
- The maximum break-even entry premium is **657.60 USD**, versus the assumed 650 USD. At equality expected cash is zero and our policy skips it.
- The minimum break-even completed-sale probability by day 90 is **48.2759%**, equivalent to a constant per-period hazard of **19.7279%** under this fixture.
- Break-even assignment proceeds are **1,484.43 USD**, versus the assumed 1,500 USD.

These are arithmetic sensitivity results, not empirical uncertainty bounds. Our model already calculates sale timing, no sale, costs and maximum upfront risk; Salman's contribution would make the distribution and decision fragility easier to see.

## Preserve our selected trade and limits

His Tok demonstration applies Nevada White Rock staged terms hypothetically to Tok, with a 72-month horizon, 300,000 USD funding budget, 100,000 USD loss limit and assumed early completion. The solver can pay remaining stages before selling the interest. Our trade is resale of an assignable option without exercise, with a 90-day target, 2,000 USD per-option commitment cap and 10,000 USD whole-cohort cap. His pricing, funding and policy engine therefore cannot replace ours without changing the agreed trade.

The reproduced demo reports expected value **8,218.91 USD**, loss probability **87.0038%**, median outcome **-12,819.45 USD**, worst outcome **-75,288.97 USD** and peak funding **252,919.96 USD**. It retains BUY under `manual_review` because land status and mineral rights are unknown. Removing its one recent staking event changes value to **-10,409.53 USD**. These are conditional model outputs, not evidence of a realizable Tok deal. Sources and rental-rate claims referenced from Arjin's branch were not independently legally or commercially verified in this review.

His [scenario mappings](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/research/decision-engine/swarm-mappings.json#L5) apply assumed buyer-conversion changes of +25%, -25% or -15%, and bid changes of -15% or -10%. Carry over the diagnostic concept while retaining our agreed capped price mapping and separate liquidity assumption. The upstream scored-results schema also differs from our normalized daily-score schema. Scenario names include `mine_approved`, `tax_rise` and `court_blocks_mine`; groups include `land_industry` and `land_community`. Map these explicitly after reading the actual export, rather than guessing missing scores from pass/fail flags.

A holder appearing in a claims dataset can help identify a potential counterparty. It does not establish option availability, authority to convey all relevant rights or assignment consent. Keep our unknown-term entry block. Similarly, the PR's cited statewide same-year gold/staking correlation does not resolve our separate relationship between commodity prices and mineral-interest value.

## Forecast research that should remain separate

The reported **+2.2% Brier skill** concerns next-year staking in previously staked Nevada/Arizona sections. It does not measure Tok option-price predictions or completed assignment probability over 90 days. The full data and generated forecast reports were absent from the PR review snapshot, so that empirical result was not independently reproduced.

The chronological and spatial evaluation structure is reusable. The static MRDS gold-site snapshot has an acknowledged historical availability issue; retain the no-gold baseline and use dated source availability before treating geological proximity as validated incremental skill. PBO=0 is a result over six supplied variants and 20 splits, not absence of overfitting risk. The trial pool includes a 60-day lag the author rejects as likely look-ahead. Annual significance tests and year resampling also need dependence sensitivity; five-fold scores share years and overlapping training data.

Source anchors: [target and reported transfer boundaries](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/research/decision-engine/claim-activity-forecast.md#L27), [chronological fit](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/claims_forecast.py#L264), [PBO implementation](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/claims_pbo.py#L27).

## Fix before copying code

1. **Conflicting action fields after failed gates.** `apply_gates({'action':'BUY','signal':'BUY'}, {'rights':{'status':'fail'}})` returns `status='excluded'` and `signal='SKIP'` while leaving `action='BUY'`. A consumer reading `action` alone would miss the gate. Canonical action and status must agree. [Source](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/decision_engine.py#L746).
2. **Zero buyer conversion crashes the swarm transform.** `GammaArrival(1,1,0)` passed to `apply_transform` with a q multiplier raises `AttributeError`, because zero is treated as missing and the code assumes mixture components exist. The Gamma probability functions also divide by q; zero needs an explicit no-buyer boundary. [Source](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/swarm_adapter.py#L62).
3. **Keyword labels are not probabilities.** “The government will not approve the mine” returns `approve` with probability 1.0. Preserve rule provenance, handle negation and avoid presenting one-hot keyword output as calibrated confidence. Keep these annotations outside monetary calculations. [Source](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/scripts/policy_extract.py#L39).
4. **Documented isolated engine test command fails locally.** On Python 3.14.7, dynamic import does not register `decision_engine` in `sys.modules` before dataclass processing. Use a normal import or register the module before `exec_module`. [Source](https://github.com/amitvijapur/oxhack-2026/blob/b34eff6ad1ce023d4440c114a290fe3c82a269c6/tests/test_decision_engine.py#L14).

## Checks performed

- Downloaded all 15 added files from the pinned PR commit into `/private/tmp/oxhack-pr26-b34eff6`; no branch checkout or merge.
- Reproduced the Tok CLI output directly from its checked-in fixture.
- The documented engine unittest invocation failed on import. With `decision_engine` imported normally first, **37/37 engine tests passed**, without editing the snapshot.
- Independent forecast review ran **15/15 forecast tests successfully**. No large datasets were downloaded or forecast fit rerun.
- Reproduced the failed-gate, zero-q and negated-policy cases above.
- Computed our baseline break-even values from the actual current workbench result and checked the flat-price algebra.
- No live model changes, PR comments, review submission, merge or push were made.
