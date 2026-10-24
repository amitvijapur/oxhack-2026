# Decision engine review: what to fix to meet an HRT or Citadel standard

**For:** the agent building the decision engine on branch `salman/decision-engine` (owner: Salman)
**Repo:** `oxhack-2026`
**Files reviewed:** `scripts/decision_engine.py`, `scripts/claims_forecast.py`, `research/decision-engine/README.md`, `research/decision-engine/tok-demo.json`, `tests/test_decision_engine.py` (test names only)
**Review date:** 24 Oct 2026. Hard cutoff: **Sunday 12:00**. Judging: HRT, "best use of data for predictions and decision-making".
**Review type:** read-only. No code was changed. Line numbers refer to the working tree when the review was written, so check them again before editing.

---

## 0. How to use this document

- Work through the items in priority order: **P0, then P1, then P2**. Each item gives:
  - what's wrong, with evidence
  - why a quant reviewer cares
  - what "done" looks like
- Keep within the project rules in `AGENTS.md`:
  - Python standard library only.
  - Chronological evaluation, with transformations fitted only on training data.
  - Compare against a simple baseline.
  - Record when each observation became available.
  - Report the actual commands you ran and their results. Don't claim completion from untested code.
- Keep every existing test passing. Every number added to the README must sit next to the command that regenerates it.
- If an item will change the pinned demo result (`test_demo_decision`, BUY at +$14,507), update the pin deliberately and explain why in the README. Don't silently loosen the test.

---

## 1. The standard being judged against

What reviewers at firms like HRT and Citadel check, in order:

1. **An honest out-of-sample number.** You measure skill on data the model never saw, against strong simple baselines, with error bars, and show there's no look-ahead.
2. **Calibration.** A forecast of 30% comes true about 30% of the time.
3. **Evaluating the decision, not just the prediction.** Show the distribution of outcomes the policy produces, not only its expected value.
4. **Knowing where it breaks.** Break-evens, sensitivity to each assumption and model checks, with the assumptions labelled.
5. **Reproducibility and verification.** Pinned data, one command to run, and tests against independent methods.
6. **A connected pipeline.** Data → measured prediction → decision. The measured part must actually drive the decision.

---

## 2. Strengths to keep (don't regress these)

- A 92-day feature lag before 1 January, consistent with the BLM 90-day recording rule (`claims_forecast.py:34,43`).
- Training only on fully resolved label years, up to Y-2 (`claims_forecast.py:195`).
- Spatial holdout by township, so cells in the test fold never appear in training (`claims_forecast.py:180,270-273`).
- Transfer tests from Nevada to Arizona and from Arizona to Nevada (`claims_forecast.py:274-277`).
- Counting distinct locator-days rather than claims, which avoids overstating demand by about 80×.
- Exact Gamma–Poisson conjugate updating (`decision_engine.py:122-144`).
- Backward induction checked against brute force on random contracts (`test_matches_brute_force_on_random_small_contracts`).
- Break-evens by bisection and the `fragile` flag (`decision_engine.py:341-395`).
- Data fetched with manifests and SHA-256 hashes.

---

## 3. P0: must fix (these decide whether the entry is credible)

### P0-1. The BUY signal depends on the 2007–2017 period; recent data points to SKIP

**Evidence.** `tok-demo.json` uses `staking_events_per_year = [2,0,0,3,2,2,0,1,2,4,1, 0,0,0,0,0,0,0, 1]` (2007–2025).

- Activity is steady until about 2017, followed by **seven zero years in a row**.
- `main()` (`decision_engine.py:410`) builds the prior with `gamma_prior_from_counts(counts, statistics.fmean(counts))`. That treats all 19 years as exchangeable, so the regime change becomes "overdispersion" instead of a drop in the rate.

The engine was re-run read-only, changing only how the history is used:

| How the history is used | Decision | EV | P(buyer within 12 months) | q* |
|---|---|---|---|---|
| All years equal (current demo) | **BUY** | +$14,507 | 0.340 | 0.196 |
| Same spread, mean from the last 8 years | **SKIP** | −$7,434 | 0.059 | none |
| Weak prior Gamma(1, 12 months), updated on all 19 years | BUY | +$21,752 | 0.374 | 0.186 |
| Weak prior Gamma(1, 12 months), updated on the last 8 years | **SKIP** | −$4,363 | 0.102 | 0.828 |

Reproduce the table (read-only; `-B` stops `.pyc` files being written):

```bash
python3 -B -c "
import sys,json,statistics; sys.path.insert(0,'scripts')
import decision_engine as d
spec=json.load(open('research/decision-engine/tok-demo.json'))
c=spec['contract']; counts=spec['staking_events_per_year']
def run(label,arr):
    r=d.analyse(c,arr,300000,100000)
    print(label,r['action'],round(r['value_usd']),r['break_even']['buyers_per_staking_event_q'],round(arr.p_buyer_within(12),3))
p=d.gamma_prior_from_counts(counts,statistics.fmean(counts)); run('all',d.GammaArrival(p.alpha,p.beta,0.5))
p=d.gamma_prior_from_counts(counts,statistics.fmean(counts[-8:])); run('last8 mean',d.GammaArrival(p.alpha,p.beta,0.5))
b=d.GammaArrival(1.0,12.0,0.5); run('seq all',b.with_staking(sum(counts),12*len(counts))); run('seq last8',b.with_staking(sum(counts[-8:]),96))
"
```

**Why it matters.** A quant reviewer looks at the input series before anything else. A BUY that disappears when recent years carry more weight is the main risk in the demo. Presented honestly, though, it becomes the strongest **TIME** story in the project.

**What to do.**
- Model the rate as **changing over time**. Use one of:
  - a discounted, or "forgetting", Gamma–Poisson: each year multiply both `alpha` and `beta` by a factor λ ∈ (0, 1] before adding that year's counts. λ = 1 reproduces today's i.i.d. pooling.
  - a power prior with an explicit half-life.

  Keep it conjugate and exact, consistent with the rest of the engine.
- Choose λ (or the half-life) **from data**, not by eye. Pick the value that maximises the one-step-ahead predictive log-likelihood of each year's count given only the years before it. A simple grid is fine. That makes the choice of how much to trust the past a measured choice.
- Report **the decision as a function of λ or the half-life**, including the break-even half-life at which BUY flips to SKIP. Add it to the `break_even` block and the `fragile` checks.
- Add a **posterior predictive check**. Simulate yearly counts from the fitted model and compare them with the observed data: the share of zero years, the longest run of zero years, and the variance. With i.i.d. pooling, seven zero years in a row should come out as unlikely. Show that.
- **Data integrity first.** The Tok series comes from the Alaska DNR field `NTPSTDT`, labelled "meaning unconfirmed" in `tok-demo.json`. Confirm what that date means: location, recording or status change. If it isn't the staking date, the whole demand series needs rebuilding.

**Done when:**
- the README shows the half-life sweep, with the chosen value justified by out-of-sample predictive likelihood
- the posterior predictive check is reported
- the BUY or SKIP headline reflects the chosen model
- the `NTPSTDT` meaning is confirmed and cited
- tests cover: λ = 1 reproducing the current prior, the discounted update matching hand-computed values, and the choice of λ using only past years

### P0-2. The forecast doesn't feed the decision

**Evidence.**
- The README claims data → features → measured prediction → decision.
- The `gamma_prior_from_counts` docstring (`decision_engine.py:156-167`) says the mean comes "from the forecast". But `main()` (`decision_engine.py:410`) passes the **raw historical mean** of the Tok counts.
- `final_model()` (`claims_forecast.py:239-253`) computes count moments for each forecast band, but nothing consumes them.

The validated NV/AZ forecast and the money decision are two separate pieces of work.

**Why it matters.** HRT's brief is predictions **and** decision-making. The link between them is the thing being judged.

**What to do.**
- Wire the forecast into the prior. The forecast's calibrated P(staking next year) for the target cell, or its band's mean and variance from `final_model`, sets the Gamma prior's mean and spread. Tok's own history then updates that prior through the P0-1 discounted update. This is "empirical-Bayes prior from the forecast, updated by local data", which the docstring already describes.
- Address the distribution shift openly: the model is trained on NV/AZ lode claims and applied to Alaska state claims.
  - Use the NV→AZ and AZ→NV transfer results as evidence of how well skill carries across regions.
  - State plainly that Alaska is a further step.
  - Report the decision with the forecast-based prior, with the Tok-only prior, and with the combination.
- Fix the docstring so it matches the code. Don't leave a claim the code doesn't fulfil.

**Done when:**
- one command runs data → forecast → prior → decision end to end
- the README shows the decision under each prior source
- a test checks that the forecast's output reaches the prior

### P0-3. The headline forecast result doesn't exist

**Evidence.**
- `research/decision-engine/README.md` links to `claim-activity-forecast.md`, which doesn't exist.
- `data/raw/claims/` has no `nv_az_lode_since_1997.csv` on Salman's machine. Only `nvaz_pages/`, the MRDS data and the Tok CSVs are there.
- There's no `data/generated/claims_forecast/report.json`.

**What to do.**
- Rebuild the NV/AZ CSV with `scripts/claims_fetch.py`. Run `python3 scripts/claims_forecast.py`.
- Write `research/decision-engine/claim-activity-forecast.md` with the pooled spatial result (headline), the per-fold table, the transfer results, the reliability table and the final model's coefficients.
- Put the run command and the data hashes alongside.

**Done when:** the linked file exists, and every number in it matches a fresh run of the stated command.

---

## 4. P1: what separates good from firm-grade

### P1-4. Error bars and effective sample size

Rows within a year aren't independent: common shocks such as the gold price move all cells together. The effective sample is about **21 test years**, not tens of thousands of cell-years.

- Report skill per year. `evaluate()` already returns `per_year`, so surface it. Also report **how many of the 21 years the model beats each baseline**, with a sign-test p-value.
- Get confidence intervals with a **block bootstrap** that resamples whole years, and townships for the spatial result, not single rows. Only claim an edge if the 95% CI excludes zero.

### P1-5. Add the gold price, and label the oracle baseline

- The model has no time-varying macro feature. The gold price is the obvious driver of staking and the natural link to markets for HRT.
  - Add a point-in-time gold-price feature, such as the log price change over the 12 months before the cutoff, built only from data available at `cutoff(year)`.
  - Document the source and its publication delay (`AGENTS.md` requires this).
- The `year_base_rate` baseline (`claims_forecast.py:202`) uses the **test year's own outcome rate**, so it's a hindsight oracle. Label it that way everywhere. Beating it shows **cross-sectional ranking** skill. Not beating it is expected without a macro feature. Say which claim you're making.

### P1-6. Fuller scoring

- Add **log loss** and **AUC** next to Brier.
- Add the **Murphy decomposition** of Brier into reliability, resolution and uncertainty.
- Add **calibration slope and intercept**.
- `pool_folds()` (`claims_forecast.py:287-299`) **drops the reliability table** from the pooled spatial result, the headline evaluation. Pool the scored pairs and compute reliability on them.
- **Ablation:** fit a model with only `log_trailing_1y` (persistence), then add one feature group at a time. Report the marginal skill of each. "Staked last year" is probably the hardest baseline to beat, so show the full model beats it out of sample.

### P1-7. Show the outcome distribution, not just EV and worst case

For the current demo, only a **high offer arriving in year 1** pays off:
- P(buyer within 12 months) ≈ 0.34, so P(high offer in year 1) ≈ 0.35 × 0.34 ≈ **0.12**.
- A low offer of $120k is always declined before month 12, because about $240k of stages would still be owed.
- So roughly **88% of the time you lose about $11.5k**, and about 12% of the time you gain about $200k+. This is a lottery-shaped payoff.

What to do:
- Report P(loss), P(gain), the median and the 5th and 95th percentiles of discounted P&L under the optimal policy. The tree can compute these exactly, or simulate paths.
- Add a sizing view: EV per dollar at risk, or a Kelly-style fraction under the stated budget.

### P1-8. The belief update ignores buyer arrivals

`Solver.hold()` (`decision_engine.py:232-239`) continues to `value(month + 1, pos)` after a **declined** offer. `p_buyer_in_month(month+1)` then treats that month as **quiet** (`decision_engine.py:142-144`). A buyer arriving is evidence of a **higher** rate, yet the model lowers its belief.

The class docstring (`decision_engine.py:180-181`) says values depend only on (month, position). That's true only because of this shortcut.

What to do:
- Add the number of arrivals seen to the state, as (month, position, arrivals). The posterior is then Gamma(alpha + arrivals, beta/q + months).
- Extend the brute-force test to match.

Optional, but strong for the TIME story: add **nearby staking events observed by the holder** to the state, so the plan updates as staking happens. That's the real learning-over-time mechanism. `with_staking()` already exists but the solver never calls it.

### P1-9. Lead with the assumption that drives the outcome

`q` (buyers per staking event) and the two-point offers are pure assumptions, and together they set the dollar value. The forecast measures staking, not offers. So:
- Make the headline the **break-even**: "BUY only if more than about 1 in 5 staking events becomes a buyer (q* = 0.196)", not "+$14,507".
- Add a two-way sensitivity grid over q × high offer, and q × half-life (from P0-1), showing the BUY/SKIP boundary. This doubles as the demo slide.
- Ground the offer assumptions in the comparables already cited in `tok-demo.json`: about $170–205 per acre, roughly $109k–131k for 640 acres. Show where those comparables sit on the grid.

---

## 5. P2: minor, but reviewers notice

- **`fit_logistic`** (`claims_forecast.py:124-147`):
  - It runs a fixed 8 Newton iterations with no convergence check. Add a gradient-norm tolerance and report the iterations used.
  - The ridge of 1e-3 does almost nothing because the features aren't standardised. Standardise them on **training data only**, or drop the claim of regularisation.
- **Claimant normalisation** (`claims_forecast.py:55`): `strip().upper()` still treats "ABC LLC" and "ABC, LLC" as different. Normalise punctuation and suffixes before deduplicating locator-days.
- **MRDS snapshot look-ahead** (`claims_forecast.py:74-93`):
  - Distance to gold uses one static MRDS snapshot, which may include sites recorded after the label year.
  - Either filter by the record's date where one exists, or state this as a known, small leak.
  - Run an ablation without the gold features to bound how much it matters.
- **Pinned `fragile` threshold:** the ±25% band is arbitrary but explicit. Keep it, and state it in the README output.
- **`evaluate_fixture`** (`decision_engine.py:82`) assumes the bid is known before the exercise date. That's fine for the fixture, but keep the "clairvoyant" label visible in any output a judge might see.

---

## 6. Suggested order of work before Sunday 12:00

1. **P0-3:** produce the real forecast numbers. Without them nothing else counts as measured.
2. **P0-1:** add the discounted update, choose λ from data, add the predictive check and confirm `NTPSTDT`. This may flip the headline, so do it early.
3. **P0-2:** wire the forecast into the prior, end to end.
4. **P1-7 and P1-9:** add the outcome distribution and the break-even-first headline with the sensitivity grid. These are the demo visuals.
5. **P1-4, P1-6 and P1-5:** add error bars, fuller scoring and the gold-price feature, as time allows.
6. **P1-8**, then **P2** items.

## 7. Suggested pitch

> "On the full history our engine said BUY. Weight recent years by how well they predict the next year, and it says SKIP: Tok has been quiet since 2017. So the real question is how much to trust the past. We measure that out of sample, use a forecast tested on 21 years of Nevada and Arizona claims to set the prior, and show exactly where the decision flips."

That's honest, it's about TIME, and it shows the self-criticism quant engineers look for.

## 8. Verification checklist for the building agent

- [ ] `python3 -m unittest discover -s tests -v` passes, including the new tests for the discounted update, the λ choice using only past years, the arrival-count state and brute force with arrivals.
- [ ] `python3 scripts/claims_forecast.py` regenerates `report.json`, and `claim-activity-forecast.md` matches it.
- [ ] `python3 scripts/decision_engine.py research/decision-engine/tok-demo.json` prints the decision, the outcome distribution, the break-evens (q*, first payment, high bid, half-life) and the `fragile` flags.
- [ ] Every README number has its command beside it. If the demo pin changed, the reason is stated.
- [ ] `NTPSTDT` meaning confirmed, with its source cited.
