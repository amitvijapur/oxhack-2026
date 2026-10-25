#!/usr/bin/env python3
"""Build and score a small human gold set for the Tok society's cold / warm / hot labels.

A random sample is almost all "warm" and cannot separate good labellers from bad ones, so this draws a
stratified, disagreement-heavy sample from the pilot's judged posts (Kossen et al. 2021; Gilardi et
al. 2023 for the annotation design):
  judge_cold     every post the judge scored 0-3
  judge_hot      every post the judge scored 7-10
  jev_extreme    every other post Jev (variant V1) labels cold or hot
  both_warm      a seeded random sample of posts both label warm
Every stratum except both_warm is taken whole (pi = 1); both_warm items carry pi = sample / stratum
size, and results are reweighted by 1/pi (Horvitz-Thompson) to estimate agreement on all posts.

Two people score each post blind, 0-10 or n/a, using the codebook in research/decision-engine/
gold-set/README.md. The sheet holds no judge or Jev labels; the key file does.

With the full run's scores (``--scores``), the scorer also gives prediction-powered estimates
(Angelopoulos et al., Science 2023) of each group's mean HUMAN score: a labeller's mean over all
posts, corrected by its 1/pi-weighted mean error on the gold set. That is the number the swarm's
scenario effects should be read against.

Usage:
  python3 scripts/gold_set.py build SCORES_JSONL [--both-warm 30]
  python3 scripts/gold_set.py score FILLED_SHEET_CSV [--scores SCORES_JSONL]
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import math
from pathlib import Path
import random

OUT = Path("research/decision-engine/gold-set")
SHEET, KEY = OUT / "annotation_sheet.csv", OUT / "gold_set_key.csv"
SPEC = importlib.util.spec_from_file_location("jev_sentiment_check", Path(__file__).with_name("jev_sentiment_check.py"))
jev = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(jev)


def strata(posts, jev_labels, both_warm, seed=2026):
    """[(post, stratum, pi)] for the judged posts."""
    chosen, warm_pool = [], []
    for post, label in zip(posts, jev_labels):
        judge = jev.bucket(post["score"])
        if judge is None:
            continue
        if judge == "cold":
            chosen.append((post, "judge_cold", 1.0))
        elif judge == "hot":
            chosen.append((post, "judge_hot", 1.0))
        elif label in ("cold", "hot"):
            chosen.append((post, "jev_extreme", 1.0))
        else:
            warm_pool.append(post)
    rng = random.Random(seed)
    sample = rng.sample(warm_pool, min(both_warm, len(warm_pool)))
    pi = len(sample) / len(warm_pool) if warm_pool else 1.0
    chosen += [(p, "both_warm", pi) for p in sample]
    random.Random(seed + 1).shuffle(chosen)  # annotators must not see strata in order
    return chosen


def build(scores_path, both_warm):
    posts = [json.loads(line) for line in Path(scores_path).read_text().splitlines() if line.strip()]
    key = jev.api_key()
    answers, _ = jev.run_variant(posts, "V1", key, 25)  # cached; a key is needed only for uncached calls
    chosen = strata(posts, [a["label"] for a in answers], both_warm)
    OUT.mkdir(parents=True, exist_ok=True)
    with SHEET.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["id", "author_role", "text", "annotator_1_score", "annotator_2_score"])
        for i, (post, _, _) in enumerate(chosen, 1):
            text = "\n".join(line.rstrip() for line in post["text"].splitlines())  # trailing spaces only
            writer.writerow([i, post["group"], text, "", ""])
    by_text = {p["text"]: a for p, a in zip(posts, answers)}
    with KEY.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["id", "stratum", "pi", "judge_score", "jev_v1_label", "jev_v1_score_0_10"])
        for i, (post, stratum, pi) in enumerate(chosen, 1):
            a = by_text[post["text"]]
            writer.writerow([i, stratum, round(pi, 6), post["score"], a["label"], round(a["score_0_10"], 3)])
    counts = {}
    for _, stratum, _ in chosen:
        counts[stratum] = counts.get(stratum, 0) + 1
    print(json.dumps({"items": len(chosen), "by_stratum": counts, "sheet": str(SHEET), "key": str(KEY)}, indent=2))


def weighted_agreement(rows):
    """Agreement with the human label, reweighted by 1/pi: accuracy and quadratic weighted kappa."""
    ix = {l: i for i, l in enumerate(jev.LABELS)}
    total = sum(w for _, _, w in rows)
    accuracy = sum(w for h, m, w in rows if h == m) / total
    observed = [[0.0] * 3 for _ in range(3)]
    for h, m, w in rows:
        observed[ix[h]][ix[m]] += w
    r = [sum(x) for x in observed]
    c = [sum(observed[i][j] for i in range(3)) for j in range(3)]
    weight = lambda i, j: (i - j) ** 2 / 4
    disagree = sum(weight(i, j) * observed[i][j] for i in range(3) for j in range(3))
    expected = sum(weight(i, j) * r[i] * c[j] / total for i in range(3) for j in range(3))
    return {"weighted_n": round(total, 1), "accuracy": round(accuracy, 4),
            "weighted_kappa_quadratic": round(1 - disagree / expected, 4) if expected else None}


def ppi_mean(model_values, gold, z=1.959964):
    """Prediction-powered estimate of the mean human score, with a normal 95% interval.

    ``model_values``: the labeller's scores on every post. ``gold``: (human, model, weight) for the
    scored posts, weight = 1/pi. Estimate = mean(model) + weighted mean(human - model). The variance
    adds the two parts as if independent (the gold set is small next to the run)."""
    n_all = len(model_values)
    mean_all = sum(model_values) / n_all
    var_all = sum((v - mean_all) ** 2 for v in model_values) / (n_all - 1) / n_all if n_all > 1 else 0.0
    total = sum(w for _, _, w in gold)
    rect = sum(w * (h - m) for h, m, w in gold) / total
    var_rect = sum(w * w * ((h - m) - rect) ** 2 for h, m, w in gold) / total ** 2
    half = z * math.sqrt(var_all + var_rect)
    return {"labeller_mean": round(mean_all, 3), "correction": round(rect, 3), "estimate": round(mean_all + rect, 3),
            "ci95": [round(mean_all + rect - half, 3), round(mean_all + rect + half, 3)], "gold_posts": len(gold)}


def human_corrected_means(posts, jev_scores, gold_rows):
    """PPI estimates of the mean human score, overall and per group, from the judge and from Jev.

    ``gold_rows``: (group, human 0-10, judge 0-10, jev 0-10, weight) for posts both annotators scored."""
    out = {}
    for name, idx, all_scores in (("judge", 2, [p["score"] for p in posts]), ("jev_v1", 3, jev_scores)):
        rows = {"all": ppi_mean([v for v in all_scores if v is not None],
                                [(r[1], r[idx], r[4]) for r in gold_rows if r[idx] is not None])}
        for group in sorted({p["group"] for p in posts}):
            values = [v for p, v in zip(posts, all_scores) if p["group"] == group and v is not None]
            gold = [(r[1], r[idx], r[4]) for r in gold_rows if r[0] == group and r[idx] is not None]
            if values and gold:
                rows[group] = ppi_mean(values, gold)
        out[name] = rows
    return out


def score(sheet_path, scores_path=None):
    key = {row["id"]: row for row in csv.DictReader(KEY.open(encoding="utf-8"))}
    rows, both, pairs_between_annotators, gold_rows = [], 0, [], []
    for row in csv.DictReader(Path(sheet_path).open(encoding="utf-8-sig")):
        a, b = row["annotator_1_score"].strip(), row["annotator_2_score"].strip()
        if not a or not b:
            continue
        both += 1
        la, lb = jev.bucket(a), jev.bucket(b)
        if la and lb:
            pairs_between_annotators.append((la, lb))
        if la is None or lb is None:
            continue  # off topic for at least one annotator
        human = jev.bucket(round((int(a) + int(b)) / 2))  # adjudicate by the mean score
        k = key[row["id"]]
        judge_score = float(k["judge_score"]) if jev.bucket(k["judge_score"]) else None
        gold_rows.append((row["author_role"], (int(a) + int(b)) / 2, judge_score, float(k["jev_v1_score_0_10"]),
                          1 / float(k["pi"])))
        rows.append((human, jev.bucket(k["judge_score"]), k["jev_v1_label"], 1 / float(k["pi"])))
    report = {"items_scored_by_both": both,
              "annotator_agreement": jev.full_metrics(pairs_between_annotators, draws=500) if pairs_between_annotators else None,
              "judge_vs_human": weighted_agreement([(h, j, w) for h, j, _, w in rows if j]),
              "jev_v1_vs_human": weighted_agreement([(h, v, w) for h, _, v, w in rows])}
    if scores_path and gold_rows:
        posts = [json.loads(line) for line in Path(scores_path).read_text().splitlines() if line.strip()]
        answers, _ = jev.run_variant(posts, "V1", jev.api_key(), 25)  # the same batches as build, so cached
        on_topic = [(p, a) for p, a in zip(posts, answers) if p["score"] is not None]
        report["human_corrected_means"] = human_corrected_means([p for p, _ in on_topic],
                                                                [a["score_0_10"] for _, a in on_topic], gold_rows)
    print(json.dumps(report, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    b = sub.add_parser("build")
    b.add_argument("scores", type=Path)
    b.add_argument("--both-warm", type=int, default=30)
    s = sub.add_parser("score")
    s.add_argument("sheet", type=Path)
    s.add_argument("--scores", type=Path, help="the run's scores.jsonl, for human-corrected group means")
    args = parser.parse_args()
    build(args.scores, args.both_warm) if args.command == "build" else score(args.sheet, args.scores)


if __name__ == "__main__":
    main()
