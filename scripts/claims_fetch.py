#!/usr/bin/env python3
"""Download the data the claim-activity forecast needs. Standard library only.

Datasets (output ignored by Git, under data/raw/claims/, each with a manifest and SHA-256):
- nvaz: Nevada and Arizona lode claims located since 1997, from the Nevada Division of Minerals
  copy of BLM MLRS (snapshot 19 March 2025; found by Arjin, research/nv-az-data-sources.md on
  arjin/nv-az-claim-data). Only the fields the forecast uses.
- mrds: USGS MRDS sites listing gold (code AU) inside a Nevada/Arizona bounding box.
- tok: Alaska DNR state mining claims (active and closed) around the Tok sites, with owner,
  start date (NTPSTDT, meaning unconfirmed) and polygon centre. Same box as Arjin's tok_land_claims.py.

Usage: python3 scripts/claims_fetch.py nvaz-hub|nvaz|mrds|tok [--output DIR]
(nvaz-hub is the fast route: one filtered CSV export; nvaz pages the query API and is slow.)
"""
from __future__ import annotations

import argparse
import csv
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
import math
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


def utm_to_lonlat(easting, northing, zone=11):
    """Inverse transverse Mercator (Snyder 1987, GRS80/NAD83), northern hemisphere. Standard library only."""
    a, f, k0 = 6378137.0, 1 / 298.257222101, 0.9996
    e2 = f * (2 - f)
    ep2 = e2 / (1 - e2)
    x, y = easting - 500000.0, northing
    m = y / k0
    mu = m / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    phi1 = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
            + (151 * e1 ** 3 / 96) * math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    c1, t1 = ep2 * math.cos(phi1) ** 2, math.tan(phi1) ** 2
    n1 = a / math.sqrt(1 - e2 * math.sin(phi1) ** 2)
    r1 = a * (1 - e2) / (1 - e2 * math.sin(phi1) ** 2) ** 1.5
    d = x / (n1 * k0)
    lat = phi1 - (n1 * math.tan(phi1) / r1) * (d ** 2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4 / 24
                                               + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) * d ** 6 / 720)
    lon = (d - (1 + 2 * t1 + c1) * d ** 3 / 6 + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) * d ** 5 / 120) / math.cos(phi1)
    return math.degrees(lon) + (zone * 6 - 183), math.degrees(lat)


def hub_date(text):
    """Hub CSV dates look like '6/21/1998 8:00:00 AM' (UTC); keep the calendar date."""
    if not text:
        return ""
    month, day, year = text.split()[0].split("/")
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"


def fetch_nvaz_hub(output):
    """Ask ArcGIS Hub for one filtered CSV export of the claims layer, download it and normalise it.

    Much faster than paging through the query API, which throttles and resets connections."""
    spec = DATASETS["nvaz"]
    item = post(spec["url"].rsplit("/", 1)[0], dict(f="json"))["serviceItemId"]
    url = (f"https://hub.arcgis.com/api/download/v1/items/{item}/csv?" +
           urllib.parse.urlencode(dict(redirect="false", layers=spec["url"].rsplit("/", 1)[1], where=spec["where"])))
    for _ in range(240):
        request = urllib.request.Request(url, headers={"User-Agent": "oxhack-2026-claims-fetch/1.0"})
        with urllib.request.urlopen(request, timeout=120) as response:
            status = json.load(response)
        print(f"  export {status.get('status')} {status.get('progressInPercent', '')}", flush=True)
        if status.get("resultUrl"):
            break
        time.sleep(30)
    else:
        raise SystemExit("FAIL: Hub export did not finish")
    output.mkdir(parents=True, exist_ok=True)
    raw = output / "nv_az_lode_since_1997.hub.csv"
    request = urllib.request.Request(status["resultUrl"], headers={"User-Agent": "oxhack-2026-claims-fetch/1.0"})
    with urllib.request.urlopen(request, timeout=1800) as response, raw.open("wb") as handle:
        while chunk := response.read(1 << 20):
            handle.write(chunk)
    return convert_hub_export(raw, spec)


def convert_hub_export(raw, spec):
    """Rename Hub CSV columns to the query API names, convert dates and UTM 11N coordinates."""
    names = {"OBJECTID_1": "OBJECTID", "Serial Number": "Serial_Number", "Claim Type": "Claim_Type",
             "Case Disposition": "Case_Disposition"}
    rows = []
    with raw.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            out = {names.get(k, k): v for k, v in row.items()}
            record = {field: out.get(field, "") for field in spec["fields"]}
            record["Location_Date"] = hub_date(record["Location_Date"])
            record["Closed_Date"] = hub_date(record["Closed_Date"])
            if row.get("x") and row.get("y"):
                record["lon"], record["lat"] = utm_to_lonlat(float(row["x"]), float(row["y"]))
            else:
                record["lon"] = record["lat"] = None
            rows.append(record)
    rows.sort(key=lambda r: int(r["OBJECTID"]))
    manifest = dict(source=spec["url"], where=spec["where"], note=spec["note"] + "; via ArcGIS Hub CSV export",
                    raw_export=raw.name, raw_sha256=hashlib.sha256(raw.read_bytes()).hexdigest())
    return rows, list(spec["fields"]) + ["lon", "lat"], spec["file"], manifest


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
    parser.add_argument("dataset", choices=("nvaz", "nvaz-hub", "mrds", "tok"))
    parser.add_argument("--output", type=Path, default=Path("data/raw/claims"))
    args = parser.parse_args()
    if args.dataset == "tok":
        write(args.output, *fetch_tok())
        return
    if args.dataset == "nvaz-hub":
        write(args.output, *fetch_nvaz_hub(args.output))
        return
    spec = dict(DATASETS[args.dataset], cache=args.output / f"{args.dataset}_pages")
    rows, fields = fetch_layer(spec)
    write(args.output, rows, fields, spec["file"],
          dict(source=spec["url"], where=spec["where"], box=spec.get("box"), note=spec["note"]))


if __name__ == "__main__":
    main()
