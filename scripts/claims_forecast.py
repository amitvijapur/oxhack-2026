#!/usr/bin/env python3
"""Measured claim-activity forecast: will a previously staked section see new lode staking next year?

Standard library only. Rules fixed before fitting (research/decision-engine/claim-activity-forecast.md):

- Cell: a PLSS section (MTRS). Spatial block: its township. Event: a distinct locator-day, meaning
  one claimant (name normalised) staking on one date, however many claims they file that day.
- Target for year Y: at least one locator-day in the cell during calendar year Y.
- Features are built only from claims located before a cutoff 92 days before 1 January of Y
  (a gap for recording lag), using location and closed dates. Snapshot status fields are ignored.
- Eligible cells for year Y: sections with a claim located (since 1997) before that cutoff.
  Cells that are only staked later never appear early, so membership cannot leak the future.
- Training for test year Y uses label years up to Y-2, the last fully resolved at the cutoff.
  Recalibration (an intercept shift fitted on out-of-sample predictions for year Y-2 from a model
  trained on years up to Y-3) is scored alongside; it scores worse than the raw model, so raw is used.
- Test years 2003-2023; 2024 labels may be incompletely recorded in the March 2025 snapshot.
- Evaluation: walk-forward by year x 5 township folds (cells in a test fold never train), plus
  Nevada-to-Arizona and Arizona-to-Nevada transfer. Brier skill against climatology, a per-cell
  trailing rate and the test year's own base rate (a hindsight oracle); significance with years as
  the unit; relative economic value and precision at k.

Usage: python3 scripts/claims_forecast.py [--claims CSV] [--mrds CSV] [--output DIR]
       [--lag-days N] [--gold-radius-km R] [--no-gold] [--quick] [--tag NAME]
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
import re
import statistics
import zlib

LAG_DAYS = 92
FIRST_LABEL_YEAR = 2001  # three full trailing years after the 1997 data start
TEST_YEARS = range(2003, 2024)
FOLDS = 5
SAMPLE = 15000  # training rows per fit, sampled with a fixed seed
SNAPSHOT = date(2025, 3, 19)  # NDOM snapshot date; later location dates are invalid
BOX = (-120.1, 31.3, -109.0, 42.1)  # NV/AZ bounding box for claim positions
MTRS_FORMAT = re.compile(r"^\d{2} \d{4}[NS] \d{4}[EW] \d{3}$")
SUFFIXES = {"LLC", "L", "C", "INC", "INCORPORATED", "CORP", "CORPORATION", "CO", "COMPANY", "LTD", "LIMITED",
            "LP", "LLP", "PLLC", "THE"}
BASE_FEATURES = ("intercept", "log_trailing_1y", "log_trailing_3y", "log_active_claims", "log_neighbour_1y")
GOLD_FEATURES = ("gold_within_radius", "log_km_to_gold")
FEATURES = BASE_FEATURES + GOLD_FEATURES
PRECISION_K = (100, 500, 1000)


def cutoff(year, lag_days=LAG_DAYS):
    return date(year, 1, 1) - timedelta(days=lag_days)


def normalise_claimant(name):
    """Upper case, punctuation removed, trailing company suffixes dropped: 'ABC, LLC' -> 'ABC'."""
    tokens = re.sub(r"[^A-Z0-9 ]", " ", (name or "").upper()).split()
    while len(tokens) > 1 and tokens[-1] in SUFFIXES:
        tokens.pop()
    return " ".join(tokens)


def load_claims(path, stats=None):
    """Load claims into sections, validating each row. ``stats`` (a dict) receives the drop counts."""
    counts = defaultdict(int)
    raw_names, clean_names = set(), set()
    cells = defaultdict(lambda: {"events": set(), "located": [], "closed": [], "lonlat": None, "state": None})
    with open(path, newline="") as handle:
        for row in csv.DictReader(handle):
            counts["rows"] += 1
            if not row["MTRS"] or not row["Location_Date"]:
                counts["dropped_missing_mtrs_or_date"] += 1
                continue
            if not MTRS_FORMAT.match(row["MTRS"]):
                counts["dropped_bad_mtrs_format"] += 1
                continue
            located = date.fromisoformat(row["Location_Date"])
            if located > SNAPSHOT:
                counts["dropped_location_after_snapshot"] += 1
                continue
            cell = cells[row["MTRS"]]
            raw_names.add((row["Claimant"] or "").strip().upper())
            claimant = normalise_claimant(row["Claimant"])
            clean_names.add(claimant)
            cell["events"].add((claimant, located))
            cell["located"].append(located)
            if row["Closed_Date"]:
                closed = date.fromisoformat(row["Closed_Date"])
                if closed < located:
                    counts["closed_before_located_ignored"] += 1
                else:
                    cell["closed"].append(closed)
            if row["lon"]:
                lon, lat = float(row["lon"]), float(row["lat"])
                if not (BOX[0] <= lon <= BOX[2] and BOX[1] <= lat <= BOX[3]):
                    counts["position_outside_box_ignored"] += 1
                elif cell["lonlat"] is None or located < cell["lonlat"][0]:
                    cell["lonlat"] = (located, lon, lat)  # earliest claim's position
            cell["state"] = row["AdminState"]
            counts["kept"] += 1
    for cell in cells.values():
        cell["event_dates"] = sorted(d for _, d in cell["events"])
        cell["located"].sort()
        cell["closed"].sort()
        cell["first"] = cell["located"][0]
    if stats is not None:
        stats.update(counts, claimant_names_raw=len(raw_names), claimant_names_normalised=len(clean_names),
                     locator_days=sum(len(c["events"]) for c in cells.values()))
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


def build_rows(cells, gold, years, lag_days=LAG_DAYS, gold_radius_km=5.0, use_gold=True):
    """One row per eligible cell and label year, with point-in-time features and the label."""
    km = {mtrs: gold.km_to_nearest(c["lonlat"][1], c["lonlat"][2]) if c["lonlat"] else 50.0
          for mtrs, c in cells.items()}
    rows = []
    for year in years:
        cut = cutoff(year, lag_days)
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
                 math.log1p(by_township[township(m)] - trailing[m]))
            if use_gold:
                x += (1.0 if km[m] <= gold_radius_km else 0.0, math.log1p(km[m]))
            rows.append({"cell": m, "township": township(m), "state": c["state"], "year": year, "x": x,
                         "events": label, "y": 1 if label else 0})
    return rows


def fit_logistic(rows, ridge=1e-3, max_iterations=25, tolerance=1e-7, info=None):
    """Newton-Raphson (IRLS) logistic regression with a small ridge, standard library only.

    Stops when the largest gradient component, per row, falls below ``tolerance``; ``info``
    (a dict) receives the iterations used and whether it converged."""
    k = len(rows[0]["x"])
    w = [0.0] * k
    converged = False
    for iteration in range(1, max_iterations + 1):
        grad = [0.0] * k
        hess = [[ridge if i == j and i else 0.0 for j in range(k)] for i in range(k)]
        for r in rows:
            x = r["x"]
            p = predict(w, x)
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
        if max(abs(g) for g in grad) / len(rows) < tolerance:
            converged = True
            break
        step = solve_linear(hess, grad)
        w = [a + b for a, b in zip(w, step)]
    if info is not None:
        info.update(iterations=iteration, converged=converged)
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


def logit_of(w, x):
    return max(-30.0, min(30.0, sum(a * b for a, b in zip(w, x))))


def predict(w, x, shift=0.0):
    return 1 / (1 + math.exp(-(logit_of(w, x) + shift)))


def intercept_shift(w, rows, iterations=30):
    """The constant added to the logit that best calibrates ``w`` on ``rows`` (1-D Newton)."""
    z = [logit_of(w, r["x"]) for r in rows]
    c = 0.0
    for _ in range(iterations):
        p = [1 / (1 + math.exp(-(zi + c))) for zi in z]
        g = sum(r["y"] - pi for r, pi in zip(rows, p))
        h = sum(pi * (1 - pi) for pi in p)
        if h == 0 or abs(g) < 1e-9:
            break
        c += g / h
    return c


def trailing_rate(history, base):
    """Per-cell fraction of resolved past years with activity, shrunk to the base rate (Beta, weight 2)."""
    return (sum(history) + 2 * base) / (len(history) + 2)


def brier(pairs):
    return sum((p - y) ** 2 for p, y in pairs) / len(pairs)


def fold(name):
    return zlib.crc32(name.encode()) % FOLDS


def fit_sample(rows, seed):
    return fit_logistic(random.Random(seed).sample(rows, min(SAMPLE, len(rows))))


def evaluate(rows, train_filter, test_filter, label):
    """Walk-forward by year: fit on resolved label years, recalibrate, score the held-out cells for year Y."""
    by_year = defaultdict(list)
    for r in rows:
        by_year[r["year"]].append(r)
    history = defaultdict(dict)  # cell -> year -> y, to compute the trailing-rate baseline
    for r in rows:
        history[r["cell"]][r["year"]] = r["y"]
    keys = ("model", "calibrated", "climatology", "trailing_rate", "year_base_rate")
    scored = {k: [] for k in keys}
    per_year = []
    for year in TEST_YEARS:
        train = [r for y in range(FIRST_LABEL_YEAR, year - 1) for r in by_year[y] if train_filter(r, year)]
        test = [r for r in by_year[year] if test_filter(r, year)]
        if not train or not test:
            continue
        base = sum(r["y"] for r in train) / len(train)
        w = fit_sample(train, year)
        # Calibration: a model that has not seen year Y-2 predicts it; fit only an intercept shift there.
        older = [r for y in range(FIRST_LABEL_YEAR, year - 2) for r in by_year[y] if train_filter(r, year)]
        recent = [r for r in by_year[year - 2] if train_filter(r, year)]
        shift = intercept_shift(fit_sample(older, year + 1000), recent) if older and recent else 0.0
        year_rate = sum(r["y"] for r in test) / len(test)
        rows_scored = {k: [] for k in keys}
        for r in test:
            past = [history[r["cell"]][y] for y in range(FIRST_LABEL_YEAR, year - 1) if y in history[r["cell"]]]
            rows_scored["model"].append((predict(w, r["x"]), r["y"]))
            rows_scored["calibrated"].append((predict(w, r["x"], shift), r["y"]))
            rows_scored["climatology"].append((base, r["y"]))
            rows_scored["trailing_rate"].append((trailing_rate(past, base), r["y"]))
            rows_scored["year_base_rate"].append((year_rate, r["y"]))
        for key in keys:
            scored[key] += rows_scored[key]
        ranked = sorted(rows_scored["calibrated"], key=lambda pair: -pair[0])
        per_year.append({"year": year, "test_cells": len(test), "base_rate": round(year_rate, 4),
                         "calibration_shift": round(shift, 4),
                         **{f"brier_{k}": round(brier(v), 6) for k, v in rows_scored.items()},
                         **{f"precision_at_{k}": round(sum(y for _, y in ranked[:k]) / k, 4)
                            for k in PRECISION_K if len(ranked) >= k}})
    b = {k: brier(v) for k, v in scored.items() if v}
    return {
        "_scored": scored, **year_stats(per_year),
        "evaluation": label, "test_rows": len(scored["model"]),
        "brier": {k: round(v, 6) for k, v in b.items()},
        "skill_vs_climatology": round(1 - b["model"] / b["climatology"], 4),
        "calibrated_skill_vs_climatology": round(1 - b["calibrated"] / b["climatology"], 4),
        "skill_vs_trailing_rate": round(1 - b["model"] / b["trailing_rate"], 4),
        "calibrated_skill_vs_trailing_rate": round(1 - b["calibrated"] / b["trailing_rate"], 4),
        "skill_vs_year_base_rate_oracle": round(1 - b["model"] / b["year_base_rate"], 4),
        "trailing_rate_skill_vs_climatology": round(1 - b["trailing_rate"] / b["climatology"], 4),
        "reliability_raw": reliability(scored["model"]), "reliability_calibrated": reliability(scored["calibrated"]),
        "per_year": per_year,
    }


def t_two_sided_p(t, df):
    """Two-sided p-value of Student's t, via the regularised incomplete beta function."""
    x = df / (df + t * t)
    return betainc(df / 2, 0.5, x)


def betainc(a, b, x):
    """Regularised incomplete beta I_x(a, b), continued fraction (Numerical Recipes betacf)."""
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    front = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log(1 - x))
    if x > (a + 1) / (a + b + 2):
        return 1 - betainc(b, a, 1 - x)
    c, d = 1.0, 1 - (a + b) * x / (a + 1)
    d = 1 / d
    f = d
    for m in range(1, 300):
        for step in (0, 1):
            if step == 0:
                num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m))
            else:
                num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1))
            d = 1 + num * d
            d = 1 / (d if abs(d) > 1e-300 else 1e-300)
            c = 1 + num / c if abs(c) > 1e-300 else 1 + num / 1e-300
            f *= c * d
        if abs(c * d - 1) < 1e-14:
            break
    return front * f / a


def diebold_mariano(per_year, model_key, baseline_key):
    """Diebold-Mariano test on yearly Brier differences with the Harvey-Leybourne-Newbold correction (h = 1)."""
    d = [y[f"brier_{baseline_key}"] - y[f"brier_{model_key}"] for y in per_year]
    n = len(d)
    mean, sd = statistics.fmean(d), statistics.stdev(d)
    t = mean / (sd / math.sqrt(n)) * math.sqrt((n - 1) / n)
    return {"years": n, "mean_brier_gain": mean, "t_hln": t, "p_two_sided": t_two_sided_p(t, n - 1)}


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
    out = {"years_beating_climatology": f"{wins}/{n}", "sign_test_p": p_value,
           "skill_vs_climatology_95ci_year_bootstrap": [round(skills[int(0.025 * draws)], 4),
                                                        round(skills[int(0.975 * draws) - 1], 4)]}
    if n > 2 and "brier_calibrated" in per_year[0]:
        out["diebold_mariano"] = {f"{m}_vs_{b}": diebold_mariano(per_year, m, b)
                                  for m in ("model", "calibrated") for b in ("climatology", "trailing_rate")}
    return out


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


def economic_value(pairs, thresholds=None):
    """Relative economic value of 'act when p > theta' for a user whose cost/loss ratio is theta.

    0 = no better than always or never acting on the base rate; 1 = perfect foresight (Richardson 2000)."""
    s = sum(y for _, y in pairs) / len(pairs)
    events = sum(y for _, y in pairs)
    non = len(pairs) - events
    curve = []
    for theta in thresholds or [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]:
        hits = sum(1 for p, y in pairs if y and p > theta) / events
        false = sum(1 for p, y in pairs if not y and p > theta) / non
        expense = false * (1 - s) * theta - hits * s * (1 - theta) + s
        climate, perfect = min(theta, s), s * theta
        curve.append({"cost_loss_ratio": theta, "value": round((climate - expense) / (climate - perfect), 4)})
    return curve


def final_model(rows, use_gold=True, seeds=(0, 1, 2, 3, 4)):
    """Fit on all resolved label years; report coefficients, their spread across samples, and band moments."""
    names = FEATURES if use_gold else BASE_FEATURES
    train = [r for r in rows if FIRST_LABEL_YEAR <= r["year"] <= TEST_YEARS[-1]]
    fits, infos = [], []
    for seed in seeds:
        info = {}
        fits.append(fit_logistic(random.Random(seed).sample(train, min(SAMPLE, len(train))), info=info))
        infos.append(info)
    w = fits[0]
    bands = defaultdict(list)
    for r in train:
        bands[min(9, int(predict(w, r["x"]) * 10))].append(r["events"])
    moments = {}
    for band, counts in sorted(bands.items()):
        mean = sum(counts) / len(counts)
        var = sum((c - mean) ** 2 for c in counts) / max(1, len(counts) - 1)
        moments[f"{band / 10:.1f}-{(band + 1) / 10:.1f}"] = {"n": len(counts), "mean_events": round(mean, 4),
                                                            "var_events": round(var, 4)}
    spread = {name: [round(min(f[i] for f in fits), 4), round(max(f[i] for f in fits), 4)]
              for i, name in enumerate(names)}
    return {"coefficients": dict(zip(names, (round(v, 4) for v in w))),
            "coefficient_range_over_5_samples": spread, "fit_convergence": infos,
            "count_moments_by_forecast_band": moments}


def write_forecast(cells, gold, rows, year, output, settings):
    """Forecast ``year`` for every section eligible at its cutoff: final model plus the latest calibration shift."""
    resolved = [r for r in rows if FIRST_LABEL_YEAR <= r["year"] <= year - 2]
    w = fit_sample(resolved, 0)
    older = [r for r in rows if FIRST_LABEL_YEAR <= r["year"] <= year - 3]
    recent = [r for r in rows if r["year"] == year - 2]
    shift = intercept_shift(fit_sample(older, 1), recent)
    target = build_rows(cells, gold, [year], **settings)
    path = output / f"forecast_{year}.csv"
    names = FEATURES if settings["use_gold"] else BASE_FEATURES
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        # The raw model scores better out of sample than the recalibrated one, so it is the default.
        writer.writerow(["mtrs", "state", "p_any_staking", "p_recalibrated", "cutoff", *names[1:]])
        for r in sorted(target, key=lambda r: -predict(w, r["x"])):
            writer.writerow([r["cell"], r["state"], round(predict(w, r["x"]), 5), round(predict(w, r["x"], shift), 5),
                             cutoff(year, settings["lag_days"]).isoformat(), *(round(v, 4) for v in r["x"][1:])])
    print(f"forecast {year}: {len(target):,} sections, calibration shift {shift:+.3f} -> {path}", flush=True)
    return shift


def pool_folds(results):
    """Combine township folds: Brier weighted by rows, per-year scores pooled, pairs pooled for reliability."""
    total = sum(r["test_rows"] for r in results)
    keys = results[0]["brier"].keys()
    brier_pooled = {k: sum(r["brier"][k] * r["test_rows"] for r in results) / total for k in keys}
    years = defaultdict(lambda: defaultdict(float))
    for r in results:
        for y in r["per_year"]:
            row = years[y["year"]]
            row["test_cells"] += y["test_cells"]
            row["events"] += y["base_rate"] * y["test_cells"]
            for k in keys:
                row[f"brier_{k}"] += y[f"brier_{k}"] * y["test_cells"]
    per_year = [{"year": year, "test_cells": int(v["test_cells"]), "base_rate": round(v["events"] / v["test_cells"], 4),
                 **{f"brier_{k}": v[f"brier_{k}"] / v["test_cells"] for k in keys}} for year, v in sorted(years.items())]
    scored = {k: [pair for r in results for pair in r["_scored"][k]] for k in results[0]["_scored"]}
    fold_skill = [1 - r["brier"]["model"] / r["brier"]["climatology"] for r in results]
    t_folds = statistics.fmean(fold_skill) / (statistics.stdev(fold_skill) / math.sqrt(len(fold_skill)))
    return {
        "_scored": scored, **year_stats(per_year),
        "evaluation": "time-forward x township folds (cells never seen in training)", "test_rows": total,
        "brier": {k: round(v, 6) for k, v in brier_pooled.items()},
        "skill_vs_climatology": round(1 - brier_pooled["model"] / brier_pooled["climatology"], 4),
        "calibrated_skill_vs_climatology": round(1 - brier_pooled["calibrated"] / brier_pooled["climatology"], 4),
        "skill_vs_trailing_rate": round(1 - brier_pooled["model"] / brier_pooled["trailing_rate"], 4),
        "calibrated_skill_vs_trailing_rate": round(1 - brier_pooled["calibrated"] / brier_pooled["trailing_rate"], 4),
        "skill_vs_year_base_rate_oracle": round(1 - brier_pooled["model"] / brier_pooled["year_base_rate"], 4),
        "trailing_rate_skill_vs_climatology": round(1 - brier_pooled["trailing_rate"] / brier_pooled["climatology"], 4),
        "reliability_raw": reliability(scored["model"]), "reliability_calibrated": reliability(scored["calibrated"]),
        "fold_skill_vs_climatology": [round(s, 4) for s in fold_skill],
        "fold_t_test": {"t": t_folds, "df": len(fold_skill) - 1, "p_two_sided": t_two_sided_p(t_folds, len(fold_skill) - 1)},
        "economic_value": {"model": economic_value(scored["model"]),
                           "calibrated_model": economic_value(scored["calibrated"]),
                           "trailing_rate": economic_value(scored["trailing_rate"])},
        "precision_at_k_mean": {f"k={k}": round(statistics.fmean(y[f"precision_at_{k}"] for r in results for y in r["per_year"]
                                                                if f"precision_at_{k}" in y), 4) for k in PRECISION_K},
        "per_year": per_year,
        "folds": [{k: r[k] for k in ("evaluation", "test_rows", "brier")} for r in results],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--claims", type=Path, default=Path("data/raw/claims/nv_az_lode_since_1997.csv"))
    parser.add_argument("--mrds", type=Path, default=Path("data/raw/claims/mrds_gold_nv_az_box.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/generated/claims_forecast"))
    parser.add_argument("--forecast-year", type=int, default=2025,
                        help="year to forecast for every eligible section, from data available at its cutoff")
    parser.add_argument("--lag-days", type=int, default=LAG_DAYS)
    parser.add_argument("--gold-radius-km", type=float, default=5.0)
    parser.add_argument("--no-gold", action="store_true", help="drop the two MRDS gold features (ablation)")
    parser.add_argument("--quick", action="store_true", help="township folds only; for the trials log")
    parser.add_argument("--tag", default="", help="suffix for the report file, e.g. lag60")
    args = parser.parse_args()
    settings = {"lag_days": args.lag_days, "gold_radius_km": args.gold_radius_km, "use_gold": not args.no_gold}
    validation = {}
    cells = load_claims(args.claims, validation)
    gold = GoldIndex(args.mrds)
    rows = build_rows(cells, gold, range(FIRST_LABEL_YEAR, TEST_YEARS[-1] + 1), **settings)
    print(f"{len(cells):,} sections, {len(rows):,} cell-years", flush=True)
    report = {"rules": __doc__.split("Usage:")[0].strip(), "settings": settings,
              "features": FEATURES if settings["use_gold"] else BASE_FEATURES, "validation": validation,
              "sections": len(cells), "cell_years": len(rows), "results": []}
    spatial = [evaluate(rows, lambda r, y, k=k: fold(r["township"]) != k,
                        lambda r, y, k=k: fold(r["township"]) == k, f"township fold {k}") for k in range(FOLDS)]
    report["results"].append(pool_folds(spatial))
    if not args.quick:
        report["results"].append(evaluate(rows, lambda r, y: True, lambda r, y: True,
                                          "time-forward, all cells (in-sample cells)"))
        report["results"].append(evaluate(rows, lambda r, y: r["state"] == "NV", lambda r, y: r["state"] == "AZ",
                                          "transfer: train Nevada, test Arizona"))
        report["results"].append(evaluate(rows, lambda r, y: r["state"] == "AZ", lambda r, y: r["state"] == "NV",
                                          "transfer: train Arizona, test Nevada"))
        report["final_model"] = final_model(rows, settings["use_gold"])
    report["year_base_rate_note"] = ("year_base_rate uses the test year's own outcome rate: a hindsight oracle. "
                                     "Beating it shows ranking skill across cells within a year.")
    for r in report["results"]:
        r.pop("_scored", None)
    args.output.mkdir(parents=True, exist_ok=True)
    if not args.quick:
        report["forecast_calibration_shift"] = write_forecast(cells, gold, rows, args.forecast_year, args.output, settings)
    name = f"report_{args.tag}.json" if args.tag else "report.json"
    (args.output / name).write_text(json.dumps(report, indent=2) + "\n")
    for r in report["results"]:
        print(f"{r['evaluation']}: rows={r['test_rows']:,} skill vs climatology raw={r['skill_vs_climatology']} "
              f"calibrated={r['calibrated_skill_vs_climatology']} vs trailing={r['calibrated_skill_vs_trailing_rate']} "
              f"vs oracle={r['skill_vs_year_base_rate_oracle']}", flush=True)


if __name__ == "__main__":
    main()
