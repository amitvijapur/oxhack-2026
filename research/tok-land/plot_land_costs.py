#!/usr/bin/env python3
"""Chart: how gold, Alaska land prices and claim rent changed by year (needs matplotlib).

Reads the three CSVs in this folder and writes img/alaska-gold-price-vs-land-price-vs-claim-rent-2000-2025.png. Top panel: each
series indexed to 2000 = 100 on one log axis, so different units share a scale. Bottom panel:
Alaska state claims opened per year. 2026 is left out because it is a partial year.
"""
from __future__ import annotations

import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator  # noqa: E402

HERE = Path(__file__).resolve().parent
YEARS = list(range(2000, 2026))
BASE = 2000
# Reference palette, categorical slots 1-3 in fixed order; ink and surface tokens.
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
SURFACE, INK, INK_2, MUTED, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#898781", "#e6e5e1"


def read(name, key):
    with open(HERE / name, encoding="utf-8") as fh:
        return {int(r[key]): r for r in csv.DictReader(fh)}


def main():
    gold_claims = read("alaska_claims_vs_gold.csv", "year")
    rent = read("alaska_holding_costs_by_year.csv", "mining_year_starting_sep_1")
    sales = {int(r["year"]): r for r in csv.DictReader(open(HERE / "alaska_land_sales_by_year.csv", encoding="utf-8"))
             if r["scope"] == "Statewide"}

    # (name, colour, values, steps): rent changes on fixed dates, so it is drawn as a step line.
    series = [
        ("Gold price", BLUE, {y: float(gold_claims[y]["gold_usd_per_oz_mean"]) for y in YEARS}, False),
        ("State land sold, median $/acre", ORANGE, {y: float(sales[y]["median_usd_per_acre"]) for y in YEARS}, False),
        ("Rent, new 160-acre state claim", AQUA, {y: float(rent[y]["ak_rent_160ac_age_0_5"]) for y in YEARS}, True),
    ]

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "text.color": INK,
                         "axes.labelcolor": INK_2, "xtick.color": MUTED, "ytick.color": MUTED})
    fig, (top, bottom) = plt.subplots(2, 1, figsize=(9, 7.2), height_ratios=[2.2, 1], sharex=True,
                                      facecolor=SURFACE)
    for ax in (top, bottom):
        ax.set_facecolor(SURFACE)
        for side in ("top", "right", "left"):
            ax.spines[side].set_visible(False)
        ax.spines["bottom"].set_color(MUTED)
        ax.grid(axis="y", color=GRID, linewidth=0.8)
        ax.set_axisbelow(True)
        ax.tick_params(length=0)

    for name, color, values, steps in series:
        index = [values[y] / values[BASE] * 100 for y in YEARS]
        top.plot(YEARS, index, color=color, linewidth=2, label=name, solid_capstyle="round",
                 drawstyle="steps-post" if steps else "default")
        top.plot(YEARS[-1], index[-1], "o", color=color, markersize=8, markeredgecolor=SURFACE, markeredgewidth=2)
        top.annotate(f"{name}\n{index[-1]:,.0f}", (YEARS[-1], index[-1]), xytext=(10, 0),
                     textcoords="offset points", va="center", fontsize=9, color=INK_2)
    top.set_yscale("log")
    top.yaxis.set_major_locator(FixedLocator([50, 100, 200, 500, 1000, 2000]))
    top.yaxis.set_minor_locator(NullLocator())
    top.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}"))
    top.set_ylim(50, 2400)
    top.axhline(100, color=MUTED, linewidth=1)
    top.set_ylabel("Index, 2000 = 100 (log scale)")
    top.set_title("Alaska: gold, land prices and claim rent, 2000–2025", loc="left", fontsize=13,
                  fontweight="bold", pad=40)
    top.text(0, 1.02, "Each line is its own value divided by its 2000 value. State land sales are surface "
             "parcels (not mineral land);\nthe 2023–25 rise partly reflects smaller lots being offered.",
             transform=top.transAxes, fontsize=8.5, color=INK_2, va="bottom")
    top.legend(loc="upper left", frameon=False, fontsize=9, labelcolor=INK_2)

    counts = [int(gold_claims[y]["claims_total"]) for y in YEARS]
    bottom.bar(YEARS, counts, width=0.7, color=BLUE, alpha=0.55)
    bottom.set_ylabel("Claims opened")
    bottom.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}"))
    peak = YEARS[counts.index(max(counts))]
    bottom.annotate(f"{max(counts):,} in {peak}", (peak, max(counts)), xytext=(0, 4), textcoords="offset points",
                    ha="center", fontsize=8.5, color=INK_2)
    bottom.set_xticks(range(2000, 2026, 5))
    bottom.set_xlim(1999.3, 2025.7)

    fig.text(0.01, 0.008, "Sources: World Bank Pink Sheet (gold); Alaska DNR Sold Parcel Search (7,253 sales); "
             "AS 38.05.211 and DNR rent fact sheet;\nAlaska DNR state mining claims, counted by NTPSTDT year "
             "(field meaning unconfirmed). 2026 left out as a partial year.", fontsize=7.5, color=MUTED)
    fig.tight_layout(rect=(0, 0.035, 0.86, 1))
    out = HERE / "img"
    out.mkdir(exist_ok=True)
    fig.savefig(out / "alaska-gold-price-vs-land-price-vs-claim-rent-2000-2025.png", dpi=160, facecolor=SURFACE)
    print("wrote", out / "alaska-gold-price-vs-land-price-vs-claim-rent-2000-2025.png")


if __name__ == "__main__":
    main()
