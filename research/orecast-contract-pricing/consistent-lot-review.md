# Orecast consistent-lot review

Local review only. No push, merge or deployment is authorized.

A consistent synthetic larger-interest illustration using the original invented unit-economics ratio. The historical initial payments do not independently establish this economic exposure or resale price. No parameters were chosen from a target return.

## One frozen hypothetical interest

The scale factor is 46.153846154, applied once to both the original 500oz exposure and $4,000 remaining buyer consideration. The proposed single contract has 23,076.923 assumed conditional troy ounces and $184,615.38 remaining buyer consideration. Ownership stays 50%, material conversion 2%, geological success 25%, gold $2,000/oz and baseline growth zero. Neither quantity nor buyer consideration changes when the premium changes. This is a synthetic design choice, not the valuation of Tibbs or Northway.

The independent input sequence is:

`success value = 50% × 2% × (quantity × gold price)`

`assignment = 25% × max(success value − remaining buyer consideration, 0)`

`E[cash] = sum(monthly sale weights × (dated assignment − exit fee)) − all upfront capital`

The model's arithmetic is independent of subsequent premium edits. The chosen default profile nevertheless retains the original invented assignment-to-premium ratio, so it does not independently establish fair value.

## What changed

| Example | Conditional assignment | Upfront capital | Expected 90-day cash | Expected return | Model action |
| --- | ---: | ---: | ---: | ---: | --- |
| Original small arithmetic fixture | $1,500.00 | $700.00 | $7.60 | 1.09% | BUY_CANDIDATE |
| Rejected entry-only change | $1,500.00 | $30,050.00 | -$29,342.40 | -97.65% | SKIP |
| Proposed frozen larger interest, fixed fees | $69,230.77 | $30,050.00 | $3,710.22 | 12.35% | BUY_CANDIDATE |

## Same interest, different fee assumptions

| Fee case | Entry fee | Exit fee | Expected return | Upfront capital | Risk gate | Model action |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Fixed per-contract fees | $50.00 | $50.00 | 12.35% | $30,050.00 | PASS | BUY_CANDIDATE |
| Proportional reference fees | $2,307.69 | $2,307.69 | 1.09% | $32,307.69 | FAIL | SKIP |

Both rows use the same quantity, buyer consideration, assignment value, sale hazard and premium. The higher fixed-fee return comes from assumed fee economics. The second row exceeds the $30,050.00 per-option cap.

## Holding horizons with fixed fees

| Horizon | Conditional assignment | Upfront capital | Expected cash | Non-annualized return | Model action |
| --- | ---: | ---: | ---: | ---: | --- |
| 30 days | $69,230.77 | $30,050.00 | -$16,213.85 | -53.96% | SKIP |
| 90 days | $69,230.77 | $30,050.00 | $3,710.22 | 12.35% | BUY_CANDIDATE |
| 180 days | $69,230.77 | $30,050.00 | $20,995.45 | 69.87% | BUY_CANDIDATE |

## Recorded scenario comparisons, 90 days

| Scenario | Conditional assignment | Upfront capital | Expected cash | Non-annualized return | Model action |
| --- | ---: | ---: | ---: | ---: | --- |
| mine_approval | $69,027.40 | $30,050.00 | $3,610.97 | 12.02% | BUY_CANDIDATE |
| mine_blocked | $69,479.01 | $30,050.00 | $3,831.36 | 12.75% | BUY_CANDIDATE |

The recorded contrasts remain simulated mining-support comparisons with failed research checks and an uncalibrated transfer to gold. They do not establish a historical trading edge.

## Cash risk and target hurdle

Sale probability is 48.80% and no sale is 51.20% at 90 days, both under assumed liquidity. No-sale cash and median cash are -$30,050.00. An unsold model mark is separate from cash. A positive expectation does not make the result typical or guaranteed.

A 25% expected return requires $77,022.34 constant gross assignment proceeds under the same fixed-fee liquidity assumptions. It remains a requirement, not the forecast. Raising the premium to $40,000 leaves assignment at $69,230.77, makes expected cash -$6,289.78, and gives SKIP.

## Source boundary

The two historical $30,000 signing payments give an initial-payment scale only. The [2019 issuer AIF, pp7,13–15](https://www.tectonicmetals.com/_resources/financials/TECT-AIF-2019-Final.pdf?v=061201) reports no identified mineral resources or reserves for its properties at that time. The [Tibbs agreement description, p4](https://www.tectonicmetals.com/_resources/financials/MDA-Q2-2019-FINAL.pdf?v=070606) and [Northway financial note, pp17–18](https://www.tectonicmetals.com/_resources/financials/FS-Tectonic-2018YE-AUDITED.pdf?v=090403) describe different long-term rights and substantial additional payments and work obligations. They do not support the synthetic resource quantity, short holding term or assignment value used here.

- The original reference inputs are explicitly invented. Maintaining their valuation-to-premium ratio cannot validate a market margin.
- The larger return with fixed fees reflects their lower proportional burden. Proportionally scaling both fees retains the original return.
- The proportional-fee case exceeds the current per-option risk cap and cannot be presented as an eligible trade.
- Conditional quantity is not a measured resource or reserve. A/B are evidence partitions, not matched legal parcels.
- The unsold mark is separate from cash. Negative cash at the horizon while still holding an interest is not necessarily a realized economic loss.
- No available assignable contract, full actual obligation schedule, buyer bid, calibrated sale hazard or predictive edge is established.

Reproduce from the repository root with:

`node research/orecast-contract-pricing/build-consistent-lot-review.mjs`

Local model input commit: `69a0b5b4d2ca8db16cc46f15ff0b07f954e72ed2`. This commit is local and is not a published GitHub revision.
