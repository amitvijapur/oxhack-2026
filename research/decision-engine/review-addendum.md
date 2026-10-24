# Decision engine review, part 3: gaps found while checking parts 1 and 2

**For:** the agent building the decision engine (owner: Salman). Read after [part 1](review-hrt-standard.md) and [part 2](review-architecture-and-transform.md).
**Date:** 24 Oct 2026. Checked read-only against the uncommitted engine on `salman/decision-engine`.

Parts 1 and 2 hold up. Part 1's P0-1 was reproduced exactly: BUY at +$14,507 when all years are pooled; SKIP at −$7,434 (mean from the last 8 years) and −$4,363 (a weak prior updated on the last 8 years). This addendum covers only what neither part says.

## A1 (P0). The demo's BUY depends entirely on accelerating the option

**Evidence:** the same demo and prior, with only `acceleration_allowed` changed (read-only; `-B` writes no files):

```bash
python3 -B -c "
import sys,json,statistics,copy; sys.path.insert(0,'scripts')
import decision_engine as d
spec=json.load(open('research/decision-engine/tok-demo.json'))
c=copy.deepcopy(spec['contract']); counts=spec['staking_events_per_year']
p=d.gamma_prior_from_counts(counts,statistics.fmean(counts)); a=d.GammaArrival(p.alpha,p.beta,0.5)
print('acceleration on ', round(d.solve(c,a)))
c['acceleration_allowed']=False; print('acceleration off', round(d.solve(c,a)))
"
```

| `acceleration_allowed` | Value | Decision |
|---|---|---|
| `true` (current demo) | +$14,507 | BUY |
| `false` | −$11,545 | SKIP: only the first payment and a year of rent are ever spent |

The whole payoff is "a high offer arrives in year 1, the holder pays the remaining $240k early and sells". The White Rock release in the catalogue (NV-04) doesn't say whether the optionee may exercise early, or assign the option before exercise.

**Why it matters:** this assumption flips the sign on its own, and it's about the contract's legal terms, not the market. A reviewer who reads the terms will ask about it first.

**Done when:**
- `acceleration_allowed` (and assignment, if modelled) is a labelled assumption in the decision record.
- The README shows the decision both ways.
- The source agreement's early-exercise and assignment clauses are checked, or explicitly marked unverified.
- The sensitivity grid in part 2's T8 includes acceleration as a third axis, or as two separate maps.

## A2. Picking one forgetting rate from 19 years is itself uncertain

Part 1 asks to choose the discount λ (or half-life) by one-step-ahead predictive log-likelihood. With 19 yearly counts, the likelihood profile over λ will be flat over a wide range.

- Report the profile, not just its maximum: the range of half-lives within about 2 log-likelihood units of the best.
- Better still, average the decision over λ (weight each value by its out-of-sample predictive likelihood) rather than using a single best value.
- Compare it with the simplest alternative: **one change-point** (a rate before and after a break year, chosen the same way). Part 2 found the slowdown covers the whole area, which a change-point describes directly.
- State the decision under each, and show where they agree.

## A3. Drop the Kelly suggestion in part 1, P1-7

Part 1 suggests "a Kelly-style fraction under the stated budget". Kelly sizing was deliberately cut from the design (PR #23, Round 4: "Kelly sizing… cut, no proven accuracy"). With a lottery-shaped payoff (about 88% lose about $11.5k, about 12% gain $200k or more) and an unmeasured `q`, a Kelly fraction would overstate confidence. Keep EV per dollar at risk, P(loss) and the percentiles.

## A4. Make the suggested pitch conditional on results

Part 1, §7 says "use a forecast tested on 21 years of Nevada and Arizona claims". No forecast result exists yet (part 1, P0-3). Phrase it as: "if the forecast beats the persistence baseline out of sample, its prior sets…; if not, we use the baseline and say so". The pitch must match whatever the measured result turns out to be.

## A5. A concrete way to confirm what `NTPSTDT` means

Both parts flag `NTPSTDT` as unconfirmed but give no procedure. Steps:
1. Read the field description in the layer metadata (`https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer/0?f=json`) and any linked data dictionary.
2. In a browser (DNR case pages block scripts), open case **ADL 715614**. Arjin's README gives its `NTPSTDT` as 22 August 2012. Compare that date with the case abstract's location date, recording date and status-change dates.
3. Repeat for one closed claim, and record which date matches.

If `NTPSTDT` turns out to be a recording or status date, rebuild the Tok series before any other P0 work, because every Tok number rests on it.
