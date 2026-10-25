# Decision engine: buy, wait, hold, sell or skip a gold land contract

25 October 2026. Owner: Salman. Code:
- [`scripts/decision_engine.py`](../../scripts/decision_engine.py): the decision
- [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py): the measured prediction
- [`scripts/claims_pbo.py`](../../scripts/claims_pbo.py): the overfitting check
- [`scripts/claims_fetch.py`](../../scripts/claims_fetch.py): the data
- [`scripts/q_bound.py`](../../scripts/q_bound.py): the data floor on buyers per staking event
- [`bid-comparables.csv`](bid-comparables.csv): the comparable deals behind the buyer offers

Standard library only. The design follows the combined strategy (PR #24) and the three reviews in PR #25. Every number below sits beside the command that regenerates it.

## Data → features → measured prediction → decision

| Step | What it does | Result |
|---|---|---|
| Data | 875,406 Nevada and Arizona lode claims since 1997 (874,545 pass validation); 21,141 MRDS gold sites; 1,469 Tok state claims. Each fetch has a manifest and SHA-256 | 125,005 staking decisions across 31,431 sections |
| Features | Point-in-time staking decisions per section (claimant names normalised), township activity, active claims, distance to gold | 445,681 cell-years |
| Measured prediction | Will a staked section see new staking next year? | **Beats climatology in 21/21 held-out years; +2.2% (95% CI +1.7% to +2.7%); DM t = 9.0; +6.7% against persistence; overfitting probability 0.0.** See [forecast results](claim-activity-forecast.md) |
| Decision | Staged land-contract options solved month by month: buy now, wait a year, pay the next stage, sell, hold or lapse | Below |

## How the decision works

1. **The contract is a staged option.** At each due date the holder pays the next stage or lets the option lapse. When a buyer arrives, the holder can pay the remaining stages early and sell, or decline and wait. The payment schedule is the TIME axis.
2. **Buyers are learned over time.** Staking near the land follows a Poisson process with an uncertain rate (a Gamma belief). Buyers arrive at `q` times the staking rate. Quiet months lower the belief, and an offer, even a declined one, raises it. Every update is exact.
3. **Where the belief comes from:**
   - **Nevada and Arizona:** the measured forecast (λ = −ln(1 − p); the spread comes from sections in the same forecast band).
   - **Tok:** the forecast isn't validated there, so Tok's own history is used. Old years are discounted (the West and Harrison discount model), at a rate chosen by one-step-ahead predictive score using only earlier years, and averaged over rates by that score.
4. **Constrained optimal policy.** Backward induction finds it, with the loss limit applied inside the policy.
5. **Three choices today: BUY, WAIT or SKIP.** WAIT means watching staking for 12 months and then deciding with the updated belief, which is valued exactly. Whether the deal is still open then is a labelled assumption.
6. **Every result reports:**
   - the exact outcome distribution
   - the certainty equivalent under risk aversion
   - break-evens
   - **the facts the decision is conditional on**: any assumption or single observation that flips it

## Tok demo: real contract terms, real local demand, offers from real deals

```sh
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json   # about 50 s
```

### Headline: SKIP. It holds up in 55 of 60 combinations of the uncertain assumptions.

| Output | Value |
|---|---|
| **Signal** | **SKIP**: the probability-weighted value across all 60 combinations is **−$9,877** |
| BUY combinations | 5 of 60, and every one needs **early completion allowed and `q` ≥ 0.25** |
| Range of values | −$12,819 (worst) to +$25,167 (best) |
| Value of perfect information | **$519**: even learning every assumption first is worth little |
| Worth checking first | `q` together with acceleration (+$381). No single assumption, learned alone, changes the decision |
| Status | **Manual review**: land status and mineral rights unconfirmed |

**What's uncertain, and how each is handled:**

| Assumption | Range checked | Weights | Mean value |
|---|---|---|---|
| How the staking rate moves | Discount model, or changepoint model (at most one jump) | **From the data:** one-step-ahead predictive score, so changepoint 0.74, discount 0.26 | −$10,363 / −$8,499 |
| Buyer offers | Comparable deals at the NV/AZ level, at the Alaska level, or Alaska shrunk towards NV/AZ | Equal | −$8,541 / −$10,837 / −$10,252 |
| `q`, buyers per staking event | 0.003 (the data floor), 0.03, 0.1, 0.25, 0.5 | Equal | from −$12,768 at 0.003 to −$4,504 at 0.5 |
| Early completion (acceleration) | Allowed, or not | Equal | −$6,934 / −$12,819 |

**Why each range is what it is:**
- **Offers from data.** The earlier demo assumed offers of $450k (35%) or $120k (65%). They now come from [`bid-comparables.csv`](bid-comparables.csv): 15 arm's-length NV/AZ gold deals with a price, sized 100–20,000 acres, plus 2 Alaska state-claim packages. Each deal's $/acre is one equally likely offer for the 640-acre block.
  - The NV/AZ spread is kept: log sd 1.24, median **$285 an acre**.
  - Its level is moved to the Alaska mean (**$198**) or to the Alaska mean shrunk towards NV/AZ (**$223**).
  - The chance of an offer of at least $450k is **27% at NV/AZ prices, 20% shrunk, and 7% at Alaska prices**, against the old assumed 35%.
  - **Caveat:** these are original deal values, not resale prices of an option.
- **`q` from data.** [`scripts/q_bound.py`](../../scripts/q_bound.py) counts public NV/AZ claim deals per staking event in the same years.
  - The result is **0.0027** in NV (18 deals / 6,600 claimant-days, 2017–24) and **0.0032** in AZ (7 / 2,216, 2019–24).
  - The deal catalogue is a sample, not a census, so this is a floor. The census would be BLM transfer-of-interest filings, which weren't fetched.
  - The break-even at the headline assumptions is **0.45**, more than 100× above the floor.
- **Acceleration isn't public.** White Rock's NI 43-101 technical report (2022, §4) and the press releases give the schedule, the 2% NSR and the $25k advance royalty, but no early-exercise or assignment terms. The final payment was made on schedule in July 2024.
  - A Tok deal would be ours to negotiate, so the engine prices the clause: **it adds $5,886 of expected value**. That isn't enough to make BUY pay.
- **Demand model.**
  - A constant rate is rejected: seven quiet years like 2018–2024 happen 2% of the time under it.
  - The changepoint posterior gives an **87–90% probability that the rate changed**, most likely in **2018**. It fell from about **1.5 staking decisions a year to 0.2–0.33**.
  - Both models are kept and weighted by how well they predicted each next year.

**Inputs that are facts, not assumptions:**
- **Contract (real terms):** the White Rock option (Elko County, NV; catalogue row NV-04). $10k at signing, then $25k, $40k, $50k and $125k at years 1–4, and a $25k annual advance royalty after exercise. It is applied hypothetically to a 640-acre block in the Tok Site B window.
- **Demand (real data):** Site B's staking decisions from 2007 to 5 March 2025. 2025 counts as 63 days.
- **Carrying cost (verified):** Arjin's sourced Alaska rates (`research/tok-land/alaska_holding_costs_by_year.csv` on `arjin/tok-land-data`). The block is four 160-acre claims aged 6–10:
  - **during the option:** **$243 a month**
  - **after exercise:** **$2,492 a month**
- **Gates, from Arjin's land matches:**
  - **Pass:** a counterparty exists (Contango's active claims).
  - **Unknown:** land status and the mineral rights an option would convey.

**At the headline assumptions** (offers shrunk towards NV/AZ, the two demand models averaged, `q` = 0.5, acceleration allowed), BUY is worth +$1,499. That's the optimistic corner, and it is fragile on four counts:
- `q`
- the first payment
- acceleration
- the single 2025 event

The outcome distribution there shows a **94% chance of a loss**, a median of −$12,819, a 95th percentile of +$142,349, and a worst reachable outcome of −$75,289. Any risk aversion above γ ≈ 0.31 turns it negative. The engine reports it as `signal_at_headline_assumptions` and does not act on it.

**What would change the answer:** a signed early-completion right **and** evidence that at least one in four nearby staking events brings a buyer, for example BLM transfer filings in the Tok region. The engine reruns as soon as either is known.

## Nevada: the measured forecast drives the decision

```sh
python3 scripts/claims_forecast.py      # writes forecast_2025.csv
python3 scripts/decision_engine.py research/decision-engine/nv-forecast-demo.json
```

This uses the same White Rock terms with real BLM fees: 30 claims × $200 a year = $500 a month, plus the $25k advance royalty after exercise. The forecast is the raw model, which over-forecasts slightly, so it leans towards BUY.

| Section | Forecast P(staking in 2025) | Buy now | Wait a year | P(loss) if bought | Break-even `q` | Signal |
|---|---:|---:|---:|---:|---:|---|
| 21 0310N 0330E 001 (top-ranked) | 0.372 | −$1,186 | +$3,402 | 91% | 0.541 | **WAIT**, near the boundary |
| 21 0040N 0320E 016 (median) | 0.066 | −$13,636 | +$157 | 99% | none | WAIT in name only; effectively SKIP |

The forecast moves the value of buying now by about $12k. For the top section, watching staking for a year is worth more than buying today, and it becomes a BUY if more than about 54% of staking events turn into buyers.

## The swarm: wired in, waiting for scored runs

```sh
python3 scripts/swarm_adapter.py swarm/records/results/results.json   # path from swarm/score.py report
python3 scripts/policy_extract.py swarm/records/pilot/interviews.json
```

[`scripts/swarm_adapter.py`](../../scripts/swarm_adapter.py) reads the `results.json` that the Tok society's `swarm/score.py report` writes (branch `ahmed/gold-society-plan`):
- A scenario is used only when its pre-registered checks pass: the placebo is quiet, the scenario moves an expected group beyond its chance band and beyond the placebo, and the mirrors check passes where one applies.
- Each usable scenario changes one engine input through [`swarm-mappings.json`](swarm-mappings.json). For example, a tax rise lowers offers by 15%. Every magnitude there is a labelled assumption.
- The Tok demo reports the decision with and without each scenario. Today it reports "no swarm results", because the nine scored runs haven't finished, and the decision runs without them.

[`scripts/policy_extract.py`](../../scripts/policy_extract.py) labels the interviews' one free-text answer ("what will the state do next?") with a typed policy move:
- **Jev:** used when `TYPESAFE_API_KEY` is set.
- **Rules fallback:** otherwise a keyword rule answers. On the pilot's 48 answers it labelled 22 review or delay, 13 approve with conditions, 2 tax change and 1 approve, and left 10 unlabelled. That's where Jev would add the most.
- The label annotates the policy call only and never changes a value.

**Jev as a sentiment labeller, measured where the swarm uses it:**
- **Per post:** on held-out posts, Jev's 0–10 score correlates with the judge's at r = 0.55 (95% CI 0.43–0.66; Spearman 0.60).
- **Group means after calibration:** a per-group shift and one slope, fitted on the design half, bring Jev's held-out group means to **within 0.18 points of the judge's on average (largest error 0.28; r = 0.97)**. Uncalibrated, the average error is 0.58.
- **Smallest detectable scenario effect** from one day's posts, at 80% power: **0.33–0.60 points** per group under the judge, and 0.33–0.88 under Jev. Run-to-run spread adds to this.
- **Gold set:** a blind 91-post human set is ready to score. With it, `gold_set.py score --scores` turns either labeller's group means into human-corrected estimates (prediction-powered inference).

See [the Jev sentiment check](jev-sentiment-check.md) and [the gold set](gold-set/README.md).

Observation for the swarm team: in the pilot, several agents doubt the $4,500 premise ("Last I checked it's around $2k/oz"). That's a model knowledge-cutoff effect that may weaken the price calls. The engine doesn't use the swarm's price call.

## Correctness checks

`python3 -m unittest discover -s tests -p 'test_decision_engine.py' -v` runs 61 tests (engine, labeller and gold set):
- the review fixture and its boundary cases
- the one-period tree matching the fixture
- the Gamma hand values
- backward induction equal to an **independent brute-force search over full histories** on 40 random contracts
- costs never raising value
- a stronger forecast never lowering an option's value
- the exact outcome distribution agreeing with the expected value and the worst case
- the loss cap
- forgetting-rate scoring using only earlier years
- partial years counting less
- the negative-binomial staking predictive
- waiting-value bounds
- the certainty equivalent falling with risk aversion
- the changepoint marginal against a hand value, and a known break recovered
- gates: a failure gives SKIP; an unknown gives manual review with the signal kept
- the swarm adapter: nothing used when the placebo fails, an effect inside the band ignored, a passed scenario applied once
- the policy extractor's rules fallback and its Jev request shape
- the pinned demo, and the robust SKIP across 60 combinations
- offers from comparables against hand values; value of information against hand values, never negative and never above the full value of information
- a ROBUST BUY when every combination buys; the changepoint components forming a distribution; the floor on `q` counting claimant-days after name normalisation
- the labeller: continuous agreement, group calibration and the detectable effect against hand values; the prediction-powered mean against hand values, and removing a constant bias exactly

`python3 -m unittest discover -s tests -p 'test_claims_forecast.py' -v` runs 15 tests:
- leakage
- name normalisation and validation counts
- logistic convergence and coefficient recovery
- the intercept shift
- economic-value bounds
- the Student-t p-value
- PBO behaviour

**Demo re-pins, 25 October:**
- **To +$9,617:** the earlier pin (+$14,507) pooled all years, counted 2025 as a full year, treated declined offers as quiet months, and applied the loss limit only after optimising. Each was fixed after the PR #25 review.
- **To +$8,219:** the assumed $133-a-month Alaska rent was replaced by Arjin's verified rates for claims aged 6–10, plus annual labour.
- **To +$1,499 at the headline assumptions, and SKIP overall:**
  - the assumed two-point offers were replaced by offers from comparable deals
  - the changepoint model joined the demand average (weight 0.74 from its predictive score)
  - the signal now comes from the decision across all 60 combinations of the uncertain assumptions

## Still open

- Confirm what `NTPSTDT` means (Alaska DNR case ADL 715614 against its case abstract).
- Get the White Rock agreement's text (SEDAR+), or negotiate the clause directly. The public summaries don't cover early exercise or assignment.
- A census of claim transfers (BLM transfer-of-interest filings) to replace the floor on `q`.
- From the PR #25 research-standards review:
  - a gold-price feature, which would also drive offers (D5)
  - a rate that keeps changing during the contract (D2)
  - stacking across model types with robust values (D3)
  - the optimizer's-curse adjustment (D10)
  - a stopping-theory test (D8)
  - inference calibration checks (D9)
  - skill within strata (V3)
  - a drift alarm (V10)
  - a frozen 2026 forecast hash (V11)
  - profiling (E1)
- `q` has a data floor but no point estimate. Offers come from 17 deals, only 2 of them in Alaska. The robust check covers both.
- Not investment or legal advice. Brokerage routes need the licensing gates in PR #23.
