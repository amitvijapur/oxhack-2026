#!/usr/bin/env python3
"""Turn the Tok society's scored results into labelled stress scenarios for the decision engine.

Reads `results.json` written by `swarm/score.py report` (branch ahmed/gold-society-plan). A scenario
is used only when its pre-registered checks pass: the placebo moved no group beyond its chance band,
the scenario itself moved an expected group beyond both its band and the placebo's move, and for
the mirrored scenarios the mirrors check passed. Each usable scenario is mapped to a change in the
engine's inputs through `research/decision-engine/swarm-mappings.json`. The magnitudes there are
labelled assumptions, never swarm outputs. Standard library only.

Usage: python3 scripts/swarm_adapter.py RESULTS_JSON [--mappings FILE]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

MAPPINGS = Path("research/decision-engine/swarm-mappings.json")
PLACEBO_PART = "placebo moves no group beyond its band"


def part_status(check, name):
    for part in (check or {}).get("parts", []):
        if part["part"] == name:
            return part["status"]
    return "not run"


def usable_scenarios(results, mappings):
    """[(scenario, transform, evidence)] for scenarios whose checks pass; plus the reasons others were dropped."""
    checks = results.get("checks", {})
    placebo = checks.get("placebo")
    used, dropped = [], {}
    if part_status(placebo, PLACEBO_PART) != "pass":
        return [], {"all": f"placebo check is {part_status(placebo, PLACEBO_PART)!r}, so no scenario is trusted"}
    for scenario, rule in mappings["scenarios"].items():
        if part_status(placebo, scenario) != "pass":
            dropped[scenario] = f"scenario check is {part_status(placebo, scenario)!r}"
            continue
        mirror = rule.get("mirror_check")
        if mirror and part_status(checks.get("mirrors"), mirror) != "pass":
            dropped[scenario] = f"mirror check is {part_status(checks.get('mirrors'), mirror)!r}"
            continue
        effects = results.get("effects", {}).get(scenario, {})
        triggers = {g: effects.get(g, {}) for g in rule["trigger_groups"]}
        moved = {g: e for g, e in triggers.items()
                 if e.get("beyond_band") and e.get("effect") is not None and e["effect"] * rule["trigger_sign"] > 0}
        if not moved:
            dropped[scenario] = "no trigger group moved beyond its band in the expected direction"
            continue
        used.append((scenario, rule["transform"], {"effects": moved, "assumption": rule["assumption"]}))
    return used, dropped


def apply_transform(contract, arrival, transform):
    """Engine inputs under one scenario: offers scaled, or buyer conversion q scaled."""
    changed = json.loads(json.dumps(contract))
    if "bid_multiplier" in transform:
        for bid in changed["bids"]:
            bid["usd"] *= transform["bid_multiplier"]
    if "q_multiplier" in transform:
        q = getattr(arrival, "q", None) or arrival.components[0][1].q
        arrival = arrival.with_q(q * transform["q_multiplier"])
    return changed, arrival


def load(results_path, mappings_path=MAPPINGS):
    mappings = json.loads(Path(mappings_path).read_text())
    path = Path(results_path)
    if not path.exists():
        return [], {"all": f"no swarm results at {path} (the scored runs have not finished)"}, mappings
    return (*usable_scenarios(json.loads(path.read_text()), mappings), mappings)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("results", type=Path)
    parser.add_argument("--mappings", type=Path, default=MAPPINGS)
    args = parser.parse_args()
    used, dropped, _ = load(args.results, args.mappings)
    print(json.dumps({"usable": [{"scenario": s, "transform": t, **e} for s, t, e in used], "dropped": dropped},
                     indent=2))


if __name__ == "__main__":
    main()
