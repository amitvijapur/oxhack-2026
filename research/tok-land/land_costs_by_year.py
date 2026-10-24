#!/usr/bin/env python3
"""Alaska state land sale prices by year, from DNR's Sold Parcel Search.

Downloads every sold parcel listed by the Alaska DNR land sales "Sold Parcel Search".
The search needs an auction number, so it runs once per auction (all regions) and once per
auction and region (to tag each parcel's region). It then writes alaska_land_sales_by_year.csv: parcels, acres, total
price and the median price per acre, statewide and for each region. These are surface
parcels (residential and recreational), not mineral land.

Standard library only. Raw downloads go to data/raw/tok-land/land-sales/ (ignored by Git).
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import csv
from datetime import datetime
import html
import http.cookiejar
import json
from pathlib import Path
import re
import statistics
import time
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
SEARCH_PAGE = "https://dnr.alaska.gov/mlw/landsales/history/sold-parcel-search/"
RESULTS_URL = SEARCH_PAGE + "results"
# Region closest to Tok (the Alaska Highway runs through Tok).
TOK_REGION = "Richardson, Alaska Highways"
# DNR press-release totals used as a check: auction -> parcels sold.
PRESS_RELEASE_PARCELS = {495: 136, 496: 121, 497: 99}


def opener():
    """An HTTP opener that keeps the session cookie the search page sets."""
    jar = http.cookiejar.CookieJar()
    o = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    o.addheaders = [("User-Agent", "Mozilla/5.0 (oxhack-2026 research script)")]
    return o


def page_options(o, name):
    """Value list of one drop-down on the search page, e.g. regions or auction numbers."""
    page = o.open(SEARCH_PAGE, timeout=120).read().decode("utf-8")
    options = json.loads(html.unescape(re.search(rf'data-{name}-options="([^"]*)"', page).group(1)))
    return {opt["Text"]: opt["Value"] for opt in options}


def search(o, auction, region_id=""):
    """Sold parcels for one auction, optionally one region (the request the page's JavaScript sends)."""
    payload = {"guid": str(uuid.uuid4()), "timeStampMilliseconds": int(time.time() * 1000), "auctionNo": auction,
               "program": "", "roadAccess": "", "region": region_id, "subdivision": "", "parcelNo": None,
               "adl": None, "mtrs": None, "minimumAcres": None, "maximumAcres": None, "dateSoldStartDate": None,
               "dateSoldEndDate": None, "orderBy": "AuctionNumber", "sortOrder": "Ascending"}
    req = urllib.request.Request(RESULTS_URL, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json;charset=UTF-8"})
    for attempt in range(4):
        try:
            data = json.loads(o.open(req, timeout=120).read())
            if data.get("isCanceled"):
                raise RuntimeError("search was cancelled")
            return data["rows"]
        except (OSError, ValueError, RuntimeError):
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"could not download auction {auction} region {region_id!r}")


def download(raw):
    """Fetch every auction, tag rows by region, cache; returns {region name: rows}."""
    folder = raw / "land-sales"
    folder.mkdir(parents=True, exist_ok=True)
    cache = folder / "sold_parcels_by_region.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))["regions"]
    o = opener()
    region_ids = page_options(o, "region")
    by_region = defaultdict(list)
    for auction in page_options(o, "auction-number").values():
        all_rows = search(o, auction)
        tagged = set()
        for name, region_id in region_ids.items():
            for r in search(o, auction, region_id):
                by_region[name].append(r)
                tagged.add((r["auctionNo"], r["parcelNo"]))
            time.sleep(0.3)  # be gentle with the state server
        by_region["Region not tagged"] += [r for r in all_rows if (r["auctionNo"], r["parcelNo"]) not in tagged]
    cache.write_text(json.dumps({"retrieved": datetime.now().date().isoformat(), "source": RESULTS_URL,
                                 "regions": by_region}), encoding="utf-8")
    return by_region


def money(text):
    return float(text.replace("$", "").replace(",", "")) if text else None


def parcels(by_region):
    """Clean, de-duplicated sold parcels with a price, acreage and sale date."""
    seen, out = set(), []
    for region, rows in by_region.items():
        for r in rows:
            key = (r["auctionNo"], r["parcelNo"])
            price, acres = money(r.get("purchasePrice")), float(r["acres"]) if r.get("acres") else None
            if r.get("isWithdrawn") or key in seen or not price or not acres or not r.get("dateSold"):
                continue
            seen.add(key)
            sold = datetime.strptime(r["dateSold"], "%m/%d/%Y").date()
            out.append({"region": region, "auction": r["auctionNo"], "parcel": r["parcelNo"],
                        "subdivision": r.get("subdivisionName"), "acres": acres, "price": price,
                        "year": sold.year, "sold": sold.isoformat(), "usd_per_acre": price / acres})
    return out


def summarise(rows):
    per_acre = sorted(r["usd_per_acre"] for r in rows)
    quart = statistics.quantiles(per_acre, n=4) if len(per_acre) >= 2 else [per_acre[0]] * 3
    return {"parcels": len(rows), "total_acres": round(sum(r["acres"] for r in rows), 2),
            "total_price_usd": round(sum(r["price"] for r in rows), 2),
            "median_usd_per_acre": round(statistics.median(per_acre), 2),
            "p25_usd_per_acre": round(quart[0], 2), "p75_usd_per_acre": round(quart[2], 2)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=ROOT / "data" / "raw" / "tok-land")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args(argv)

    rows = parcels(download(args.raw))
    groups = defaultdict(list)
    for r in rows:
        groups[(r["year"], "Statewide")].append(r)
        groups[(r["year"], r["region"])].append(r)
    fields = ["year", "scope", "parcels", "total_acres", "total_price_usd", "median_usd_per_acre",
              "p25_usd_per_acre", "p75_usd_per_acre"]
    with open(args.out / "alaska_land_sales_by_year.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fields)
        w.writeheader()
        for (year, scope) in sorted(groups, key=lambda k: (k[0], k[1] != "Statewide", k[1])):
            w.writerow({"year": year, "scope": scope, **summarise(groups[(year, scope)])})

    # Parcels left over at an auction are sold later over the counter under the same auction
    # number, so compare the press release with the parcels sold on the auction day itself.
    by_auction = defaultdict(lambda: defaultdict(int))
    for r in rows:
        by_auction[r["auction"]][r["sold"]] += 1
    for auction, expected in PRESS_RELEASE_PARCELS.items():
        days = by_auction[auction]
        day, on_day = max(days.items(), key=lambda kv: kv[1])
        print(f"auction {auction}: {on_day} sold on auction day {day} (+{sum(days.values()) - on_day} later), "
              f"press release says {expected}")
    years = sorted({r["year"] for r in rows})
    print(f"{len(rows)} sold parcels, {years[0]}-{years[-1]}; {TOK_REGION}: "
          f"{sum(r['region'] == TOK_REGION for r in rows)} parcels")


if __name__ == "__main__":
    main()
