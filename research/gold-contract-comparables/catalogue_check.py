#!/usr/bin/env python3
"""Validate the NV/AZ gold contract catalogue and print its summary statistics.

Standard library only. Run from the repository root:
    python3 research/gold-contract-comparables/catalogue_check.py
"""
import csv
import statistics
import sys
from collections import Counter
from pathlib import Path

PATH = Path(__file__).with_name("nv_az_gold_contracts.csv")
CONTRACT_TYPES = {"purchase", "option_to_purchase", "earn_in", "royalty_sale", "lease", "jv"}
LAND_TYPES = {"purchase", "option_to_purchase", "earn_in"}


def fail(message):
    sys.exit(f"FAIL: {message}")


def describe(label, values):
    values = sorted(values)
    q1, median, q3 = statistics.quantiles(values, n=4, method="inclusive")
    print(f"{label}: n={len(values)} median={median:,.0f} middle half={q1:,.0f}-{q3:,.0f} range={values[0]:,.0f}-{values[-1]:,.0f}")


def main():
    with PATH.open(newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        header = reader.fieldnames
    for row in rows:
        if None in row or any(value is None for value in row.values()):
            fail(f"{row.get('deal_id')} has the wrong number of columns")
    ids = [row["deal_id"] for row in rows]
    if len(ids) != len(set(ids)):
        fail("duplicate deal_id")
    for row in rows:
        if row["contract_type"] not in CONTRACT_TYPES:
            fail(f"{row['deal_id']} has unknown contract_type {row['contract_type']}")
        if not row["source_url"].startswith("https://"):
            fail(f"{row['deal_id']} has no https source_url")
        if row["exclude_from_land_value"] == "true" and not row["exclude_reason"]:
            fail(f"{row['deal_id']} is excluded without a reason")
    print(f"OK: {len(rows)} rows, {len(header)} columns, unique IDs, every row sourced")
    print("By state:", dict(Counter(row["state"] for row in rows)))
    print("By contract type:", dict(Counter(row["contract_type"] for row in rows)))

    # The README's original selection: grassroots/exploration land contracts with a USD total and an area.
    selected = [row for row in rows if row["contract_type"] in LAND_TYPES
                and row["stage"].split()[0] in ("grassroots", "exploration")
                and row["usd_per_acre_est"] and row["total_consideration_usd_est"]]
    describe("All selected, USD/acre", [float(row["usd_per_acre_est"]) for row in selected])
    describe("All selected, USD/claim", [float(row["usd_per_claim_est"]) for row in selected if row["usd_per_claim_est"]])

    # Excludes royalty-only, related-party, remaining-commitment and share-only rows, and keeps one row per project group.
    clean, seen = [], set()
    for row in selected:
        if row["exclude_from_land_value"] == "true" or row["project_group"] in seen:
            continue
        seen.add(row["project_group"])
        clean.append(row)
    describe("Clean subset, USD/acre", [float(row["usd_per_acre_est"]) for row in clean])
    describe("Clean subset, USD/claim", [float(row["usd_per_claim_est"]) for row in clean if row["usd_per_claim_est"]])
    print("Rows with outcomes published after the agreement date:",
          ", ".join(f"{row['deal_id']}->{row['outcome_known_from']}" for row in rows if row["outcome_known_from"]))


if __name__ == "__main__":
    main()
