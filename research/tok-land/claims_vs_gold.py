#!/usr/bin/env python3
"""Compare Alaska state mining claims opened per year with the yearly gold price.

Counts every Alaska DNR state mining claim (active and closed) by the year of its
NTPSTDT date, reads the World Bank Pink Sheet monthly gold price, and writes
alaska_claims_vs_gold.csv plus the correlations printed at the end.

Standard library only. Raw downloads go to data/raw/tok-land/ (ignored by Git).
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
CLAIMS_URL = "https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer"
CLAIM_LAYERS = {"active": 0, "closed": 2}
PINK_SHEET_URL = ("https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/"
                  "related/CMO-Historical-Data-Monthly.xlsx")
FIRST_YEAR, LAST_YEAR = 1970, 2026
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def count_claims(layer, year):
    """Number of claims in one layer whose NTPSTDT falls in the given year (retries politely)."""
    where = f"NTPSTDT >= DATE '{year}-01-01' AND NTPSTDT < DATE '{year + 1}-01-01'"
    url = f"{CLAIMS_URL}/{layer}/query?" + urllib.parse.urlencode(dict(where=where, returnCountOnly="true", f="json"))
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.load(r)["count"]
        except (OSError, KeyError):
            time.sleep(3 * (attempt + 1))  # the service drops bursts of requests
    raise RuntimeError(f"could not count layer {layer} year {year}")


def column_index(ref):
    """Turn an Excel cell reference like 'BR7' into a 0-based column number."""
    letters = re.match(r"[A-Z]+", ref).group()
    return sum((ord(c) - 64) * 26 ** i for i, c in enumerate(reversed(letters))) - 1


def read_sheet(path, name):
    """Minimal .xlsx reader: returns {row_number: {col: value}} for one sheet."""
    z = zipfile.ZipFile(path)
    shared = [("".join(t.text or "" for t in si.iter(f"{{{NS['m']}}}t")))
              for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    book = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid = next(s.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
               for s in book.find("m:sheets", NS) if s.get("name") == name)
    target = next(r.get("Target") for r in rels if r.get("Id") == rid)
    sheet = ET.fromstring(z.read("xl/" + target.lstrip("/").removeprefix("xl/")))
    rows = {}
    for row in sheet.iter(f"{{{NS['m']}}}row"):
        cells = {}
        for c in row.findall("m:c", NS):
            v = c.find("m:v", NS)
            if v is None:
                continue
            cells[column_index(c.get("r"))] = shared[int(v.text)] if c.get("t") == "s" else v.text
        rows[int(row.get("r"))] = cells
    return rows


def yearly_gold(path):
    """Average gold price per calendar year in US$/troy oz, with the number of months used."""
    rows = read_sheet(path, "Monthly Prices")
    header_row = next(r for r, cells in rows.items() if "Gold" in cells.values())
    col = next(c for c, v in rows[header_row].items() if v == "Gold")
    unit = rows[header_row + 1].get(col)
    if unit != "($/troy oz)":
        raise RuntimeError(f"unexpected gold unit {unit!r}")
    months = {}
    for cells in rows.values():
        stamp, price = cells.get(0, ""), cells.get(col)
        if re.fullmatch(r"\d{4}M\d{2}", str(stamp)) and price not in (None, "", ".."):
            months.setdefault(int(stamp[:4]), []).append(float(price))
    return {y: (sum(p) / len(p), len(p)) for y, p in months.items()}


def correlation(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    n = len(pairs)
    mx, my = sum(x for x, _ in pairs) / n, sum(y for _, y in pairs) / n
    sxy = sum((x - mx) * (y - my) for x, y in pairs)
    sx = math.sqrt(sum((x - mx) ** 2 for x, _ in pairs))
    sy = math.sqrt(sum((y - my) ** 2 for _, y in pairs))
    return sxy / (sx * sy), n


def pct_change(series, year):
    prev, cur = series.get(year - 1), series.get(year)
    return None if not prev or cur is None else (cur / prev - 1) * 100


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=ROOT / "data" / "raw" / "tok-land")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args(argv)
    args.raw.mkdir(parents=True, exist_ok=True)

    pink = args.raw / "CMO-Historical-Data-Monthly.xlsx"
    if not pink.exists():
        urllib.request.urlretrieve(PINK_SHEET_URL, pink)
    gold = yearly_gold(pink)

    years = range(FIRST_YEAR, LAST_YEAR + 1)
    claims = {y: {s: count_claims(layer, y) for s, layer in CLAIM_LAYERS.items()} for y in years}
    total = {y: claims[y]["active"] + claims[y]["closed"] for y in years}
    price = {y: gold[y][0] for y in years if y in gold}

    with open(args.out / "alaska_claims_vs_gold.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["year", "claims_active", "claims_closed", "claims_total", "gold_usd_per_oz_mean", "gold_months",
                    "claims_change_pct", "gold_change_pct"])
        for y in years:
            g = gold.get(y, (None, 0))
            cc, gc = pct_change(total, y), pct_change(price, y)
            w.writerow([y, claims[y]["active"], claims[y]["closed"], total[y],
                        None if g[0] is None else round(g[0], 2), g[1],
                        None if cc is None else round(cc, 1), None if gc is None else round(gc, 1)])

    # Full years only: 1990-2025 (2026 is a partial year).
    span = range(1991, 2026)
    claim_chg = [pct_change(total, y) for y in span]
    for lag in (0, 1, 2):
        r, n = correlation(claim_chg, [pct_change(price, y - lag) for y in span])
        print(f"claims change vs gold change {lag} year(s) earlier: r = {r:.2f} (n = {n})")
    r, n = correlation([math.log(total[y]) for y in range(1990, 2026)], [math.log(price[y]) for y in range(1990, 2026)])
    print(f"log claims vs log gold price, 1990-2025: r = {r:.2f} (n = {n})")


if __name__ == "__main__":
    main()
