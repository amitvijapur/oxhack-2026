# Tok option model

This is an executable implementation of the [agreed strategy](../../research/tok-option-strategy.md). It screens observed sediment evidence and evaluates an explicitly hypothetical assignable mineral-interest option. All financial outputs are illustrative. No available Tok contract, executable buyer quote, fitted sale probability or predictive edge has been established.

## Run

From the repository root, with Node.js 24:

```sh
node --test model/tok-option/tests/*.test.mjs
node model/tok-option/demo.mjs
node model/tok-option/audit.mjs
```

The demo reads the shipped 67-sample snapshot, uses the same pure engine as React, and prints baseline, synthetic boundaries, an imported synthetic group-score example and the failed B evidence screen. It makes no network requests. The UI starts without demo economics enabled; select explicit demo assumptions to calculate.

## Modules

| File | Responsibility |
| --- | --- |
| `evidence.mjs` | Read primary Au qualifiers and form conservative fraction bounds. Retests remain separate. |
| `commodities.mjs` | Compatible, available-at-cutoff historical CAGR and dated price projection. |
| `valuation.mjs` | Hypothetical recoverable material exposure, interest fraction, conversion and call-shaped option proxy. |
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

The default fixture uses 500 assumed recoverable troy ounces at USD2,000 per ounce, zero growth, a 50% interest, conversion factor 0.02, assumed success probability 0.25 and remaining buyer consideration USD4,000. This gives conditional assignment proceeds USD1,500. Entry premium USD650 plus fee USD50 puts USD700 at risk. With an assumed 20% conditional sale hazard per 30 days and USD50 exit fee, the 90-day sale probability is 48.8% and expected net cash is USD7.60. The weighted unsold mark USD768 is separate from cash.

The synthetic group-score file gives signal 0.203, adjustment 1.421%, assignment proceeds USD1,521.315 and expected net cash USD18.00172. These are arithmetic fixtures, not delivered teammate runs or observations. Default evidence A is 25/33 passing samples; B is 16/34 and fails the 50% rule. These areas are longitude partitions, not legal option interests.

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

## Source coverage and diagnostic outputs

`runWorkbench` also returns `sourceAudit`, `swarmDiagnostics` and `cashDiagnostics`. The pinned land branch at `34eaf1d` joins all 67 sample identities to checked land layers. It supplies 10 heterogeneous deal examples, dated cost schedules, annual gold means and statewide surface sales. These provide context without becoming available option terms or liquidity estimates. See [land integration](../../research/tok-option-model/land-integration.md).

The UI can explicitly apply the 14.2201% descriptive CAGR of complete 2020–2025 annual gold means to a demo. Partial 2026 observations are excluded. With other defaults unchanged, expected 90-day cash becomes USD32.5973 versus USD7.60 at zero growth. Treating historical growth as a forward rate is an assumption, not a forecast or a backtest.

`diagnoseCash(result, {candidate})` derives exact sale/no-sale cash branches, probability of negative cash, median, worst supported outcome, 5th/95th percentiles and break-even thresholds. The baseline has 51.2% probability of negative cash, median USD-700, maximum break-even premium USD657.60 and minimum constant monthly sale hazard 19.72794%. Unsold marks are excluded. Negative cash while still holding the option need not be a realized economic loss.

Minimum-hazard thresholds are unavailable for increasing interval proceeds because changing hazard changes sale timing and can make expected receipts non-monotone. The maximum premium remains exact. The flat assignment-value threshold is explicitly a constant-price sensitivity. These thresholds do not override evidence, expiry, terms or risk gates.

## API and scope

`runWorkbench({ features, controls, swarmRuns })` returns the evidence screen, baseline/mapped results, signal contributions, horizon comparisons, live differences, assumption labels and portfolio selection. `DEFAULT_CONTROLS.mode` is `pending`. Only `demo` enables invented financial inputs. `real` preserves observed evidence and eligible imported simulations but has null financial outputs until actual inputs are wired in. Unknown numbers remain null; no `NaN` is rendered. Invalid weight sums are errors and are never silently normalized.

The workbench shows one explicitly hypothetical contract linked for demonstration to the selected evidence area. The independent `optimizePortfolio(candidates, { limits, ledger })` supports multiple already-evaluated candidates. Candidate records require `id`, `underlyingId`, `entryAction`, `amountAtRiskUsd`, `expectedNetCashUsd`. Pass outputs from `evaluateOpportunity`, not unvalidated external BUY labels. The optimizer trusts that prior validation boundary. Its optional ledger has `openRiskUsd`, `lifetimeCommittedUsd`, `openPositions`, `usedUnderlyingIds`. Omitted fields initialize a new zero ledger; explicitly null fields are invalid. Exits never reduce lifetime commitment or erase used underlying IDs. This module has no persistence or execution API.

The exact search allows an empty portfolio, disallows more than 20 candidates and chooses the greatest sum of positive cash expectations within all constraints. Equal objectives prefer lower committed risk. It does not optimize diversification or infer independence; every selected position can fail together.

The first version supports 30, 90 and 180 days, upfront unavoidable obligations, zero discounting and an assumed price-conditional marketing rule that closes at the model price. Below-fee proceeds invalidate the fixed sale policy. Unknown contract terms, later mandatory payments, expiry conflicts and missing liquidity block selection. The cap is 7% for the scenario adjustment, not a maximum investment loss. No exercise, borrowing, automatic execution or reinvestment exists.

`growthFromHistory` reports actual window coverage and rejects observations unavailable at the cutoff. A shorter available series is marked incomplete; it is not labelled five-year evidence. The UI's growth field is an explicit assumption and does not fetch prices. Additional materials require compatible quantities/prices and supplied provenance. The current evidence screen only uses Au; Li is not treated as a gold indicator.

## Verification

The tests compare fixed cash and horizon oracles, all 67 observed samples, primary assay bounds, no-sale branches, missing inputs, the partial swarm signal, equal-day weighting, unit/time errors, contract/risk gates, an optimizer example where greedy selection loses, ledger nonreplenishment, and UI adapter provenance. No test establishes market accuracy. Chronological price and sale-probability validation remains a later data-dependent task.
