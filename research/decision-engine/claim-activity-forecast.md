# Measured prediction: will a staked section see new staking next year?

25 October 2026. Owner: Salman. Code:
- [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py): the forecast
- [`scripts/claims_pbo.py`](../../scripts/claims_pbo.py): the overfitting check

Results come from `data/generated/claims_forecast/report.json` (SHA-256 `fa2e5793…c839`). The outputs are ignored by Git; regenerate them with the commands at the end. This version follows the third review in PR #25 (`review-research-standards.md`).

## Result

On held-out years and held-out townships, the model is better than the climatology baseline in **every one of 21 test years (2003–2023)**:

| Measure | Value |
|---|---|
| Brier skill against climatology | **+2.2%**, 95% CI +1.7% to +2.7% (resampling whole years) |
| Year-unit significance | Diebold–Mariano t = 9.0 (Harvey–Leybourne–Newbold correction, 20 df), p ≈ 2×10⁻⁸ |
| Across the five township folds | t = 18.0 (4 df), p = 6×10⁻⁵ |
| Against persistence (each section's own trailing rate) | **+6.7%** (DM t = 9.2) |
| Against a hindsight oracle that knows each year's overall rate | +0.3% |

**What that means:**
- **Almost all the skill is ranking sections within a year,** not predicting busy years. Predicting busy years would need a time-varying driver such as the gold price, which is an open item.
- **Nevada → Arizona transfer holds** (+3.7%).
- **Arizona → Nevada transfer is not established** (+0.9%, CI includes 0).
- **The edge is small but real, and it pays off for some decisions** (economic value below).

## What is predicted

| Item | Definition |
|---|---|
| Unit | A PLSS section (1 square mile, `MTRS`) in Nevada or Arizona with a lode claim located since 1997, before the forecast cutoff |
| Target | At least one **new staking decision** in the section during calendar year Y. A decision is a distinct claimant-and-date pair; claimant names are normalised so "ABC, LLC" and "ABC LLC" are one claimant |
| Information | Only claims located before **1 October of Y−1**. This 92-day gap was fixed before fitting, to match BLM's 90-day window for recording a new claim |
| Training | Label years 2001 to Y−2 only, the last fully resolved at the cutoff |
| Features | Staking decisions in the section over 1 and 3 years; active claims; staking elsewhere in the township over 1 year; gold within 5 km and distance to the nearest MRDS gold site |
| Model | Logistic regression in the standard library. It stops on a gradient tolerance; all five fits converged in 6 iterations |

## Data checks

875,406 claims were read and 874,545 kept:
- 861 dropped for a malformed `MTRS`
- none located after the 2025-03-19 snapshot
- 31 closed dates earlier than their location dates were ignored

2,642 raw claimant names become 2,566 after normalisation, giving **125,005 staking decisions** across 31,431 sections (445,681 cell-years).

## Held-out skill

Brier score is the mean squared error of the probability; lower is better. Skill = 1 − Brier(model) / Brier(baseline).

| Evaluation | Test cell-years | Brier, model | Climatology | Skill vs climatology | 95% CI | Years beating climatology |
|---|---:|---:|---:|---:|---:|---:|
| Held-out years × held-out townships (headline) | 433,110 | 0.07636 | 0.07806 | **+2.2%** | +1.7% to +2.7% | **21/21** |
| Held-out years, all cells | 433,110 | 0.07630 | 0.07807 | +2.3% | +1.8% to +2.9% | 21/21 |
| Train Nevada → test Arizona | 99,074 | 0.07129 | 0.07401 | +3.7% | +2.7% to +4.5% | 19/21 |
| Train Arizona → test Nevada | 334,036 | 0.07871 | 0.07938 | +0.9% | −0.5% to +1.9% | 16/21, **not established** |

**Skill by year:**
- 0–2% in 2003–2009
- mostly 2–5.5% from 2010 (1.7% in 2011)
- largest in 2013–2015, when staking was rare (base rate 4.5–6%)

## Decision value: who is helped by this forecast?

**Relative economic value** applies the rule "act on a section when p > θ" for a decision-maker whose cost/loss ratio is θ:
- 0 means no better than acting on the base rate.
- 1 means perfect foresight.

| Cost/loss ratio θ | 0.04 | 0.06 | 0.08 | 0.10 | 0.12 | 0.15 | 0.20 |
|---|---|---|---|---|---|---|---|
| Model | 0.01 | 0.05 | **0.15** | 0.11 | 0.07 | 0.02 | −0.01 |
| Persistence (trailing rate) | −0.10 | −0.01 | 0.12 | 0.08 | 0.00 | −0.07 | −0.13 |

The forecast helps decision-makers whose costs are 4–15% of the possible gain. That's the range where acting on a section is cheap relative to missing a burst. Persistence helps a narrower band, and does harm outside it.

**Precision at k:** of the 100 sections ranked highest in each held-out fold and year, **20%** saw new staking, against a mean base rate of 9.4% (about 2.2×). For the top 500 it's 17%, and for the top 1,000, 15%.

## Calibration

| Mean forecast | 0.040 | 0.055 | 0.065 | 0.074 | 0.083 | 0.093 | 0.104 | 0.116 | 0.135 | 0.186 |
|---|---|---|---|---|---|---|---|---|---|---|
| Observed | 0.041 | 0.052 | 0.055 | 0.062 | 0.073 | 0.080 | 0.089 | 0.104 | 0.128 | 0.164 |

The ranking is right, but the model **over-forecasts by about 1 percentage point** (roughly 10–15% in relative terms).

**Recalibration was tried and made things worse.** The method fitted an intercept shift on out-of-sample predictions for year Y−2, from a model trained up to Y−3:
- It cut skill to +1.3%, with DM t = 1.9 against climatology.
- For Arizona → Nevada it went to −0.8%.

The bias moves with each year's level, which isn't known two years ahead. **The raw model is therefore used.** Because of the over-forecast, decisions built on these probabilities lean slightly towards BUY. That's stated in the decision output.

## Trials and overfitting

Every variant tried is recorded in [`trials.json`](trials.json): lag 60, 92 or 180 days; gold radius 2, 5 or 10 km; with or without gold. Mean yearly skill:

| base (92 days, 5 km) | lag 60 | lag 180 | radius 2 km | radius 10 km | no gold |
|---|---|---|---|---|---|
| 2.23% | 2.55% | 1.82% | 2.20% | 2.23% | 1.66% |

- **Probability of backtest overfitting** (CSCV, 6 year-blocks, 20 splits): **0.0**. The variant that wins in sample also ranks first out of sample in every split.
- **The gold radius is a plateau, not a peak:** 2, 5 and 10 km give practically the same skill.
- **The gold features add about 0.6 percentage points.** Some of that could come from MRDS sites recorded after the label year (a static snapshot), so treat it as an upper bound.
- **The 60-day lag scores best but is not adopted.** It would use claims that can still be unrecorded in real time (the 90-day recording window), so its extra skill is likely look-ahead. The 92-day lag was fixed before any fit.

## The final model

The model is fitted on label years 2001–2023, five samples of 15,000 rows each:

| Feature | Coefficient | Range over 5 samples |
|---|---:|---|
| Intercept | −1.791 | −2.050 to −1.664 |
| log(1 + staking decisions, last year) | +0.088 | +0.088 to +0.205 |
| log(1 + staking decisions, last 3 years) | +0.559 | +0.425 to +0.559 |
| log(1 + active claims) | −0.103 | −0.103 to −0.052 |
| log(1 + township staking, last year) | +0.189 | +0.162 to +0.199 |
| Gold within 5 km | −0.253 | −0.392 to −0.083 |
| log(1 + km to nearest gold site) | −0.472 | −0.544 to −0.356 |

No coefficient changes sign across samples. The two gold terms are correlated: read together, closer to known gold means more staking.

## Rejected after checking

PR #25's third review checked these possible faults and found they don't apply:
- the neighbour feature leaking across folds
- the snapshot date
- declined offers lowering belief
- missing averaging over forgetting rates
- the forecast not being wired to the decision

See section 5 of that review.

## Still open

- a point-in-time gold-price feature
- log loss and AUC
- skill within strata (state × activity decile)
- a drift alarm
- a frozen, hashed 2026 forecast
- a profile of where the run time goes

## Reproduce

```sh
python3 scripts/claims_fetch.py nvaz-hub   # 875,406 lode claims since 1997, via one ArcGIS Hub CSV export
python3 scripts/claims_fetch.py mrds       # 21,141 MRDS sites listing gold in an NV/AZ box
python3 scripts/claims_forecast.py         # about 5 minutes; writes report.json and forecast_2025.csv
python3 scripts/claims_forecast.py --quick --tag lag60 --lag-days 60      # trial variants, about 3 minutes each
python3 scripts/claims_forecast.py --quick --tag lag180 --lag-days 180
python3 scripts/claims_forecast.py --quick --tag radius2 --gold-radius-km 2
python3 scripts/claims_forecast.py --quick --tag radius10 --gold-radius-km 10
python3 scripts/claims_forecast.py --quick --tag nogold --no-gold
python3 scripts/claims_pbo.py              # probability of backtest overfitting over trials.json
python3 -m unittest discover -s tests -p 'test_claims_forecast.py' -v
```

| File | Rows | SHA-256 |
|---|---:|---|
| `nv_az_lode_since_1997.csv` (NDOM copy of BLM MLRS, snapshot 2025-03-19) | 875,406 | `76dd32c4…1307` |
| `mrds_gold_nv_az_box.csv` (USGS MRDS) | 21,141 | `1579feff…9cb8` |
| `forecast_2025.csv` (generated; 2025 forecast with cutoff 2024-10-01) | 31,242 sections | `f7e16a8c…a288` |
