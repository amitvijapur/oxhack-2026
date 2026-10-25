#!/usr/bin/env python3
"""How well can Jev label the Tok society's posts cold / warm / hot, and which labeller design is best?

Reads the pilot's judged posts (`swarm/records/pilot/scores.jsonl` on ahmed/gold-society-plan): each
has the gpt-5.4-mini judge's 0-10 support score (cold 0-3, warm 4-6, hot 7-10, or n/a when off topic).
The judge is a reference, not ground truth; a human gold set (scripts/gold_set.py) settles that.

To avoid tuning to the test set, the judged posts are split 50/50 by a seeded draw stratified by the
judge's label. Boundary examples (variant V2) and thresholds (V3, V4) come only from the design half;
every variant is scored once on the test half and logged. Variants:
  V0  baseline: the post and its author's role in each question; three plain levels
  V1  the same without the author's role (the judge rubric forbids inferring stance from role)
  V2  structured levels with boundary examples and a not_for note; stance, not tone
  V2r V2 with the levels listed in reverse order (an order-bias check; labels mapped back)
  V3  five atomic yes/no questions combined by fixed rules with design-half thresholds
  V4  escalation: keep the V1 label when its top probability is at least tau, else send to the judge
Metrics: quadratic and linear weighted kappa, Gwet's AC2, ordinal Krippendorff alpha, accuracy,
macro-F1, recall per judge class, and MAE and signed bias on the 0-10 scale, with bootstrap CIs.
Responses are cached under data/generated/jev_sentiment/ (ignored by Git), so a rerun costs nothing.

Usage: python3 scripts/jev_sentiment_check.py SCORES_JSONL [--human-sample CSV --human-key CSV]
       [--batch 25] [--dry-run] [--output JSON]
Needs TYPESAFE_API_KEY in the environment or a local .env, unless --dry-run.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import hashlib
import json
import math
import os
from pathlib import Path
import random
import statistics
import time
import urllib.error
import urllib.request

JEV_URL = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-1.14.0"  # pinned, as TypeSafe advises once questions are tuned
LABELS = ("cold", "warm", "hot")
LEVELS = [  # the judge prompt's definitions, as situations (swarm/judge_prompt.txt)
    "cold: the author is against gold mining at Tok; wants it blocked, stopped, taxed away, sold or avoided",
    "warm: the author is neutral, mixed, unsure or only mildly for gold mining at Tok",
    "hot: the author strongly supports gold mining at Tok; wants approvals, expansion or investment, or is buying in",
]
CONTEXT = ("Posts from a simulated social network about gold mining near Tok, Alaska: existing and proposed "
           "mines, the ore haul and mining approvals. For investors, appetite to buy gold or gold-mining "
           "exposure counts as support, and wanting to sell or avoid it counts as opposition. Judge each "
           "author's own stance, not that of people they quote; read sarcasm as its intended meaning.")
STANCE_NOTE = ("Judge the author's stance on gold mining at Tok, not their tone: polite, practical or constructive "
               "wording is not support, and worried or critical wording is not opposition unless the author "
               "takes a side.")
ATOMIC = {  # V3: one judgment per question, combined in code
    "opposes": "Does the author say gold mining at Tok, or investing in gold, should be stopped, blocked, taxed away, sold or avoided?",
    "concern": "Does the author raise a concern or doubt about gold mining at Tok, its effects, or the gold price claim?",
    "conditional": "Does the author make their support depend on conditions being met, such as safety, roads, water or proof?",
    "strong_support": "Does the author clearly want mining at Tok approved or expanded, or say they are buying gold or gold-mining exposure?",
}
PRICE_PER_MILLION_INPUT_TOKENS = 0.042  # USD, TypeSafe's published price; output tokens are free
CACHE = Path("data/generated/jev_sentiment/cache.jsonl")


def bucket(score):
    """The judge's 0-10 score as cold / warm / hot; None when off topic."""
    if score is None or score == "n/a":
        return None
    score = int(score)
    return "cold" if score <= 3 else "warm" if score <= 6 else "hot"


def api_key():
    if os.environ.get("TYPESAFE_API_KEY"):
        return os.environ["TYPESAFE_API_KEY"]
    env = Path(".env")
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("TYPESAFE_API_KEY=") and line.split("=", 1)[1].strip():
                return line.split("=", 1)[1].strip()
    return None


# --------------------------------------------------------------------------- split and examples


def split(posts, seed=2026):
    """Seeded 50/50 split of judged posts, stratified by the judge's label: (design, test)."""
    by_label = defaultdict(list)
    for p in posts:
        if p["score"] is not None:
            by_label[bucket(p["score"])].append(p)
    rng = random.Random(seed)
    design, test = [], []
    for label in LABELS:
        group = sorted(by_label[label], key=lambda p: (p["platform"], p["round"], p["agent_id"], p["text"]))
        rng.shuffle(group)
        half = (len(group) + 1) // 2
        design += group[:half]
        test += group[half:]
    return design, test


def boundary_examples(design, per_level=2, length=220):
    """Real design-half posts nearest each boundary: cold 2-3, warm 4 and 6, hot 7-8 (judge scores)."""
    pick = lambda scores: [p["text"][:length] for p in design if p["score"] in scores][:per_level]
    return {"cold": pick((3, 2)), "warm": pick((6,))[:1] + pick((4,))[:1], "hot": pick((7, 8))}


# --------------------------------------------------------------------------- requests per variant


def quoted(post, role=True):
    who = f'Author: {post["name"]} ({post["group"]})\n' if role else ""
    return f'{who}Post: """{post["text"]}"""'


def build_request(posts, variant="V0", examples=None):
    """One request for a batch of posts under a labeller design."""
    questions = {}
    for i, post in enumerate(posts):
        role = variant == "V0"
        text = quoted(post, role)
        if variant in ("V0", "V1"):
            questions[f"support_{i}"] = {"type": "score", "criteria": LEVELS,
                                         "instructions": f"How much does the author support gold mining at Tok?\n{text}"}
        elif variant in ("V2", "V2r"):
            levels = [
                {"what": LEVELS[0], "examples": examples["cold"]},
                {"what": LEVELS[1], "examples": examples["warm"],
                 "includes": "practical suggestions, conditional or cautious support, questions about a source"},
                {"what": LEVELS[2], "examples": examples["hot"],
                 "not_for": "conditional or cautious support, or constructive talk about doing it safely; those are warm"},
            ]
            if variant == "V2r":
                levels = levels[::-1]
            questions[f"support_{i}"] = {"type": "score", "criteria": levels,
                                         "instructions": f"How much does the author support gold mining at Tok?\n{text}"}
        elif variant == "V3":
            for name, ask in ATOMIC.items():
                questions[f"{name}_{i}"] = {"type": "noul", "instructions": f"{ask}\n{text}"}
        questions[f"on_topic_{i}"] = {"type": "noul", "instructions":
                                      "Does this post say anything that bears on gold mining at Tok, gold-mining "
                                      f"investment or the gold price?\n{text}"}
    context = CONTEXT if variant in ("V0", "V1") else f"{CONTEXT} {STANCE_NOTE}"
    return {"model": MODEL, "state": {"context": context}, "questions": questions}


def read_answers(response, n, variant="V0"):
    out = []
    for i in range(n):
        row = {"p_on_topic": response["answers"][f"on_topic_{i}"]["noul"]}
        if variant == "V3":
            row["nouls"] = {name: response["answers"][f"{name}_{i}"]["noul"] for name in ATOMIC}
        else:
            support = response["answers"][f"support_{i}"]
            order = LABELS[::-1] if variant == "V2r" else LABELS
            probs = {order[int(k)]: v for k, v in support["probabilities"].items()}
            row.update(label=max(probs, key=probs.get), probabilities=probs,
                       score_0_10=5 * sum(LABELS.index(l) * v for l, v in probs.items()),
                       confidence=support.get("confidence"))
        out.append(row)
    return out


def v3_label(nouls, t):
    """Fixed rule order: clear opposition is cold; strong support without conditions is hot; else warm."""
    if nouls["opposes"] >= t["opposes"] and nouls["strong_support"] < 0.5:
        return "cold"
    if nouls["strong_support"] >= t["strong_support"] and nouls["conditional"] < t["conditional"]:
        return "hot"
    return "warm"


# --------------------------------------------------------------------------- calling Jev


def ask(request, key):
    """POST with a small retry; returns (response, seconds). A failed call raises; it is never an answer."""
    body = json.dumps(request).encode()
    for attempt in range(4):
        try:
            started = time.perf_counter()
            req = urllib.request.Request(JEV_URL, data=body, headers={
                "Authorization": f"Bearer {key}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.load(response), time.perf_counter() - started
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 529) or attempt == 3:
                raise RuntimeError(f"Jev HTTP {error.code}: {error.read()[:300]!r}") from error
            time.sleep(2 ** attempt)


def cached_ask(request, key):
    digest = hashlib.sha256(json.dumps(request, sort_keys=True).encode()).hexdigest()
    if CACHE.exists():
        for line in CACHE.read_text().splitlines():
            row = json.loads(line)
            if row["key"] == digest:
                return row["response"], row["seconds"], True
    response, seconds = ask(request, key)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE.open("a") as handle:
        handle.write(json.dumps({"key": digest, "seconds": seconds, "response": response}) + "\n")
    return response, seconds, False


def run_variant(posts, variant, key, batch, examples=None):
    answers, stats = [], {"requests": 0, "cached": 0, "seconds": [], "input_tokens": 0}
    for start in range(0, len(posts), batch):
        chunk = posts[start:start + batch]
        response, took, hit = cached_ask(build_request(chunk, variant, examples), key)
        answers += read_answers(response, len(chunk), variant)
        stats["requests"] += 1
        stats["cached"] += hit
        stats["seconds"].append(took)
        stats["input_tokens"] += response.get("usage", {}).get("input_tokens", 0)
    stats["seconds_per_request_median"] = round(sorted(stats.pop("seconds"))[stats["requests"] // 2], 3)
    stats["cost_usd"] = round(stats["input_tokens"] / 1e6 * PRICE_PER_MILLION_INPUT_TOKENS, 6)
    return answers, stats


# --------------------------------------------------------------------------- metrics


def agreement(pairs):
    """Accuracy, macro-F1, Cohen's kappa and the confusion matrix for (reference, predicted) labels."""
    n = len(pairs)
    if not n:
        return {"n": 0}
    accuracy = sum(a == b for a, b in pairs) / n
    f1s = []
    for label in LABELS:
        tp = sum(a == label and b == label for a, b in pairs)
        fp = sum(a != label and b == label for a, b in pairs)
        fn = sum(a == label and b != label for a, b in pairs)
        f1s.append(2 * tp / (2 * tp + fp + fn) if tp + fp + fn else None)
    ref, pred = Counter(a for a, _ in pairs), Counter(b for _, b in pairs)
    chance = sum(ref[l] * pred[l] for l in LABELS) / (n * n)
    kappa = (accuracy - chance) / (1 - chance) if chance < 1 else None
    present = [f for f in f1s if f is not None]
    return {"n": n, "accuracy": round(accuracy, 4), "macro_f1": round(sum(present) / len(present), 4),
            "kappa": None if kappa is None else round(kappa, 4),
            "confusion_reference_by_predicted": {a: {b: sum(x == a and y == b for x, y in pairs) for b in LABELS}
                                                 for a in LABELS}}


def weighted_kappa(pairs, quadratic=True):
    """Cohen's weighted kappa with linear or quadratic disagreement weights."""
    n, k, ix = len(pairs), len(LABELS), {l: i for i, l in enumerate(LABELS)}
    observed = [[0] * k for _ in range(k)]
    for a, b in pairs:
        observed[ix[a]][ix[b]] += 1
    rows = [sum(r) for r in observed]
    cols = [sum(observed[i][j] for i in range(k)) for j in range(k)]
    weight = lambda i, j: ((i - j) ** 2 / (k - 1) ** 2) if quadratic else abs(i - j) / (k - 1)
    disagree = sum(weight(i, j) * observed[i][j] for i in range(k) for j in range(k))
    expected = sum(weight(i, j) * rows[i] * cols[j] / n for i in range(k) for j in range(k))
    return 1 - disagree / expected if expected else None


def gwet_ac2(pairs):
    """Gwet's AC2 with quadratic agreement weights; robust to the kappa paradox under imbalance."""
    n, k, ix = len(pairs), len(LABELS), {l: i for i, l in enumerate(LABELS)}
    weight = lambda i, j: 1 - (i - j) ** 2 / (k - 1) ** 2
    pa = sum(weight(ix[a], ix[b]) for a, b in pairs) / n
    share = [(sum(a == l for a, _ in pairs) + sum(b == l for _, b in pairs)) / (2 * n) for l in LABELS]
    total_weight = sum(weight(i, j) for i in range(k) for j in range(k))
    pe = total_weight / (k * (k - 1)) * sum(s * (1 - s) for s in share)
    return (pa - pe) / (1 - pe)


def krippendorff_ordinal(pairs):
    """Krippendorff's alpha for two coders with the ordinal metric (no missing values)."""
    ix = {l: i for i, l in enumerate(LABELS)}
    counts = Counter()
    for a, b in pairs:
        counts[ix[a]] += 1
        counts[ix[b]] += 1
    total = 2 * len(pairs)

    def delta(c, k):
        lo, hi = min(c, k), max(c, k)
        return (sum(counts[g] for g in range(lo, hi + 1)) - (counts[lo] + counts[hi]) / 2) ** 2

    observed = sum(2 * delta(ix[a], ix[b]) for a, b in pairs) / total
    expected = sum(counts[c] * counts[k] * delta(c, k) for c in range(3) for k in range(3)) / (total * (total - 1))
    return 1 - observed / expected if expected else None


def full_metrics(pairs, scores=None, draws=2000, seed=0):
    """All agreement metrics for (reference, predicted) labels, with bootstrap CIs for the ordinal ones.

    ``scores`` (optional) are (reference 0-10, predicted 0-10) pairs for MAE and signed bias."""
    out = agreement(pairs)
    out.update(weighted_kappa_quadratic=round(weighted_kappa(pairs), 4),
               weighted_kappa_linear=round(weighted_kappa(pairs, False), 4),
               gwet_ac2=round(gwet_ac2(pairs), 4), krippendorff_alpha_ordinal=round(krippendorff_ordinal(pairs), 4),
               recall_by_reference={l: (round(sum(a == b == l for a, b in pairs) / c, 4) if (c := sum(a == l for a, _ in pairs)) else None)
                                    for l in LABELS})
    rng = random.Random(seed)
    boots = {"weighted_kappa_quadratic": [], "gwet_ac2": []}
    for _ in range(draws):
        sample = [rng.choice(pairs) for _ in pairs]
        if len({a for a, _ in sample} | {b for _, b in sample}) > 1:
            boots["weighted_kappa_quadratic"].append(weighted_kappa(sample) or 0.0)
            boots["gwet_ac2"].append(gwet_ac2(sample))
    for name, values in boots.items():
        values.sort()
        out[f"{name}_95ci"] = [round(values[int(0.025 * len(values))], 4), round(values[int(0.975 * len(values)) - 1], 4)]
    if scores:
        out["mae_0_10"] = round(sum(abs(p - r) for r, p in scores) / len(scores), 3)
        out["signed_bias_0_10"] = round(sum(p - r for r, p in scores) / len(scores), 3)
    return out


def pearson(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx, syy = sum((x - mx) ** 2 for x in xs), sum((y - my) ** 2 for y in ys)
    return sxy / math.sqrt(sxx * syy) if sxx and syy else None


def ranks(xs):
    """Average ranks (ties share the mean rank), for Spearman's correlation."""
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    out = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            out[order[k]] = (i + j) / 2
        i = j + 1
    return out


def continuous_metrics(reference, predicted, draws=2000, seed=0):
    """Agreement on the 0-10 scale itself (Jev's expected score), with bootstrap CIs over posts.

    The swarm averages scores, so this is closer to how the labels are used than bucket kappa."""
    def stats(r, p):
        return {"pearson": pearson(r, p), "spearman": pearson(ranks(r), ranks(p)),
                "mae": sum(abs(a - b) for a, b in zip(r, p)) / len(r), "bias": sum(b - a for a, b in zip(r, p)) / len(r)}
    out = {k: round(v, 4) for k, v in stats(reference, predicted).items()}
    rng = random.Random(seed)
    boots = {"pearson": [], "spearman": []}
    for _ in range(draws):
        idx = [rng.randrange(len(reference)) for _ in reference]
        s = stats([reference[i] for i in idx], [predicted[i] for i in idx])
        for k in boots:
            if s[k] is not None:
                boots[k].append(s[k])
    for k, values in boots.items():
        values.sort()
        out[f"{k}_95ci"] = [round(values[int(0.025 * len(values))], 4), round(values[int(0.975 * len(values)) - 1], 4)]
    return out


def fit_group_calibration(groups, predicted, reference):
    """Least squares reference = a_group + b * predicted: one slope, one intercept per group.

    Fitted on the design half only. Groups unseen there fall back to the pooled intercept."""
    by = defaultdict(list)
    for g, x, y in zip(groups, predicted, reference):
        by[g].append((x, y))
    sxy = sxx = 0.0
    for rows in by.values():
        mx, my = sum(x for x, _ in rows) / len(rows), sum(y for _, y in rows) / len(rows)
        sxy += sum((x - mx) * (y - my) for x, y in rows)
        sxx += sum((x - mx) ** 2 for x, _ in rows)
    b = sxy / sxx if sxx else 1.0
    a = {g: sum(y for _, y in rows) / len(rows) - b * sum(x for x, _ in rows) / len(rows) for g, rows in by.items()}
    pooled = sum(reference) / len(reference) - b * sum(predicted) / len(predicted)
    return {"slope": b, "intercepts": a, "pooled_intercept": pooled}


def calibrated(cal, group, x):
    return cal["intercepts"].get(group, cal["pooled_intercept"]) + cal["slope"] * x


def group_means(groups, values):
    by = defaultdict(list)
    for g, v in zip(groups, values):
        by[g].append(v)
    return {g: sum(v) / len(v) for g, v in sorted(by.items())}


def group_level_check(design, design_answers, test, test_answers):
    """Group mean support on the test half: the judge vs Jev raw vs Jev calibrated on the design half."""
    cal = fit_group_calibration([p["group"] for p in design], [a["score_0_10"] for a in design_answers],
                                [p["score"] for p in design])
    groups = [p["group"] for p in test]
    judge = group_means(groups, [p["score"] for p in test])
    raw = group_means(groups, [a["score_0_10"] for a in test_answers])
    cal_means = group_means(groups, [calibrated(cal, p["group"], a["score_0_10"]) for p, a in zip(test, test_answers)])
    posts = Counter(groups)
    summary = lambda m: {"mae_of_group_means": round(sum(abs(m[g] - judge[g]) for g in judge) / len(judge), 4),
                         "max_abs_error": round(max(abs(m[g] - judge[g]) for g in judge), 4),
                         "pearson_of_group_means": round(pearson([judge[g] for g in judge], [m[g] for g in judge]), 4)}
    return {"calibration_from_design_half": {"slope": round(cal["slope"], 4),
                                             "intercepts": {g: round(v, 4) for g, v in cal["intercepts"].items()}},
            "by_group": {g: {"posts": posts[g], "judge": round(judge[g], 3), "jev_raw": round(raw[g], 3),
                             "jev_calibrated": round(cal_means[g], 3)} for g in judge},
            "jev_raw": summary(raw), "jev_calibrated": summary(cal_means)}


Z_TWO_SIDED_5PCT, Z_POWER_80PCT = 1.959964, 0.841621


def detectable_effect(sd, posts_per_arm):
    """Smallest difference in group means (scenario minus baseline, equal posts per arm) detectable at
    5% two-sided with 80% power, from post-to-post spread only. Run-to-run (seed) spread adds to it."""
    return (Z_TWO_SIDED_5PCT + Z_POWER_80PCT) * sd * math.sqrt(2 / posts_per_arm)


def detectable_effects(posts, values):
    """Per group: posts, standard deviation of the scores, and the smallest detectable effect."""
    by = defaultdict(list)
    for p, v in zip(posts, values):
        by[p["group"]].append(v)
    return {g: {"posts": len(v), "sd": round(statistics.stdev(v), 3),
                "smallest_detectable_effect": round(detectable_effect(statistics.stdev(v), len(v)), 3)}
            for g, v in sorted(by.items()) if len(v) > 1}


def tune_v3(design_posts, design_answers):
    """Grid-search V3's thresholds on the design half by quadratic weighted kappa."""
    best, best_t = None, None
    grid = (0.3, 0.5, 0.7, 0.85)
    for o in grid:
        for s in grid:
            for c in grid:
                t = {"opposes": o, "strong_support": s, "conditional": c}
                pairs = [(bucket(p["score"]), v3_label(a["nouls"], t)) for p, a in zip(design_posts, design_answers)]
                k = weighted_kappa(pairs) if len({b for _, b in pairs}) > 1 else -1
                if best is None or k > best:
                    best, best_t = k, t
    return best_t, round(best, 4)


def escalation(test_posts, answers, tau):
    """Keep Jev's label when its top probability is at least tau; otherwise the post goes to the judge."""
    kept = [(bucket(p["score"]), a["label"]) for p, a in zip(test_posts, answers) if max(a["probabilities"].values()) >= tau]
    return {"tau": tau, "share_escalated": round(1 - len(kept) / len(test_posts), 4),
            "agreement_on_posts_jev_keeps": agreement(kept)}


def daily_support(posts, answers):
    """Mean 0-10 support per group per simulated day under Jev's labels, like score.py's daily table."""
    table = defaultdict(lambda: defaultdict(list))
    for p, a in zip(posts, answers):
        if a.get("p_on_topic", 1) >= 0.5 and "score_0_10" in a:
            table[p["group"]][p.get("day", 1)].append(a["score_0_10"])
    return {g: {str(d): {"support": round(sum(v) / len(v), 3), "posts": len(v)} for d, v in sorted(days.items())}
            for g, days in table.items()}


# --------------------------------------------------------------------------- main


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("scores", type=Path)
    parser.add_argument("--human-sample", type=Path)
    parser.add_argument("--human-key", type=Path)
    parser.add_argument("--batch", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--output", type=Path, default=Path("data/generated/jev_sentiment/report.json"))
    args = parser.parse_args()
    posts = [json.loads(line) for line in args.scores.read_text().splitlines() if line.strip()]
    judged = [p for p in posts if p["score"] is not None]
    design, test = split(posts)
    examples = boundary_examples(design)
    report = {"model": MODEL, "posts": len(posts), "judged": len(judged),
              "judge_labels": dict(Counter(bucket(p["score"]) for p in judged)),
              "split": {"design": dict(Counter(bucket(p["score"]) for p in design)),
                        "test": dict(Counter(bucket(p["score"]) for p in test))},
              "always_warm_on_test": full_metrics([(bucket(p["score"]), "warm") for p in test], draws=200)}
    key = None if args.dry_run else api_key()
    if key is None:
        report["jev"] = "dry run: no calls made" if args.dry_run else "TYPESAFE_API_KEY not set; no calls made"
        report["example_requests"] = {v: build_request(test[:1], v, examples) for v in ("V0", "V1", "V2", "V3")}
        print(json.dumps(report, indent=2))
        return
    results, cost = {}, {}
    for variant in ("V0", "V1", "V2", "V2r"):
        answers, stats = run_variant(test, variant, key, args.batch, examples)
        cost[variant] = stats
        pairs = [(bucket(p["score"]), a["label"]) for p, a in zip(test, answers)]
        scores = [(p["score"], a["score_0_10"]) for p, a in zip(test, answers)]
        results[variant] = full_metrics(pairs, scores)
        if variant == "V2":
            v2_answers = answers
        if variant == "V1":
            v1_answers = answers
            # tau for V4 from the design half
            design_answers, _ = run_variant(design, "V1", key, args.batch, examples)
            taus = {}
            for tau in (0.6, 0.7, 0.8, 0.9):
                kept = [(bucket(p["score"]), a["label"]) for p, a in zip(design, design_answers)
                        if max(a["probabilities"].values()) >= tau]
                taus[tau] = (weighted_kappa(kept) if len({b for _, b in kept}) > 1 else 0, len(kept) / len(design))
            tau = max((t for t in taus if taus[t][1] >= 0.6), key=lambda t: taus[t][0], default=0.8)
    design_v3, _ = run_variant(design, "V3", key, args.batch)
    thresholds, design_kappa = tune_v3(design, design_v3)
    test_v3, cost["V3"] = run_variant(test, "V3", key, args.batch)
    results["V3"] = full_metrics([(bucket(p["score"]), v3_label(a["nouls"], thresholds)) for p, a in zip(test, test_v3)])
    results["V3"]["thresholds_from_design_half"] = thresholds
    results["V3"]["design_half_weighted_kappa"] = design_kappa
    results["V4"] = escalation(test, v1_answers, tau)
    order_agree = sum(a["label"] == b["label"] for a, b in zip(v2_answers, run_variant(test, "V2r", key, args.batch, examples)[0]))
    report.update(variants_on_test_half=results, cost=cost, boundary_examples_from_design_half=examples,
                  v2_order_check={"same_label_when_levels_reversed": round(order_agree / len(test), 4)})
    test_scores = [p["score"] for p in test]
    report["continuous_v1_test_half"] = continuous_metrics(test_scores, [a["score_0_10"] for a in v1_answers])
    report["continuous_v0_test_half"] = continuous_metrics(test_scores, [a["score_0_10"] for a in
                                                                         run_variant(test, "V0", key, args.batch, examples)[0]])
    report["group_level_v1_test_half"] = group_level_check(design, design_answers, test, v1_answers)
    all_v1, _ = run_variant(posts, "V1", key, args.batch, examples)
    judged_v1 = [(p, a) for p, a in zip(posts, all_v1) if p["score"] is not None]
    report["detectable_effects_all_judged_posts"] = {
        "judge": detectable_effects([p for p, _ in judged_v1], [p["score"] for p, _ in judged_v1]),
        "jev_v1": detectable_effects([p for p, _ in judged_v1], [a["score_0_10"] for _, a in judged_v1])}
    report["daily_support_v1_all_posts"] = daily_support(posts, all_v1)
    off = [(p["score"] is None, a["p_on_topic"] < 0.5) for p, a in zip(posts, all_v1)]
    report["off_topic_v1_all_posts"] = {"judge_off_topic": sum(j for j, _ in off),
                                        "jev_off_topic": sum(k for _, k in off), "both": sum(j and k for j, k in off)}
    if args.human_sample and args.human_key:
        texts = {row["text"]: row for row in csv.DictReader(args.human_sample.open(encoding="utf-8-sig"))}
        by_text = {p["text"]: a for p, a in zip(posts, all_v1)}
        report["vs_muhd_hand_scores_v1"] = agreement([(bucket(r["muhd_score"]), by_text[t]["label"])
                                                     for t, r in texts.items() if t in by_text and bucket(r["muhd_score"])])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
