# Can Jev label the Tok society's posts cold, warm or hot?

25 October 2026. Owner: Salman. Code: [`scripts/jev_sentiment_check.py`](../../scripts/jev_sentiment_check.py). Data: the pilot run of the Tok society on `ahmed/gold-society-plan`. That's `swarm/records/pilot/scores.jsonl`: 296 posts, each scored 0–10 by the gpt-5.4-mini judge. Muhd's 30 hand scores are in `swarm/records/judge-check/`.

## Set-up

For each post, Jev (`jev-latest`, TypeSafe System One) answered two typed questions:
- a **Score** with three levels (cold, warm, hot), written to match the judge prompt's own definitions
- a **Noul**: "Does this post say anything that bears on gold mining at Tok, gold-mining investment or the gold price?"

Each post sat in its own question, 25 posts per request. Jev returns probabilities; the label is the most likely level.

## Results

| Comparison (on the 277 posts the judge scored) | Accuracy | Cohen's kappa | Macro-F1 |
|---|---:|---:|---:|
| Always say "warm" (baseline) | 86% | 0.00 | 0.31 |
| **Jev against the judge** | 83% | **0.42** | **0.48** |

Jev's expected level has a Spearman rank correlation of **0.60** with the judge's 0–10 score.

**Read kappa, not accuracy.** The judge called 238 of 277 posts warm, so always saying "warm" scores 86% while knowing nothing. Jev's kappa of 0.42 is moderate agreement beyond chance.

| Judge ↓ / Jev → | cold | warm | hot |
|---|---:|---:|---:|
| cold (6) | 0 | 6 | 0 |
| warm (238) | 0 | 206 | 32 |
| hot (33) | 1 | 8 | 24 |

- **Hot posts:** Jev finds 24 of the judge's 33 (73%).
- **Over-calling hot:** 32 warm posts are called hot. Most are constructive "yes, if it's done safely" replies, with Jev's hot probability only 0.54–0.65, so they sit on the boundary.
- **Cold posts:** none of the judge's 6 are caught. They're sceptical or worried rather than clearly against mining ("show the source", "who pays for road repair?"), and Jev gave them a 0.2–0.4 chance of cold. Several are arguable either way.
- **Off topic:** the judge marked 19 posts off topic, Jev 10, and 8 overlap.

**Cut-offs don't help much.** Choosing the cut-offs on alternating halves of the posts and testing on the other half leaves kappa about the same (0.34 → 0.34 and 0.51 → 0.53). Macro-F1 rises slightly, because a low cold cut-off catches a few cold posts. The two halves differ a lot (0.34 against 0.53), a reminder that a few hundred mostly-warm posts give a noisy measure.

**Against Muhd's hand scores** (28 on topic), Jev and the judge are 82% and 86% accurate, both with kappa near 0. Muhd scored 27 of the 28 warm, so this sample can't tell good from bad labelling.

## Speed and cost

- 296 posts in 12 requests.
- 0.66 seconds median per request of 25 posts; about 8.6 seconds for the whole run.
- 113,844 input tokens, costing **$0.0048** at TypeSafe's published price ($0.042 per million input tokens; output is free).
- Answers are cached in `data/generated/jev_sentiment/`, so a rerun is free.

## What this means for the team

- **Jev is not a replacement for the pre-registered judge.** The swarm plan fixes the judge before the scored runs, and Jev agrees with it only moderately.
- **Jev is a fast, almost free second rater.**
  - Posts where Jev and the judge disagree, especially cold and hot calls, are the ones worth a human look.
  - Jev could label the nine scored runs in seconds, as a robustness check on the group effects. If an effect holds under both labellers, it's sturdier.
- **Neither is validated against people on stance.** That needs a human sample with more cold and hot posts, chosen on purpose rather than at random.

## Reproduce

```sh
# TYPESAFE_API_KEY in .env (ignored by Git); files from the ahmed/gold-society-plan branch
python3 scripts/jev_sentiment_check.py swarm/records/pilot/scores.jsonl \
  --human-sample swarm/records/judge-check/sample.csv --human-key swarm/records/judge-check/sample_key.csv
python3 scripts/jev_sentiment_check.py swarm/records/pilot/scores.jsonl --dry-run   # no key, no calls
```
