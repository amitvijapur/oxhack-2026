#!/usr/bin/env python3
"""Read-only audit of the pinned Tok stream-sediment gold/lithium tables.

This is a candidate-data audit, not an evidence-pack extractor or targeting model.
Only -200 mesh records enter the coordinate-only A/B comparison. Paired -80
mesh analyses and Au-AA25 retests are reported separately, never substituted.
"""
import argparse
from collections import Counter
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import statistics

SOURCE_SHA256 = "3833f09686ce03ba823881df5ff662768e24a05f12091ee1c097b1e2ec7c30d1"
LIMITS_SHA256 = "94a81641f92af2e0fd94864cf56a2106a27792408da817e6061b012769772ed5"
CUTOFF_LONGITUDE = -143.793381
METHODS = {
    "gold_primary": ("Au_ppm_PGM-MS23", "PGM-MS23", 0.001, 1.0),
    "gold_retest": ("Au_ppm_Au-AA25", "Au-AA25", 0.01, 100.0),
    "lithium_secondary": ("Li_ppm_ME-MS61", "ME-MS61", 0.2, 10000.0),
}
STATUSES = ("quantified", "below_detection", "above_detection", "not_analyzed")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_csv(path, expected_sha):
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    require(digest == expected_sha, f"Unexpected SHA-256 for {path.name}")
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""), strict=True)
    require(reader.fieldnames and len(reader.fieldnames) == len(set(reader.fieldnames)), "Missing or duplicate CSV headers")
    rows = list(reader)
    require(all(None not in row and all(value is not None for value in row.values()) for row in rows), "Malformed CSV record width")
    return rows, {"filename": path.name, "sha256": digest, "bytes": len(raw)}


def record_id(row):
    return f"{row['SAMPLE']}|{row['SIZE_FRACTION'].strip()}"


def parse_measurement(raw, lower, upper):
    token = raw.strip()
    if token == "":
        return {"raw": raw, "status": "not_analyzed", "value_ppm": None, "bound_ppm": None}
    if token == "-1":
        return {"raw": raw, "status": "below_detection", "value_ppm": None, "bound_ppm": lower}
    if token == "-2":
        return {"raw": raw, "status": "above_detection", "value_ppm": None, "bound_ppm": upper}
    value = float(token)
    require(math.isfinite(value) and value >= 0, f"Unexpected analytical encoding: {raw!r}")
    require(lower <= value <= upper, f"Quantified value {value} is outside its declared method range [{lower}, {upper}]")
    return {"raw": raw, "status": "quantified", "value_ppm": value, "bound_ppm": None}


def coordinates(row):
    longitude, latitude = float(row["LONGITUDE"]), float(row["LATITUDE"])
    require(math.isfinite(longitude) and math.isfinite(latitude), "Nonfinite coordinates")
    require(-180 <= longitude <= 180 and -90 <= latitude <= 90, "Coordinates outside longitude/latitude bounds")
    return longitude, latitude


def method_summary(rows, field, lower, upper):
    observations = [(row, parse_measurement(row[field], lower, upper)) for row in rows]
    values = [measurement["value_ppm"] for _, measurement in observations if measurement["status"] == "quantified"]
    counts = Counter(measurement["status"] for _, measurement in observations)
    return {
        "column": field,
        "unit": "ppm",
        "counts": {status: counts[status] for status in STATUSES},
        "quantified_only": {
            "denominator": len(values),
            "minimum_ppm": min(values) if values else None,
            "median_ppm": statistics.median(values) if values else None,
            "maximum_ppm": max(values) if values else None,
        },
        "record_ids_by_status": {
            status: sorted(record_id(row) for row, measurement in observations if measurement["status"] == status)
            for status in STATUSES
        },
        "qualification": "Statistics exclude censored and blank results. No zero, detection-limit or retest substitution.",
    }


def group_summary(rows):
    points = [coordinates(row) for row in rows]
    return {
        "record_count": len(rows),
        "unique_sample_count": len({row["SAMPLE"] for row in rows}),
        "unique_coordinate_count": len(set(points)),
        "sample_ids": sorted({row["SAMPLE"] for row in rows}),
        "record_ids": sorted(record_id(row) for row in rows),
        "coordinate_bounds": {
            "west": min(point[0] for point in points), "east": max(point[0] for point in points),
            "south": min(point[1] for point in points), "north": max(point[1] for point in points),
        },
        "batches": dict(sorted(Counter(row["BATCH_NUMBER"].strip() for row in rows).items())),
        "methods": {name: method_summary(rows, field, lower, upper) for name, (field, _, lower, upper) in METHODS.items()},
    }


def audit(source, limits_path):
    rows, source_meta = read_csv(source, SOURCE_SHA256)
    limits_rows, limits_meta = read_csv(limits_path, LIMITS_SHA256)
    require(len(rows) == 90, "Expected exactly 90 analytical records")
    required = {"SAMPLE", "LAB_SAMPLE_NUMBER", "SIZE_FRACTION", "LATITUDE", "LONGITUDE", "BATCH_NUMBER"} | {entry[0] for entry in METHODS.values()}
    require(required <= set(rows[0]), "Required source fields missing")
    require(all(row["SAMPLE"].strip() and row["LAB_SAMPLE_NUMBER"].strip() for row in rows), "Missing sample or laboratory identifier")
    require(len({record_id(row) for row in rows}) == 90, "Duplicate sample/mesh record")
    require(len({row["LAB_SAMPLE_NUMBER"] for row in rows}) == 90, "Duplicate laboratory sample identifier")
    for row in rows:
        coordinates(row)
    fractions = Counter(row["SIZE_FRACTION"].strip() for row in rows)
    require(fractions == {"-200": 67, "-80": 23}, "Expected 67 -200 mesh and 23 -80 mesh records")
    fine = [row for row in rows if row["SIZE_FRACTION"].strip() == "-200"]
    coarse = [row for row in rows if row["SIZE_FRACTION"].strip() == "-80"]
    fine_by_id = {row["SAMPLE"]: row for row in fine}
    require(len(fine_by_id) == 67, "Expected 67 unique -200 mesh sample IDs")
    unique_location_count = len({coordinates(row) for row in fine})
    require(unique_location_count == 67, "Expected 67 unique -200 mesh sampling locations")
    require(len({row["SAMPLE"] for row in coarse}) == 23, "Expected 23 unique -80 mesh sample IDs")
    require(all(row["SAMPLE"] in fine_by_id for row in coarse), "Unpaired -80 mesh sample")
    require(all(coordinates(row) == coordinates(fine_by_id[row["SAMPLE"]]) for row in coarse), "Paired mesh fractions have different coordinates")

    method_limits = {}
    for name, (field, code, lower, upper) in METHODS.items():
        matches = [row for row in limits_rows if row.get("ANALYSIS") == field]
        require(len(matches) == 1, f"Expected one limits row for {field}")
        limit = matches[0]
        require(limit["LAB_CODE"] == code and limit["UNITS"] == "parts per million", f"Method or unit mismatch for {field}")
        require(float(limit["LOWER_DETECTION_LIMIT"]) == lower and float(limit["UPPER_DETECTION_LIMIT"]) == upper, f"Unexpected detection limits for {field}")
        for row in rows:
            parse_measurement(row[field], lower, upper)
        method_limits[name] = {"column": field, "lab_code": code, "unit": "ppm", "lower_detection_limit_ppm": lower, "upper_detection_limit_ppm": upper, "technique": limit["GEOCHEM_TECHNIQUE"], "digestion": limit["DIGESTION_DESCRIPTION"], "lab": limit["LAB_NAME"]}

    cut = statistics.median(coordinates(row)[0] for row in fine)
    require(cut == CUTOFF_LONGITUDE, "Coordinate median differs from the predeclared split")
    areas = {"A": [row for row in fine if coordinates(row)[0] < cut], "B": [row for row in fine if coordinates(row)[0] >= cut]}
    a_ids, b_ids = ({row["SAMPLE"] for row in areas[area]} for area in ("A", "B"))
    require(not a_ids & b_ids and a_ids | b_ids == set(fine_by_id), "A/B IDs overlap or fail complete -200 mesh coverage")

    retests = []
    for row in sorted(rows, key=record_id):
        retest = parse_measurement(row["Au_ppm_Au-AA25"], 0.01, 100.0)
        if retest["status"] != "not_analyzed":
            retests.append({"sample_id": row["SAMPLE"], "record_id": record_id(row), "mesh_fraction": row["SIZE_FRACTION"].strip(), "included_in_primary_ab": row["SIZE_FRACTION"].strip() == "-200", "gold_primary": parse_measurement(row["Au_ppm_PGM-MS23"], 0.001, 1.0), "gold_retest": retest})

    return {
        "audit_version": "1.0",
        "purpose": "Read-only candidate dataset audit; no evidence pack or targeting model is built.",
        "source": source_meta,
        "limits_source": limits_meta,
        "analytical_record_count": len(rows),
        "unique_all_sample_ids": len({row["SAMPLE"] for row in rows}),
        "mesh_counts": dict(sorted(fractions.items())),
        "method_limits": method_limits,
        "encoding": {"-1": "below lower detection limit", "-2": "above upper detection limit", "blank": "not_analyzed; no result is available, distinct from censoring"},
        "selected_200_mesh": group_summary(fine),
        "paired_80_mesh_separate": group_summary(coarse),
        "pairing": {"paired_sample_ids": sorted(row["SAMPLE"] for row in coarse), "coordinates_match": True, "unique_location_count": unique_location_count, "warning": "The 23 -80 mesh records are paired analyses, not 23 extra sampling locations."},
        "selection": {"rule": "Use -200 mesh only. Median longitude split fixed before gold analysis: A longitude < cutoff; B longitude >= cutoff.", "cutoff_longitude": cut, "all_boundary_ties_go_to": "B", "no_au_based_selection": True},
        "areas": {area: group_summary(group) for area, group in areas.items()},
        "gold_retests_separate": retests,
        "checks": {key: "passed" for key in ("pinned_source_and_limits_checksums", "csv_record_shapes", "exact_rows_and_mesh_counts", "unique_sample_mesh_and_lab_ids", "finite_coordinate_ranges", "all_coarse_records_paired_at_same_coordinates", "declared_method_units_and_limits", "explicit_blank_and_censor_statuses", "predeclared_coordinate_split", "ab_disjoint_complete_200_mesh_coverage")},
        "interpretation": "Au PGM-MS23 is primary; Au-AA25 results remain separately qualified retests. Lithium ME-MS61 is secondary. Summaries describe stream-sediment measurements, not ore grade, economic deposits, legal land availability or validated predictive skill. No historical availability chronology is inferred from sample IDs.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--limits", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = audit(args.source, args.limits)
    except (OSError, ValueError, KeyError, csv.Error) as exc:
        parser.exit(2, f"error: {exc}\n")
    print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))


if __name__ == "__main__":
    main()
