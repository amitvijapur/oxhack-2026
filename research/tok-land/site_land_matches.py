#!/usr/bin/env python3
"""Fill Amit's land_match_template for Site A and Site B from Alaska DNR land records.

For every selected Tok gold sample, list each state mining claim (active or closed) and
each state land parcel that contains the point, using the exact columns of
land_match_template.csv in the gold evidence packs (scripts/gold_evidence.py). Also checks
mineral closing orders and Native allotments. Writes, per site:
  site-a/land_matches.csv, site-a/summary.md   (and the same for site-b)

Run tok_land_claims.py first, or let this script call its downloads. Standard library only.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import date
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tok_land_claims as claims_mod  # noqa: E402  (shared download and geometry helpers)

ROOT = claims_mod.ROOT
SAMPLE_SOURCE_ID = "alaska_dggs_rdf2016_10"
STATUS_URL = "https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/Alphabetical_All/FeatureServer"
# Layers checked besides the claims: id -> (short name, what a match means)
STATUS_LAYERS = {42: ("state_land", "state land record"),
                 22: ("mineral_order", "mineral order (closing or opening to mineral entry)"),
                 29: ("native_allotment", "Native allotment")}
# Columns copied from land_match_template.csv (scripts/gold_evidence.py)
SAMPLE_FIELDS = ("sample_key", "sample_id", "area", "longitude", "latitude", "source_id", "source_sha256",
                 "source_crs", "coordinate_order", "sample_accuracy_min_m", "sample_accuracy_max_m",
                 "sample_accuracy_scope", "match_status")
CONTRACT_FIELDS = ("contract_source_id", "contract_source_url", "contract_record_id", "contract_snapshot_at",
                   "contract_effective_from", "contract_effective_to", "contract_interest_type",
                   "geometry_crs_original", "geometry_sha256", "spatial_relation", "boundary_distance_m",
                   "spatial_uncertainty_m", "temporal_relation", "notes")
ORIGINAL_CRS = "ESRI:102006 / EPSG:3338 Alaska Albers (service source); retrieved as EPSG:4326"
TEMPORAL = "present-day record vs June/July 2016 sample; does not show the record existed in 2016"


def download_status_layers(raw):
    """Fetch every polygon touching the search box from each status layer, by ID list."""
    folder = raw / "status"
    folder.mkdir(parents=True, exist_ok=True)
    for layer, (name, _) in STATUS_LAYERS.items():
        path = folder / f"{name}.geojson"
        if path.exists():
            continue
        url = f"{STATUS_URL}/{layer}/query"
        box = ",".join(map(str, claims_mod.SEARCH_BOX))
        ids = sorted(claims_mod.fetch_json(url, dict(where="1=1", geometry=box, geometryType="esriGeometryEnvelope",
                                                     inSR=4326, spatialRel="esriSpatialRelIntersects",
                                                     returnIdsOnly="true", f="json"))["objectIds"] or [])
        features = []
        for i in range(0, len(ids), 100):
            chunk = ",".join(map(str, ids[i:i + 100]))
            features += claims_mod.fetch_json(url, dict(objectIds=chunk, outFields="*", outSR=4326,
                                                         f="geojson"))["features"]
        if {f["properties"]["OBJECTID"] for f in features} != set(ids):
            raise RuntimeError(f"{name}: downloaded features do not match the ID list")
        path.write_text(json.dumps({"type": "FeatureCollection", "retrieved": date.today().isoformat(),
                                    "source": f"{STATUS_URL}/{layer}", "features": features}), encoding="utf-8")


def load_records(raw):
    """Every land record as (source_id, url, record_id, interest_type, notes, snapshot, geometry)."""
    records = []
    for status, layer in claims_mod.CLAIM_LAYERS.items():
        fc = json.loads((raw / f"tok_state_claims_{status}.geojson").read_text(encoding="utf-8"))
        for f in fc["features"]:
            p = f["properties"]
            start = claims_mod.start_date(p["NTPSTDT"])
            records.append({
                "contract_source_id": f"alaska_dnr_state_mining_claim_{status}",
                "contract_source_url": f"{claims_mod.CLAIMS_URL}/{layer}",
                "contract_record_id": p["CASE_ID"],
                "contract_interest_type": f"state mining claim ({status})",
                "notes": f"owner: {(p['CSTMRNM'] or '').strip()}; claim: {p['CLAIM_NAME']}; "
                         f"NTPSTDT: {start or 'blank'} (field meaning undocumented); acres: {p['TOT_ACRES']}",
                "snapshot": fc.get("retrieved"), "geometry": f["geometry"]})
    for layer, (name, meaning) in STATUS_LAYERS.items():
        fc = json.loads((raw / "status" / f"{name}.geojson").read_text(encoding="utf-8"))
        for f in fc["features"]:
            p = f["properties"]
            code = (p.get("LAND_STATUS") or "").strip()
            records.append({
                "contract_source_id": f"alaska_dnr_{name}",
                "contract_source_url": f"{STATUS_URL}/{layer}",
                "contract_record_id": f"{p.get('FILE_TYPE', '')} {p.get('FILE_NUMBER', '')}".strip(),
                "contract_interest_type": meaning + (f" (status code {code})" if code else ""),
                "notes": f"case status: {p.get('CS_LABEL')}; case type: {(p.get('CT_SC_LABEL') or '').strip() or 'blank'}",
                "snapshot": fc.get("retrieved"), "geometry": f["geometry"]})
    return records


def geometry_hash(geometry):
    """SHA-256 of the geometry as retrieved (EPSG:4326 GeoJSON, keys sorted)."""
    return hashlib.sha256(json.dumps(geometry, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def sample_columns(s, selection):
    return {"sample_key": f"{SAMPLE_SOURCE_ID}:{s['sample']}:-200", "sample_id": s["sample"], "area": s["site"],
            "longitude": s["lon"], "latitude": s["lat"], "source_id": SAMPLE_SOURCE_ID,
            "source_sha256": selection["source_sha256"], "source_crs": "WGS84", "coordinate_order": "lon,lat",
            "sample_accuracy_min_m": 1, "sample_accuracy_max_m": 10,
            "sample_accuracy_scope": "source_reported_range_not_per_point_confidence"}


def write_summary(path, site, area, rows, samples):
    """Plain summary of what the land records say about one site, built only from rows."""
    hits = defaultdict(set)
    owners, land_codes = Counter(), Counter()
    for r in rows:
        if r["match_status"] != "point_inside_record":
            continue
        hits[r["contract_source_id"]].add(r["sample_id"])
        if r["contract_source_id"].endswith("claim_active"):
            owners[r["notes"].split(";")[0].removeprefix("owner: ")] += 1
        if r["contract_source_id"] == "alaska_dnr_state_land":
            land_codes[r["contract_interest_type"].split("status code ")[-1].rstrip(")")] += 1
    unmatched = sorted(r["sample_id"] for r in rows if r["match_status"] == "no_record_in_checked_layers")
    n = len(samples)
    lines = [
        f"# Site {site} ({area['name']}): land records", "",
        f"Generated by [site_land_matches.py](../site_land_matches.py) from Alaska DNR layers retrieved "
        f"{rows[0]['contract_snapshot_at'] or 'unknown'}. One row per sample–record pair in "
        f"[land_matches.csv](land_matches.csv), in the column layout of the gold pack's `land_match_template.csv`.", "",
        "| Samples inside … | Count |", "|---|---:|",
        f"| an active state mining claim | {len(hits['alaska_dnr_state_mining_claim_active'])} of {n} |",
        f"| a closed state mining claim | {len(hits['alaska_dnr_state_mining_claim_closed'])} of {n} |",
        f"| a state land record | {len(hits['alaska_dnr_state_land'])} of {n} |",
        f"| a mineral order | {len(hits['alaska_dnr_mineral_order'])} of {n} |",
        f"| a Native allotment | {len(hits['alaska_dnr_native_allotment'])} of {n} |",
        f"| none of the checked layers | {len(unmatched)} of {n} |", "",
        "Active-claim owners at samples (sample–claim pairs): "
        + (", ".join(f"{o} ({c})" for o, c in owners.most_common()) or "none") + ".", "",
        "State land status codes at samples (sample–record pairs): "
        + (", ".join(f"{k} ({v})" for k, v in land_codes.most_common()) or "none")
        + ". DNR does not explain these codes in the layer; they are probably PA = patented, "
          "TA = tentatively approved, SA = state selected. Confirm before relying on them.", "",
        "Samples in none of the checked layers: " + (", ".join(unmatched) or "none")
        + ". They may be on federal or Native corporation land; BLM land status was not checked "
          "(the BLM Alaska service was down).", "",
        "A point inside a record is a spatial relationship only. It does not show who owns the minerals, "
        "where the sediment's gold came from, or whether land can be acquired. Land records are present-day; "
        "the samples are from 2016.", "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--raw", type=Path, default=ROOT / "data" / "raw" / "tok-land")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args(argv)
    args.raw.mkdir(parents=True, exist_ok=True)

    selection = json.loads((ROOT / "research" / "gold-site-selection.json").read_text(encoding="utf-8"))
    claims_mod.download_claims(args.raw)
    download_status_layers(args.raw)
    samples = claims_mod.load_samples(args.raw, selection)
    records = load_records(args.raw)

    for site, area in selection["areas"].items():
        site_samples = sorted((s for s in samples if s["site"] == site), key=lambda s: s["sample"])
        rows = []
        for s in site_samples:
            base = sample_columns(s, selection)
            matched = [r for r in records if claims_mod.inside(s["lon"], s["lat"], r["geometry"])]
            for r in sorted(matched, key=lambda r: (r["contract_source_id"], r["contract_record_id"])):
                rows.append(dict(base, match_status="point_inside_record",
                                 contract_source_id=r["contract_source_id"],
                                 contract_source_url=r["contract_source_url"],
                                 contract_record_id=r["contract_record_id"],
                                 contract_snapshot_at=r["snapshot"] or "",
                                 contract_effective_from="", contract_effective_to="",
                                 contract_interest_type=r["contract_interest_type"],
                                 geometry_crs_original=ORIGINAL_CRS, geometry_sha256=geometry_hash(r["geometry"]),
                                 spatial_relation="point_intersects_polygon",
                                 boundary_distance_m=round(claims_mod.edge_distance_m(s["lon"], s["lat"], r["geometry"])),
                                 spatial_uncertainty_m="sample GPS 1-10 m (source range); record boundary accuracy unknown",
                                 temporal_relation=TEMPORAL, notes=r["notes"]))
            if not matched:
                rows.append(dict(base, match_status="no_record_in_checked_layers",
                                 contract_snapshot_at=records[0]["snapshot"] or "",
                                 notes="checked: state mining claims (active, closed), state land, mineral orders, "
                                       "Native allotments; BLM federal land not checked"))
        folder = args.out / f"site-{site.lower()}"
        folder.mkdir(exist_ok=True)
        with open(folder / "land_matches.csv", "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, SAMPLE_FIELDS + CONTRACT_FIELDS, restval="")
            writer.writeheader()
            writer.writerows(rows)
        write_summary(folder / "summary.md", site, area, rows, site_samples)
        print(f"Site {site}: {len(site_samples)} samples, {len(rows)} rows")


if __name__ == "__main__":
    main()
