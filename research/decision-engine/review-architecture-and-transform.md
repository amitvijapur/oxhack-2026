# Decision engine, part 2: architecture, system and how predictions become decisions

**For:** the agent building the decision engine (owner: Salman). This is a companion to `review-hrt-standard.md`. Do that review's P0 items first.
**Scope:** the algorithm's architecture, the pipeline around it, and how a prediction is converted into a decision and then into the result shown to judges. **The MiroFish swarm is out of scope.** The engine must work fully without it.
**Review date:** 24 Oct 2026. Hard cutoff: Sunday 12:00. Review only; no code was changed.
**Reviewed:**
- `scripts/decision_engine.py` and `scripts/claims_forecast.py`
- `data/raw/claims/tok_state_claims.csv`
- the foundation design (PR #23, `research/gold-land-algorithm-foundation.md`)
- the combined strategy and proposed decision contract (PR #24, `research/strategy-amendments/proposed-decision-contract.md`)

---

## 0. The main idea

At the moment the system is **two good pieces with a gap between them**:

```text
NV/AZ claims ─► forecast P(staking next year)  ✗ not used   Tok counts ─► Gamma prior ─► solver ─► BUY/SKIP
                                                              q, bids   ─► (assumed)  ──┘
```

The HRT brief judges the arrow between prediction and decision. The target architecture is a chain of **typed, separately tested transforms**. Each one turns one quantity into the next, carries its uncertainty forward and records what it assumed:

```text
raw data ─► features ─► calibrated probability ─► arrival-rate distribution ─► buyer/offer model ─► optimal policy ─► outcome distribution ─► decision record ─► explanation & demo
   (T0)        (T1)            (T2)                        (T3)                      (T4)               (T5)              (T6)                 (T7)              (T8)
```

Each section below is one link in that chain, plus the system around it.

---

## 1. New data findings that change the plan

Read these before acting on `review-hrt-standard.md` P0-1. They were checked read-only on `data/raw/claims/tok_state_claims.csv`, which has 1,469 rows: 706 active and 763 closed.

1. **The slowdown since 2018 covers the whole Tok area; Site B is just the extreme case.** Distinct owner-days (staking decisions) per year from 2007 to 2025, reproduced from the raw file using the sample bounds in `research/gold-site-selection.json`:

   | Window | 2007 … 2017 | 2018 … 2025 | Mean per year 2007–17 | Mean per year 2018–24 |
   |---|---|---|---|---|
   | Site B (matches `tok-demo.json` exactly) | 2,0,0,3,2,2,0,1,2,4,1 | 0,0,0,0,0,0,0,1 | 1.55 | 0.00 |
   | Site A | 1,1,1,2,3,0,0,0,0,0,1 | 0,1,0,0,2,0,2,0 | 0.82 | 0.71 |
   | Whole Tok fetch box | 4,1,4,5,4,5,3,1,4,4,3 | 0,1,0,0,2,0,2,1 | 3.45 | 0.71 |

   - Counted as **claims**, Tok still looks busy after 2018: 37 in 2019, 38 in 2022, 50 in 2024 and 30 in early 2025. But those were only 1–2 staking decisions a year. **Counting claims hides the slowdown.**
   - So the regime change in `review-hrt-standard.md` P0-1 is real and area-wide, roughly a fivefold drop. Spatial pooling (T3) doesn't rescue the BUY. It makes the slowdown better measured, because there are more events behind it.
   - Site B, the Tok area and NV/AZ are still three levels of evidence, and should be pooled as in T3.
2. **2025 is a partial year.** The data stop at **2025-03-05**, yet `tok-demo.json` treats 2025's count of 1 as a full year. Either scale it by the exposure actually observed (about 2 of 12 months) or drop it. Never mix partial and full years at equal weight.
3. **Staking is seasonal.** Across Tok's 49 owner-days, the counts by month from January to December are `[0,3,6,3,3,5,7,10,3,1,7,1]`, with a peak from February to August. The solver spreads the arrival rate evenly across months. Because the BUY/LAPSE choice happens at month 12, the month the contract is signed matters.
4. **The data include closed claims**, so staking history doesn't suffer from survivorship bias. Keep both statuses. State this in the README; reviewers will ask.
5. **`NTPSTDT` is still unconfirmed** as the staking date. Everything above depends on it. Confirm it first.

---

## 2. The transform chain: what to change at each link

### T1. Features: keep them point-in-time and make that visible
- Already good: the 92-day lag, and no feature built from data after the cutoff.
- Add an `available_at` field to every input row and feature, as both PR #23's principle 4 and PR #24's decision contract require. A single assertion can then prove there's no look-ahead: each feature's `available_at` must be on or before its decision time.
- **Gold-price feature** (point-in-time, from World Bank monthly data with its publication delay recorded). This is the time-varying driver the model lacks. See `review-hrt-standard.md` P1-5.

### T2. Probability, then calibration
- The logistic model's raw output isn't guaranteed calibrated **out of sample**, and it certainly isn't calibrated in Alaska.
- Fit a **calibration map** on held-out walk-forward predictions only:
  - **isotonic regression** (pool-adjacent-violators, about 20 lines of standard-library Python), or
  - **Platt scaling**, which is a one-variable logistic fit.

  Apply it before anything downstream. Report reliability before and after calibration.
- Output a typed `Prediction` object. Suggested fields:
  - `target`: P(≥ 1 locator-day in the cell during year Y)
  - `horizon`
  - `as_of`
  - `p`
  - `p_interval`, from the year-block bootstrap
  - `calibration_scope`: which population it was validated on, for example "NV/AZ, township holdout"
  - `transfer_status`: `validated` for NV/AZ, `unvalidated` for AK

### T3. From probability to an arrival-rate distribution (the missing link)
This is the core improvement, and it's exact, not hand-wavy:

- If staking in a cell follows a Poisson process with yearly rate λ, then P(≥ 1 event in a year) = 1 − e^(−λ), so **λ = −ln(1 − p)**.
- The forecast's uncertainty about p, from its bootstrap interval, becomes a **Gamma distribution over λ**. Use method of moments on the transformed interval, or use the count moments for each forecast band that `final_model()` already computes (`claims_forecast.py:239-253`). That function's output exists only for this purpose and currently goes unused.
- **Hierarchical pooling across spatial scales**, from section 1: NV/AZ forecast → Tok area → Site B window.
  - Each level's posterior becomes the next level's prior.
  - Use the discounted update from `review-hrt-standard.md` P0-1 within each level.
  - Choose the discount λ and the pooling strength by out-of-sample predictive log-likelihood, not by eye.

  This is the PR #23 "partial pooling" design applied to the part we actually have data for.
- **Seasonality:** split the yearly rate into monthly rates using a seasonal profile estimated from the data, shrunk towards uniform because there are only 49 events. `GammaArrival.p_buyer_in_month` then takes a calendar month, not just a month index.

**Done when:** a function maps a `Prediction` plus local counts to a `GammaArrival`, and tests check:
- p → λ against hand values
- a flat seasonal profile reproducing today's numbers
- a neutral, uninformative local history leaving the forecast prior unchanged

### T4. Buyers and offers: replace two assumptions with measurements where possible
- **`q` (buyers per staking event)** is the single assumption that sets the dollar value. The README already reports its break-even, q* = 0.196. Look for a measured proxy:
  - **Ownership transfers** of existing claims (a change of claimant on the same claim or case ID) are observed "buyer arrivals". With claimant history, q ≈ transfers ÷ new staking events per cell and year.
  - **Checked: the current extracts can't measure this.**
    - `claims_fetch.py` pulls only the *current* `Claimant` for NV/AZ (lines 37–40; snapshot 2025-03-19) and the current `CSTMRNM` (owner) for Tok (line 162). Neither has history.
    - Possible sources, none verified: the BLM MLRS case-record history, or a second snapshot from a different date, compared claim by claim.
    - Until then, keep q as a labelled assumption and lead with its break-even and EVPI (T6).
  - **Partial measured anchor available now:** the 2026 sale of the 249-claim Delta project next to Site A, to Vizsla (`research/gold-land-algorithm-foundation.md`, PR #23), is one observed buyer event in the area. It's one data point, not an estimate of q, so cite it only as a sanity check.
- **Offers:** replace the two-point $450k/$120k guess with a distribution built from the comparables catalogue, `research/gold-contract-comparables/nv_az_gold_contracts.csv` on PR #23. **Checked:** it has 40 NV/AZ rows announced 2017–2026, but **only 21 have `usd_per_acre_est`**. That's a small sample, so bootstrap it and report the resulting spread in the decision:
  - Normalise each deal to dollars per acre.
  - Adjust it to today's gold price with an elasticity β. Fit β from the deals' dates if they spread enough; otherwise label β 1–2 as assumed, per PR #23's Layer 2.
  - Use the empirical or bootstrapped distribution as the solver's `bids`.

  The Alaska comps quoted in `tok-demo.json` ($170–205 per acre) are a check of how well this carries over.
- **Gold price link:** offers move with the gold price. Feed a small set of gold paths into the offer distribution. A block bootstrap of the World Bank monthly series is the simplest honest model and can be built with the standard library. That makes the decision a distribution over gold paths rather than one number. Keep it minimal: one gold model, not PR #23's five.

### T5. Policy: make the state match what the holder actually knows
- **State = (month, position, buyers seen, nearby staking seen).** Today's state (month, position) assumes nothing is observed except quiet months. After a declined offer the model even lowers its belief in buyers (`review-hrt-standard.md` P1-8).
- Nearby staking is observable and is the forecast's own target. Feeding it into the state lets the plan update as the market moves. That's the honest TIME mechanism.
- State size stays small (72 × 6 × a few × a few), and backward induction remains exact. Extend the brute-force test to the larger state.

### T6. Outcome distribution
- Push the policy forward through the tree to get the **full distribution of discounted P&L**: P(loss), P(gain), the median, the 5th and 95th percentiles, and the expected time to exit. This is exact and needs no simulation.
- **Value of the forecast**, the HRT metric: the expected value of the decision made with the forecast's prior **minus** that made with a naive prior (climatology), both scored on the same realised outcomes. That's a dollar figure for what the prediction is worth.
- **Value of information (EVPI)** for q and β: how much the decision would gain if each were known exactly. This tells the team which assumption is worth paying to measure, which shows decision-making skill rather than just modelling skill.

### T7. Decision record: one schema, every number labelled
- Make the CLI output conform to the decision record already specified in PR #24 §5 (`run_id`, `as_of`, `input_refs`, `assumption_ids`, `status`, `action`, `excluded_actions_with_reasons`, `cashflow_schedule_by_scenario`, `worst_loss_within_scenarios_usd`, `required_cash_before_receipts_usd`, `validation_scope`, and so on). The swarm fields don't apply.
- Tag every input as `observed`, `assumed` or `estimated`. An estimated input also records its target, calibration status and the population it was validated on. **No single combined confidence score**, as PR #24 says.
- Add `git_commit`, `data_sha256` for each input, and the parameter and seed values. Then anyone can reproduce any record exactly.

### T8. Explanation and how the result is shown
- **Value waterfall in dollars:** for example, P(high offer by month 12) × net proceeds (+$X), minus stage-1 payment (−$10k), minus rent (−$Y), minus discounting (−$Z), giving EV. Compute it from the tree, not by hand.
- **Decision map:** a 2-D grid of BUY/SKIP over q × the history half-life, and over q × offer level, with today's point marked. This is the demo's centre slide. It turns "+$14,507" into "here is where we stand and how far we are from the boundary".
- **Time view (TIME theme):** show how P(buyer within 12 months) and the sell-above threshold fall month by month under the quiet path. `Solver.policy()` already returns this, so plot it.
- **Lead with the measured parts:** the forecast skill with its confidence interval, the value of the forecast in dollars, then the decision and its break-evens. Put assumptions last, with their EVPI.

---

## 3. Architecture and code structure

- **Separate prediction from decision in code, not just in docs.** This is PR #23's principle 1. Suggested modules, all standard library:
  - `forecast`: features, model fit, walk-forward evaluation. It produces `Prediction`.
  - `calibrate`: isotonic or Platt mapping, plus reliability.
  - `transform`: p → λ → Gamma, discounted and hierarchical updates, seasonality. It produces `GammaArrival`.
  - `market`: the offer distribution from comparables and gold paths, and `q`.
  - `solve`: the existing `Solver`, given the larger state.
  - `report`: the outcome distribution, the decision record, the waterfall and the maps.

  Each module boundary is a frozen dataclass. That way any model, including a better forecast later, can be swapped without touching the solver.
- **One source of truth for the design.** There are currently four overlapping algorithm documents:
  - `research/gold-land-algorithm-foundation.md` (PR #23)
  - `research/gold-land-strategy.md` and the amendments (PR #24)
  - `research/algorithm.md` (branch `strategy-algorithm`)
  - `research/decision-engine/README.md`

  Agree with Amit on one canonical specification. Mark the others as history and link to the canonical one, so judges and teammates don't find contradictions.
- **Assumptions file.** Move every assumption (q, offers, β, rent, discount rate, loss limit, budget) into one `assumptions.json`. Give each an `id`, a `status`, a `source` and a `last_checked` date. Decision records cite these ids.

---

## 4. The system around the algorithm (orchestration)

- **One command, staged pipeline:** fetch → verify hashes → features → walk-forward forecast → calibrate → transform → decide → report. Use a small standard-library runner; no framework.
- **Content-addressed artefacts:** each stage writes its output plus a manifest of input hashes, code commit and parameters. A stage reruns only when its inputs change, and a hash mismatch stops the run (fail closed). This reuses the manifest and SHA-256 pattern already in `claims_fetch.py` and the gold packs.
- **Determinism:** fixed seeds already exist (`random.Random(year)`). Record them in the run manifest, and add a test that two runs produce byte-identical reports.
- **CI:** CI currently runs only `test_optional_tooling.py`. Add the decision-engine and forecast tests to the existing workflow without renaming the required check names (`AGENTS.md`). Use small fixture data in `tests/fixtures/`, since raw data aren't in Git.
- **Property and invariant tests**, from PR #23's list, applied to what's built:
  - higher costs never raise value (already tested)
  - a higher offer level never lowers value
  - a higher q never lowers value
  - zero time left means zero waiting value
  - a failed budget or loss gate always gives SKIP
  - an uninformative local history leaves the forecast prior unchanged
- **Backtest harness for decisions**, not just predictions. Replay NV/AZ year by year:
  - At each year and for each eligible cell, run transform → solve with point-in-time data only.
  - Score the realised outcome under the same offer assumptions.
  - Compare against: always SKIP, buy everything, buy the top-k cells by forecast, and the climatology prior.

  The money is assumed, but the **ranking of policies on identical assumptions** is measured. This is the "value of the forecast" in T6.
- **Performance:** fine as is. The memoised solve is small, and sensitivity grids are a few hundred solves. Don't rewrite in C++ for this; the Citadel handmade prize is better served elsewhere.

---

## 5. Priority order before Sunday 12:00

1. Do `review-hrt-standard.md` P0-3, then P0-1 as updated by section 1 here (data fixes for the partial year, scale and `NTPSTDT`).
2. **T3 p → λ transform plus hierarchical pooling.** This joins the forecast to the decision; it's the most valuable single change.
3. **T6 outcome distribution and the value of the forecast in dollars.**
4. **T8 decision map and value waterfall.** These are the demo assets.
5. **T7 decision record and the assumptions file.**
6. T2 calibration, T4 offers from comparables, then T5 state extension.
7. Section 4: the pipeline runner, CI and the decision backtest harness, as time allows.

## 6. Verification for the building agent

- [ ] `python3 -m unittest discover -s tests -v` passes, with new tests for p → λ, pooling, seasonality, calibration monotonicity, the invariants and determinism.
- [ ] One command runs the whole chain and writes a decision record matching the PR #24 schema, with every input tagged observed, assumed or estimated.
- [ ] The README shows forecast skill with its CI, the value of the forecast in dollars, the decision with its outcome distribution, the decision map, and the EVPI for q and β. Each figure has its command beside it.
- [ ] The partial year 2025, the scale choice (Site B versus the Tok area) and the meaning of `NTPSTDT` are stated explicitly.

## 7. How this review was checked (24 Oct 2026, read-only)

| Claim | Check | Result |
|---|---|---|
| Site B counts in `tok-demo.json` | Recomputed from `tok_state_claims.csv` using the B bounds in `research/gold-site-selection.json` | Exact match |
| Area-wide slowdown since 2018 | Same calculation over Site A and the whole fetch box (`TOK_BOX`, `claims_fetch.py:32`) | Confirmed; table in §1 |
| Tok data end at 2025-03-05 and include closed claims | Max `NTPSTDT`; status counts | 2025-03-05; 706 active, 763 closed |
| Seasonality | Owner-days by month, all years | `[0,3,6,3,3,5,7,10,3,1,7,1]` (n = 49, small) |
| No ownership history in the extracts | `claims_fetch.py` field lists (lines 37–40, 162, 170) | Current claimant or owner only |
| Comparables size | Parsed the CSV from PR #23's branch | 40 rows, 21 with $/acre, 2017–2026 |
| `final_model` band moments are unused | `grep` over `scripts/` and `tests/` | Only written to `report.json` |
| CI doesn't run the engine tests | `.github/workflows/*.yml` | Only `test_optional_tooling.py` runs |
| PR #24 decision-record fields | Read `proposed-decision-contract.md` §5 | As quoted in T7 |
| p → λ transform | Poisson: P(N ≥ 1) = 1 − e^(−λ) | Standard identity |

**Not verified, and labelled as such above:** the meaning of `NTPSTDT`; the availability of MLRS ownership history; whether the comparables' dates spread widely enough to fit the gold elasticity β.
