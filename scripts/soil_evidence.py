#!/usr/bin/env python3
"""Build a deterministic, source-checked USGS soil evidence pack for area A or B."""
from __future__ import annotations

import argparse
from collections import Counter
import csv
from dataclasses import dataclass
from datetime import datetime
import hashlib
import io
import json
import math
from pathlib import Path
import re
import shutil
import statistics
import tempfile

VERSION = "1.0"
SOURCE_ID = "usgs_ds801_c_horizon"
SOURCE_URL = "https://pubs.usgs.gov/ds/801/downloads/Appendix_4b_Chorizon_18Sept2013.txt"
STATUSES = ("quantified", "below_detection", "no_sample", "insufficient_sample")
REQUIRED = ("SiteID", "C_LabID", "StateID", "Latitude", "Longitude", "CollDate", "C_Depth", "C_Cu")
CSV_FIELDS = ("study_area_id", "source_id", "sample_id", "lab_id", "state", "latitude", "longitude", "collection_date_raw", "collection_date", "depth_raw_cm", "copper_raw", "copper_mg_kg", "copper_status", "detection_limit_mg_kg", "copper_unit")


class EvidenceError(ValueError):
    """Input or output failed an explicit evidence contract."""


@dataclass(frozen=True)
class SnapshotProfile:
    source_sha256: str
    national_counts: dict[str, int]
    state_counts: dict[str, int]
    minimum_quantified: int = 10


PRODUCTION = SnapshotProfile(
    "4aa8080f81f690587f762300bada16e33e376eea0003243d5333b47c78b4c90c",
    dict(zip(STATUSES, (4766, 14, 75, 2))),
    dict(zip(STATUSES, (176, 0, 1, 0))),
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n").encode()


def require(condition, message):
    if not condition:
        raise EvidenceError(message)


def parse_copper(raw: str):
    value = raw.strip()
    if value in ("N.S.", "INS"):
        return None, {"N.S.": "no_sample", "INS": "insufficient_sample"}[value], None
    if value == "<0.5":
        return None, "below_detection", 0.5
    require(bool(re.fullmatch(r"(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?", value)), f"Unknown copper encoding: {raw!r}")
    number = float(value)
    require(math.isfinite(number) and number >= 0, f"Invalid copper measurement: {raw!r}")
    return number, "quantified", None


def status_counts(records):
    counts = Counter(r["copper_status"] for r in records)
    return {key: counts[key] for key in STATUSES}


def parse_source(raw: bytes, profile: SnapshotProfile = PRODUCTION):
    require(sha256(raw) == profile.source_sha256, "Source SHA-256 differs from the audited snapshot")
    try:
        rows = list(csv.reader(io.StringIO(raw.decode("utf-8-sig"), newline=""), delimiter="\t", strict=True))
    except (UnicodeError, csv.Error) as exc:
        raise EvidenceError(f"Invalid UTF-8/tabular source: {exc}") from exc
    headers = [i for i, row in enumerate(rows) if all(field in row for field in REQUIRED)]
    require(len(headers) == 1, "Expected exactly one source header")
    index = headers[0]
    require(index == 12, "Audited source header must be the thirteenth table row")
    header = rows[index]
    require(len(header) == 82 and len(set(header)) == 82, "Expected 82 unique source fields")
    require(len(rows) > index + 1, "Missing source units row")
    unit_row = rows[index + 1]
    require(len(unit_row) == len(header), "Malformed units row")
    units = dict(zip(header, unit_row))
    require(all(units[k] == v for k, v in {"SiteID": "", "Latitude": "Degrees", "Longitude": "Degrees", "C_Depth": "cm", "C_Cu": "mg/kg"}.items()), "Unexpected source units row")
    records, seen = [], set()
    trailing_blanks = False
    for row_number, values in enumerate(rows[index + 2:], start=index + 3):
        if not any(value.strip() for value in values):
            trailing_blanks = True
            continue
        require(not trailing_blanks, f"Nonblank record after trailing blank rows at row {row_number}")
        require(len(values) == len(header), f"Malformed source row {row_number}: expected 82 fields")
        row = dict(zip(header, values))
        sample_id = row["SiteID"]
        require(bool(re.fullmatch(r"\d+", sample_id)), f"Invalid SiteID at row {row_number}")
        require(sample_id not in seen, f"Duplicate SiteID: {sample_id}")
        seen.add(sample_id)
        try:
            latitude, longitude = float(row["Latitude"]), float(row["Longitude"])
            date = datetime.strptime(row["CollDate"], "%m/%d/%y").date()
        except ValueError as exc:
            raise EvidenceError(f"Invalid coordinates/date for SiteID {sample_id}") from exc
        require(math.isfinite(latitude) and -90 <= latitude <= 90 and math.isfinite(longitude) and -180 <= longitude <= 180, f"Invalid WGS84 coordinates for SiteID {sample_id}")
        require(2007 <= date.year <= 2011, f"Collection date outside source period for SiteID {sample_id}")
        require(bool(re.fullmatch(r"[A-Z]{2}", row["StateID"])), f"Invalid StateID for SiteID {sample_id}")
        copper, status, limit = parse_copper(row["C_Cu"])
        records.append({"source_id": SOURCE_ID, "sample_id": sample_id, "lab_id": row["C_LabID"], "state": row["StateID"], "latitude": latitude, "longitude": longitude, "collection_date_raw": row["CollDate"], "collection_date": date.isoformat(), "depth_raw_cm": row["C_Depth"], "copper_raw": row["C_Cu"], "copper_mg_kg": copper, "copper_status": status, "detection_limit_mg_kg": limit, "copper_unit": "mg/kg"})
    require(status_counts(records) == profile.national_counts, "National status counts differ from the audited snapshot")
    az = [r for r in records if r["state"] == "AZ"]
    require(status_counts(az) == profile.state_counts, "Arizona status counts differ from the audited snapshot")
    return sorted(records, key=lambda r: r["sample_id"])


def bounds(records):
    return {"west": min(r["longitude"] for r in records), "east": max(r["longitude"] for r in records), "south": min(r["latitude"] for r in records), "north": max(r["latitude"] for r in records)}


def validate_selection(manifest, raw, records, profile=PRODUCTION):
    require(manifest.get("schema_version") == "1.0", "Unsupported selection schema")
    require(manifest.get("source_id") == SOURCE_ID, "Unexpected selection source ID")
    require(manifest.get("source_sha256") == sha256(raw) == profile.source_sha256, "Selection/source checksum mismatch")
    require(manifest.get("source_bytes") == len(raw), "Selection/source byte count mismatch")
    filename = manifest.get("source_file_name", "")
    require(isinstance(filename, str) and bool(filename) and Path(filename).name == filename and "/" not in filename and "\\" not in filename, "Source filename must be portable")
    require(manifest.get("state") == "AZ" and manifest.get("coordinate_system") == "WGS84 EPSG:4326", "Unexpected selection state or coordinate system")
    az = [r for r in records if r["state"] == "AZ"]
    cut = statistics.median(r["longitude"] for r in az)
    require(manifest.get("split_longitude") == cut, "Selection split is not the all-record Arizona median longitude")
    require(isinstance(manifest.get("areas"), dict) and set(manifest["areas"]) == {"A", "B"}, "Selection must define exactly A and B")
    selected = {}
    for area in ("A", "B"):
        group = [r for r in az if (r["longitude"] < cut) == (area == "A")]
        entry = manifest["areas"][area]
        require(isinstance(entry, dict), f"Area {area} selection must be an object")
        ids = sorted(r["sample_id"] for r in group)
        require(entry.get("sample_ids") == ids, f"Area {area} IDs differ from the coordinate-only partition")
        require(entry.get("record_count") == len(group), f"Area {area} count mismatch")
        require(entry.get("sample_coordinate_bounds") == bounds(group), f"Area {area} bounds mismatch")
        require(status_counts(group)["quantified"] >= profile.minimum_quantified, f"Area {area} has fewer than {profile.minimum_quantified} quantified measurements")
        selected[area] = group
    a, b = ({r["sample_id"] for r in selected[area]} for area in ("A", "B"))
    require(not a & b and a | b == {r["sample_id"] for r in az}, "A/B partition does not cover Arizona exactly once")
    return selected


def summarise(records):
    measured = [r for r in records if r["copper_status"] == "quantified"]
    values = [r["copper_mg_kg"] for r in measured]
    require(len(values) >= 2, "At least two quantified values needed for quartiles")
    q1, _, q3 = statistics.quantiles(values, n=4, method="inclusive")
    counts = status_counts(records)
    top = sorted(measured, key=lambda r: (-r["copper_mg_kg"], r["sample_id"]))[:3]
    return {"schema_version": VERSION, "study_area_id": records[0]["study_area_id"], "record_count": len(records), "status_counts": counts, "missing_count": counts["no_sample"] + counts["insufficient_sample"], "copper": {"unit": "mg/kg", "denominator": len(values), "excluded_statuses": [s for s in STATUSES if s != "quantified"], "minimum": min(values), "q1": q1, "median": statistics.median(values), "q3": q3, "maximum": max(values), "quartile_method": "statistics.quantiles(n=4, method='inclusive')", "top_three": [{"sample_id": r["sample_id"], "copper_raw": r["copper_raw"], "copper_mg_kg": r["copper_mg_kg"]} for r in top]}, "collection_dates": {"earliest": min(r["collection_date"] for r in records), "latest": max(r["collection_date"] for r in records)}, "depth_raw_cm_counts": dict(sorted(Counter(r["depth_raw_cm"] for r in records).items())), "sample_ids": [r["sample_id"] for r in records]}


def build_payloads(raw: bytes, manifest: dict, area: str, profile=PRODUCTION):
    require(area in ("A", "B"), "Area must be A or B")
    records = parse_source(raw, profile)
    areas = validate_selection(manifest, raw, records, profile)
    chosen = [dict(r, study_area_id=area) for r in areas[area]]
    summary = summarise(chosen)
    manifest_bytes = json_bytes(manifest)
    source_hash = sha256(raw)
    selection_hash = sha256(manifest_bytes)
    site = {"schema_version": VERSION, "extractor_version": VERSION, "study_area_id": area, "source_id": SOURCE_ID, "source_file_name": manifest["source_file_name"], "source_sha256": source_hash, "source_url": SOURCE_URL, "source_publication_year": 2013, "coordinate_system": manifest["coordinate_system"], "state": "AZ", "selection_file": "selection.json", "selection_sha256": selection_hash, "selection_rule": "longitude < split" if area == "A" else "longitude >= split", "split_longitude": manifest["split_longitude"], "sample_coordinate_bounds": manifest["areas"][area]["sample_coordinate_bounds"], "record_count": len(chosen), "status_counts": summary["status_counts"], "scope": "Regional sampling cohort. Bounds describe sample locations, not parcels or geological boundaries. Depths vary; collection dates are not publication dates."}
    csv_text = io.StringIO(newline="")
    writer = csv.DictWriter(csv_text, fieldnames=CSV_FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(chosen)
    assumptions = {"schema_version": VERSION, "study_area_id": area, "assumptions": [], "unknown_scenario_inputs": ["investigation_success_probability", "investigation_cost", "investigation_duration", "investigation_payoff", "survey_cost", "survey_duration", "survey_sensitivity", "survey_specificity", "budget", "remaining_time"], "warning": "No source measurement is converted into a probability, resource estimate or financial return."}
    copper = summary["copper"]
    high = "\n".join(f"- SiteID `{r['sample_id']}`: {r['copper_raw']} mg/kg (samples.csv; summary.json#/copper/top_three)." for r in copper["top_three"])
    evidence = f"""# Site {area}: measured soil evidence

## Selection and coverage

This is a regional Arizona sampling cohort selected by coordinates only: {site['selection_rule']}, split {manifest['split_longitude']} degrees longitude. The selection is in selection.json; included SiteIDs are in summary.json#/sample_ids. It is not a land parcel or proof of undrilled ground.

There are {len(chosen)} included records and {copper['denominator']} quantified copper measurements. Status counts are {json.dumps(summary['status_counts'], sort_keys=True)}. These claims derive from summary.json#/record_count and summary.json#/status_counts; every record remains in samples.csv.

## Quantified copper

The measured copper median is {copper['median']:g} mg/kg; minimum {copper['minimum']:g}, first quartile {copper['q1']:g}, third quartile {copper['q3']:g}, maximum {copper['maximum']:g}. These are descriptive statistics over {copper['denominator']} quantified values only (summary.json#/copper). Censored and missing concentrations are excluded, never replaced by zero. Quartiles use the documented inclusive convention.

The three highest quantified observations, with deterministic SiteID tie breaking, are:

{high}

These are observed high values, not mineral discoveries.

## Dates, depths and limitations

Collection dates span {summary['collection_dates']['earliest']} to {summary['collection_dates']['latest']} (summary.json#/collection_dates). Exact depth strings and their counts are in summary.json#/depth_raw_cm_counts and each source value is retained in samples.csv. Samples do not all represent the same depth. The source was published in 2013; collection dates do not establish when information became available.

Source: [USGS Data Series 801]({SOURCE_URL}). Source SHA-256: `{source_hash}`. Regional soil chemistry does not establish an economic deposit, available mineral rights, or present-day conditions. No geological explanation for high values or predictive advantage is inferred. Probabilities, costs and outcomes remain unknown in assumptions.json. Provenance links are recorded in provenance.json.
"""
    readme = f"""# Site {area} evidence pack

Generated with soil_evidence.py version {VERSION}; no runtime timestamps or absolute machine paths are embedded. Source snapshot and selection are pinned by SHA-256 in site.json. This pack contains measured historical soil evidence, not a mineral-success forecast.

From the repository root, with the source file and this pack available, regenerate into a new destination:

```sh
python3 scripts/soil_evidence.py --source PATH_TO_SOURCE --selection PATH_TO_PACK/selection.json --area {area} --output NEW_OUTPUT_DIRECTORY
```

For the other area, change only --area. Both use the same frozen selection and source snapshot. An identical rerun is accepted. Existing changed/unrelated output directories are never overwritten.

## Files and interpretation

- samples.csv: one row per selected source SiteID, including missing/censored observations. Cite `usgs_ds801_c_horizon:SiteID` (the sample_id column). Geographic coordinates use WGS84 decimal degrees. Copper uses mg/kg. Depth strings use cm and remain uninterpreted.
- site.json and selection.json: source provenance and exact coordinate-only partition.
- summary.json: quantified-only copper statistics, denominators, status counts, dates, depths and source IDs. Quartiles use Python's inclusive method.
- evidence.md: human-readable claims with summary paths and record references.
- assumptions.json: empty assumptions and explicitly unknown scenario inputs.
- provenance.json: dependency graph and claim-to-record references.
- validation.json: completed extraction checks and SHA-256 hashes of every other file. It excludes its own hash to avoid recursive hashing. These are integrity checks, not prediction validation.

`quantified` means a nonnegative numeric source measurement. `below_detection` retains its limit but leaves concentration null. `no_sample` retains N.S.; `insufficient_sample` retains INS. Empty CSV numeric fields represent null, not zero. Raw copper, collection date and depth text remain available. Unknown source encodings cause extraction to fail. Collection dates are normalized from MM/DD/yy; publication is separately recorded as 2013.

Raw source and generated packs are ignored by Git. Transfer the pack and source through an agreed file-sharing method or download the exact source from the URL in site.json and verify its checksum. A Git pull alone will not transfer these data files.
"""
    quantified_ids = [r["sample_id"] for r in chosen if r["copper_status"] == "quantified"]
    provenance = {"schema_version": VERSION, "source": {"id": SOURCE_ID, "sha256": source_hash, "url": SOURCE_URL}, "nodes": ["source", "selection.json", "samples.csv", "summary.json", "evidence.md", "assumptions.json"], "edges": [{"from": a, "to": b, "relation": "derived_from"} for a, b in [("selection.json", "source"), ("samples.csv", "source"), ("samples.csv", "selection.json"), ("summary.json", "samples.csv"), ("evidence.md", "summary.json")]], "claims": {"coverage_dates_depths": {"summary_paths": ["/record_count", "/status_counts", "/collection_dates", "/depth_raw_cm_counts"], "source_sample_ids": summary["sample_ids"]}, "quantified_copper": {"summary_paths": ["/copper"], "source_sample_ids": quantified_ids}}, "assumptions": "No measured derivation: assumptions.json contains no assigned scenario values."}
    payloads = {"samples.csv": csv_text.getvalue().encode(), "site.json": json_bytes(site), "summary.json": json_bytes(summary), "selection.json": manifest_bytes, "assumptions.json": json_bytes(assumptions), "evidence.md": evidence.encode(), "README.md": readme.encode(), "provenance.json": json_bytes(provenance)}
    validation = {"schema_version": VERSION, "extractor_version": VERSION, "source_sha256": source_hash, "national_record_count": len(records), "national_status_counts": status_counts(records), "arizona_status_counts": status_counts(areas["A"] + areas["B"]), "partition_counts": {k: len(v) for k, v in areas.items()}, "selected_area": area, "checks": {name: "passed" for name in ["audited_source_sha256", "source_row_structure_and_units", "unique_source_ids", "coordinates_and_dates", "national_and_arizona_status_counts", "coordinate_only_frozen_partition", "disjoint_complete_arizona_partition", "minimum_quantified_coverage", "missing_records_retained", "quantified_only_summary"]}, "output_sha256": {name: sha256(data) for name, data in sorted(payloads.items())}, "hash_scope": "Every pack file except validation.json itself; no timestamps or absolute paths."}
    payloads["validation.json"] = json_bytes(validation)
    return payloads


def write_pack(output: Path, payloads):
    output = Path(output)
    require(not output.is_symlink(), "Output directory must not be a symlink")
    if output.exists():
        require(output.is_dir(), "Output exists and is not a directory")
        require({p.name for p in output.iterdir()} == set(payloads), "Existing output is not an identical managed pack; choose a new directory")
        require(all((output / name).is_file() and not (output / name).is_symlink() and (output / name).read_bytes() == data for name, data in payloads.items()), "Existing output differs; choose a new directory")
        return "unchanged"
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".soil-evidence-", dir=output.parent))
    try:
        for name, data in payloads.items():
            (staging / name).write_bytes(data)
        require(not output.exists() and not output.is_symlink(), "Output appeared during extraction; refusing overwrite")
        staging.rename(output)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return "created"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--selection", required=True, type=Path)
    parser.add_argument("--area", required=True, choices=("A", "B"))
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        raw = args.source.read_bytes()
        manifest = json.loads(args.selection.read_text())
        require(isinstance(manifest, dict), "Selection must be a JSON object")
        payloads = build_payloads(raw, manifest, args.area)
        state = write_pack(args.output, payloads)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(2, f"error: {exc}\n")
    summary = json.loads(payloads["summary.json"])
    print(json.dumps({"status": state, "area": args.area, "record_count": summary["record_count"], "quantified_count": summary["copper"]["denominator"], "median_copper_mg_kg": summary["copper"]["median"], "output": str(args.output)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
