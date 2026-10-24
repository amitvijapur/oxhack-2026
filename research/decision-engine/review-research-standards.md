# Decision engine, part 3: what a quant firm would still ask for

**For:** the agent building the decision engine (owner: Salman). This is a companion to `review-hrt-standard.md` and `review-architecture-and-transform.md`.
**Date:** 24–25 Oct 2026. Hard cutoff: Sunday 12:00. Research only; no code was changed.
**Method:** three parallel research passes, each told what the earlier reviews already covered:
1. how top quant firms validate research
2. decision science for sequential, uncertain choices
3. engineering standards at HRT and Citadel, and what hackathon judges reward

Every key claim was then rechecked against the current working tree (uncommitted changes on `salman/decision-engine`), `data/generated/claims_forecast/report.json` and a fresh run of the demo. Each item is labelled **[checked]** (verified in our code or data), **[literature]** (from a cited source) or **[judgement]** (an opinion with no primary source). The swarm is out of scope.

---

## 0. Where the engine stands now (it has moved a lot)

Since the first two reviews, the building agent has already added:
- a forgetting Gamma–Poisson, with the forgetting rate chosen by one-step predictive log score
- Bayesian averaging over forgetting rates (`MixtureArrival`)
- the 2025 partial-year exposure (63/365)
- arrivals in the solver state, so a declined offer raises belief in buyers
- the exact outcome distribution (`outcomes()`)
- a zero-run posterior predictive check
- `arrival_from_forecast` (p → λ = −ln(1−p) plus band moments)
- a commitment cap and an acceleration-flip check

Good work. Don't redo these.

**Current demo** (`python3 -B scripts/decision_engine.py research/decision-engine/tok-demo.json`) **[checked]**:

| Output | Value |
|---|---|
| Action | **BUY**, EV **+$9,617** |
| P(loss) / P(gain) | **0.870 / 0.130** |
| Median / 5th pct / 95th pct | −$11,545 / −$36,123 / +$182,901 |
| Worst reachable | −$71,742 |
| q* (break-even) | **0.269** (the demo assumes q = 0.5) |
| Pooled model zero-run check | 7-year zero run, p = **0.020**, so the constant-rate model is rejected |
| `fragile` | "the acceleration assumption alone flips the sign"; "**removing the single most recent staking event flips the sign**" (value without it: **−$9,140**) |

---

## 1. Three findings that should change the pitch

### F1. The BUY depends on one event in a partial year [checked]
- The engine's own `latest_event_check` shows that dropping the single 2025 owner-day (data end 2025-03-05) turns +$9.6k into −$9.1k. The acceleration assumption flips it on its own too.
- A quant reviewer will read this as "no decision": one Poisson count is noise.

**Honest framing:** "The Tok evidence isn't strong enough to justify BUY. Our engine detects that and tells you exactly which two facts it rests on." That's a strong, credible result. Present the decision as **conditional**, not as a call.
- Recommended display: **BUY/WAIT/SKIP**, with WAIT as the default when `fragile` isn't empty. See D4.
- Next step: confirm the 2025 event (owner, `NTPSTDT` meaning) before showing it to judges.

### F2. The forecast's edge within a year is small, and it fails one transfer test [checked]
From `report.json` (Brier skill; positive = better than the baseline):

| Evaluation | vs climatology | vs per-cell trailing rate | vs the test year's own base rate (oracle) |
|---|---|---|---|
| Time-forward, township folds (headline) | +2.21% | **+6.72%** | **+0.27%** |
| Train NV → test AZ | +3.68% | +7.34% | +2.08% |
| Train AZ → test NV | +0.90% | +5.60% | **−1.22%** |

Reliability over-forecasts across the middle bins, by about 15–22%. For example, a forecast of 0.0659 against an observed 0.0541, and 0.0837 against 0.0711.

What this means:
- The model reliably beats persistence (+6.7%).
- It matches an oracle that knows each year's overall level, but adds only about 0.3% beyond it in ranking cells.
- These probabilities feed money through `arrival_from_forecast`, so the over-forecasting biases λ upward and pushes towards BUY.

**Lead with:** "+6.7% against persistence, with [CI]; ranking adds little; AZ→NV transfer fails. Here's why, and here's the calibration fix." HRT's own blog prizes this kind of honesty. [literature: HRT, "ML benchmarks don't track what you care about", https://www.hudsonrivertrading.com/hrtbeat/trading-machine-learning/]

### F3. Fix one number [checked]
The forecast uses **875,406** NV/AZ lode claims located since 1997 (`wc -l` on `nv_az_lode_since_1997.csv`), making 31,643 sections and 446,047 cell-years. The "2.4M" figure in the foundation doc is the all-time count since 1850. Use 875k in the pitch.

---

## 2. Forecast validation: new items, ranked

**V1. Write down every variant you tried, then measure the probability of backtest overfitting (PBO) [literature]**
- Source: Bailey, Borwein, López de Prado & Zhu, https://papers.ssrn.com/abstract=2326253.
- Man AHL requires researchers to "keep a record of what was tried" (https://www.man.com/maninstitute/overfitting-and-its-impact-on-the-investor). Jane Street: "be very careful about the number of hypotheses that you test" (https://signalsandthreads.com/finding-signal-in-the-noise/).
- Steps:
  1. List every choice in `trials.json`: features, the 5 km radius, the 92-day lag, the 1y/3y windows, the log transforms, any baselines you dropped.
  2. Build a matrix: 21 test years × N variants, with Brier skill in each cell.
  3. Split the years into 6 contiguous blocks. Take all C(6,3) = 20 ways of using half the blocks in-sample and half out-of-sample.
  4. In each split, find the in-sample winner's out-of-sample rank ω. PBO is the share of splits where logit(ω) < 0.
- About 60 lines of stdlib code. About 2 h. Very high value.
- Purging and embargo: training on labels up to Y-2 already purges. Say so explicitly.

**V2. Test significance with years as the unit, not rows [literature]**
- d_t = baseline Brier − model Brier for each of the 21 years. Use the Diebold–Mariano t-test with the Harvey–Leybourne–Newbold small-sample correction, giving T − 1 degrees of freedom.
- Also run a t-test across the 5 spatial folds (Ibragimov & Müller, https://collaborate.princeton.edu/en/publications/t-statistic-based-correlation-and-heterogeneity-robust-inference/).
- After trying several variants, use **t > 3** as the bar (Harvey, Liu & Zhu, https://www.nber.org/papers/w20592).
- Optional: regress d_t on the year's base rate or the change in gold price to show *when* the model helps (Giacomini & White).
- About 1.5 h. High value.

**V3. Skill within strata, to rule out "varying climatology" [literature]**
- Source: Hamill & Juras 2006, https://www.bib.irb.hr/493347.
- Score skill within state × activity-decile strata, each against its own stratum's climatology, then average. If it collapses, the model is mapping where activity already is rather than forecasting change.
- About 1 h. High value.

**V4. Murphy diagram / relative economic value: links the forecast to the decision [literature]**
- Sources: Ehm, Gneiting, Jordan & Krüger 2016 (JRSS-B); Richardson's cost-loss value (ECMWF, https://www.ecmwf.int/en/elibrary/11903-skill-and-relative-economic-value-ecmwf-ensemble-prediction-system).
- For each θ in (0, 1), score the elementary cost-loss rule (act when p > θ) for the model and each baseline. Mark the θ implied by our contract.
- This shows directly which decision-makers the forecast helps, and why a small Brier skill can still be valuable.
- About 1.5 h. **Very high value for the "predictions and decision-making" criterion.**

**V5. Rare-event metrics [literature]**
- Source: Saito & Rehmsmeier 2015, https://pmc.ncbi.nlm.nih.gov/articles/PMC4349800/.
- Add precision@k and lift for k = 100/500/1000 sections per year. For example: "of the 500 sections we ranked highest, X% were staked, against the base rate's Y%." Add a precision-recall curve with the base rate as the no-skill line.
- About 1 h. High value, because judges can read it instantly.

**V6. Walk-forward recalibration [checked: over-forecasting]**
- Refit only the intercept, or isotonic regression, on the latest resolved year before each test year. Show reliability before and after.
- State which way the bias pushed BUY.
- About 1 h. High value.

**V7. Ablate the MRDS gold features [checked: static snapshot]**
- `GoldIndex` uses today's MRDS for every year. If MRDS has no record date to filter on, report skill with and without the two gold features.
- Explain the coefficient signs. Both are negative (−0.23 and −0.50). The log-distance term means closer is better; the 5 km dummy offsets part of it, because the two are collinear.
- About 1 h.

**V8. Check the fit and its stability [checked: fixed 8 iterations, no tolerance]**
- `fit_logistic` (`claims_forecast.py:124`) has no convergence test. Stop on a gradient-norm tolerance, assert convergence, and add a finite-difference gradient test.
- Refit with 5 sample seeds (the 15k subsample) and report the spread of coefficients and skill.
- Echoes Godbolt: "always measure" (https://podscripts.co/podcasts/twos-complement/performance).
- About 1 h.

**V9. Plateau, not peak [literature]**
- Show skill as the radius (2/5/10 km), the lag (60/92/180 days) and the windows vary. Plot the coefficient paths across walk-forward years. Sign flips are a red flag (Man AHL, above).
- Comes almost free from V1's matrix.

**V10. Drift alarm [literature]**
- A risk-adjusted Bernoulli CUSUM on the model's own probabilities: W_t = max(0, W_{t−1} + y·ln R − ln(1 − p + R·p)), with R = 2 and the threshold h set by simulation.
- Source: Steiner et al. 2000, https://pmc.ncbi.nlm.nih.gov/articles/PMC1743380.
- Report the dates it fires: when the forecast itself broke. This is different from the decision model's forgetting.

**V11. Freeze and hash a 2026 forecast [judgement]**
- Every year has been looked at, so a true holdout isn't possible now. Publish the SHA-256 of the 2026 forecast file and the code commit, so it can be checked later. This is the honest substitute for pre-registration.

---

## 3. Decision science: new items, ranked

**D1. Exact changepoint posterior: "P(the regime changed in 2018)" [literature]**
- Sources:
  - Raftery & Akman 1986, Biometrika 73(1), https://doi.org/10.1093/biomet/73.1.85
  - Fearnhead 2006, exact multiple changepoints
  - Adams & MacKay 2007, the online run-length form, https://arxiv.org/abs/0710.3742
- With 19 years, enumerate every possible change year τ exactly. For a segment with total count S and exposure E, under a Gamma(a, b) prior:
  `log m = a·ln b − lnΓ(a) + lnΓ(a+S) − (a+S)·ln(b+E) + Σ yᵢ·ln eᵢ − Σ ln yᵢ!`
- `L(τ) = m(1..τ−1) · m(τ..19)`; P(τ | y) ∝ π(τ)·L(τ). Compare against the no-change model m(all).
- Bayes factors are sensitive to the prior, so use the pooled Tok/NV prior and show 2–3 priors.
- Our existing `discounted_posterior` *is* the West & Harrison / Harvey–Fernandes discount model, so name it that way.
- About 1.5 h. **Very high value:** "an X% posterior probability of a break in 2018, with a post-break rate of 0.1–0.3 a year" is far more persuasive than a forgetting factor.

**D2. Let the rate keep changing during the 72-month horizon [literature]**
- The past is modelled as drifting, but the solver freezes the rate for the next 6 years. That's inconsistent.
- Option A: run the Adams & MacKay recursion forward with hazard H chosen by predictive score.
- Option B, simpler: before each month's arrival step, apply α, β ← δ^(1/12)·(α, β), and memoise on a rounded (α, β).
- About 2–3 h. High value.

**D3. Average across model *types*, then report robust values [literature]**
- Stack the constant, discounted and changepoint models by one-step predictive density. Stacking: Yao, Vehtari, Simpson & Gelman 2018, https://arxiv.org/abs/1704.02030. This is preferred to Bayesian model averaging when no model is true.
- Report alongside EV:
  - maxmin value, min_k V_k
  - minimax regret for BUY against SKIP
  - the KL-robust value inf_{KL(Q‖P) ≤ η} E_Q[X] = sup_θ{−(1/θ)·ln E_P[e^(−θX)] − η/θ}, computed on the exact `outcomes()` distribution
  - **η\***, the ambiguity budget at which BUY flips
- Caveat: this evaluates the fixed policy rather than re-optimising it. Say so.
- About 2 h. High value, because q is assumed, which is exactly when robust criteria are expected.

**D4. Option to wait: BUY / WAIT / SKIP [literature]**
- Sources: Dixit & Pindyck 1994; Majd & Pindyck 1987, https://www.nber.org/papers/w1654.
- `V_wait = P(deal still open) · δ¹² · Σ_n NB(n | α, β, 1) · max(0, V_entry(posterior after n))`, using the existing `with_staking(n, 12)`.
- Treat P(deal open) as a labelled assumption with its own break-even.
- Combined with F1, WAIT is likely the honest answer today. About 1–1.5 h. High value.

**D5. Gold drives both buyer arrivals and offer size [literature]**
- Use K gold scenarios, each with its own Gamma rate and its own bid distribution, as mixture components in `MixtureArrival`.
- Weights update on arrivals as they do now, so an arrival also raises the expected bid. The dynamic programme stays exact.
- Sources: Brennan & Schwartz 1985 (not fetched); Trigeorgis 1993 (JFQA).
- About 2–3 h, and needs the comparables bid bootstrap.

**D6. Risk preference: certainty equivalent and Kelly [literature]**
- With P(loss) = 0.87, EV alone isn't enough. On the exact `outcomes()` distribution, report:
  - the CRRA certainty equivalent at γ = 1, 2, 4
  - the γ at which BUY flips
  - the fractional-Kelly stake
- Source: MacLean, Thorp & Ziemba 2010, https://www.stat.berkeley.edu/~aldous/157/Papers/Good_Bad_Kelly.pdf.
- A rough hand estimate from the research pass suggests the flip is around γ ≈ 3–4 [judgement; recompute on engine output].
- About 1 h.

**D7. "Why 8%?" [literature]**
- Value the hedgeable gold part with the risk-free rate and futures-implied scenario weights. Handle the unhedgeable buyer-arrival risk through D6's utility.
- Sources: Smith & Nau 1995 (Management Science), https://people.duke.edu/~rnau/sn95.htm; Smith & McCardle 1998.
- At minimum, one slide saying 8% is a placeholder, citing this method. 1 h for the slide, 3 h to implement.

**D8. Test the solver against stopping theory [literature]**
- Fixed-point test: with a known rate, a long horizon and no carry, the threshold must satisfy x = δ[(1−p)·x + p·E max(B − fees, x)].
- Monotonicity: on the quiet path the threshold should not rise. State that under learning a decline raises later thresholds, which is correct Bayesian behaviour.
- Sources: Albright 1977; Rosenfield, Shapiro & Butler 1983.
- With two-point bids, "threshold" just means "accept $120k: yes or no". Say so.
- About 1 h.

**D9. Validate the inference, since decision outcomes can't be observed [literature]**
- Off-policy evaluation doesn't apply: there's no log of past decisions. Say so explicitly.
- Instead, run three checks:
  1. **Simulation-based calibration** of the Gamma updating (Talts et al., https://arxiv.org/abs/1804.06788).
  2. A **walk-forward non-randomised PIT histogram** and ranked probability score for the yearly count forecasts against a constant rate (Czado, Gneiting & Held 2009).
  3. **Leave-one-out** on the 21 priced comparables.
- About 2 h. High value.

**D10. The optimizer's curse [literature]**
- BUY is chosen *because* V̂ > 0, so V̂ is biased upward. Shrink it: V̂_adj = V̂ − (σ²_est / (σ²_est + σ²_prior))·(V̂ − μ_prior), with σ² taken from the spread across stacked models and bid bootstraps.
- Source: Smith & Winkler 2006, Management Science 52(3).
- About 0.5 h. Mainly a slide.

---

## 4. Engineering, data and presentation

**E1. Measure before optimising [literature + judgement]**
- Run `python3 -m cProfile -s cumtime scripts/claims_forecast.py` and put a three-row timing table in the README. Data loading and `build_rows` are expected to dominate, not IRLS.
- A hand-written C++ inner loop is worth it for the Citadel "handmade" prize only if a teammate wrote it and can defend it live. If so: match the Python coefficients to 1e-9, time both, and link the loop on Compiler Explorer. That nods to the Godbolt talk at the event (https://xania.org/202511/advent-of-compiler-optimisation).
- Godbolt's Law: if one optimisation makes code run twice as fast or more, you've probably broken it (https://xania.org/200504/godbolt's-law).

**E2. Data checks at the boundaries [literature]**
- HRT recommends validating external data at runtime and using domain types or `Literal` (https://www.hudsonrivertrading.com/hrtbeat/building-robust-codebases-with-pythons-type-annotations/).
- Add `validate_claims()` covering:
  - `Location_Date` ≤ the snapshot date
  - `Closed_Date` ≥ `Location_Date`
  - the MTRS format
  - lon/lat inside the bounding box
  - claim counts per year
- Report how many rows each check drops. Normalise claimant suffixes (LLC/INC/punctuation); name variants inflate the locator-day count, which is our headline data correction.
- HRT on provenance: https://www.hudsonrivertrading.com/hrtbeat/how-hrt-thinks-about-data/.

**E3. Visible handmade evidence for Citadel [judgement]**
- Add photos of a hand derivation of the Gamma–Poisson update and of the $12,600 / −$400 fixture.
- Keep a "what we got wrong" log: the 80× claims-versus-decisions correction, the PR #23 audit fixes, F1 and F2.
- Make sure a human can derive q* at the judging table.
- Citadel Securities says it assesses "judgment about edge cases and failure modes" (search snippet only; the page returned 403).

**E4. One slide quant engineers won't dismiss [judgement]**
The slide:
- the headline skill with its interval
- three baselines, including the oracle you nearly tie
- the reliability chart
- the failure case (AZ→NV)
- the Murphy diagram (V4)
- the decision with its flip points (q*, the latest event, acceleration) and the outcome distribution

What gets projects dismissed:
- no baseline
- in-sample numbers
- a decision whose inputs are all assumed
- anything that can't be reproduced live

Note: no verified named winner of a past HRT or Citadel hackathon prize could be found, so this is judgement, not evidence.

---

## 5. Rejected or downgraded after checking (don't act on these)

| Claim from a research pass | Check | Verdict |
|---|---|---|
| The neighbour-township feature leaks across spatial folds | `build_rows` (`claims_forecast.py:109-118`) sums only the cell's own township; folds are by township, so neighbours are always in the same fold. Training labels are also ≥ 2 years older than test labels. | **Rejected.** No label leak. A buffer adds little. |
| The manifest contradicts its snapshot date (URL says 2022) | Latest `Location_Date` in the CSV is **2025-03-12** | **Rejected.** Consistent with the 2025-03-19 snapshot; the URL is just an old service name. |
| Declined offers lower belief in buyers | `Solver.hold` passes `seen + 1`; `p_buyer_in_month` uses `alpha + arrivals` | **Already fixed.** |
| No averaging over forgetting rates | `MixtureArrival` plus `forgetting_profile` | **Already done.** D3 extends it to model types. |
| The forecast isn't wired to the decision | A `forecast_cell` path in `main()` calls `arrival_from_forecast` | **Wired.** The Tok demo can't use it, because the forecast is NV/AZ only. Show it on an NV/AZ cell to demonstrate the link. |
| Survivorship from a deduplicated snapshot | The file includes closed claims; early-year purges are unknown | **Downgraded.** Optionally rerun with test years from 2008 to show robustness. |

---

## 6. Priority order for the remaining hours

1. **F1:** confirm the 2025 event. Present the decision as conditional, with BUY/WAIT/SKIP (D4).
2. **F2 + V2 + V6:** headline skill with a year-unit significance test and recalibration. Own the AZ→NV failure.
3. **V4:** the Murphy diagram, linking forecast to decision.
4. **D1:** the changepoint posterior, as the TIME story.
5. **V1:** a trials log plus PBO.
6. **D6:** certainty equivalent and Kelly on the exact outcomes.
7. **V3, V5, D3**, then **E3 + E4** (the slide).
8. Everything else as time allows: D2, D5, D7–D10, V7–V11, E1, E2.

## 7. Verification log (read-only, 24–25 Oct 2026)

| Item | Command / source | Result |
|---|---|---|
| Demo outputs in §0 | `python3 -B scripts/decision_engine.py research/decision-engine/tok-demo.json` | As tabulated |
| Forecast skill and reliability | `data/generated/claims_forecast/report.json` | As tabulated in F2 |
| Claim count | `wc -l data/raw/claims/nv_az_lode_since_1997.csv` | 875,407 lines (875,406 claims) |
| Snapshot date | max `Location_Date` | 2025-03-12 |
| Fit convergence | `claims_forecast.py:124-128` | Fixed 8 iterations, no tolerance |
| Neighbour feature scope | `claims_forecast.py:109-118` | Same-township only |
| Engine features present | `grep` over `decision_engine.py` | `discounted_posterior`, `MixtureArrival`, `arrival_from_forecast`, `outcomes`, `zero_run_check`, state includes `seen` |

**Not verified:**
- the full texts of the PBO, Smith & Miller, Brennan & Schwartz and Hu & Hong papers (abstracts or secondary sources only)
- Citadel's pages (403)
- whether past HRT or Citadel prize winners exist
- the BLM 90-day recording rule (from memory; check 43 CFR 3833)
- the meaning of `NTPSTDT`
- the γ ≈ 3–4 flip estimate (a hand calculation on rough numbers)
