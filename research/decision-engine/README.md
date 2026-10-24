# Decision engine: buy, hold, sell or skip a gold land contract

25 October 2026. Owner: Salman. Code:
- [`scripts/decision_engine.py`](../../scripts/decision_engine.py): the decision
- [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py): the measured prediction
- [`scripts/claims_fetch.py`](../../scripts/claims_fetch.py): the data

Standard library only. The design follows the combined strategy (PR #24) and the review in PR #25. Every number below sits beside the command that regenerates it.

## Data → features → measured prediction → decision

| Step | What it does | Result |
|---|---|---|
| Data | 875,406 Nevada and Arizona lode claims since 1997; 21,141 MRDS gold sites; 1,469 Tok state claims. Each fetch has a manifest and SHA-256 | Fetched and hashed |
| Features | Point-in-time staking decisions (distinct claimant-days) per section, township activity, active claims, distance to gold | 446,047 cell-years |
| Measured prediction | Will a staked section see new staking next year? | **Beats climatology in 21/21 held-out years; skill +2.2% (95% CI +1.7% to +2.8%)**. See [forecast results](claim-activity-forecast.md) |
| Decision | Staged land-contract options solved month by month: pay the next stage, sell, hold or lapse | Below |

## How the decision works

1. **The contract is a staged option.** Real gold land options are paid in stages. At each due date the holder pays the next stage or lets the option lapse. When a buyer arrives, the holder can pay the remaining stages early and sell, or decline and wait. The payment schedule is the TIME axis.
2. **Buyers are learned over time.** Staking near the land follows a Poisson process with an uncertain rate (a Gamma belief). Buyers arrive at `q` times the staking rate. Quiet months lower the belief; an offer, even a declined one, raises it. The updates are exact.
3. **Where the belief comes from:**
   - In **Nevada and Arizona**, the measured forecast sets it. A section's P(any staking) gives the mean rate (λ = −ln(1 − p)), and sections in the same forecast band give the spread.
   - In **Tok**, the forecast isn't validated, so Tok's own recorded history sets it. Old years are discounted by a forgetting rate chosen by one-step-ahead predictive score (each year predicted only from earlier years), and the decision averages over the forgetting rates, weighted by those scores.
4. **The policy is optimal by backward induction**, subject to a loss limit applied inside it: a stage that could push the cash at risk past the limit is refused.
5. **Every result reports:**
   - the full outcome distribution: P(loss), P(gain), median, 5th and 95th percentiles
   - the worst reachable outcome and the peak cash needed
   - break-evens: the `q` at which the decision flips, the largest first payment and the smallest high offer worth entering for
   - **fragility flags**: any input within 25% of its break-even, or any single assumption that flips the sign

## Tok demo: real contract terms, real local demand

```sh
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json
```

- **Contract (real terms):** the White Rock option (Elko County, NV; catalogue row NV-04). $10k at signing, then $25k, $40k, $50k and $125k at years 1–4, and a $25k annual advance royalty after exercise. It is applied hypothetically to a 640-acre block in the Tok Site B window.
- **Demand (real data):** Site B's staking decisions from 2007 to 5 March 2025. Counting claims instead would mislead badly: the 392 claims of 2016–17 were only 5 decisions.
- **Assumed:** `q` = 0.5; offers of $450k (probability 0.35) or $120k (0.65); Alaska rent of $133 a month (unverified); an 8% discount rate; and early completion being allowed.

| Output | Value |
|---|---|
| Signal | **BUY** the option, by paying the $10k first stage |
| Expected value | +$9,617 |
| Outcome distribution | **87% chance of a loss**; median −$11,545; 5th percentile −$36,123; 95th percentile +$182,901 |
| Worst reachable outcome | −$71,742, within the $100k limit |
| Plan | Hold; **sell** on an offer of at least $279,780 in month 0, falling to $252,629 by month 11; **lapse** at month 12 rather than pay the $25k second stage |
| Break-even `q` | 0.269: BUY only if at least about 1 in 4 staking events becomes a buyer |
| Largest first payment worth making | $19,617 |
| Smallest high offer worth entering for | $361,893 |
| P(buyer within 12 months) | 0.266 |

**What the data say about demand:**
- **A constant-rate model is rejected.** Under the pooled model, a run of 7 quiet years like 2018–2024 happens only 2% of the time (posterior predictive check, p = 0.020 over 20,000 simulations).
- **Best half-life:** recent years carry most weight. The best-scoring forgetting rate gives a half-life of about 2.4 years.

**Fragile, and flagged as such by the engine:**
- **Acceleration:** if the remaining stages can't be paid early to complete a sale, the value is **−$11,545** (SKIP). The White Rock release doesn't say whether this is allowed.
- **One recent event:** without the single staking decision in January–March 2025, the value is **−$9,140** (SKIP). One fresh observation in a 63-day window flips the recommendation. Its date field (`NTPSTDT`) is still unconfirmed.

This is the honest headline: the BUY is a low-probability, high-payoff bet that rests on two checkable facts.

## Nevada: the measured forecast drives the decision

```sh
python3 scripts/claims_forecast.py      # writes forecast_2025.csv
python3 scripts/decision_engine.py research/decision-engine/nv-forecast-demo.json
```

This uses the same White Rock terms with real BLM fees: 30 claims × $200 a year = $500 a month, plus the $25k advance royalty after exercise. The two sections come from the 2025 forecast:

| Section | Forecast P(staking in 2025) | Expected value | P(loss) | Break-even `q` | Signal |
|---|---:|---:|---:|---:|---|
| 21 0310N 0330E 001 (top Nevada forecast) | 0.359 | −$1,843 | 91% | 0.565 | SKIP, near the boundary (fragile) |
| 21 0040N 0320E 016 (median Nevada forecast) | 0.064 | −$13,673 | 99% | none | SKIP |

The forecast moves the value by about $12k. The top section becomes a BUY if more than about 57% of staking events turn into buyers; the median section never does.

## Correctness checks

`python3 -m unittest discover -s tests -p 'test_decision_engine.py' -v` runs 24 tests:
- the review fixture and its boundary cases ($9,500 / $12,600 / −$400 and SKIP)
- the one-period monthly tree matching the fixture
- the Gamma hand values
- backward induction equal to an **independent brute-force search over full histories**, including offers seen, on 40 random contracts
- costs never raising value
- a stronger forecast never lowering an option's value
- the exact outcome distribution agreeing with both the expected value and the worst case
- the loss cap bounding losses
- forgetting-rate scoring using only earlier years
- partial years counting less
- the pinned demos

`python3 -m unittest discover -s tests -p 'test_claims_forecast.py' -v` runs 6 leakage and arithmetic tests.

**Demo re-pin, 25 October:**
- **Before:** the earlier pin (+$14,507) pooled all years equally, counted 2025 as a full year, treated declined offers as quiet months, and applied the loss limit only after optimising.
- **What changed:** each of those was fixed after the PR #25 review, which moved the pin to +$9,617.

## Still open

- Confirm what `NTPSTDT` means (Alaska DNR case ADL 715614 against its case abstract).
- Check the White Rock agreement's early-exercise and assignment terms.
- Calibrate the forecast (it over-forecasts by about 1 percentage point).
- Add a point-in-time gold-price feature.
- Add log loss and AUC, a persistence-only ablation, and a run without the gold terms.
- Normalise claimant names.
- Offers and `q` remain assumptions. The engine reports how far each can move before the signal flips.
- Not investment or legal advice. Brokerage routes need the licensing gates in PR #23.
