# Branch integration and remaining gaps

25 October 2026. Built locally for Amit. The source branch heads were checked again after implementation and remained unchanged.

## What is connected

| Input | Delivered evidence | Model treatment |
| --- | --- | --- |
| Tok land, `34eaf1d` | All 67 sample joins; active-claim overlaps A2/33 and B20/34; recorded holders and land layers | Observed context, without assuming verified title or an available interest |
| Historical gold | Complete annual means for the 2020–2025 window; descriptive CAGR 14.2201% | Explicit opt-in demo growth; never an automatic forecast or current quote |
| Land and mineral deals | Statewide surface-sale summaries, 10 heterogeneous Alaska deals, dated holding-cost tables | Background context; not a Tok mineral-price baseline, floor, contract quote or assigned liability |
| Swarm, `d7717cd` | Nine input configurations, day-one pilot, judge agreement 27/30 | Pilot and source-readiness display; no completed news signal |

Source lineage, hashes, exact revisions and limitations are in [land-integration.md](land-integration.md), [swarm-integration.md](swarm-integration.md), and the small bundles under `model/tok-option/data/`.

The swarm pilot contains 296 rows, all day 1, with 277 on-topic scores. It is explicitly a timing/format pilot, not one of the nine completed scored runs. The branch has no final report or complete days 3–5 scenario outputs. The judge agreement check validates scoring consistency only.

## Three diagnostics added

1. Discrete sale/no-sale cash outcomes, negative-cash probability, median and worst supported outcome, with the unsold mark kept separate.
2. Maximum entry premium, premium headroom, minimum sale probability/hazard where the timing relationship supports it, and an explicitly flat-price assignment threshold.
3. Swarm judge, baseline spread, placebo, interview stability, grounding, scenario direction and mirror checks. Missing or failed applicable checks block an actual simulation from changing the model price. Synthetic fixtures remain labelled demo inputs.

The import accepts the actual upstream scored-report schema through an attributed wrapper. It retains daily means as aggregates, preserves post counts, explicitly translates names and requires an input knowledge cutoff. It does not fabricate raw posts or infer source availability from retrieval time.

## Reproduced results

| Case | Assignment value at day 90 | Expected net cash | Decision |
| --- | ---: | ---: | --- |
| Existing zero-growth Area A demo | $1,500.00 | $7.60 | Illustrative buy candidate |
| Explicit historical-CAGR demo | $1,583.32 | $32.60 | Illustrative buy candidate |
| Actual branch, mine-approval news | Unavailable | Unavailable | Swarm pending |
| Area B, existing baseline economics | $1,500.00 | $7.60 | Skip, evidence screen fails |
| Real-input mode | Unavailable | Unavailable | Required inputs missing |

Baseline negative-cash probability is 51.2%, with median and worst supported cash outcome of -$700. The maximum break-even premium is $657.60 versus assumed $650, leaving $7.60 headroom. Minimum completed-sale probability is 48.27586%, equivalent to a constant 19.72794% chance in each 30-day interval. Flat assignment value breaks even at $1,484.43. All are conditional arithmetic, not empirical uncertainty estimates. Negative cash at the horizon is distinct from a realized loss while an option remains held.

## Gaps that remain

- A verified available Tok option, executable premium, conveyable rights, assignment consent, expiry, capped obligations and release on assignment.
- Recoverable material quantity, geological success probability and defensible material-to-interest conversion.
- Compatible Tok mineral-interest transaction history and completed/unsold assignment observations to estimate sale probability and resale prices.
- Completed swarm scenarios with their diagnostics and source knowledge cutoff.
- Chronological evaluation against a simple baseline using outcomes available at each historical cutoff.

More claim overlaps in B do not change its sediment screen or prove greater recoverable value. Public surface-land sales do not become a mineral-interest price floor. Hypothetical gold growth does not establish an edge. The new information fills source context and diagnostic coverage; it does not fill all valuation or liquidity inputs.

## Verification

`npm test` in `frontend/` passed all 93 tests. `npm run build` passed with the existing MapLibre chunk-size advisory. `node model/tok-option/audit.mjs` reproduces [integration-results.json](integration-results.json).

Independent review reproduced all 24 source hashes, all 67 land joins, annual gold observations and pilot statistics, and checked 48 real-mode combinations for null financial outputs. It found a malformed diagnostic-import crash; this was fixed, regression tested and independently rechecked as resolved. Browser checks confirmed rejected imports preserve the last valid result, historical growth updates the demo, A/B context switches correctly and real mode keeps money unavailable.

Desktop 1440 px and mobile 390 px have no page overflow; wide tables scroll inside their containers. A separate UI reviewer returned ship for the four supplied source/cash section captures. Expanded disclosures were source-reviewed and checked for overflow; mobile swarm content was not in the screenshot scope. The scoped design detector returned no findings. No visual-system change was made.

No branch merge, push, deployment or trade was performed. The local workbench is available at `http://127.0.0.1:5175/#option-model`.
