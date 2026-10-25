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

Usage:
  python3 scripts/gold_set.py build SCORES_JSONL [--both-warm 30]
  python3 scripts/gold_set.py score FILLED_SHEET_CSV
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
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


def score(sheet_path):
    key = {row["id"]: row for row in csv.DictReader(KEY.open(encoding="utf-8"))}
    rows, both, pairs_between_annotators = [], 0, []
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
        rows.append((human, jev.bucket(k["judge_score"]), k["jev_v1_label"], 1 / float(k["pi"])))
    report = {"items_scored_by_both": both,
              "annotator_agreement": jev.full_metrics(pairs_between_annotators, draws=500) if pairs_between_annotators else None,
              "judge_vs_human": weighted_agreement([(h, j, w) for h, j, _, w in rows if j]),
              "jev_v1_vs_human": weighted_agreement([(h, v, w) for h, _, v, w in rows])}
    print(json.dumps(report, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    b = sub.add_parser("build")
    b.add_argument("scores", type=Path)
    b.add_argument("--both-warm", type=int, default=30)
    s = sub.add_parser("score")
    s.add_argument("sheet", type=Path)
    args = parser.parse_args()
    build(args.scores, args.both_warm) if args.command == "build" else score(args.sheet)


if __name__ == "__main__":
    main()
