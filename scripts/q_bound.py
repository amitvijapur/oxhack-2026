#!/usr/bin/env python3
"""Rough data floor for q, the buyers per staking event that the decision engine assumes.

Public gold claim deals (the comparables catalogue, ``bid-comparables.csv``) per staking event
(distinct claimant-days in the NV/AZ claims file) in the same state and years. The catalogue is a
hand-collected sample of deals that public companies announced, not a census, so the ratio is a
LOWER bound: private sales and unannounced transfers are missing. The census would be BLM
transfer-of-interest filings (43 CFR 3833.32), which were not fetched. Only years with a full year
of claims data are used.

Usage: python3 scripts/q_bound.py CLAIMS_CSV research/decision-engine/bid-comparables.csv [--last-full-year 2024]
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
import importlib.util
import json
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("claims_forecast", Path(__file__).with_name("claims_forecast.py"))
claims_forecast = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(claims_forecast)


def staking_events(rows):
    """{(state, year): number of distinct (normalised claimant, location date)}."""
    events = defaultdict(set)
    for r in rows:
        if r["Location_Date"]:
            events[(r["AdminState"], int(r["Location_Date"][:4]))].add(
                (claims_forecast.normalise_claimant(r["Claimant"]), r["Location_Date"]))
    return {k: len(v) for k, v in events.items()}


def public_deals(rows):
    """{(state, year): deals}: every NV/AZ claim deal, priced or not, except royalty and other non-land rows."""
    deals = Counter()
    for r in rows:
        year = r["announce_date"][:4]
        if r["region"] in ("NV", "AZ") and not r["why_not_used"].startswith("royalty") and year.isdigit():
            deals[(r["region"], int(year))] += 1
    return deals


def floor(events, deals, last_full_year):
    out = {}
    for state in sorted({s for s, _ in deals}):
        years = [y for s, y in deals if s == state and y <= last_full_year]
        first = min(years)
        d = sum(n for (s, y), n in deals.items() if s == state and first <= y <= last_full_year)
        e = sum(n for (s, y), n in events.items() if s == state and first <= y <= last_full_year)
        out[state] = {"years": [first, last_full_year], "public_deals": d, "staking_events": e, "deals_per_event": d / e}
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("claims", type=Path)
    parser.add_argument("catalogue", type=Path)
    parser.add_argument("--last-full-year", type=int, default=2024)
    args = parser.parse_args()
    with open(args.claims, newline="") as handle:
        events = staking_events(csv.DictReader(handle))
    with open(args.catalogue, newline="") as handle:
        deals = public_deals(csv.DictReader(handle))
    print(json.dumps(floor(events, deals, args.last_full_year), indent=2))


if __name__ == "__main__":
    main()
