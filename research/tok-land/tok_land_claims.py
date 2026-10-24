#!/usr/bin/env python3
"""Match the Tok River gold sample points (Site A / Site B) to Alaska state mining claims.

Downloads active and closed state mining claims from Alaska DNR, checks the DGGS gold
source file against the hash in research/gold-site-selection.json, then writes:
  tok_sample_claim_matches.csv  one row per sample-claim pair (one-to-many), or one
                                 "outside_state_claims" row for a sample in no claim
  tok_land_summary.json          per-site counts, owners and claims by start year

Standard library only. Raw downloads go to data/raw/tok-land/ (ignored by Git).
Claims change daily, so a later run can give different counts than the committed ones.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import date, datetime, timedelta, timezone
import hashlib
import io
import json
import math
from pathlib import Path
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
CLAIMS_URL = "https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer"
CLAIM_LAYERS = {"active": 0, "closed": 2}  # layer 1 (pending) had no claims in the Tok box
SOURCE_ZIP_URL = "https://dggs.alaska.gov/webpubs/data/rdf2016_010_tok-stream-sediment-geochemistry.zip"
SOURCE_CSV = "tables/rdf2016-10-stream-sed-trace-element.csv"
# Search box around both sites (lon/lat, WGS84), slightly wider than the sample extents.
SEARCH_BOX = (-144.05, 63.0, -143.05, 63.28)
EARTH_RADIUS_M = 6371008.8
MATCH_FIELDS = ("sample", "site", "longitude", "latitude", "match_status", "claim_status", "case_id",
                "claim_name", "owner", "ntpstdt_date", "total_acres", "m_to_nearest_active_claim")


def fetch_json(url, params):
    with urllib.request.urlopen(f"{url}?{urllib.parse.urlencode(params)}", timeout=120) as r:
        return json.load(r)


def download_claims(raw):
    """Fetch every claim touching the search box: list the IDs first, then 100 at a time.

    Offset paging on this service returned short pages, so IDs are the reliable route.
    """
    for status, layer in CLAIM_LAYERS.items():
        path = raw / f"tok_state_claims_{status}.geojson"
        if path.exists():
            continue
        url = f"{CLAIMS_URL}/{layer}/query"
        ids = sorted(fetch_json(url, dict(where="1=1", geometry=",".join(map(str, SEARCH_BOX)),
                                          geometryType="esriGeometryEnvelope", inSR=4326,
                                          spatialRel="esriSpatialRelIntersects", returnIdsOnly="true",
                                          f="json"))["objectIds"] or [])
        features = []
        for i in range(0, len(ids), 100):
            chunk = ",".join(map(str, ids[i:i + 100]))
            features += fetch_json(url, dict(objectIds=chunk, outFields="*", outSR=4326, f="geojson"))["features"]
        if {f["properties"]["OBJECTID"] for f in features} != set(ids):
            raise RuntimeError(f"{status}: downloaded features do not match the ID list")
        path.write_text(json.dumps({"type": "FeatureCollection", "retrieved": date.today().isoformat(),
                                    "source": f"{CLAIMS_URL}/{layer}", "features": features}), encoding="utf-8")


def load_samples(raw, selection):
    """Return the 67 selected -200 mesh sample points, after checking the source hash."""
    zip_path = raw / "rdf2016_010_tok-stream-sediment-geochemistry.zip"
    if not zip_path.exists():
        urllib.request.urlretrieve(SOURCE_ZIP_URL, zip_path)
    data = zipfile.ZipFile(zip_path).read(SOURCE_CSV)
    if hashlib.sha256(data).hexdigest() != selection["source_sha256"]:
        raise RuntimeError("DGGS source CSV does not match the hash in gold-site-selection.json")
    site_of = {sid: area for area, a in selection["areas"].items() for sid in a["sample_ids"]}
    samples = {}
    for row in csv.DictReader(io.StringIO(data.decode("utf-8-sig"))):
        if row["SIZE_FRACTION"] == selection["size_fraction"] and row["SAMPLE"] in site_of:
            samples.setdefault(row["SAMPLE"], {"sample": row["SAMPLE"], "site": site_of[row["SAMPLE"]],
                                               "lon": float(row["LONGITUDE"]), "lat": float(row["LATITUDE"])})
    if len(samples) != len(site_of):
        raise RuntimeError(f"expected {len(site_of)} selected samples, found {len(samples)}")
    return list(samples.values())


def rings(geometry):
    """All rings (outer and holes) of a Polygon or MultiPolygon, as lists of (lon, lat)."""
    polys = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return [[tuple(pt[:2]) for pt in ring] for poly in polys for ring in poly]


def inside(lon, lat, geometry):
    """Even-odd ray casting over every ring, so holes and multipolygons are handled."""
    hit = False
    for ring in rings(geometry):
        for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
            if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
                hit = not hit
    return hit


def to_metres(lon, lat, lat0):
    """Local equirectangular projection; under 1% error across this ~50 km area."""
    return (EARTH_RADIUS_M * math.radians(lon) * math.cos(math.radians(lat0)), EARTH_RADIUS_M * math.radians(lat))


def distance_m(lon, lat, geometry):
    """Metres from a point to a claim: 0 inside, otherwise to the nearest edge."""
    if inside(lon, lat, geometry):
        return 0.0
    px, py = to_metres(lon, lat, lat)
    best = math.inf
    for ring in rings(geometry):
        pts = [to_metres(x, y, lat) for x, y in ring]
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            dx, dy = x2 - x1, y2 - y1
            t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / ((dx * dx + dy * dy) or 1)))
            best = min(best, math.hypot(px - x1 - t * dx, py - y1 - t * dy))
    return best


def segments_cross(a, b, c, d):
    def turn(p, q, r):
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return turn(a, b, c) * turn(a, b, d) < 0 and turn(c, d, a) * turn(c, d, b) < 0


def intersects_box(geometry, box):
    """True if a claim polygon overlaps a lon/lat rectangle (west, south, east, north)."""
    w, s, e, n = box
    corners = [(w, s), (e, s), (e, n), (w, n), (w, s)]
    for ring in rings(geometry):
        if any(w <= x <= e and s <= y <= n for x, y in ring):
            return True
        for p, q in zip(ring, ring[1:]):
            if any(segments_cross(p, q, c, d) for c, d in zip(corners, corners[1:])):
                return True
    return any(inside(x, y, geometry) for x, y in corners[:4])


def start_date(ms):
    """NTPSTDT is milliseconds since 1970 (UTC). Its meaning is not documented by DNR."""
    return None if ms is None else (datetime(1970, 1, 1, tzinfo=timezone.utc) + timedelta(milliseconds=ms)).date()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=ROOT / "data" / "raw" / "tok-land")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args(argv)
    args.raw.mkdir(parents=True, exist_ok=True)

    selection = json.loads((ROOT / "research" / "gold-site-selection.json").read_text(encoding="utf-8"))
    download_claims(args.raw)
    samples = load_samples(args.raw, selection)

    claims, retrieved = [], {}
    for status in CLAIM_LAYERS:
        fc = json.loads((args.raw / f"tok_state_claims_{status}.geojson").read_text(encoding="utf-8"))
        retrieved[status] = fc.get("retrieved")
        for f in fc["features"]:
            p = f["properties"]
            claims.append({"status": status, "geometry": f["geometry"], "case_id": p["CASE_ID"],
                           "claim_name": p["CLAIM_NAME"], "owner": (p["CSTMRNM"] or "").strip(),
                           "start": start_date(p["NTPSTDT"]), "acres": p["TOT_ACRES"]})
    active = [c for c in claims if c["status"] == "active"]

    rows = []
    for s in samples:
        nearest = round(min(distance_m(s["lon"], s["lat"], c["geometry"]) for c in active))
        base = {"sample": s["sample"], "site": s["site"], "longitude": s["lon"], "latitude": s["lat"],
                "m_to_nearest_active_claim": nearest}
        hits = [c for c in claims if inside(s["lon"], s["lat"], c["geometry"])]
        for c in hits:
            rows.append(dict(base, match_status="point_inside_claim", claim_status=c["status"], case_id=c["case_id"],
                             claim_name=c["claim_name"], owner=c["owner"],
                             ntpstdt_date=c["start"].isoformat() if c["start"] else "", total_acres=c["acres"]))
        if not hits:
            rows.append(dict(base, match_status="outside_state_claims"))
    rows.sort(key=lambda r: (r["site"], r["sample"], r.get("claim_status", ""), r.get("case_id", "")))
    with open(args.out / "tok_sample_claim_matches.csv", "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, MATCH_FIELDS, restval="")
        writer.writeheader()
        writer.writerows(rows)

    summary = {"retrieved": retrieved, "claims_source": CLAIMS_URL, "search_box_lon_lat": SEARCH_BOX,
               "claims_in_search_box": dict(Counter(c["status"] for c in claims)),
               "top_owners_active": Counter(c["owner"] for c in active).most_common(5), "sites": {}}
    for site, area in selection["areas"].items():
        b = area["sample_coordinate_bounds"]
        box = (b["west"], b["south"], b["east"], b["north"])
        site_rows = [r for r in rows if r["site"] == site]
        in_status = defaultdict(set)
        for r in site_rows:
            if r["match_status"] == "point_inside_claim":
                in_status[r["claim_status"]].add(r["sample"])
        nearest = sorted({r["sample"]: r["m_to_nearest_active_claim"] for r in site_rows}.values())
        by_year = defaultdict(Counter)
        for c in claims:
            if c["start"] and intersects_box(c["geometry"], box):
                by_year[c["start"].year][c["status"]] += 1
        summary["sites"][site] = {
            "samples": len(area["sample_ids"]),
            "samples_inside_active_claim": len(in_status["active"]),
            "samples_inside_closed_claim": len(in_status["closed"]),
            "median_m_to_nearest_active_claim": nearest[len(nearest) // 2] if len(nearest) % 2 else
                                                 (nearest[len(nearest) // 2 - 1] + nearest[len(nearest) // 2]) / 2,
            "owners_of_active_claims_at_samples": dict(Counter(r["owner"] for r in site_rows
                                                               if r.get("claim_status") == "active")),
            "claims_overlapping_window_by_ntpstdt_year": {y: dict(by_year[y]) for y in sorted(by_year)},
        }
    (args.out / "tok_land_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    for site, s in summary["sites"].items():
        print(f"Site {site}: {s['samples_inside_active_claim']}/{s['samples']} samples in an active claim, "
              f"{s['samples_inside_closed_claim']} in a closed claim, median {s['median_m_to_nearest_active_claim']} m "
              f"to the nearest active claim")


if __name__ == "__main__":
    main()
