#!/usr/bin/env python3
"""Build the showcase site's data files from the team's committed work and one DNR fetch.

Writes frontend/public/data/showcase/:
  claims.geojson   Alaska DNR state mining claims (active and closed) in the Tok search box
  history.json     Alaska claims opened per year against the gold price (arjin/tok-land-data)
  town.json        the 61-person Tok society and its scored day-1 pilot posts (ahmed/gold-society-plan)
  decision.json    the decision engine's verdict and outcome distributions (salman/decision-engine)

Inputs are read from Git refs with `git show`, so no branch has to be checked out. Every file
records its source ref and commit. Standard library only. Run from anywhere in the repository:

    python3 frontend/scripts/build-showcase-data.py
"""
from __future__ import annotations

import csv
from datetime import date, datetime, timezone
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

ROOT = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
OUT = ROOT / "frontend/public/data/showcase"
LAND_REF = "origin/arjin/tok-land-data"
ENGINE_REF = "origin/salman/decision-engine"
SWARM_REF = "origin/ahmed/gold-society-plan"
CLAIMS_URL = "https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer"
CLAIM_LAYERS = {"active": 0, "closed": 2}  # the same layers and box as research/tok-land/tok_land_claims.py
SEARCH_BOX = (-144.05, 63.0, -143.05, 63.28)


def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args], text=True)


def show(ref, path):
    return git("show", f"{ref}:{path}")


def source(ref, *paths):
    return {"ref": ref, "commit": git("rev-parse", ref).strip(), "paths": list(paths)}


def write(name, payload):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / name).write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {name}: {(OUT / name).stat().st_size // 1024} KB")


def fetch_json(url, params):
    with urllib.request.urlopen(f"{url}?{urllib.parse.urlencode(params)}", timeout=120) as r:
        return json.load(r)


def year_of(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).year if ms else None


def build_claims():
    """Claim outlines with only the fields the map uses; coordinates rounded to about 1 m."""
    features = []
    for status, layer in CLAIM_LAYERS.items():
        url = f"{CLAIMS_URL}/{layer}/query"
        ids = sorted(fetch_json(url, dict(where="1=1", geometry=",".join(map(str, SEARCH_BOX)),
                                          geometryType="esriGeometryEnvelope", inSR=4326,
                                          spatialRel="esriSpatialRelIntersects", returnIdsOnly="true",
                                          f="json"))["objectIds"] or [])
        for i in range(0, len(ids), 100):
            chunk = ",".join(map(str, ids[i:i + 100]))
            page = fetch_json(url, dict(objectIds=chunk, outFields="CASE_ID,CSTMRNM,CLAIM_NAME,NTPSTDT,DATE_ALF,TOT_ACRES",
                                        outSR=4326, f="geojson"))["features"]
            for f in page:
                p = f["properties"]
                geometry = f["geometry"]
                geometry["coordinates"] = json.loads(json.dumps(geometry["coordinates"]),
                                                     parse_float=lambda v: round(float(v), 5))
                features.append({"type": "Feature", "geometry": geometry, "properties": {
                    "id": p["CASE_ID"], "status": status, "owner": p["CSTMRNM"], "name": p["CLAIM_NAME"],
                    "start": year_of(p["NTPSTDT"]), "end": year_of(p["DATE_ALF"]) if status == "closed" else None,
                    "acres": float(p["TOT_ACRES"] or 0)}})
        print(f"claims {status}: {len(ids)}")
    write("claims.geojson", {"type": "FeatureCollection", "retrieved": date.today().isoformat(),
                             "source": CLAIMS_URL, "search_box": SEARCH_BOX,
                             "fields": {"start": "year of DNR NTPSTDT (meaning not confirmed by DNR)",
                                        "end": "year of DNR DATE_ALF, closed claims only"},
                             "features": features})


def build_history():
    rows = list(csv.DictReader(io.StringIO(show(LAND_REF, "research/tok-land/alaska_claims_vs_gold.csv"))))
    write("history.json", {"source": source(LAND_REF, "research/tok-land/alaska_claims_vs_gold.csv"),
                           "columns": list(rows[0].keys()), "rows": rows})


def build_town():
    cast = json.loads(show(SWARM_REF, "swarm/cast.json"))
    posts = []
    for line in show(SWARM_REF, "swarm/records/pilot/scores.jsonl").splitlines():
        r = json.loads(line)
        if r.get("score") is None:
            continue
        posts.append({k: r[k] for k in ("platform", "round", "name", "group", "score", "text")})
    posts.sort(key=lambda p: (p["round"], p["name"]))
    people = [{k: c[k] for k in ("n", "name", "role", "group", "tier")} for c in cast]
    meta = json.loads(show(SWARM_REF, "swarm/records/pilot/run_meta.json"))
    write("town.json", {"source": source(SWARM_REF, "swarm/cast.json", "swarm/records/pilot/scores.jsonl"),
                        "run": {"kind": "pilot", "simulated_hours": meta["max_rounds"], "seed": meta["seed"],
                                "news": "Gold futures jumped today from about $4,000 to about $4,500 an ounce.",
                                "judge_check": "27 of 30 posts within 2 points of hand labels"},
                        "people": people, "posts": posts})


def histogram(dist, edges):
    counts = [0.0] * (len(edges) - 1)
    for cash, prob in dist.items():
        i = next((k for k in range(len(edges) - 1) if cash < edges[k + 1]), len(edges) - 2)
        counts[max(i, 0)] += prob
    return [round(c, 6) for c in counts]


def build_decision():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for path in ("scripts/decision_engine.py", "research/decision-engine/tok-demo.json",
                     "research/decision-engine/bid-comparables.csv"):
            (tmp / path).parent.mkdir(parents=True, exist_ok=True)
            (tmp / path).write_text(show(ENGINE_REF, path), encoding="utf-8")
        spec_ = importlib.util.spec_from_file_location("decision_engine", tmp / "scripts/decision_engine.py")
        de = importlib.util.module_from_spec(spec_)
        sys.modules["decision_engine"] = de
        spec_.loader.exec_module(de)
        spec = json.loads((tmp / "research/decision-engine/tok-demo.json").read_text())
        bm, rb, policy = spec["bid_model"], spec["robust"], spec["policy"]
        bids, _ = de.bid_sources(de.load_comparables(tmp / bm["comparables"]), bm["acres"], bm.get("home", "AK"))
        contract = dict(spec["contract"], bids=bids[bm["headline_source"]])
        arrival, models, model_weights, _ = de.averaged_arrival(spec["staking_history"], spec["arrival_prior"],
                                                                spec["q_buyers_per_staking_event"])
        weights = {"arrival_model": model_weights["weight"], "exit_bids": rb["exit_bid_weights"],
                   "q_buyers_per_staking_event": {str(v): 1 / len(rb["q_values"]) for v in rb["q_values"]},
                   "acceleration_allowed": {"True": 0.5, "False": 0.5}}
        robust = de.robust_decision(contract, models, bids, rb["q_values"], [True, False],
                                    policy["budget_usd"], policy["loss_limit_usd"], weights)

        # One world per slider setting: the outcome distribution under the averaged arrival belief and
        # the headline bids, plus the expected value over the other assumptions (as the robust check).
        edges = [-200000, -150000, -100000, -75000, -50000, -35000, -25000, -15000, -10000, -5000, 0,
                 25000, 50000, 100000, 200000, 400000, 800000]
        worlds = []
        for q in rb["q_values"]:
            for acc in (True, False):
                c = dict(contract, acceleration_allowed=acc)
                d = de.decide_entry(c, arrival.with_q(q), policy["budget_usd"], policy["loss_limit_usd"])
                solver = de.Solver(c, arrival.with_q(q), commitment_cap=policy["loss_limit_usd"])
                dist = solver.outcomes()
                modal = max(dist.items(), key=lambda kv: kv[1])
                lapse = next((m["month"] for m in solver.policy() if m["action"] == "LAPSE"), None)
                rows = [r for r in robust["table"] if r["q_buyers_per_staking_event"] == q and r["acceleration_allowed"] == acc]
                w = {(r["arrival_model"], r["exit_bids"]): weights["arrival_model"][r["arrival_model"]] * weights["exit_bids"][r["exit_bids"]] for r in rows}
                ev = sum(w[(r["arrival_model"], r["exit_bids"])] * r["value_usd"] for r in rows) / sum(w.values())
                worlds.append({"q": q, "acceleration": acc, "action": d["action"], "value_usd": round(d["value_usd"], 2),
                               "expected_over_other_assumptions_usd": round(ev, 2),
                               "buy_in": sum(r["action"] == "BUY" for r in rows), "of": len(rows),
                               "p_loss": round(d["outcomes"]["p_loss"], 4), "p_gain": round(d["outcomes"]["p_gain"], 4),
                               "histogram": histogram(dist, edges),
                               # The most likely single outcome, and when the no-buyer plan walks away.
                               "modal_outcome_usd": round(modal[0], 2), "p_modal": round(modal[1], 4),
                               "lapse_month_if_no_buyer": lapse})
                print(f"q={q} acc={acc}: {d['action']} {d['value_usd']:,.0f}")
    write("decision.json", {
        "source": source(ENGINE_REF, "scripts/decision_engine.py", "research/decision-engine/tok-demo.json",
                         "research/decision-engine/bid-comparables.csv"),
        "verdict": robust["bayes_action"], "verdict_text": robust["verdict"],
        "expected_value_usd": round(robust["expected_value_usd"], 2),
        "combinations": robust["combinations"], "combinations_buy": robust["combinations_buy"],
        "worst_value_usd": round(robust["worst_value_usd"], 2), "best_value_usd": round(robust["best_value_usd"], 2),
        "acceleration_clause_adds_usd": round(robust["acceleration_clause_adds_usd"], 2),
        "contract": {"stages": spec["contract"]["stages"], "horizon_months": spec["contract"]["horizon_months"],
                     "acres": bm["acres"], "carry_usd_per_month": spec["contract"]["carry_usd_per_month"],
                     "terms_label": spec["labels"]["contract"]},
        "q_label": spec["labels"]["q"], "histogram_edges_usd": edges, "worlds": worlds,
        "gates": {k: v["status"] for k, v in spec["gates"].items()}})


if __name__ == "__main__":
    steps = {"claims": build_claims, "history": build_history, "town": build_town, "decision": build_decision}
    for name in sys.argv[1:] or steps:
        steps[name]()
