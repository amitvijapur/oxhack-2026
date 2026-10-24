#!/usr/bin/env python3
"""Can Jev label the Tok society's posts cold / warm / hot as well as the swarm's judge?

Reads the pilot's judged posts (`swarm/records/pilot/scores.jsonl` on ahmed/gold-society-plan): each
has the gpt-5.4-mini judge's 0-10 support score (cold 0-3, warm 4-6, hot 7-10, or n/a when off topic).
Muhd's hand scores for 30 of them (`swarm/records/judge-check/`) are the human reference.

For every post Jev answers two typed questions in one request batch: a Score over three levels that
mirror the judge prompt's own definitions, and a Noul for "is this about gold mining at Tok?".
Agreement is measured with accuracy, macro-F1 and Cohen's kappa (the labels are mostly "warm", so an
always-warm baseline is shown too), plus rank correlation with the 0-10 score. Responses are cached
under data/generated/jev_sentiment/ (ignored by Git), so a rerun costs nothing.

Usage: python3 scripts/jev_sentiment_check.py SCORES_JSONL [--human-sample CSV --human-key CSV]
       [--batch 25] [--dry-run]
Needs TYPESAFE_API_KEY in the environment or a local .env, unless --dry-run.
"""
from __future__ import annotations

import argparse
from collections import Counter
import csv
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request

JEV_URL = "https://api.typesafe.ai/v1/systemone"
MODEL = "jev-latest"
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


def build_request(posts):
    """One request for a batch: a Score and a Noul per post, each with the post in its own instructions."""
    questions = {}
    for i, post in enumerate(posts):
        quoted = f'Author: {post["name"]} ({post["group"]})\nPost: """{post["text"]}"""'
        questions[f"support_{i}"] = {"type": "score", "criteria": LEVELS,
                                     "instructions": f"How much does the author support gold mining at Tok?\n{quoted}"}
        questions[f"on_topic_{i}"] = {"type": "noul", "instructions":
                                      "Does this post say anything that bears on gold mining at Tok, gold-mining "
                                      f"investment or the gold price?\n{quoted}"}
    return {"model": MODEL, "state": {"context": CONTEXT}, "questions": questions}


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


def read_answers(response, n):
    out = []
    for i in range(n):
        support = response["answers"][f"support_{i}"]
        probs = {LABELS[int(k)]: v for k, v in support["probabilities"].items()}
        out.append({"label": max(probs, key=probs.get), "probabilities": probs, "score_0_2": support["score"],
                    "confidence": support.get("confidence"),
                    "p_on_topic": response["answers"][f"on_topic_{i}"]["noul"]})
    return out


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


def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(v):
            j = i
            while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]:
                j += 1
            for k in range(i, j + 1):
                r[order[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    return cov / (sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry)) ** 0.5


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("scores", type=Path)
    parser.add_argument("--human-sample", type=Path)
    parser.add_argument("--human-key", type=Path)
    parser.add_argument("--batch", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    posts = [json.loads(line) for line in args.scores.read_text().splitlines() if line.strip()]
    judged = [p for p in posts if p["score"] is not None]
    report = {"posts": len(posts), "on_topic_by_judge": len(judged),
              "judge_labels": dict(Counter(bucket(p["score"]) for p in judged)),
              "always_warm_baseline": agreement([(bucket(p["score"]), "warm") for p in judged])}
    batches = [posts[i:i + args.batch] for i in range(0, len(posts), args.batch)]
    key = None if args.dry_run else api_key()
    if key is None:
        report["jev"] = ("dry run: no calls made" if args.dry_run else "TYPESAFE_API_KEY not set; no calls made")
        report["requests_planned"] = len(batches)
        report["example_request"] = build_request(batches[0][:1])
        print(json.dumps(report, indent=2))
        return
    answers, seconds, tokens, cached = [], [], 0, 0
    for batch in batches:
        response, took, hit = cached_ask(build_request(batch), key)
        answers += read_answers(response, len(batch))
        seconds.append(took)
        tokens += response.get("usage", {}).get("input_tokens", 0)
        cached += hit
    on_topic_pairs = [(p, a) for p, a in zip(posts, answers) if p["score"] is not None]
    report["jev_vs_judge"] = agreement([(bucket(p["score"]), a["label"]) for p, a in on_topic_pairs])
    report["jev_vs_judge"]["spearman_with_0_10_score"] = round(
        spearman([a["score_0_2"] for _, a in on_topic_pairs], [p["score"] for p, _ in on_topic_pairs]), 4)
    off = [(p["score"] is None, a["p_on_topic"] < 0.5) for p, a in zip(posts, answers)]
    report["off_topic_detection"] = {"judge_off_topic": sum(j for j, _ in off), "jev_off_topic": sum(k for _, k in off),
                                     "both": sum(j and k for j, k in off)}
    report["speed_and_cost"] = {"requests": len(batches), "cached": cached,
                                "seconds_per_request_median": round(sorted(seconds)[len(seconds) // 2], 3),
                                "posts_per_request": args.batch, "input_tokens": tokens,
                                "cost_usd": round(tokens / 1e6 * PRICE_PER_MILLION_INPUT_TOKENS, 6)}
    if args.human_sample and args.human_key:
        texts = {row["text"]: row for row in csv.DictReader(args.human_sample.open(encoding="utf-8-sig"))}
        by_text = {p["text"]: a for p, a in zip(posts, answers)}
        judge_by_id = {row["id"]: row for row in csv.DictReader(args.human_key.open(encoding="utf-8-sig"))}
        human = [(bucket(row["muhd_score"]), by_text[t]["label"], bucket(judge_by_id[row["id"]]["judge_score"]))
                 for t, row in texts.items() if t in by_text and bucket(row["muhd_score"])]
        report["vs_muhd_hand_scores"] = {"jev": agreement([(h, j) for h, j, _ in human]),
                                         "gpt_judge": agreement([(h, g) for h, _, g in human if g])}
    report["model"] = MODEL
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
