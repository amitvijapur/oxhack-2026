# Orecast consistent-lot local review

This package was created as a separate local review of one explicitly defined synthetic mineral-interest contract. Amit subsequently approved publication. Code merged first in [PR #54](https://github.com/amitvijapur/oxhack-2026/pull/54); this is the separately published slide package. The older deck files remain unchanged.

Open [the review PowerPoint](output/orecast-consistent-lot-review.pptx), [review PDF](output/orecast-consistent-lot-review.pdf), [review preview](preview-consistent-lot-review.png), [speaking notes](slide-notes-consistent-lot-review.json) or [rehearsal](rehearsal-consistent-lot-review.md). The ten-page deck keeps the approved Orecast/Palantir compositions. Seven main slides total 300 seconds; three appendices explain cash, the negative historical pilot and fee sensitivity.

The frozen model input is commit `69a0b5b4d2ca8db16cc46f15ff0b07f954e72ed2`, now published as [orecast-model-inputs-v1](https://github.com/amitvijapur/oxhack-2026/tree/orecast-model-inputs-v1). Build-time unpublished labels in the immutable facts/notes describe creation-time status.

## One fixed synthetic contract

The contract has a $30,000 assumed premium, $50 assumed entry fee and $50 assumed exit fee. Upfront capital is $30,050. Its exposure is defined once using the invented reference-unit ratio:

- Frozen factor `s = 30,000 / 650 = 46.15384615`.
- Assumed recoverable quantity `Q = 500 × s = 23,076.92308 troy ounces`.
- Assumed remaining buyer consideration `K = $4,000 × s = $184,615.38462`.
- Ownership 50%, conversion 2%, geological success 25%, gold $2,000/oz, zero annual growth and 20% conditional sale hazard per 30 days.

These are invented arithmetic inputs, not a resource estimate, a real property valuation or a margin established by historical transactions. The factor does not mean multiple tradable contracts. Exposure stays fixed across horizons, news scenarios and premium edits. No parameter is selected from a 25% return target.

The two selected historical $30,000 initial payments, Tibbs and Northway, provide an entry-scale reference only. They do not value this synthetic interest or establish its assignment proceeds, full obligations or transferability. Their major work, scholarship, recurring-payment and royalty terms remain separate. The [pricing research](../../research/orecast-contract-pricing/README.md) and primary source URLs in notes 2/8/10 retain that distinction.

## Fixed-fee results

The baseline conditional assignment value is $69,230.77. With fixed $50 entry and exit fees:

| Horizon | Expected net cash | Expected option return | Model screen |
| --- | ---: | ---: | --- |
| 30 days | −$16,213.85 | −53.96% | Skip |
| 90 days | $3,710.22 | 12.35% | Conditional candidate |
| 180 days | $20,995.45 | 69.87% | Conditional candidate |

At 90 days, recorded approval gives $3,610.97 expected cash and 12.02% return; blockage gives $3,831.36 and 12.75%. They use exactly the same synthetic contract and fees. Gold responds first; valuation is recomputed at each possible sale date.

Returns divide expected cash by upfront capital and are non-annualized. Candidate means the assumed case passes the current screens, not a trade, quote or recommendation. At 90 days, 51.2% of paths still have no sale and median cash is −$30,050. An unsold mark remains separate from cash and does not fund another position.

## Fee sensitivity is essential

The higher headline return depends on holding each fee at $50 while exposure scales. The canonical `compareFeePolicies` helper holds the same interest, premium, gold and sale policy fixed:

| Fee assumption | Entry / exit fee | Upfront capital | 90-day expected cash | Return | Risk cap |
| --- | ---: | ---: | ---: | ---: | --- |
| Fixed | $50 / $50 | $30,050 | $3,710.22 | 12.35% | Pass |
| Proportional | $2,307.69 / $2,307.69 | $32,307.69 | $350.77 | 1.09% | Fail |

Proportional fees equal `$50 × s` each and preserve the original invented arithmetic return of 1.085714%. Their higher upfront capital exceeds the $30,050 per-option cap, so that case is skipped. Neither fee assumption is calibrated to an actual contract's costs.

The simulated fund remains $1,502,500, per-option cap $30,050, open and lifetime commitment caps $150,250, and at most five positions. This capacity does not establish five available contracts.

## Return hurdle and validation

A 25% expected 90-day return requires $77,022.34 constant gross assignment proceeds at every possible sale date under the assumed liquidity. This is a required underwriting hurdle, not a forecast or an input used to choose exposure. The fixed-fee baseline's $69,230.77 valuation and 12.35% expected return do not meet that target.

The historical equity pilot is unchanged and separate. Its event adjustment did not beat baseline. There are no paired historical swarm outcomes establishing incremental value or Tok option returns. Real costs, resource evidence, verified rights and completed/unsold assignments are still needed.

## Editing and source status

Foreground text, diagrams, the slide 6 chart and appendix tables are native editable objects. Screenshots remain images. Use DM Sans Light/Regular and [the Orecast guide](../../brand/orecast/BRAND.md). Check font substitution against the PDF. Native desktop PowerPoint opening and system font rendering have not been tested.

[Review facts](algorithm-facts-consistent-lot-review.json) record the local unpublished source revision, input hashes and canonical helper outputs. No GitHub URL is invented for the unpublished commit. Saved review captures must match that local model source; published older captures are not the review scenario.
