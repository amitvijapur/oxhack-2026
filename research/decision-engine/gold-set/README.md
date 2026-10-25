# Human gold set: how to score the posts

Owner: Salman. For two annotators, for example Salman and Muhd, working **separately and blind**. This settles whether the swarm's GPT judge or Jev labels the Tok society's posts better, which neither can show on its own.

## What to do

1. Copy [`annotation_sheet.csv`](annotation_sheet.csv). Fill **your** column only: `annotator_1_score` or `annotator_2_score`.
2. **Don't open `gold_set_key.csv`** until both of you have finished. It holds the judge's and Jev's labels.
3. Merge both columns into one sheet, then run:
   `python3 scripts/gold_set.py score research/decision-engine/gold-set/annotation_sheet.csv --scores swarm/records/pilot/scores.jsonl`

The 91 posts were chosen on purpose: every post either labeller calls cold or hot, plus 30 random posts both call warm. Expect more strongly worded posts than in the full run. That's deliberate, and the scorer reweights the result back to the full run.

## Codebook (the same rubric the judge used: `swarm/judge_prompt.txt` on `ahmed/gold-society-plan`)

Score how much the **author** supports gold mining at Tok, from 0 to 10. That covers existing and proposed mines near Tok, the ore haul, and mining approvals.

| Score | Meaning |
|---|---|
| 0–3 (cold) | Against it. Wants it blocked, stopped, taxed away, sold or avoided |
| 4–6 (warm) | Neutral, mixed, unsure or mildly for |
| 7–10 (hot) | Strongly for it. Wants approvals, expansion or investment; buying in |
| `n/a` | The post says nothing that bears on gold mining at Tok, gold-mining investment or the gold price |

Rules:
- **Investors:** appetite to buy gold or gold-mining exposure counts as support. Wanting to sell or avoid it counts as opposition.
- **Judge the author's own stance,** not the stance of people they quote or reply to. Read sarcasm as its intended meaning.
- **Use the author's role only to understand what the post means,** never to guess a stance the post doesn't express.
- **Stance is not tone.** Polite or constructive wording isn't support by itself, and worried wording isn't opposition by itself.

## What the scorer reports

- **Your agreement with each other:** weighted kappa, Gwet's AC2 and Krippendorff's ordinal alpha. If you two disagree a lot, the rubric is the problem, not the models.
- **The human label:** the mean of your two scores, bucketed into cold, warm or hot.
- **Judge vs humans and Jev vs humans:** accuracy and weighted kappa, each reweighted by 1/π so they estimate agreement on all posts, not just this sample.
- **Human-corrected group means** (with `--scores`): each labeller's mean over the whole run plus its 1/π-weighted mean error on these posts (prediction-powered inference), with a 95% interval. Groups with few gold posts (Government has 2) get wide intervals.
