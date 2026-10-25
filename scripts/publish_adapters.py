"""Turn each workstream's output files into a website run: full payload, summary and child rows.

Each adapter reads only field names confirmed in that workstream's producer and maps a
missing or non-numeric value to None, never 0. The summary shapes match
frontend/convex/model/validators.ts.
"""
import csv
import json
import math
from pathlib import Path
import subprocess

LIST_ITEMS = 50
SWARM_CHECKS = ("placebo", "mirrors", "stability", "grounding")
SWARM_CALLS = ("price", "policy", "leaning")
LAND_SITES = ("A", "B")


def number(value):
    """A finite number, or None. Strings are parsed so CSV cells and JSON values behave alike."""
    if isinstance(value, bool):
        return None
    if isinstance(value, str):
        try:
            value = float(value)
        except ValueError:
            return None
    if isinstance(value, (int, float)) and math.isfinite(value):
        return value
    return None


def text(value):
    return value if isinstance(value, str) and value.strip() else None


def strings(values):
    return [v for v in values if isinstance(v, str)][:LIST_ITEMS] if isinstance(values, list) else []


def decision(data):
    """Project canonical assignment output through the model's own pure JS helper.

    No financial equations are reproduced in Python. Old monthly-engine records
    fail the canonical version/shape checks instead of being silently mapped.
    """
    module = Path(__file__).resolve().parents[1] / "model/tok-option/publish.mjs"
    program = (f"import {{ decisionSummary }} from {json.dumps(module.as_uri())};"
               "import { readFileSync } from 'node:fs';"
               "console.log(JSON.stringify(decisionSummary(JSON.parse(readFileSync(0, 'utf8')))));")
    try:
        result = subprocess.run(["node", "--input-type=module", "-e", program],
                                input=json.dumps(data, allow_nan=False), text=True,
                                capture_output=True, timeout=30, check=False)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise ValueError("canonical assignment projection requires Node.js 24 and model/tok-option/publish.mjs") from error
    if result.returncode:
        message = next((line.strip() for line in result.stderr.splitlines()
                        if line.startswith("Error: Invalid canonical assignment output:")),
                       "invalid canonical assignment output")
        raise ValueError(message)
    return data, json.loads(result.stdout), None


def _call(calls, name):
    call = calls.get(name) if isinstance(calls, dict) else None
    if not isinstance(call, dict):
        return None
    return {"call": text(call.get("call")), "answers": number(call.get("answers"))}


def swarm(data):
    """swarm/score.py results.json."""
    if not isinstance(data, dict):
        raise ValueError("swarm results must be a JSON object")
    checks = data.get("checks") if isinstance(data.get("checks"), dict) else {}
    runs = [r for r in data.get("runs", []) if isinstance(r, dict)] if isinstance(data.get("runs"), list) else []
    effects = data.get("effects") if isinstance(data.get("effects"), dict) else {}
    baseline = next((r for r in runs if r.get("scenario") == "baseline" and isinstance(r.get("calls"), dict)), None)
    summary = {
        "kind": "swarm",
        "generated": text(data.get("generated")),
        "checks": {name: text((checks.get(name) or {}).get("status")) if isinstance(checks.get(name), dict) else None
                   for name in SWARM_CHECKS},
        "scenarios": [s for s in effects if isinstance(s, str)][:LIST_ITEMS],
        "runsJudged": sum(1 for r in runs if r.get("status") == "judged"),
        "runsTotal": len(runs),
        "baselineCalls": {name: _call(baseline["calls"], name) for name in SWARM_CALLS} if baseline else None,
    }
    return data, summary, None


LAND_MATCH_COLUMNS = {
    "sampleKey": "sample_key", "sampleId": "sample_id", "area": "area", "matchStatus": "match_status",
    "contractSourceId": "contract_source_id", "contractRecordId": "contract_record_id",
    "contractInterestType": "contract_interest_type", "contractSnapshotAt": "contract_snapshot_at",
    "spatialRelation": "spatial_relation", "temporalRelation": "temporal_relation", "notes": "notes",
}
REQUIRED_LAND_COLUMNS = ("sample_key", "sample_id", "area", "match_status")


def _land_row(row):
    missing = [c for c in REQUIRED_LAND_COLUMNS if not text(row.get(c))]
    if missing:
        raise ValueError(f"land match row is missing {', '.join(missing)}")
    match = {field: text(row.get(column)) for field, column in LAND_MATCH_COLUMNS.items()}
    match["boundaryDistanceM"] = number(row.get("boundary_distance_m"))
    return match


def _land_site(site):
    site = site if isinstance(site, dict) else {}
    return {
        "samples": number(site.get("samples")),
        "insideActiveClaim": number(site.get("samples_inside_active_claim")),
        "insideClosedClaim": number(site.get("samples_inside_closed_claim")),
        "medianMToActiveClaim": number(site.get("median_m_to_nearest_active_claim")),
    }


def land_files(directory):
    """The files the land adapter reads, in a stable order, for input hashing."""
    directory = Path(directory)
    return [directory / "tok_land_summary.json"] + [directory / f"site-{s.lower()}" / "land_matches.csv" for s in LAND_SITES]


def land(directory):
    """research/tok-land/: tok_land_summary.json and site-{a,b}/land_matches.csv."""
    summary_path, *match_paths = land_files(directory)
    for path in [summary_path, *match_paths]:
        if not path.is_file():
            raise ValueError(f"land input is missing {path}")
    land_summary = json.loads(summary_path.read_text(encoding="utf-8"))
    raw_rows = []
    for path in match_paths:
        with path.open(newline="", encoding="utf-8") as handle:
            raw_rows.extend(csv.DictReader(handle))
    retrieved = land_summary.get("retrieved") if isinstance(land_summary.get("retrieved"), dict) else {}
    in_box = land_summary.get("claims_in_search_box") if isinstance(land_summary.get("claims_in_search_box"), dict) else {}
    sites = land_summary.get("sites") if isinstance(land_summary.get("sites"), dict) else {}
    summary = {
        "kind": "land",
        "snapshotAt": text(retrieved.get("active")),
        "activeClaimsInBox": number(in_box.get("active")),
        "closedClaimsInBox": number(in_box.get("closed")),
        "sites": {s: _land_site(sites.get(s)) for s in LAND_SITES},
    }
    payload = {"tok_land_summary": land_summary, "land_matches": raw_rows}
    return payload, summary, [_land_row(r) for r in raw_rows]


ADAPTERS = {"decision": decision, "swarm": swarm, "land": land}
DEFAULT_MODES = {"swarm": "scenario", "land": "measured"}
PRODUCERS = {
    "decision": "model/tok-option/export.mjs",
    "swarm": "swarm/score.py",
    "land": "research/tok-land/site_land_matches.py",
}
