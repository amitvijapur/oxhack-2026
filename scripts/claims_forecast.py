#!/usr/bin/env python3
"""Measured claim-activity forecast: will a previously staked section see new lode staking next year?

Standard library only. Rules fixed before fitting (research/claim-activity-forecast.md):

- Cell: a PLSS section (MTRS). Spatial block: its township. Event: a distinct locator-day, meaning
  one claimant staking on one date, however many claims they file that day.
- Target for year Y: at least one locator-day in the cell during calendar year Y.
- Features are built only from claims located before a cutoff 92 days before 1 January of Y
  (a gap for recording lag), using location and closed dates. Snapshot status fields are ignored.
- Eligible cells for year Y: sections with a claim located (since 1997) before that cutoff.
  Cells that are only staked later never appear early, so membership cannot leak the future.
- Training for test year Y uses label years up to Y-2, the last fully resolved at the cutoff.
- Test years 2003-2023; 2024 labels may be incompletely recorded in the March 2025 snapshot.
- Evaluation: walk-forward by year x 5 township folds (cells in a test fold never train), plus
  Nevada-to-Arizona and Arizona-to-Nevada transfer. Brier skill against climatology, a per-cell
  trailing rate and the test year's own base rate.

Usage: python3 scripts/claims_forecast.py [--claims CSV] [--mrds CSV] [--output DIR]
"""
from __future__ import annotations

import argparse
from bisect import bisect_left
from collections import defaultdict
import csv
from datetime import date, timedelta
import json
import math
from pathlib import Path
import random
import zlib

LAG_DAYS = 92
FIRST_LABEL_YEAR = 2001  # three full trailing years after the 1997 data start
TEST_YEARS = range(2003, 2024)
FOLDS = 5
SAMPLE = 15000  # training rows per fit, sampled with a fixed seed
FEATURES = ("intercept", "log_trailing_1y", "log_trailing_3y", "log_active_claims", "log_neighbour_1y",
            "gold_within_5km", "log_km_to_gold")


def cutoff(year):
    return date(year, 1, 1) - timedelta(days=LAG_DAYS)


def load_claims(path):
    cells = defaultdict(lambda: {"events": set(), "located": [], "closed": [], "lonlat": None, "state": None})
    with open(path, newline="") as handle:
        for row in csv.DictReader(handle):
            if not row["MTRS"] or not row["Location_Date"]:
                continue
            cell = cells[row["MTRS"]]
            located = date.fromisoformat(row["Location_Date"])
            cell["events"].add(((row["Claimant"] or "").strip().upper(), located))
            cell["located"].append(located)
            if row["Closed_Date"]:
                cell["closed"].append(date.fromisoformat(row["Closed_Date"]))
            if row["lon"] and (cell["lonlat"] is None or located < cell["lonlat"][0]):
                cell["lonlat"] = (located, float(row["lon"]), float(row["lat"]))  # earliest claim's position
            cell["state"] = row["AdminState"]
    for cell in cells.values():
        cell["event_dates"] = sorted(d for _, d in cell["events"])
        cell["located"].sort()
        cell["closed"].sort()
        cell["first"] = cell["located"][0]
    return cells


def count_between(sorted_dates, start, end):
    return bisect_left(sorted_dates, end) - bisect_left(sorted_dates, start)


class GoldIndex:
    """Nearest MRDS gold site by bucketing points into 0.25 degree squares."""

    def __init__(self, path):
        self.buckets = defaultdict(list)
        with open(path, newline="") as handle:
            for row in csv.DictReader(handle):
                if row["lon"]:
                    lon, lat = float(row["lon"]), float(row["lat"])
                    self.buckets[(math.floor(lon * 4), math.floor(lat * 4))].append((lon, lat))

    def km_to_nearest(self, lon, lat, cap=50.0):
        bx, by = math.floor(lon * 4), math.floor(lat * 4)
        best = cap
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                for x, y in self.buckets.get((bx + dx, by + dy), ()):
                    km = 111.2 * math.hypot((x - lon) * math.cos(math.radians(lat)), y - lat)
                    best = min(best, km)
        return best


def township(mtrs):
    return " ".join(mtrs.split()[:3])


def build_rows(cells, gold, years):
    """One row per eligible cell and label year, with point-in-time features and the label."""
    km = {mtrs: gold.km_to_nearest(c["lonlat"][1], c["lonlat"][2]) if c["lonlat"] else 50.0
          for mtrs, c in cells.items()}
    rows = []
    for year in years:
        cut = cutoff(year)
        eligible = [m for m, c in cells.items() if c["first"] < cut]
        trailing = {m: count_between(cells[m]["event_dates"], cut - timedelta(days=365), cut) for m in eligible}
        by_township = defaultdict(int)
        for m in eligible:
            by_township[township(m)] += trailing[m]
        for m in eligible:
            c = cells[m]
            trail3 = count_between(c["event_dates"], cut - timedelta(days=3 * 365), cut)
            active = bisect_left(c["located"], cut) - bisect_left(c["closed"], cut)
            label = count_between(c["event_dates"], date(year, 1, 1), date(year + 1, 1, 1))
            x = (1.0, math.log1p(trailing[m]), math.log1p(trail3), math.log1p(max(active, 0)),
                 math.log1p(by_township[township(m)] - trailing[m]), 1.0 if km[m] <= 5 else 0.0, math.log1p(km[m]))
            rows.append({"cell": m, "township": township(m), "state": c["state"], "year": year, "x": x,
                         "events": label, "y": 1 if label else 0})
    return rows


def fit_logistic(rows, ridge=1e-3, iterations=8):
    """Newton-Raphson (IRLS) logistic regression with a small ridge, standard library only."""
    k = len(rows[0]["x"])
    w = [0.0] * k
    for _ in range(iterations):
        grad = [0.0] * k
        hess = [[ridge if i == j and i else 0.0 for j in range(k)] for i in range(k)]
        for r in rows:
            x = r["x"]
            p = 1 / (1 + math.exp(-max(-30.0, min(30.0, sum(a * b for a, b in zip(w, x))))))
            g, h = r["y"] - p, p * (1 - p)
            for i in range(k):
                grad[i] += g * x[i]
                hx = h * x[i]
                row = hess[i]
                for j in range(i, k):
                    row[j] += hx * x[j]
        for i in range(k):
            grad[i] -= ridge * w[i] if i else 0.0
            for j in range(i):
                hess[i][j] = hess[j][i]
        step = solve_linear(hess, grad)
        w = [a + b for a, b in zip(w, step)]
    return w


def solve_linear(a, b):
    """Gaussian elimination with partial pivoting."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(m[r][col]))
        m[col], m[pivot] = m[pivot], m[col]
        for r in range(col + 1, n):
            f = m[r][col] / m[col][col]
            for c in range(col, n + 1):
                m[r][c] -= f * m[col][c]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (m[r][n] - sum(m[r][c] * x[c] for c in range(r + 1, n))) / m[r][r]
    return x


def predict(w, x):
    return 1 / (1 + math.exp(-max(-30.0, min(30.0, sum(a * b for a, b in zip(w, x))))))


def trailing_rate(history, base):
    """Per-cell fraction of resolved past years with activity, shrunk to the base rate (Beta, weight 2)."""
    return (sum(history) + 2 * base) / (len(history) + 2)


def brier(pairs):
    return sum((p - y) ** 2 for p, y in pairs) / len(pairs)


def fold(name):
    return zlib.crc32(name.encode()) % FOLDS


def evaluate(rows, train_filter, test_filter, label):
    """Walk-forward by year: fit on resolved label years, score the held-out cells for year Y."""
    by_year = defaultdict(list)
    for r in rows:
        by_year[r["year"]].append(r)
    history = defaultdict(dict)  # cell -> year -> y, to compute the trailing-rate baseline
    for r in rows:
        history[r["cell"]][r["year"]] = r["y"]
    scored = {"model": [], "climatology": [], "trailing_rate": [], "year_base_rate": []}
    per_year = []
    for year in TEST_YEARS:
        train = [r for y in range(FIRST_LABEL_YEAR, year - 1) for r in by_year[y] if train_filter(r, year)]
        test = [r for r in by_year[year] if test_filter(r, year)]
        if not train or not test:
            continue
        base = sum(r["y"] for r in train) / len(train)
        sample = random.Random(year).sample(train, min(SAMPLE, len(train)))
        w = fit_logistic(sample)
        year_rate = sum(r["y"] for r in test) / len(test)
        rows_scored = {"model": [], "climatology": [], "trailing_rate": [], "year_base_rate": []}
        for r in test:
            past = [history[r["cell"]][y] for y in range(FIRST_LABEL_YEAR, year - 1) if y in history[r["cell"]]]
            rows_scored["model"].append((predict(w, r["x"]), r["y"]))
            rows_scored["climatology"].append((base, r["y"]))
            rows_scored["trailing_rate"].append((trailing_rate(past, base), r["y"]))
            rows_scored["year_base_rate"].append((year_rate, r["y"]))
        for key in scored:
            scored[key] += rows_scored[key]
        per_year.append({"year": year, "test_cells": len(test), "base_rate": round(year_rate, 4),
                         **{f"brier_{k}": round(brier(v), 5) for k, v in rows_scored.items()}})
    b = {k: brier(v) for k, v in scored.items() if v}
    return {
        "_pairs": scored["model"], **year_stats(per_year),
        "evaluation": label, "test_rows": len(scored["model"]),
        "brier": {k: round(v, 5) for k, v in b.items()},
        "skill_vs_climatology": round(1 - b["model"] / b["climatology"], 4),
        "skill_vs_trailing_rate": round(1 - b["model"] / b["trailing_rate"], 4),
        "skill_vs_year_base_rate": round(1 - b["model"] / b["year_base_rate"], 4),
        "trailing_rate_skill_vs_climatology": round(1 - b["trailing_rate"] / b["climatology"], 4),
        "reliability": reliability(scored["model"]),
        "per_year": per_year,
    }


def year_stats(per_year, draws=5000):
    """Years are the independent units: count wins per year (sign test) and bootstrap whole years."""
    if not per_year:
        return {}
    n = len(per_year)
    wins = sum(y["brier_model"] < y["brier_climatology"] for y in per_year)
    p_value = sum(math.comb(n, i) for i in range(wins, n + 1)) / 2 ** n
    rng, skills = random.Random(0), []
    for _ in range(draws):
        sample = [rng.choice(per_year) for _ in per_year]
        model = sum(y["brier_model"] * y["test_cells"] for y in sample)
        clim = sum(y["brier_climatology"] * y["test_cells"] for y in sample)
        skills.append(1 - model / clim)
    skills.sort()
    return {"years_beating_climatology": f"{wins}/{n}", "sign_test_p": p_value,
            "skill_vs_climatology_95ci_year_bootstrap": [round(skills[int(0.025 * draws)], 4),
                                                         round(skills[int(0.975 * draws) - 1], 4)]}


def reliability(pairs, bins=10):
    """Mean forecast against observed frequency in equal-count bins."""
    ordered = sorted(pairs)
    size = max(1, len(ordered) // bins)
    table = []
    for start in range(0, len(ordered), size):
        chunk = ordered[start:start + size]
        table.append({"n": len(chunk), "mean_forecast": round(sum(p for p, _ in chunk) / len(chunk), 4),
                      "observed": round(sum(y for _, y in chunk) / len(chunk), 4)})
    return table


def final_model(rows):
    """Fit on all resolved label years and report coefficients and per-band count moments."""
    train = [r for r in rows if FIRST_LABEL_YEAR <= r["year"] <= TEST_YEARS[-1]]
    sample = random.Random(0).sample(train, min(SAMPLE, len(train)))
    w = fit_logistic(sample)
    bands = defaultdict(list)
    for r in train:
        bands[min(9, int(predict(w, r["x"]) * 10))].append(r["events"])
    moments = {}
    for band, counts in sorted(bands.items()):
        mean = sum(counts) / len(counts)
        var = sum((c - mean) ** 2 for c in counts) / max(1, len(counts) - 1)
        moments[f"{band / 10:.1f}-{(band + 1) / 10:.1f}"] = {"n": len(counts), "mean_events": round(mean, 4),
                                                            "var_events": round(var, 4)}
    return {"coefficients": dict(zip(FEATURES, (round(v, 4) for v in w))), "count_moments_by_forecast_band": moments}


def write_forecast(cells, gold, rows, year, output):
    """Forecast ``year`` for every section eligible at its cutoff, with the final model fitted on resolved years."""
    train = [r for r in rows if FIRST_LABEL_YEAR <= r["year"] <= year - 2]
    w = fit_logistic(random.Random(0).sample(train, min(SAMPLE, len(train))))
    target = build_rows(cells, gold, [year])
    path = output / f"forecast_{year}.csv"
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["mtrs", "state", "p_any_staking", "cutoff", *FEATURES[1:]])
        for r in sorted(target, key=lambda r: -predict(w, r["x"])):
            writer.writerow([r["cell"], r["state"], round(predict(w, r["x"]), 5), cutoff(year).isoformat(),
                             *(round(v, 4) for v in r["x"][1:])])
    print(f"forecast {year}: {len(target):,} sections -> {path}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--claims", type=Path, default=Path("data/raw/claims/nv_az_lode_since_1997.csv"))
    parser.add_argument("--mrds", type=Path, default=Path("data/raw/claims/mrds_gold_nv_az_box.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/generated/claims_forecast"))
    parser.add_argument("--forecast-year", type=int, default=2025,
                        help="year to forecast for every eligible section, from data available at its cutoff")
    args = parser.parse_args()
    cells = load_claims(args.claims)
    gold = GoldIndex(args.mrds)
    rows = build_rows(cells, gold, range(FIRST_LABEL_YEAR, TEST_YEARS[-1] + 1))
    print(f"{len(cells):,} sections, {len(rows):,} cell-years", flush=True)
    report = {"rules": __doc__.split("Usage:")[0].strip(), "features": FEATURES, "sections": len(cells),
              "cell_years": len(rows), "results": []}
    report["results"].append(evaluate(rows, lambda r, y: True, lambda r, y: True, "time-forward, all cells (in-sample cells)"))
    spatial = []
    for k in range(FOLDS):
        spatial.append(evaluate(rows, lambda r, y, k=k: fold(r["township"]) != k,
                                lambda r, y, k=k: fold(r["township"]) == k, f"township fold {k}"))
    report["results"].append(pool_folds(spatial))
    report["results"].append(evaluate(rows, lambda r, y: r["state"] == "NV", lambda r, y: r["state"] == "AZ",
                                      "transfer: train Nevada, test Arizona"))
    report["results"].append(evaluate(rows, lambda r, y: r["state"] == "AZ", lambda r, y: r["state"] == "NV",
                                      "transfer: train Arizona, test Nevada"))
    report["final_model"] = final_model(rows)
    report["year_base_rate_note"] = ("year_base_rate uses the test year's own outcome rate: a hindsight oracle. "
                                     "Beating it shows ranking skill across cells within a year.")
    for r in report["results"]:
        r.pop("_pairs", None)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    write_forecast(cells, gold, rows, args.forecast_year, args.output)
    for r in report["results"]:
        print(f"{r['evaluation']}: rows={r['test_rows']:,} brier={r['brier']} "
              f"skill vs climatology={r['skill_vs_climatology']} vs trailing={r['skill_vs_trailing_rate']} "
              f"vs year base rate={r['skill_vs_year_base_rate']}", flush=True)


def pool_folds(results):
    """Combine township folds, weighting each fold's Brier scores by its number of test rows."""
    total = sum(r["test_rows"] for r in results)
    brier_pooled = {k: sum(r["brier"][k] * r["test_rows"] for r in results) / total for k in results[0]["brier"]}
    years = defaultdict(lambda: {"test_cells": 0, "brier_model": 0.0, "brier_climatology": 0.0})
    for r in results:
        for y in r["per_year"]:
            row = years[y["year"]]
            row["test_cells"] += y["test_cells"]
            row["brier_model"] += y["brier_model"] * y["test_cells"]
            row["brier_climatology"] += y["brier_climatology"] * y["test_cells"]
    per_year = [{"year": k, "test_cells": v["test_cells"], "brier_model": v["brier_model"] / v["test_cells"],
                 "brier_climatology": v["brier_climatology"] / v["test_cells"]} for k, v in sorted(years.items())]
    pairs = [pair for r in results for pair in r["_pairs"]]
    return {
        **year_stats(per_year), "reliability": reliability(pairs),
        "evaluation": "time-forward x township folds (cells never seen in training)", "test_rows": total,
        "brier": {k: round(v, 5) for k, v in brier_pooled.items()},
        "skill_vs_climatology": round(1 - brier_pooled["model"] / brier_pooled["climatology"], 4),
        "skill_vs_trailing_rate": round(1 - brier_pooled["model"] / brier_pooled["trailing_rate"], 4),
        "skill_vs_year_base_rate": round(1 - brier_pooled["model"] / brier_pooled["year_base_rate"], 4),
        "trailing_rate_skill_vs_climatology": round(1 - brier_pooled["trailing_rate"] / brier_pooled["climatology"], 4),
        "folds": [{k: r[k] for k in ("evaluation", "test_rows", "brier")} for r in results],
    }


if __name__ == "__main__":
    main()
