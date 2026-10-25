# Can Jev label the Tok society's posts cold, warm or hot?

25 October 2026. Owner: Salman. Code:
- [`scripts/jev_sentiment_check.py`](../../scripts/jev_sentiment_check.py): the experiment
- [`scripts/gold_set.py`](../../scripts/gold_set.py): the human gold set

Data: the pilot run of the Tok society (`swarm/records/pilot/scores.jsonl` on `ahmed/gold-society-plan`): 296 posts, 277 of which the gpt-5.4-mini judge scored 0–10. The bands are cold 0–3, warm 4–6 and hot 7–10.

## Bottom line

1. **At the level the swarm uses, a calibrated Jev tracks the judge closely.** The swarm reads group means and scenario-minus-baseline differences, not single labels. Calibration is a per-group shift plus one slope, fitted on the design half. On the held-out half, Jev's group means then sit **within 0.18 points of the judge's on average (largest error 0.28; r = 0.97)**. Uncalibrated, the average error is 0.58.
2. **Per post, Jev's 0–10 score correlates with the judge's at r = 0.55** (95% CI 0.43–0.66; Spearman 0.60). The bucket kappa of about 0.2 understates that, because 53% of the judge's scores are exactly 5. A post at 6 against 7 counts as a full miss in buckets but a one-point miss here.
3. **It's fast and almost free.** It takes under a second per batch of 25 posts and less than half a cent per run.
4. **None of four prompt redesigns beat the simplest version on held-out posts.** Removing the author's role reduced the lean towards "hot":
   - over-calls 24 → 15
   - bias +0.85 → +0.60
   - per-post MAE 1.07 → 0.87

   That's the version to use. **More prompt tuning can't be measured with this data.**
5. **The smallest scenario effect one simulated day can show** (80% power, 5% two-sided, post-to-post spread only):
   - **under the judge:** 0.33 points (Funds), 0.39 (Government), 0.45 (Industry), 0.60 (Community and Retail)
   - **under Jev:** 0.33–0.88 points

   Smaller effects are noise. Run-to-run spread, measured by the three baseline seeds, adds to this.
6. **The judge is a reference, not ground truth.** The [human gold set](gold-set/README.md) settles which labeller is right. Once it's scored, `gold_set.py score --scores` corrects either labeller's group means to human-scale estimates with confidence intervals (prediction-powered inference; Angelopoulos et al., *Science* 2023).

**Policy for the nine scored runs:**
- Report each effect under the judge and under calibrated Jev.
- Call an effect robust only if it exceeds the detectable effect and keeps its sign under both.
- Once humans have scored the gold set, report the human-corrected means.

## Method

The research behind it:
- the [TypeSafe documentation](https://docs.typesafe.ai): structured criteria with examples, atomic Nouls, Score for ordered levels, order checks, pinning the model, and escalation
- the evaluation literature: weighted kappa and AC2 with bootstrap CIs; stance is not sentiment; boundary examples; and a stratified human gold set, since labeller ensembles can't replace one (see the references in PR #26)

**Guard against overfitting:**
- The 277 judged posts are split 50/50 by a seeded draw, stratified by the judge's label: 139 for design and 138 for test.
- Examples and thresholds come only from the design half.
- Each variant was scored once on the test half, and every variant tried is listed.
- The model is pinned to `jev-1.14.0`.

| Variant | Design |
|---|---|
| V0 | Baseline: the post plus the author's role in each question; three plain levels mirroring the judge rubric |
| V1 | Same, **without the author's role** |
| V2 | Structured levels (`what`, `examples`, `includes`, `not_for`) with real boundary posts from the design half, plus "judge stance, not tone" |
| V2r | V2 with the levels in reverse order (an order-bias check) |
| V3 | Four atomic yes/no questions (opposes, concern, conditional, strong support) combined by fixed rules; thresholds tuned on the design half |
| V4 | Escalation: keep V1's label when its top probability ≥ τ (τ = 0.6, chosen on the design half), otherwise send the post to the judge |

## Results on the held-out half

138 posts: 119 warm, 16 hot, 3 cold.

| Variant | Weighted kappa (quadratic) [95% CI] | Ordinal alpha | Macro-F1 | Hot recall | Hot over-calls | Bias on 0–10 |
|---|---|---:|---:|---:|---:|---:|
| Always "warm" | 0.00 | −0.03 | 0.31 | 0% | 0 | — |
| V0 | 0.21 [0.02, 0.40] | 0.20 | 0.41 | 56% | 24 | +0.85 |
| **V1, no role** | **0.21 [−0.02, 0.43]** | **0.22** | **0.42** | 44% | **15** | **+0.60** |
| V2, examples | −0.02 [−0.05, 0.00] | −0.04 | 0.31 | 0% | 2 | −0.20 |
| V3, atomic | 0.13 [−0.05, 0.32] | 0.13 | 0.37 | 25% | 15 | — |

**Reading the variants:**
- **V2 collapsed to "always warm".** Its "constructive talk is warm" rule contradicts the judge, which counts investors' constructive appetite as support, per its rubric. The judge's own hot examples were constructive investor posts.
- **V3 overfitted.** It scored 0.46 on the design half and 0.13 on the test half.
- **No order bias:** reversing V2's levels changed 1.4% of labels.
- **Escalation (V4)** sends 17% of posts to the judge. On the 83% Jev keeps, accuracy is 85% and kappa 0.29.

**Read the metrics together.** Gwet's AC2 gives the useless always-warm labeller 0.96, and weighted kappa gives it 0.00. Under labels this lopsided, each misleads in its own direction.

**The earlier headline of kappa 0.42 used all 277 posts.** On this held-out half, the same baseline (V0, the same model) scores 0.24. The gap between two halves of one run shows how noisy this measurement is.

**Off topic (V1, all posts):** the judge marked 19 posts, Jev 11, and 9 overlap.

**Muhd's 30 hand scores** can't separate anything: 27 of the 28 on topic are warm, and Jev is at 82% with kappa −0.06.

**Cost:** each variant on the test half took 6 requests, 0.3–0.4 s median each, and $0.002–0.0045.

## Group-level check on the held-out half (V1, calibrated on the design half)

| Group | Posts | Judge | Jev raw | Jev calibrated |
|---|---:|---:|---:|---:|
| Funds | 57 | 5.30 | 5.77 | 5.12 |
| Government | 11 | 5.18 | 5.20 | 4.90 |
| Land side: community | 18 | 4.78 | 5.24 | 4.64 |
| Land side: industry | 34 | 5.88 | 6.65 | 5.95 |
| Retail | 18 | 5.67 | 6.87 | 5.88 |
| **Average error of group means** | | | **0.58** | **0.18** |

The fitted slope is 0.50, with intercepts from 2.04 (community) to 2.65 (industry). Raw Jev spreads its scores more widely than the judge and runs about 0.6 higher, so the calibration pulls its scores in and down.

## Day-1 group support under two labellers

| Group | Judge (pilot README) | Jev V1 |
|---|---:|---:|
| Government | 5.0 | 5.2 |
| Land side: industry | 5.8 | 6.4 |
| Land side: community | 4.7 | 5.1 |
| Funds | 5.3 | 5.9 |
| Retail | 5.7 | 6.5 |

Both put community lowest and retail and industry highest. Jev runs about 0.4–0.6 higher. The swarm's scenario effects are differences between runs scored by the same labeller, so a stable shift cancels.

**Recommendation for the nine scored runs:**
- Report each effect under both labellers, and treat an effect as robust only if its sign holds under both.
- Use `daily_support()` in the script for the Jev side.

## Next step: the human gold set

[`gold-set/`](gold-set/README.md) holds a blind sheet of **91 posts**:
- all 6 the judge called cold
- all 33 it called hot
- 22 more that Jev alone called hot or cold
- 30 random posts both call warm

It comes with the codebook (the judge's rubric). Two people score it separately. Then `python3 scripts/gold_set.py score …` reports:
- how well the two people agree
- judge and Jev agreement with the people, reweighted by 1/π to the full run

That answers which labeller to trust, which this page can't.

## Reproduce

```sh
# TYPESAFE_API_KEY in .env (ignored by Git); input files from the ahmed/gold-society-plan branch
python3 scripts/jev_sentiment_check.py swarm/records/pilot/scores.jsonl \
  --human-sample swarm/records/judge-check/sample.csv --human-key swarm/records/judge-check/sample_key.csv
python3 scripts/jev_sentiment_check.py swarm/records/pilot/scores.jsonl --dry-run   # no key, no calls
python3 scripts/gold_set.py build swarm/records/pilot/scores.jsonl
```

All responses are cached in `data/generated/jev_sentiment/`, so reruns are free and reproducible. The full report is written to `data/generated/jev_sentiment/report.json`.
