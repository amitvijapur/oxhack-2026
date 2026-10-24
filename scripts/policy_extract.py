#!/usr/bin/env python3
"""Label the society's free-text answer "what will the state do next?" with a typed policy move.

The interviews in the Tok society give typed answers for price, timing and leaning, but the policy
move itself (`state_next_move`) is a free sentence. This turns it into one of a fixed set of moves,
with probabilities. Jev (TypeSafe System One) answers when TYPESAFE_API_KEY is set in the
environment or in a local .env; otherwise a transparent keyword rule answers. The label only
annotates the policy call; it never changes a decision value. Standard library only.

Usage: python3 scripts/policy_extract.py INTERVIEWS_JSON [--backend auto|rules|jev]
"""
from __future__ import annotations

import argparse
from collections import Counter
import json
import os
from pathlib import Path
import re
import urllib.request

JEV_URL = "https://api.typesafe.ai/v1/systemone"
MOVES = {
    "approve": "The state will approve or allow the mine or mining to go ahead.",
    "approve_with_conditions": "The state will allow it but attach conditions, mitigation or monitoring requirements.",
    "review_or_delay": "The state will keep reviewing, gather comments or information, or hold off deciding for now.",
    "block": "The state will deny, halt or block the mine or new mining.",
    "tax_change": "The state will change taxes, royalties or fees on mining.",
}
RULES = [  # checked in order; the first match wins
    ("tax_change", r"\btax|royalt|levy"),
    ("block", r"\b(deny|denial|halt|block|reject|suspend)"),
    ("approve_with_conditions", r"\b(condition|mitigat|require|monitor|guarantee)"),
    ("approve", r"\b(approve|approval|green.?light|allow|permit (it|the))"),
    ("review_or_delay", r"\b(review|continue|process|comment|wait|pending|assess|consult|study)"),
]


def rules_label(text):
    lowered = (text or "").lower()
    for move, pattern in RULES:
        if re.search(pattern, lowered):
            return {"move": move, "probabilities": {move: 1.0}, "backend": "rules"}
    return {"move": None, "probabilities": {}, "backend": "rules"}


def api_key():
    if os.environ.get("TYPESAFE_API_KEY"):
        return os.environ["TYPESAFE_API_KEY"]
    env = Path(".env")
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("TYPESAFE_API_KEY=") and line.split("=", 1)[1].strip():
                return line.split("=", 1)[1].strip()
    return None


def jev_request(text):
    """One Choice question over the answer, in the System One request shape (docs.typesafe.ai)."""
    return {"model": "jev-latest", "state": {"answer": text},
            "questions": {"policy_move": {"type": "choice",
                                          "instructions": "What does `answer` say the Alaska state government will do next about mining near Tok?",
                                          "criteria": MOVES}}}


def jev_label(text, key):
    request = urllib.request.Request(JEV_URL, data=json.dumps(jev_request(text)).encode(),
                                     headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=30) as response:
        answer = json.load(response)["answers"]["policy_move"]
    return {"move": answer.get("choice"), "probabilities": answer.get("probabilities", {}), "backend": "jev"}


def label(text, backend="auto"):
    key = api_key() if backend in ("auto", "jev") else None
    if key:
        try:
            return jev_label(text, key)
        except Exception as error:  # a failed call is an error, not an answer; fall back and say so
            result = rules_label(text)
            result["jev_error"] = str(error)
            return result
    if backend == "jev":
        raise SystemExit("TYPESAFE_API_KEY is not set")
    return rules_label(text)


def interview_answers(path):
    """(agent_key, parsed answer) pairs from a society interviews.json."""
    data = json.loads(Path(path).read_text())
    for key, item in data["result"]["results"].items():
        try:
            yield key, json.loads(item["response"])
        except (json.JSONDecodeError, TypeError):
            yield key, None


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("interviews", type=Path)
    parser.add_argument("--backend", choices=("auto", "rules", "jev"), default="auto")
    args = parser.parse_args()
    labels, unparsed = [], 0
    for key, answer in interview_answers(args.interviews):
        if not answer or not answer.get("state_next_move"):
            unparsed += 1
            continue
        labels.append({"agent": key, **label(answer["state_next_move"], args.backend),
                       "timing": answer.get("state_move_timing")})
    print(json.dumps({"answers": len(labels), "unparsed": unparsed,
                      "moves": dict(Counter(l["move"] for l in labels)),
                      "backends": dict(Counter(l["backend"] for l in labels)), "labels": labels}, indent=2))


if __name__ == "__main__":
    main()
