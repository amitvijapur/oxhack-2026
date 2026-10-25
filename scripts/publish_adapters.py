"""Turn each workstream's output files into a website run: full payload, summary and child rows.

Each adapter reads only field names confirmed in that workstream's producer and maps a
missing or non-numeric value to None, never 0. The summary shapes match
frontend/convex/model/validators.ts.
"""
import csv
import json
import math
from pathlib import Path

DECISION_SECTIONS = 50
LIST_ITEMS = 50
DECISION_CHECKS = 10
PLAN_STEPS = 24
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


def _checks(gates):
    """decision_engine.py gates: {name: {status, evidence}}, in the engine's order."""
    if not isinstance(gates, dict):
        return []
    return [{"name": name, "status": text(gate.get("status")) or "unknown", "evidence": text(gate.get("evidence"))}
            for name, gate in gates.items() if isinstance(gate, dict)][:DECISION_CHECKS]


def _plan(policy):
    """The month-by-month policy collapsed into runs of the same action, first month's amounts kept."""
    steps = []
    for entry in policy if isinstance(policy, list) else []:
        month = number(entry.get("month")) if isinstance(entry, dict) else None
        action = text(entry.get("action")) if isinstance(entry, dict) else None
        if month is None or action is None:
            continue
        if steps and steps[-1]["action"] == action and steps[-1]["toMonth"] == month - 1:
            steps[-1]["toMonth"] = month
            continue
        steps.append({"fromMonth": month, "toMonth": month, "action": action,
                      "paymentUsd": number(entry.get("stage_payment_usd")),
                      "sellIfOfferAtLeastUsd": number(entry.get("sell_if_offer_at_least_usd"))})
    return steps[:PLAN_STEPS]


def _decision_section(record, label):
    outcomes = record.get("outcomes") if isinstance(record.get("outcomes"), dict) else {}
    swarm = record.get("swarm") if isinstance(record.get("swarm"), dict) else {}
    return {
        "label": label,
        "action": text(record.get("action")),
        "signal": text(record.get("signal")),
        "status": text(record.get("status")),
        "valueUsd": number(record.get("value_usd")),
        "worstOutcomeUsd": number(record.get("worst_outcome_usd")),
        "pLoss": number(outcomes.get("p_loss")),
        "fragile": strings(record.get("fragile")),
        "conditionalOn": strings(record.get("conditional_on")),
        "swarmUsed": bool(swarm.get("used")),
        "checks": _checks(record.get("gates")),
        "plan": _plan(record.get("policy")),
    }


def _decision_label(record, index, total):
    forecast = record.get("forecast") if isinstance(record.get("forecast"), dict) else {}
    return (text(record.get("opportunity_id")) or text(forecast.get("mtrs"))
            or ("decision" if total == 1 else f"section {index + 1}"))


def decision(data):
    """decision_engine.py stdout: one record (Tok) or a list of per-section records (NV)."""
    records = data if isinstance(data, list) else [data]
    if not records or not all(isinstance(r, dict) for r in records):
        raise ValueError("decision output must be a JSON object or a non-empty list of objects")
    if len(records) > DECISION_SECTIONS:
        raise ValueError(f"decision output has {len(records)} sections; the website accepts {DECISION_SECTIONS}")
    sections = [_decision_section(r, _decision_label(r, i, len(records))) for i, r in enumerate(records)]
    return data, {"kind": "decision", "sections": sections}, None


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
DEFAULT_MODES = {"decision": "scenario", "swarm": "scenario", "land": "measured"}
PRODUCERS = {
    "decision": "scripts/decision_engine.py",
    "swarm": "swarm/score.py",
    "land": "research/tok-land/site_land_matches.py",
}
