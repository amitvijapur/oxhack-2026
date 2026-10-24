"""
Download mining-claim records for Nevada and Arizona from public ArcGIS FeatureServers.

Why not the BLM national "Closed" layer from the brief?
  - It only holds claims closed in the PAST YEAR, and it has no location/closed dates.
  - So we use the Nevada Division of Minerals (NDOM) copy of the BLM MLRS records,
    which DOES carry Location_Date and Closed_Date (snapshot from March 2025),
    plus the current NV and AZ claim layers (updated Oct 2026) to cover 2025-26.

Output: one Parquet file per layer in the repo-root data/raw/ (git-ignored), with lon/lat columns.

Usage:  python research/nv-az-claims/download_claims.py            (downloads all layers)
        python research/nv-az-claims/download_claims.py historic   (just one)
Needs: pandas, requests, pyarrow. The historic layer is ~2.4M rows and needs several GB of RAM.
"""
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pandas as pd
import requests

RAW = Path(__file__).resolve().parents[2] / "data" / "raw"  # repo root, ignored by .gitignore

# name -> (FeatureServer layer URL, SQL filter)
LAYERS = {
    # NDOM: all western-US BLM claims, active + closed, with dates. Snapshot 2025-03-19.
    "historic": (
        "https://services.arcgis.com/CXYUMoYknZtf5Qr3/arcgis/rest/services/"
        "AllStatesHistoricClaimsFeeCalculationNoDuplicatesFeesAGOL03212022/FeatureServer/29",
        "AdminState IN ('NV','AZ')",
    ),
    # NDOM: Nevada claims that are currently active/pending/filed (kept up to date).
    "nv_current": (
        "https://services.arcgis.com/CXYUMoYknZtf5Qr3/arcgis/rest/services/"
        "ArcOnlineNvStateClaims/FeatureServer/1",
        "1=1",
    ),
    # BLM Arizona: currently active claims (kept up to date).
    "az_current": (
        "https://services5.arcgis.com/aEZWbbQHTw7fmHLY/arcgis/rest/services/"
        "ArizonaMiningClaims/FeatureServer/19",
        "1=1",
    ),
}

def page_size(url):
    """Rows per request: the AZ server caps at 1000, the NDOM server allows 2000."""
    return 1000 if "services5" in url else 2000


def get_json(url, params, tries=5):
    """POST a query to ArcGIS, retrying on network hiccups."""
    for attempt in range(tries):
        try:
            r = requests.post(url, data=params, timeout=120)
            r.raise_for_status()
            d = r.json()
            if "error" in d:
                raise RuntimeError(d["error"])
            return d
        except Exception as e:
            if attempt == tries - 1:
                raise
            time.sleep(2 ** attempt)
            print(f"  retry after: {e}")


def fetch_page(url, where, offset):
    """Fetch one page of rows as a list of dicts, adding lon/lat from the point geometry."""
    d = get_json(url + "/query", {
        "where": where, "outFields": "*", "outSR": 4326, "f": "json",
        "orderByFields": "OBJECTID" if "services5" not in url else "OBJECTID_1",
        "resultOffset": offset, "resultRecordCount": page_size(url),
    })
    rows = []
    for feat in d["features"]:
        row = feat["attributes"]
        geom = feat.get("geometry") or {}
        row["lon"], row["lat"] = geom.get("x"), geom.get("y")
        rows.append(row)
    return rows


def download(name):
    url, where = LAYERS[name]
    total = get_json(url + "/query", {"where": where, "returnCountOnly": "true", "f": "json"})["count"]
    print(f"{name}: {total:,} rows to fetch")
    offsets = range(0, total, page_size(url))
    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        for i, page in enumerate(pool.map(lambda o: fetch_page(url, where, o), offsets)):
            rows.extend(page)
            if i % 200 == 0:
                print(f"  {len(rows):,} / {total:,}")
    df = pd.DataFrame(rows)
    # ArcGIS dates come as milliseconds since 1970 -> real datetimes
    for col in df.columns:
        if col in ("Location_Date", "Closed_Date", "LocDate"):
            df[col] = pd.to_datetime(df[col], unit="ms", errors="coerce")
    RAW.mkdir(parents=True, exist_ok=True)
    out = RAW / f"claims_{name}.parquet"
    df.to_parquet(out, index=False)
    print(f"  saved {len(df):,} rows -> {out}  (expected {total:,})")


if __name__ == "__main__":
    for n in (sys.argv[1:] or LAYERS):
        download(n)
