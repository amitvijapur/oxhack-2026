#!/usr/bin/env python3
"""Build reproducible Tok River gold-first, lithium-secondary evidence packs."""
import argparse
import csv
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("tok_gold_audit", ROOT / "research/verification/audit_tok_gold.py")
audit = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(audit)
require = audit.require
SOURCE_ID = "alaska_dggs_rdf2016_10"
SOURCE_NAME = "rdf2016-10-stream-sed-trace-element.csv"
LIMITS_NAME = "rdf2016-10-stream-sed-trace-element-limits.csv"
URLS = {
    "publication": "https://dggs.alaska.gov/pubs/id/29688",
    "doi": "https://doi.org/10.14509/29688",
    "download": "https://dggs.alaska.gov/webpubs/data/rdf2016_010_tok-stream-sediment-geochemistry.zip",
    "metadata": "https://dggs.alaska.gov/webpubs/metadata/RDF2016-10.faq.html",
}
CONTRACT_FIELDS = (
    "contract_source_id", "contract_source_url", "contract_record_id", "contract_snapshot_at",
    "contract_effective_from", "contract_effective_to", "contract_interest_type",
    "geometry_crs_original", "geometry_sha256", "spatial_relation", "boundary_distance_m",
    "spatial_uncertainty_m", "temporal_relation", "notes",
)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n").encode()


def csv_bytes(rows, fields):
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode()


def read_json(path):
    raw = path.read_bytes()
    return json.loads(raw), digest(raw)


def validate_inputs(source, limits, selection_path, catalog_path):
    report = audit.audit(source, limits)
    rows, _ = audit.read_csv(source, audit.SOURCE_SHA256)
    require(len(rows[0]) == 70, "Expected all 70 original fields")
    selection, selection_sha = read_json(selection_path)
    catalog, catalog_sha = read_json(catalog_path)
    for doc in (selection, catalog):
        require(doc.get("schema_version") == "1.0" and doc.get("source_id") == SOURCE_ID,
                "Unexpected catalog/selection schema or source ID")
    require(selection["source_sha256"] == audit.SOURCE_SHA256 and
            selection["limits_sha256"] == audit.LIMITS_SHA256, "Selection source checksum mismatch")
    require(selection["source_bytes"] == report["source"]["bytes"] and
            selection["source_file_name"] == SOURCE_NAME, "Selection source metadata mismatch")
    require(selection["medium"] == "stream_sediment" and selection["size_fraction"] == "-200",
            "Selection medium or mesh mismatch")
    require(selection["split_longitude"] == audit.CUTOFF_LONGITUDE, "Selection split mismatch")
    require(selection["coordinate_system"] == "WGS84 EPSG:4326", "Selection CRS mismatch")
    require(set(selection["areas"]) == {"A", "B"}, "Expected exactly A and B")
    for area in ("A", "B"):
        expected, actual = report["areas"][area], selection["areas"][area]
        require(actual["record_count"] == expected["record_count"], "Area count mismatch")
        require(actual["sample_ids"] == expected["sample_ids"], "Area sample IDs mismatch")
        require(actual["sample_coordinate_bounds"] == expected["coordinate_bounds"], "Area point bounds mismatch")
    for key, meta_key, name in (("assays", "source", SOURCE_NAME), ("limits", "limits_source", LIMITS_NAME)):
        entry, actual = catalog["files"][key], report[meta_key]
        require(entry["sha256"] == actual["sha256"] and entry["bytes"] == actual["bytes"],
                "Catalog file integrity mismatch")
        require(entry["filename"] == name and entry["archive_member"] == "tables/" + name,
                "Catalog file identity mismatch")
    require(all(catalog["urls"].get(key) == value for key, value in URLS.items()), "Catalog source URL mismatch")
    require(catalog["methods"] == report["method_limits"], "Catalog methods mismatch")
    require(catalog["spatial"]["source_datum"] == "WGS84" and
            catalog["spatial"]["source_crs"] == "EPSG:4326", "Catalog CRS mismatch")
    error_range = catalog["spatial"]["reported_horizontal_error_m"]
    require(error_range["minimum"] == 1 and error_range["maximum"] == 10, "Catalog GPS error range mismatch")
    scope = catalog["evidence_scope"]
    require(scope["medium"] == "stream_sediment" and scope["selected_size_fraction"] == "-200" and
            scope["source_rows"] == 90 and scope["unique_sampling_locations"] == 67,
            "Catalog evidence scope mismatch")
    return rows, report, selection, catalog, selection_sha, catalog_sha


def normalized(row, record_number, area):
    lon, lat = audit.coordinates(row)
    sample_key = f"{SOURCE_ID}:{row['SAMPLE']}:-200"
    result = {
        "sample_key": sample_key, "field_key": f"{SOURCE_ID}:{row['SAMPLE']}",
        "source_id": SOURCE_ID, "source_csv_record_number": record_number, "area": area,
        "sample_id": row["SAMPLE"], "laboratory_sample_id": row["LAB_SAMPLE_NUMBER"],
        "batch_number_raw": row["BATCH_NUMBER"], "batch_number": row["BATCH_NUMBER"].strip(),
        "longitude_raw": row["LONGITUDE"], "latitude_raw": row["LATITUDE"],
        "longitude": lon, "latitude": lat, "size_fraction_raw": row["SIZE_FRACTION"],
        "size_fraction": "-200", "source_crs": "WGS84 EPSG:4326",
        "method_source_file": LIMITS_NAME,
    }
    for name, (field, method, lower, upper) in audit.METHODS.items():
        measurement = audit.parse_measurement(row[field], lower, upper)
        result.update({f"{name}_{key}": value for key, value in measurement.items()})
        result[f"{name}_method"] = method
        result[f"{name}_unit"] = "ppm"
    return result


def build_payloads(source, limits, selection_path, catalog_path, area):
    require(area in ("A", "B"), "Area must be A or B")
    rows, report, selection, catalog, selection_sha, catalog_sha = validate_inputs(
        source, limits, selection_path, catalog_path)
    ids = set(selection["areas"][area]["sample_ids"])
    chosen = [(index, row) for index, row in enumerate(rows, 1)
              if row["SIZE_FRACTION"].strip() == "-200" and row["SAMPLE"] in ids]
    raw_rows = [row for _, row in chosen]
    samples = sorted((normalized(row, index, area) for index, row in chosen), key=lambda row: row["sample_key"])
    summary = audit.group_summary(raw_rows)
    summary.update({"area": area, "source_id": SOURCE_ID, "interpretation": report["interpretation"]})
    summary["gold_primary_by_batch"] = {
        batch: audit.method_summary([row for row in raw_rows if row["BATCH_NUMBER"].strip() == batch],
                                    "Au_ppm_PGM-MS23", 0.001, 1.0)
        for batch in summary["batches"]
    }
    site = {
        "area": area, "name": selection["areas"][area]["name"], "source_id": SOURCE_ID,
        "medium": "stream_sediment", "size_fraction": "-200", "record_count": len(samples),
        "sample_coordinate_bounds": summary["coordinate_bounds"],
        "bounds_meaning": "Extent of sampling points; not a parcel, deposit, catchment or geological boundary",
        "coordinate_system": "WGS84 EPSG:4326", "cutoff_longitude": audit.CUTOFF_LONGITUDE,
        "selection_predicate": "longitude < cutoff" if area == "A" else "longitude >= cutoff",
        "boundary_ties_go_to": "B", "selection_source": "selection.json", "time": catalog["time"],
    }
    features = [{"type": "Feature", "id": row["sample_key"],
                 "geometry": {"type": "Point", "coordinates": [row["longitude"], row["latitude"]]},
                 "properties": row} for row in samples]
    land_rows = []
    for row in samples:
        land = {key: row[key] for key in ("sample_key", "sample_id", "area", "longitude", "latitude")}
        land.update({"source_id": SOURCE_ID, "source_sha256": audit.SOURCE_SHA256,
                     "source_crs": "WGS84", "coordinate_order": "lon,lat",
                     "sample_accuracy_min_m": 1, "sample_accuracy_max_m": 10,
                     "sample_accuracy_scope": "source_reported_range_not_per_point_confidence",
                     "match_status": "not_evaluated"})
        land.update({field: "" for field in CONTRACT_FIELDS})
        land_rows.append(land)
    assumptions = {
        "assumptions": [],
        "unknown_scenario_inputs": ["deposit_presence_probability", "recoverable_resource",
            "ore_grade", "recovery_rate", "exploration_cost", "development_cost", "land_contract_price",
            "land_ownership", "mineral_rights", "land_availability", "drilling_status", "per_sample_collection_date",
            "per_observation_available_at", "upstream_source_footprint"],
        "land_matches": "not_evaluated", "predictive_skill": "not_tested",
    }
    lines = [f"# Tok River area {area} evidence", "", catalog["citation"], "",
             f"This pack contains {len(samples)} selected -200 mesh stream-sediment records.",
             "Trace: summary.json /record_count and /sample_ids; source_records.csv SAMPLE and SIZE_FRACTION.", ""]
    claims = []
    for name in audit.METHODS:
        method = summary["methods"][name]
        counts, stats = method["counts"], method["quantified_only"]
        lines += [f"## {name.replace('_', ' ')}", "",
                  f"Quantified: {counts['quantified']}; below detection: {counts['below_detection']}; "
                  f"above detection: {counts['above_detection']}; not analyzed: {counts['not_analyzed']}.",
                  f"Quantified-only minimum / median / maximum: {stats['minimum_ppm']} / {stats['median_ppm']} / "
                  f"{stats['maximum_ppm']} ppm, denominator {stats['denominator']}.",
                  f"Trace: summary.json /methods/{name}; record IDs are listed by status there.", ""]
        claims.append({"claim": name + " descriptive statistics", "file": "summary.json",
                       "json_pointer": "/methods/" + name, "sample_keys": [row["sample_key"] for row in samples]})
    lines += ["## Interpretation and limits", "",
              "Gold retests remain separate from the primary method. Blank retests mean not analyzed. "
              "Censored values are never replaced with zero, their limit or a retest.", "",
              "Batch counts and primary-gold summaries by batch are in summary.json /batches and /gold_primary_by_batch. "
              "Batch composition can confound an A/B comparison; the comparison does not establish a prospective ranking.", "",
              "Sampling targeted known or suspected mineralised drainages. Stream sediment can reflect upstream material. "
              "Sampling locations are not statistically independent evidence of deposits. Point extents are not parcels.", "",
              "The data do not establish ore grades, reserves, undrilled status, land availability, ownership, "
              "contract prices, economic value or predictive skill. Lithium is secondary descriptive evidence.", "",
              "Collection campaigns and month-precision publication timing are in source_catalog.json /time. "
              "No per-row collection dates or availability chronology are inferred. No chronological prediction test has been run.", "",
              "Changes: select -200 mesh, split by frozen longitude, normalize with raw strings retained, "
              "export points and compute method-specific statistics. Attribute DGGS; no provider endorsement is implied.", ""]
    provenance = {
        "generator": {
            "name": "gold_evidence.py", "version": "1.0",
            "code_sha256": {
                "scripts/gold_evidence.py": digest(Path(__file__).read_bytes()),
                "research/verification/audit_tok_gold.py": digest(
                    (ROOT / "research/verification/audit_tok_gold.py").read_bytes()),
            },
        },
        "source_id": SOURCE_ID, "source_sha256": audit.SOURCE_SHA256, "limits_sha256": audit.LIMITS_SHA256,
        "input_selection_sha256": selection_sha, "input_catalog_sha256": catalog_sha,
        "source_files": {"assays": SOURCE_NAME, "limits": LIMITS_NAME},
        "sample_keys": [row["sample_key"] for row in samples],
        "source_records": [{"sample_key": row["sample_key"], "source_csv_record_number": row["source_csv_record_number"]}
                           for row in samples],
        "dependencies": {"source_records.csv": [SOURCE_NAME, "selection.json"],
            "samples.csv": ["source_records.csv", LIMITS_NAME], "samples.geojson": ["samples.csv"],
            "summary.json": ["samples.csv"], "site.json": ["samples.csv", "selection.json", "source_catalog.json"],
            "evidence.md": ["summary.json", "source_catalog.json"],
            "land_match_template.csv": ["samples.csv", "source_catalog.json"]},
        "claims": claims,
    }
    readme = """# Reproducible gold evidence pack

Use the repository's scripts/gold_evidence.py with --source and --limits pointing to the two original DGGS CSV files, --selection research/gold-site-selection.json, --catalog research/gold-source-catalog.json, --area A or B and --output a new directory. Python standard library only. Both original CSV checksums are pinned; raw data acquisition and attribution are in source_catalog.json.

source_records.csv preserves all 70 source columns and strings, in source record order. samples.csv is sorted by sample_key. source_csv_record_number is 1-based among original data records, excluding the header. The field sample ID and laboratory sample ID remain distinct; batch_number_raw preserves whitespace while batch_number is trimmed. Raw coordinates and assay strings remain alongside parsed values. method_source_file identifies the original detection-limits table.

Each method has raw, status, value_ppm, bound_ppm, method and unit fields. Status is quantified, below_detection, above_detection or not_analyzed. Empty CSV value/bound cells correspond to JSON null, never zero. Blank retests mean not analyzed. No retest substitution occurs. Primary gold and secondary lithium statistics use only quantified values; each denominator and status ID list is explicit in summary.json. Batch summaries use the same rule.

GeoJSON is RFC7946 longitude,latitude point data with sample_key feature IDs. It does not define parcels, deposits or catchments. WGS84 GPS error of 1 to 10 metres is a source-reported range, not an individual confidence radius or deposit-location accuracy.

land_match_template.csv is a future join scaffold. Every contract field is empty and match_status is not_evaluated. Later joins may be one-to-many and must cite the contract source/snapshot, effective dates and original geometry. A point intersection would not establish mineral ownership or sediment provenance. No land acquisition, contract lookup or MiroFish integration occurs here.

provenance.json records input checksums, source record references and claim dependencies. validation.json hashes every other output file. Byte-identical reruns are accepted; changed or unrelated output directories are refused. No runtime timestamps or absolute machine paths are embedded.
"""
    payloads = {
        "source_records.csv": csv_bytes(raw_rows, list(rows[0])),
        "samples.csv": csv_bytes(samples, list(samples[0])),
        "samples.geojson": json_bytes({"type": "FeatureCollection", "features": features}),
        "site.json": json_bytes(site), "summary.json": json_bytes(summary),
        "evidence.md": "\n".join(lines).encode(), "source_catalog.json": json_bytes(catalog),
        "selection.json": json_bytes(selection), "land_match_template.csv": csv_bytes(land_rows, list(land_rows[0])),
        "assumptions.json": json_bytes(assumptions), "provenance.json": json_bytes(provenance),
        "README.md": readme.encode(),
    }
    checks = dict(report["checks"])
    checks.update({name: "passed" for name in ("catalog_file_identity_and_method_limits", "selection_ids_counts_and_point_bounds",
        "all_70_source_columns_preserved", "method_results_separate_without_substitution",
        "geojson_lon_lat_coordinates", "empty_unevaluated_contract_fields")})
    # Check generated representations before writing any output.
    require(list(csv.DictReader(io.StringIO(payloads["source_records.csv"].decode()))) == raw_rows,
            "Raw source records failed round-trip")
    require(all(feature["geometry"]["coordinates"] == [row["longitude"], row["latitude"]]
                for feature, row in zip(features, samples)), "GeoJSON coordinate mismatch")
    require(all(row[field] == "" for row in land_rows for field in CONTRACT_FIELDS), "Nonempty contract field")
    payloads["validation.json"] = json_bytes({"schema_version": "1.0", "area": area, "record_count": len(samples),
        "checks": checks, "output_sha256": {name: digest(data) for name, data in sorted(payloads.items())}})
    return payloads


def write_pack(payloads, output):
    require(not output.is_symlink(), "Output cannot be a symlink")
    if output.exists():
        require(output.is_dir() and {p.name for p in output.iterdir()} == set(payloads), "Existing output has changed or unrelated files")
        require(all(not (output / name).is_symlink() and (output / name).is_file() and
                    (output / name).read_bytes() == data for name, data in payloads.items()),
                "Existing output differs; use a new directory")
        return "unchanged"
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=".gold-evidence-", dir=output.parent))
    try:
        for name, data in payloads.items():
            (staging / name).write_bytes(data)
        require(not output.exists() and not output.is_symlink(), "Output appeared during generation")
        staging.rename(output)
    finally:
        if staging.exists():
            shutil.rmtree(staging)
    return "created"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "limits", "selection", "catalog", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    parser.add_argument("--area", required=True, choices=("A", "B"))
    args = parser.parse_args()
    try:
        payloads = build_payloads(args.source, args.limits, args.selection, args.catalog, args.area)
        status = write_pack(payloads, args.output)
    except (OSError, ValueError, KeyError, TypeError, csv.Error) as exc:
        parser.exit(2, f"error: {exc}\n")
    print(f"Area {args.area}: {status}; {len(payloads)} validated evidence files")


if __name__ == "__main__":
    main()
