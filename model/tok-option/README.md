# Tok option model

This is an executable implementation of the [agreed strategy](../../research/tok-option-strategy.md). It screens observed sediment evidence and evaluates an explicitly hypothetical assignable mineral-interest option. All financial outputs are illustrative. No available Tok contract, executable buyer quote, fitted sale probability or predictive edge has been established.

## Run

From the repository root, with Node.js 24:

```sh
node --test model/tok-option/tests/*.test.mjs
node model/tok-option/demo.mjs
node model/tok-option/audit.mjs
```

The demo reads the shipped 67-sample snapshot, uses the same pure engine as React, and prints baseline, synthetic boundaries, an imported synthetic group-score example and the failed B evidence screen. It makes no network requests. The website opens in hypothetical demo mode; the programmatic API still defaults to pending.

## Modules

| File | Responsibility |
| --- | --- |
| `lot-basis.mjs` | Shared USD30,000 historical initial-payment reference, source links and limitations; separate assumed transaction costs. |
| `evidence.mjs` | Read primary Au qualifiers and form conservative fraction bounds. Retests remain separate. |
| `commodities.mjs` | Compatible, available-at-cutoff historical CAGR and dated price projection. |
| `gold.mjs` | Bounded, uncalibrated Au response with baseline/scenario prices and explicit timing provenance. |
| `valuation.mjs` | Applies the hypothetical swarm response to gold before material value, interest fraction, conversion and the call-shaped option proxy. |
| `swarm.mjs` | Versioned import validation, equal-day aggregation and baseline-relative group weights. |
| `liquidity.mjs` | Dated assumed sales, no-sale branch, conditional fees and separate unsold marks. |
| `portfolio.mjs` | Exhaustive subset selection for at most 20 indivisible options, cohort ledger and duplicate underlying exclusion. |
| `diagnostics.mjs` | Exact discrete cash outcomes, quantiles and deterministic break-even thresholds. |
| `integrations/land.mjs` | Sample-to-claim context, source coverage and descriptive annual gold CAGR. |
| `integrations/swarm.mjs` | Actual scored-report adapter, simulator checks and per-scenario readiness. |
| `data/*-source.json` | Small pinned source bundles with hashes, URLs and distinct source/retrieval dates. |
| `index.mjs` | Shared exports and the integrated opportunity evaluator. |
| `workbench.mjs` | React-facing adapter, demo controls, provenance and unavailable states. |

## Reproducible numbers

The active whole-contract lot uses a USD30,000 initial-payment reference from two selected historical payments, Tibbs and Northway. It is not a current Tok average, available offer, full contract capital or observed assignment price. Both observations involve the same acquirer. Northway's separate USD25,000 scholarship and USD400,000 first-year work obligation illustrate why the initial payment is not total capital. Demo application of this reference as an option premium remains assumed. Entry fee USD50, exit fee USD50 and zero additional obligations remain separate invented assumptions. See [pricing research](../../research/orecast-contract-pricing/README.md) and `LOT_BASIS` for sources and limitations.

The versioned `SYNTHETIC_LOT_PROFILE` defines one assumed whole-contract interest. It retains the invented reference unit economics using the frozen factor `30,000 / 650 = 46.153846`: quantity is `500 × factor = 23,076.9231` assumed recoverable troy ounces, and remaining buyer consideration is `4,000 × factor = USD184,615.3846`. Gold USD2,000/oz, zero growth, 50% ownership, conversion 0.02 and success probability 0.25 remain assumptions. Scaling both quantity and buyer consideration preserves the call-shaped valuation consistently. The historical initial payment does not establish these quantities or this valuation, and the factor is not a number of tradable contracts. Editing the entry premium never changes the frozen exposure or assignment price.

This synthetic interest gives assignment proceeds USD69,230.7692. Premium USD30,000 plus entry fee USD50 puts USD30,050 at risk. With an assumed 20% conditional sale hazard per 30 days and USD50 exit fee, 30/90/180-day expected cash is USD-16,213.8462 / USD3,710.2154 / USD20,995.4457. Non-annualized expected returns are -53.9562% / 12.3468% / 69.8684%. The 30-day case skips, while positive 90/180-day cases are hypothetical candidates only when the other gates pass. At 90 days, no-sale probability is still 51.2%, median cash is USD-30,050, and the weighted unsold mark USD35,446.1538 is separate from cash.

`compareFeePolicies({controls, evidenceGate, horizonDays, signal})` evaluates two fee assumptions for this same selected interest using the canonical evaluator. Fixed USD50 entry/exit fees produce the 12.3468% baseline return. Reference-unit fees scaled by the frozen factor are USD2,307.6923 each, producing USD350.7692 expected cash on USD32,307.6923 upfront capital, or 1.085714%, exactly retaining the old arithmetic return. That proportional-fee variant exceeds the approved USD30,050 risk cap and must SKIP. The higher fixed-fee return comes from the fee assumption, not a measured margin or predictive improvement. The helper neither resizes the interest when premium changes nor treats risk failure as eligible. Non-demo or invalid inputs produce no fee cases.

The hypothetical fund is USD1,502,500. Limits of USD30,050 per option and USD150,250 open/lifetime commitment preserve 2%/10% ratios and permit at most five whole lots including fees. These limits do not make negative expected cash eligible. `research/tok-option-model/fixtures.json` and `tests/helpers/legacy-fixture.mjs` retain the former USD650 premium / USD700 capital / USD7.60 cash example as explicit historical arithmetic tests, not active defaults.

The synthetic group-score file gives signal 0.203, gold adjustment 1.421%, gold USD2,028.42/oz, assignment proceeds USD70,870.3846 and active-lot expected net cash USD4,510.3477. These are arithmetic scenarios, not delivered teammate runs or observations. Default evidence A is 25/33 passing samples; B is 16/34 and fails the 50% rule. These areas are longitude partitions, not legal option interests.

## Gold forecast and valuation, model v2

The live chain is **swarm contrast → hypothetical gold price → material value → mineral-interest value → option assignment → expected cash**. At every 30-day sale date, the engine grows the baseline price, applies the assumed gold response once, and recomputes the contract value. A `goldForecast` trace on every outcome records baseline/scenario USD per ounce, price delta, effect, horizon, method and uncalibrated provenance.

```text
P_base(t) = P0 * (1 + annualGrowthRate)^(t / 365)
r_gold = goldResponseCap * signal * exposure * retention
P_gold(t) = P_base(t) * (1 + r_gold)
G(t) = sum(quantity_i * scenarioPrice_i(t))
V_success(t) = ownershipFraction * kappa * G(t)
A(t) = pGeo * max(V_success(t) - remainingBuyerConsideration, 0)
EV = sum(saleWeight_j * (A(30*j) - exitFee)) - upfrontCash
```

Only Au receives this response. The relative effect is held constant across sale dates, not compounded monthly or estimated as decay. `controls.goldResponseCap` defaults to 0.07 and accepts 0 through 0.07. Setting it, exposure, retention or signal to zero restores the baseline. The option can move more than 7% because the fixed buyer consideration creates sensitivity; its zero floor remains intact.

These scores measure mining support. The proportional relationship to future gold returns is an explicit hackathon assumption, not a fitted relationship. No statistical confidence interval, market accuracy or causal effect is implied. The common day-one gold jump is not added again. The editable starting gold price remains separate from the live header quote. Version `tok-option-demo-v2` distinguishes this method from the earlier direct option markup.

## Swarm handoff schema

`parseSwarmImport(text)` from `workbench.mjs` returns `{ runs, errors }`. `runs` is the validated full document, not only its inner array. Parsing verifies format, not truth. The workbench accepts the normalized schema below and the actual team report wrapped as `{ "report": <score.py report object>, "metadata": { "sourceId": "...", "knowledgeCutoff": "...", "eventDefinition": "...", "judgeCheck": <reported human check> } }`. Input knowledge cutoff must be supplied explicitly; generation/retrieval time cannot substitute for it. The supplied [example-swarm.json](example-swarm.json) is conspicuously synthetic and can be loaded explicitly in the UI to test weights.

```json
{
  "version": 1,
  "provenance": "simulated",
  "sourceId": "your-export-identifier",
  "knowledgeCutoff": "2026-10-25T00:00:00Z",
  "eventDefinition": "Describe the common baseline and each day-three event.",
  "scoreMetric": "mining_support",
  "scoreRange": [0, 10],
  "runs": [
    {
      "scenarioId": "baseline",
      "seed": 1,
      "runId": "unique-run-identifier",
      "days": [
        {
          "day": 3,
          "groups": {
            "government": [5],
            "industry": [5],
            "community": [5],
            "funds": [5],
            "retail": [5]
          }
        }
      ]
    }
  ]
}
```

This abbreviated schema example is incomplete, so its signal stays pending. Include days 3, 4 and 5 with nonempty scores for all five groups, both for the selected scenario and seed 1 baseline. Array entries are support scores from 0 to 10. First average within each day, then equally average the three days. Post counts never become financial weights. Valid scenario IDs are `baseline`, `mine_approval`, `proposed_tax`, `protest`, `sports_placebo`, `mine_blocked`, `gold_reversal`. Use `synthetic` provenance for invented examples and `simulated` for real simulation exports, never `observed` market data.

Invalid JSON, unsupported groups/scenarios, out-of-scale scores, malformed diagnostic metadata and duplicate scenario/seed/day identities reject the workbench import. Missing days/groups/runs preserve an incomplete import but yield `PENDING_SWARM`. Five news scenarios are evaluated independently. Actual simulated signals require complete applicable judge, baseline, placebo, grounding, direction and mirror checks before affecting model prices. Normalized simulated files may carry the upstream `sourceChecks` object; absent checks remain unknown. Synthetic fixtures bypass this readiness gate only in explicit demo mode and never claim passed diagnostics. Baseline and sports placebo are diagnostics; placebo cannot produce an entry candidate. Three baseline seeds define descriptive range bands, not confidence intervals. The baseline already includes the common hypothetical day-one gold breakout; the engine does not add it again.

The pinned `ahmed/gold-society-plan` branch at `f2fe2971` supplies six five-day score sets and a replacement judge check at 26/30. Three scenarios are absent, interviews are incomplete, placebo/mirror/grounding checks fail, and baseline/news configurations differ. Exact daily means are exposed through `diagnosticRuns` for inspection. The unknown input knowledge cutoff and failed readiness checks keep monetary `runs` null. See [swarm integration](../../research/tok-option-model/swarm-integration.md).

### Existing results in the website

The **Use existing swarm results** action selects explicit demo mode with
`controls.swarmPolicy = 'illustrative_contrast'`. The default policy is `strict`.
The illustrative policy compares the recorded Claude approval or court-block
run with Claude sports placebo `04_placebo_s1`. It requires matching pairwise
configurations and complete numeric group/day inputs. The three-day support
contrast is divided by ten and combined with the selected stakeholder weights.
The adjustable gold response cap, exposure and retention map it into a
hypothetical gold-price change. Mineral and option values are then recomputed.
There is no second direct option multiplier. Geology and sale hazard are unchanged.

The underlying source remains `simulated`; the output adds an illustrative-use
policy, method version, comparison run IDs, source revision and original failed
research status. The sports placebo is not a neutral no-news control, and there
is only one recorded Claude seed per condition. Default expected 90-day cash is
USD3,610.9704 for approval and USD3,831.3559 for court blockage, versus USD3,710.2154 baseline, on USD30,050 upfront capital. These use the same frozen synthetic interest and fixed fees. The recorded gold responses remain unchanged; assignment is recomputed for the declared larger exposure.
The surprising signs are preserved. Changing economic controls or weights
recalculates the same canonical model. Missing event scenarios remain unavailable.

This is a post-only hypothetical pathway. Missing interviews and source cutoffs
are disclosed rather than invented. It does not clear strict source readiness,
enable real-mode financial outputs, replace actual data with a synthetic fixture,
or establish predictive value. No new swarm or judge API calls are needed.

## Source coverage and diagnostic outputs

`runWorkbench` also returns `sourceAudit`, `swarmDiagnostics` and `cashDiagnostics`. The pinned land branch at `34eaf1d` joins all 67 sample identities to checked land layers. It supplies 10 heterogeneous deal examples, dated cost schedules, annual gold means and statewide surface sales. These provide context without becoming available option terms or liquidity estimates. See [land integration](../../research/tok-option-model/land-integration.md).

The UI can explicitly apply the 14.2201% descriptive CAGR of complete 2020–2025 annual gold means to a demo. Partial 2026 observations are excluded. With other defaults unchanged, expected 90-day cash becomes USD4,863.9388 versus USD3,710.2154 at zero growth. Treating historical growth as a forward rate is an assumption, not a forecast or a backtest.

`diagnoseCash(result, {candidate})` derives exact sale/no-sale cash branches, probability of negative cash, median, worst supported outcome, 5th/95th percentiles and break-even thresholds. The active baseline has 51.2% probability of negative cash, median USD-30,050, maximum break-even premium USD33,710.2154 and minimum constant monthly sale hazard 17.29895%. Its negative-cash probability equals no-sale probability only because every supported sale branch is positive in this selected example. Unsold marks are excluded. Negative cash while still holding the option need not be a realized economic loss.

`requiredAssignmentProceeds(result, {targetReturnRatio: 0.25})` validates the canonical sale distribution and returns the **constant gross assignment proceeds required** at every sale date to achieve a 25% non-annualized expected return. At 90 days, `U * (1 + r) / q + F` gives USD77,022.3361, while cash break-even requires USD61,627.8689. These are counterfactual hurdles, not forecasts or observed resale prices. The independently calculated synthetic model assignment stays USD69,230.7692, below the 25% target hurdle. The helper uses actual monthly sale probability, rejects inconsistent distributions/nonconstant exit fees, and leaves return hurdles unavailable with zero sales or no positive upfront capital. The canonical publication summary preserves separate `lotContext`, `exposureContext` and `assignmentHurdles` alongside monetary outcomes. Default versus custom exposure is derived from the selected valuation inputs, independently of premium edits. Historical inputs may omit new metadata; supplied contradictory metadata is rejected.

Minimum-hazard thresholds are unavailable for increasing interval proceeds because changing hazard changes sale timing and can make expected receipts non-monotone. The maximum premium remains exact. The flat assignment-value threshold is explicitly a constant-price sensitivity. These thresholds do not override evidence, expiry, terms or risk gates.

## API and scope

The website explicitly initializes and resets the workbench with `mode: 'demo'`
and exposes hypothetical financial controls only. This UI choice does not alter
the shared API's pending default or its real-mode missing-input guards. Expected
cash totals and changes versus baseline have distinct labels, and the website's
break-even premium is read directly from `diagnoseCash`.

`runWorkbench({ features, controls, swarmRuns })` returns the evidence screen, baseline/mapped results, signal contributions, horizon comparisons, live differences, assumption labels and portfolio selection. `DEFAULT_CONTROLS.mode` is `pending`. Only `demo` enables invented financial inputs. `real` preserves observed evidence and eligible imported simulations but has null financial outputs until actual inputs are wired in. Unknown numbers remain null; no `NaN` is rendered. Invalid weight sums are errors and are never silently normalized.

The workbench shows one explicitly hypothetical contract linked for demonstration to the selected evidence area. The independent `optimizePortfolio(candidates, { limits, ledger })` supports multiple already-evaluated candidates. Candidate records require `id`, `underlyingId`, `entryAction`, `amountAtRiskUsd`, `expectedNetCashUsd`. Pass outputs from `evaluateOpportunity`, not unvalidated external BUY labels. The optimizer trusts that prior validation boundary. Its optional ledger has `openRiskUsd`, `lifetimeCommittedUsd`, `openPositions`, `usedUnderlyingIds`. Omitted fields initialize a new zero ledger; explicitly null fields are invalid. Exits never reduce lifetime commitment or erase used underlying IDs. This module has no persistence or execution API.

The exact search allows an empty portfolio, disallows more than 20 candidates and chooses the greatest sum of positive cash expectations within all constraints. Equal objectives prefer lower committed risk. It does not optimize diversification or infer independence; every selected position can fail together.

The first version supports 30, 90 and 180 days, upfront unavoidable obligations, zero discounting and an assumed price-conditional marketing rule that closes at the model price. Below-fee proceeds invalidate the fixed sale policy. Unknown contract terms, later mandatory payments, expiry conflicts and missing liquidity block selection. The maximum cap is 7% for the gold-price response, not for the option movement or investment loss. No exercise, borrowing, automatic execution or reinvestment exists.

`growthFromHistory` reports actual window coverage and rejects observations unavailable at the cutoff. A shorter available series is marked incomplete; it is not labelled five-year evidence. The UI's growth field is an explicit assumption and does not fetch prices. Additional materials require compatible quantities/prices and supplied provenance. The current evidence screen only uses Au; Li is not treated as a gold indicator.

## Verification

The tests compare fixed cash and horizon oracles, all 67 observed samples, primary assay bounds, no-sale branches, missing inputs, the partial swarm signal, equal-day weighting, unit/time errors, contract/risk gates, an optimizer example where greedy selection loses, ledger nonreplenishment, and UI adapter provenance. No test establishes market accuracy. Chronological price and sale-probability validation remains a later data-dependent task.
