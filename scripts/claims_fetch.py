#!/usr/bin/env python3
"""Download the data the claim-activity forecast needs. Standard library only.

Datasets (output ignored by Git, under data/raw/claims/, each with a manifest and SHA-256):
- nvaz: Nevada and Arizona lode claims located since 1997, from the Nevada Division of Minerals
  copy of BLM MLRS (snapshot 19 March 2025; found by Arjin, research/nv-az-data-sources.md on
  arjin/nv-az-claim-data). Only the fields the forecast uses.
- mrds: USGS MRDS sites listing gold (code AU) inside a Nevada/Arizona bounding box.
- tok: Alaska DNR state mining claims (active and closed) around the Tok sites, with owner,
  start date (NTPSTDT, meaning unconfirmed) and polygon centre. Same box as Arjin's tok_land_claims.py.

Usage: python3 scripts/claims_fetch.py nvaz|mrds|tok [--output DIR]
"""
from __future__ import annotations

import argparse
import csv
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request

NVAZ = ("https://services.arcgis.com/CXYUMoYknZtf5Qr3/arcgis/rest/services/"
        "AllStatesHistoricClaimsFeeCalculationNoDuplicatesFeesAGOL03212022/FeatureServer/29")
MRDS = "https://energy.usgs.gov/arcgis/rest/services/Hosted/Mineral_Resource_Data_System/FeatureServer/0"
TOK = "https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer"
NVAZ_BOX = "-120.1,31.3,-109.0,42.0"
TOK_BOX = "-144.05,63.0,-143.05,63.28"

DATASETS = {
    "nvaz": dict(url=NVAZ, page=2000, order="OBJECTID", id_ranges=True, id_span=10000,
                 where="AdminState IN ('NV','AZ') AND Claim_Type LIKE '%LODE%' AND Location_Date >= DATE '1997-01-01'",
                 fields=("OBJECTID", "Serial_Number", "AdminState", "Claim_Type", "Case_Disposition", "MTRS",
                         "Claimant", "Location_Date", "Closed_Date"),
                 dates=("Location_Date", "Closed_Date"), file="nv_az_lode_since_1997.csv",
                 note="NDOM copy of BLM MLRS, snapshot 2025-03-19; status fields are as of the snapshot"),
    "mrds": dict(url=MRDS, page=2000, order="objectid_1", where="code_list LIKE '%AU%'", box=NVAZ_BOX,
                 fields=("objectid_1", "dep_id", "site_name", "dev_stat", "code_list"), dates=(),
                 file="mrds_gold_nv_az_box.csv", note="USGS MRDS; systematic updates ceased 2011"),
}


def post(url, params, tries=10):
    body = urllib.parse.urlencode(params).encode()
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, data=body, headers={"User-Agent": "oxhack-2026-claims-fetch/1.0"})
            with urllib.request.urlopen(request, timeout=180) as response:
                payload = json.load(response)
            if "error" in payload:
                raise RuntimeError(payload["error"])
            return payload
        except Exception as error:  # network hiccups and server throttling
            if attempt == tries - 1:
                raise
            time.sleep(min(60, 2 ** attempt))
            print(f"  retry {attempt + 1}: {error}", flush=True)


def iso_date(ms):
    """ArcGIS dates are milliseconds since 1970 UTC; keep the calendar date only."""
    return "" if ms is None else datetime.fromtimestamp(ms / 1000, tz=timezone.utc).date().isoformat()


def centre(geometry):
    """Point coordinates, or the mean vertex of a polygon's rings (good enough for small claims)."""
    if not geometry:
        return None, None
    if "x" in geometry:
        return geometry["x"], geometry["y"]
    points = [p for ring in geometry.get("rings", []) for p in ring]
    if not points:
        return None, None
    return sum(p[0] for p in points) / len(points), sum(p[1] for p in points) / len(points)


def query_params(spec):
    params = dict(where=spec["where"], outSR=4326, f="json")
    if "box" in spec:
        params.update(geometry=spec["box"], geometryType="esriGeometryEnvelope", inSR=4326,
                      spatialRel="esriSpatialRelIntersects")
    return params


def fetch_layer(spec):
    total = post(spec["url"] + "/query", dict(query_params(spec), returnCountOnly="true"))["count"]
    print(f"{total:,} rows to fetch", flush=True)

    if spec.get("id_ranges"):
        # Deep offset paging is very slow on this server; ID ranges of one page each use its index.
        stats = post(spec["url"] + "/query", dict(query_params(spec), f="json", outStatistics=json.dumps([
            {"statisticType": "min", "onStatisticField": spec["order"], "outStatisticFieldName": "lo"},
            {"statisticType": "max", "onStatisticField": spec["order"], "outStatisticFieldName": "hi"}])))
        bounds = stats["features"][0]["attributes"]
        starts = range(bounds["lo"], bounds["hi"] + 1, spec["id_span"])
    else:
        starts = range(0, total, spec["page"])

    def page(start, size=None):
        if spec.get("id_ranges"):
            size = size or spec["id_span"]
            where = f"({spec['where']}) AND {spec['order']} BETWEEN {start} AND {start + size - 1}"
            params = dict(query_params(spec), where=where, outFields=",".join(spec["fields"]))
        else:
            params = dict(query_params(spec), outFields=",".join(spec["fields"]), orderByFields=spec["order"],
                          resultOffset=start, resultRecordCount=spec["page"])
        payload = post(spec["url"] + "/query", params)
        if spec.get("id_ranges") and payload.get("exceededTransferLimit"):
            half = size // 2  # a dense range: split it until each part fits in one response
            return page(start, half) + page(start + half, size - half)
        rows = []
        for feature in payload["features"]:
            row = {k: feature["attributes"].get(k) for k in spec["fields"]}
            for field in spec["dates"]:
                row[field] = iso_date(row[field])
            row["lon"], row["lat"] = centre(feature.get("geometry"))
            rows.append(row)
        return rows

    def cached_page(start):
        """Each range is saved as it arrives, so an interrupted download resumes where it stopped."""
        if cache is None:
            return page(start)
        path = cache / f"{start}_{spec.get('id_span', spec['page'])}.json"
        if path.exists():
            return json.loads(path.read_text())
        rows = page(start)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(rows))
        tmp.replace(path)
        return rows

    cache = spec.get("cache")
    if cache is not None:
        cache.mkdir(parents=True, exist_ok=True)
    rows = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for index, chunk in enumerate(pool.map(cached_page, starts)):
            rows.extend(chunk)
            if index % 250 == 0:
                print(f"  {len(rows):,} / {total:,}", flush=True)
    key = spec["order"]
    if len(rows) != total or len({row[key] for row in rows}) != total:
        raise SystemExit(f"FAIL: fetched {len(rows):,} rows, expected {total:,} unique")
    return sorted(rows, key=lambda row: row[key]), list(spec["fields"]) + ["lon", "lat"]


def fetch_tok():
    """State claims touching the Tok box: list IDs first, then 100 at a time (offset paging is unreliable)."""
    rows = []
    for status, layer in (("active", 0), ("closed", 2)):
        url = f"{TOK}/{layer}/query"
        ids = sorted(post(url, dict(where="1=1", geometry=TOK_BOX, geometryType="esriGeometryEnvelope", inSR=4326,
                                    spatialRel="esriSpatialRelIntersects", returnIdsOnly="true",
                                    f="json"))["objectIds"] or [])
        for start in range(0, len(ids), 100):
            chunk = ",".join(map(str, ids[start:start + 100]))
            for feature in post(url, dict(objectIds=chunk, outFields="OBJECTID,CASE_ID,CSTMRNM,NTPSTDT,TOT_ACRES",
                                          outSR=4326, f="json"))["features"]:
                a = feature["attributes"]
                lon, lat = centre(feature.get("geometry"))
                rows.append({"status": status, "OBJECTID": a["OBJECTID"], "CASE_ID": a["CASE_ID"],
                             "owner": (a["CSTMRNM"] or "").strip(), "NTPSTDT": iso_date(a["NTPSTDT"]),
                             "TOT_ACRES": a["TOT_ACRES"], "lon": lon, "lat": lat})
        print(f"{status}: {len(ids):,} claims", flush=True)
    fields = ["status", "OBJECTID", "CASE_ID", "owner", "NTPSTDT", "TOT_ACRES", "lon", "lat"]
    manifest = dict(source=TOK, box=TOK_BOX, note="Alaska DNR state claims; NTPSTDT meaning unconfirmed (see "
                    "research/tok-land/README.md on arjin/tok-land-data)")
    return rows, fields, "tok_state_claims.csv", manifest


def write(output, rows, fields, filename, manifest):
    output.mkdir(parents=True, exist_ok=True)
    path = output / filename
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    manifest.update(rows=len(rows), fields=fields, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                    retrieved_utc=datetime.now(timezone.utc).isoformat(timespec="seconds"))
    path.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"saved {len(rows):,} rows -> {path}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("dataset", choices=("nvaz", "mrds", "tok"))
    parser.add_argument("--output", type=Path, default=Path("data/raw/claims"))
    args = parser.parse_args()
    if args.dataset == "tok":
        write(args.output, *fetch_tok())
        return
    spec = dict(DATASETS[args.dataset], cache=args.output / f"{args.dataset}_pages")
    rows, fields = fetch_layer(spec)
    write(args.output, rows, fields, spec["file"],
          dict(source=spec["url"], where=spec["where"], box=spec.get("box"), note=spec["note"]))


if __name__ == "__main__":
    main()
