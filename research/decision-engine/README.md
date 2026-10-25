# Decision engine: buy, wait, hold, sell or skip a gold land contract

25 October 2026. Owner: Salman. Code:
- [`scripts/decision_engine.py`](../../scripts/decision_engine.py): the decision
- [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py): the measured prediction
- [`scripts/claims_pbo.py`](../../scripts/claims_pbo.py): the overfitting check
- [`scripts/claims_fetch.py`](../../scripts/claims_fetch.py): the data

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

## Tok demo: real contract terms, real local demand

```sh
python3 scripts/decision_engine.py research/decision-engine/tok-demo.json
```

- **Contract (real terms):** the White Rock option (Elko County, NV; catalogue row NV-04). $10k at signing, then $25k, $40k, $50k and $125k at years 1–4, and a $25k annual advance royalty after exercise. It is applied hypothetically to a 640-acre block in the Tok Site B window.
- **Demand (real data):** Site B's staking decisions from 2007 to 5 March 2025.
- **Carrying cost (verified):** Arjin's sourced Alaska rates (`research/tok-land/alaska_holding_costs_by_year.csv` on `arjin/tok-land-data`, from the Alaska session laws and the DNR annual-rent schedule). The block is four 160-acre claims staked in 2016–17, so they're aged 6–10:
  - **during the option:** $330 rent plus $400 annual labour per claim, so **$243 a month**
  - **after exercise:** at age 11 or more, plus the $25k royalty, so **$2,492 a month**
- **Gates, from Arjin's land matches:**
  - **Pass:** a counterparty exists. 17 of the Site B samples sit in Contango's active claims.
  - **Unknown:** land status (DNR's status codes are unexplained, and BLM and Native land weren't checked) and the mineral rights an option would convey. So the result is **manual review**.
- **Assumed:**
  - `q` = 0.5
  - offers of $450k (probability 0.35) or $120k (0.65)
  - an 8% discount rate
  - early completion allowed
  - a 50% chance the deal is still open in a year

**What the data say about demand:**
- **A constant rate is rejected.** A run of seven quiet years like 2018–2024 happens only 2% of the time under it (posterior predictive check).
- **The change is located exactly.** The changepoint posterior gives an **87–90% probability that the staking rate changed**, most likely in **2018** (35–46%). It fell from about **1.5 decisions a year to 0.2–0.33**, with a Bayes factor of 6–9 across three priors.
- The best forgetting half-life is about 2.4 years.
- **Statewide context (Arjin, `research/tok-land/claims-vs-gold.md`):** across all 120,211 Alaska state claims, yearly staking follows the gold price only weakly (r = 0.19 for the same year). In 2017, claims doubled statewide while gold was flat, the same years as Tok's wave. That fits an event-driven reading, and it supports keeping the gold price out of the buy/sell trigger.

| Output | Value |
|---|---|
| Status | **Manual review**: land status and mineral rights unconfirmed |
| Signal | **BUY, conditional** (see below): pay the $10k first stage |
| Expected value | +$8,219 |
| Outcome distribution | **87% chance of a loss**; median −$12,819; 5th percentile −$38,578; 95th percentile +$182,251 |
| Worst reachable outcome | −$75,289, within the $100k limit |
| Waiting 12 months instead | +$8,332 if the deal is still open. WAIT beats BUY only if that's more than 98.6% likely, because Tok's staking is too sparse for a year to teach much |
| Risk aversion | Certainty equivalent with $300k wealth: +$2,593 at γ = 1 and −$1,766 at γ = 2. **A buyer with risk aversion above γ ≈ 1.56 should not take it** |
| Plan | Hold; sell on an offer of at least $277,662 in month 0, falling to $251,411 by month 11; lapse at month 12 rather than pay the $25k second stage |
| Break-even `q` | 0.299: about 1 in 3 staking events must become a buyer |

**The decision is conditional on two checkable facts.** The engine flags both:
- **Acceleration:** if the remaining stages can't be paid early to complete a sale, the value is **−$12,819** (SKIP). The White Rock release doesn't say whether this is allowed.
- **One recent event:** without the single staking decision in January–March 2025, the value is **−$10,410** (SKIP). Its date field (`NTPSTDT`) is unconfirmed.

Honest summary: the evidence isn't strong enough for an unconditional BUY. The engine shows exactly which two facts would settle it.

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

**Jev as a sentiment labeller.** Against the judge's cold/warm/hot labels on the pilot's 277 on-topic posts, Jev reaches kappa 0.42 (moderate) and a rank correlation of 0.60. It took 8.6 seconds and cost $0.005 for all 296 posts. That makes it a useful, almost free second rater for the scored runs, but not a replacement for the pre-registered judge. See [the Jev sentiment check](jev-sentiment-check.md).

Observation for the swarm team: in the pilot, several agents doubt the $4,500 premise ("Last I checked it's around $2k/oz"). That's a model knowledge-cutoff effect that may weaken the price calls. The engine doesn't use the swarm's price call.

## Correctness checks

`python3 -m unittest discover -s tests -p 'test_decision_engine.py' -v` runs 37 tests:
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
- the pinned demo

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

## Still open

- Confirm what `NTPSTDT` means (Alaska DNR case ADL 715614 against its case abstract).
- Check the White Rock agreement's early-exercise and assignment terms.
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
- Offers and `q` remain assumptions. The engine reports how far each can move before the signal flips.
- Not investment or legal advice. Brokerage routes need the licensing gates in PR #23.
