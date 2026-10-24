# Measured prediction: will a staked section see new staking next year?

25 October 2026. Owner: Salman. Code: [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py). Results come from `data/generated/claims_forecast/report.json` (SHA-256 `7ddd00dc…a338`). The outputs are ignored by Git; regenerate them with the commands at the end.

## Result in one line

On held-out years and held-out townships, the model beats the climatology baseline in **all 21 test years (2003–2023)**. Its Brier skill is **+2.2%**, with a 95% interval of **+1.7% to +2.8%** from resampling whole years. The edge is small but measured, and it carries over from Nevada to Arizona. It does not demonstrably carry over from Arizona to Nevada.

## What is predicted

| Item | Definition |
|---|---|
| Unit | A PLSS section (1 square mile, identified by `MTRS`) in Nevada or Arizona that had a lode claim located since 1997, before the forecast cutoff |
| Target | At least one **new staking decision** in the section during calendar year Y. A staking decision is a distinct claimant-and-date pair ("locator-day"), not a claim count: one company filing hundreds of claims in a day is one decision |
| Information | Only claims located before **1 October of Y−1** (a 92-day gap for recording lag). Snapshot status fields are never used as features |
| Training | Label years 2001 to Y−2 only, the last fully resolved at the cutoff |
| Features | Distinct staking decisions in the section over the last 1 and 3 years; active claims at the cutoff; staking in the rest of the township over the last year; gold within 5 km and distance to the nearest gold site (USGS MRDS) |
| Model | Logistic regression, standard library (Newton's method), 15,000 training rows sampled per fit with a fixed seed |

## Held-out skill

Brier score is the mean squared error of the probability (lower is better). Skill is 1 − Brier(model) / Brier(baseline).

| Evaluation | Test cell-years | Brier, model | Climatology | Skill vs climatology | 95% CI (year bootstrap) | Years beating climatology |
|---|---:|---:|---:|---:|---:|---:|
| Held-out years × held-out townships (headline) | 433,476 | 0.07629 | 0.07801 | **+2.2%** | +1.7% to +2.8% | **21/21** (sign test p ≈ 5×10⁻⁷) |
| Held-out years, all cells | 433,476 | 0.07621 | 0.07801 | +2.3% | +1.8% to +2.9% | 21/21 |
| Train Nevada → test Arizona | 99,135 | 0.07125 | 0.07397 | +3.7% | +2.7% to +4.5% | 19/21 |
| Train Arizona → test Nevada | 334,341 | 0.07860 | 0.07931 | +0.9% | −0.5% to +2.0% | 16/21, **not established** |

The two other baselines:
- **Trailing rate** (each section's own past frequency) is worse than climatology: −4.8%. The model beats it by +6.7%. Simple persistence is not a strong predictor here.
- **Year base rate** uses each test year's actual outcome rate. That's a hindsight oracle no real forecast could know. The model beats it by only +0.3% on held-out townships. So almost all of its skill is **ranking sections within a year**, not predicting which years are busy. A time-varying driver, such as the gold price, is the missing piece for that (open item).

Skill grows over time as the training history lengthens: about 0–1% in 2003–2007, 2–6% from 2009 onward (per-year table in `report.json`).

## Calibration

Pooled held-out reliability, in ten equal-count bins of about 43,000 cell-years each:

| Mean forecast | 0.040 | 0.055 | 0.065 | 0.074 | 0.083 | 0.093 | 0.103 | 0.116 | 0.135 | 0.186 |
|---|---|---|---|---|---|---|---|---|---|---|
| Observed | 0.041 | 0.052 | 0.054 | 0.063 | 0.071 | 0.081 | 0.089 | 0.104 | 0.127 | 0.165 |

The ranking is right, since the observed rate rises in every bin, but the model **over-forecasts by about 1 percentage point**. A calibration step fitted on held-out predictions (isotonic or Platt) is an open item. Until then, the decision engine uses the raw probability, and that is stated in its output.

## The final model

The model is fitted on label years 2001–2023:

| Feature | Coefficient |
|---|---:|
| Intercept | −1.717 |
| log(1 + staking decisions, last year) | +0.113 |
| log(1 + staking decisions, last 3 years) | +0.487 |
| log(1 + active claims at cutoff) | −0.131 |
| log(1 + township staking, last year) | +0.199 |
| Gold within 5 km | −0.228 |
| log(1 + km to nearest gold site) | −0.501 |

The two gold terms are correlated, so read them together: being closer to known gold raises the chance of new staking.

## From forecast to decision

`scripts/decision_engine.py` converts a section's forecast P(any staking) into a staking rate: λ = −ln(1 − p), the Poisson rate with that chance of at least one event. The rate's spread comes from the event counts of sections in the same forecast band. That belief sets the buyer-arrival prior in the contract solver. See [the engine README](README.md#nevada-the-measured-forecast-drives-the-decision).

## Known limits

- **Gold sites:** MRDS is a single snapshot (updates stopped in 2011). Some sites may have been recorded after a given label year. This is a small look-ahead risk that hasn't been measured; an ablation without the gold terms is an open item.
- **Claimant names** are compared after trimming and capitalising only. Spelling variants ("ABC LLC" vs "ABC, LLC") can split one decision into two.
- **Scope:** the target is staking **activity**, not contract prices or profit.
- **Alaska:** NV/AZ skill doesn't establish Alaska skill, so the Tok demo uses Tok's own history instead.
- **Scoring:** log loss, AUC and the Murphy decomposition haven't been added yet.

## Reproduce

```sh
python3 scripts/claims_fetch.py nvaz-hub   # 875,406 lode claims since 1997, via one ArcGIS Hub CSV export
python3 scripts/claims_fetch.py mrds       # 21,141 MRDS sites listing gold in an NV/AZ box
python3 scripts/claims_forecast.py         # about 3 minutes; writes report.json and forecast_2025.csv
python3 -m unittest discover -s tests -p 'test_claims_forecast.py' -v
```

Data used for these results (each manifest is in `data/raw/claims/`):

| File | Rows | SHA-256 | Retrieved (UTC) |
|---|---:|---|---|
| `nv_az_lode_since_1997.csv` (NDOM copy of BLM MLRS, snapshot 2025-03-19) | 875,406 | `76dd32c4…1307` | 2026-10-24 22:29 |
| `mrds_gold_nv_az_box.csv` (USGS MRDS) | 21,141 | `1579feff…9cb8` | 2026-10-24 21:50 |
| `forecast_2025.csv` (generated) | 31,449 sections | `1fa3ee9d…dae7` | — |
