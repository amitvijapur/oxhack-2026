#!/usr/bin/env python3
"""Probability of backtest overfitting (PBO) for the claim-activity forecast variants.

Combinatorially symmetric cross-validation (Bailey, Borwein, Lopez de Prado and Zhu): split the test
years into S contiguous blocks; for every way to pick half the blocks as "in sample", choose the
variant that scored best there and see where it ranks on the other half. PBO is the share of splits
in which the in-sample winner falls in the bottom half out of sample. Standard library only.

Usage: python3 scripts/claims_pbo.py [--trials research/decision-engine/trials.json] [--blocks 6]
"""
from __future__ import annotations

import argparse
from itertools import combinations
import json
import math
from pathlib import Path


def yearly_skill(report_path):
    """Per-year raw-model Brier skill against climatology, from the township-fold evaluation."""
    report = json.loads(Path(report_path).read_text())
    result = next(r for r in report["results"] if r["evaluation"].startswith("time-forward x township folds"))
    return {y["year"]: 1 - y["brier_model"] / y["brier_climatology"] for y in result["per_year"]}


def pbo(matrix, names, blocks):
    """``matrix[year][variant]`` of scores (higher is better). Returns PBO and the per-split detail."""
    years = sorted(matrix)
    size = len(years) / blocks
    groups = [years[round(i * size):round((i + 1) * size)] for i in range(blocks)]
    splits = []
    for chosen in combinations(range(blocks), blocks // 2):
        inside = [y for i in chosen for y in groups[i]]
        outside = [y for i in range(blocks) if i not in chosen for y in groups[i]]
        mean = lambda ys, v: sum(matrix[y][v] for y in ys) / len(ys)
        winner = max(names, key=lambda v: mean(inside, v))
        out_scores = sorted(names, key=lambda v: mean(outside, v))
        rank = out_scores.index(winner) + 1  # 1 = worst out of sample
        omega = rank / (len(names) + 1)
        splits.append({"in_sample_blocks": list(chosen), "winner": winner, "out_of_sample_rank": rank,
                       "logit": math.log(omega / (1 - omega)),
                       "winner_in_sample": mean(inside, winner), "winner_out_of_sample": mean(outside, winner)})
    return {"pbo": sum(s["logit"] <= 0 for s in splits) / len(splits), "splits": len(splits), "blocks": blocks,
            "variants": len(names), "detail": splits}


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--trials", type=Path, default=Path("research/decision-engine/trials.json"))
    parser.add_argument("--blocks", type=int, default=6)
    args = parser.parse_args()
    trials = json.loads(args.trials.read_text())
    runs = [t for t in trials["variants"] if t.get("report")]
    skills = {t["id"]: yearly_skill(t["report"]) for t in runs}
    names = list(skills)
    matrix = {y: {n: skills[n][y] for n in names} for y in skills[names[0]]}
    result = pbo(matrix, names, args.blocks)
    summary = {n: round(sum(skills[n].values()) / len(skills[n]), 5) for n in names}
    print(json.dumps({"mean_yearly_skill": summary, **{k: v for k, v in result.items() if k != "detail"}}, indent=2))
    winners = {}
    for s in result["detail"]:
        winners[s["winner"]] = winners.get(s["winner"], 0) + 1
    print("in-sample winners across splits:", winners)


if __name__ == "__main__":
    main()
