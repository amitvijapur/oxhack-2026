#!/usr/bin/env python3
"""Build the showcase site's data files from the team's committed work and one DNR fetch.

Writes frontend/public/data/showcase/:
  claims.geojson   Alaska DNR state mining claims (active and closed) in the Tok search box
  history.json     Alaska claims opened per year against the gold price (arjin/tok-land-data)
  town.json        the 61-person Tok society and its scored day-1 pilot posts (ahmed/gold-society-plan)
  decision.json    the decision engine's verdict, outcome distributions and monthly sell plan (salman/decision-engine)
  geochem.json     all 48 elements at the 67 sites with anomaly thresholds (Alaska DGGS RDF 2016-10)
  occurrences.json known mines, prospects and occurrences near Tok (USGS ARDF)
  geology.json     the mapped bedrock unit under each sample (USGS SIM 3340 via Macrostrat)
  market.json      land sales, claim rent, Alaska deals and exit comparables over time
  plots.json       the land plot under each sample: its DNR claim, or a drawn 160-acre open plot

Inputs are read from Git refs with `git show`, so no branch has to be checked out. Every file
records its source ref and commit. Standard library only. Run from anywhere in the repository:

    python3 frontend/scripts/build-showcase-data.py
"""
from __future__ import annotations

import csv
from datetime import date, datetime, timezone
import hashlib
import html
import importlib.util
import io
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
import zipfile

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


def get(url):
    """Open a URL with a named client; some USGS services refuse Python's default User-Agent."""
    request = urllib.request.Request(url, headers={"User-Agent": "oxhack-showcase-data/1.0 (github.com/amitvijapur/oxhack-2026)"})
    return urllib.request.urlopen(request, timeout=120)


def fetch_json(url, params):
    with get(f"{url}?{urllib.parse.urlencode(params)}") as r:
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
            page = fetch_json(url, dict(objectIds=chunk, outFields="CASE_ID,CSTMRNM,CLAIM_NAME,NTPSTDT,DATE_ALF,TOT_ACRES,RFRNCMTRSC",
                                        outSR=4326, f="geojson"))["features"]
            for f in page:
                p = f["properties"]
                geometry = f["geometry"]
                geometry["coordinates"] = json.loads(json.dumps(geometry["coordinates"]),
                                                     parse_float=lambda v: round(float(v), 5))
                features.append({"type": "Feature", "geometry": geometry, "properties": {
                    "id": p["CASE_ID"], "status": status, "owner": p["CSTMRNM"], "name": p["CLAIM_NAME"],
                    "start": year_of(p["NTPSTDT"]), "end": year_of(p["DATE_ALF"]) if status == "closed" else None,
                    "acres": float(p["TOT_ACRES"] or 0), "mtrs": p.get("RFRNCMTRSC")}})
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


DGGS_ZIP = "https://dggs.alaska.gov/webpubs/data/rdf2016_010_tok-stream-sediment-geochemistry.zip"
DGGS_ZIP_SHA256 = "2ac0b7eaeeb1bf114172ad80e2afde2065a9af1946a3be163f843cb736e91d86"
DGGS_TABLE = "tables/rdf2016-10-stream-sed-trace-element.csv"
DGGS_LIMITS = "tables/rdf2016-10-stream-sed-trace-element-limits.csv"
# Gold and the elements that commonly travel with it in Alaska's intrusion-related and orogenic
# gold systems (pathfinders), then base and other metals. The map's element picker uses this order.
KEY_ELEMENTS = ["Au", "As", "Sb", "Bi", "Te", "W", "Mo", "Cu", "Ag", "Pb", "Zn", "Li"]
FIELD_NOTES = ("STREAM_WIDTH_METERS", "STREAM_DEPTH_CM", "STREAM_SPEED", "GRAIN_SIZE", "SOURCE", "SED_COLOR", "NUM_SITES")


def percentile(sorted_values, p):
    """Linear-interpolated percentile of an already sorted list."""
    k = (len(sorted_values) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(sorted_values) - 1)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo)


def build_geochem():
    """Every element measured at the 67 sites (−200 mesh), with each lab's limits and the
    50th/90th/98th percentiles that exploration geochemists use as anomaly thresholds.

    DGGS codes −1 as below the lower detection limit and −2 as above the upper one. Those values
    are kept as flags, never as numbers; for ranking they sit at their limit."""
    with get(DGGS_ZIP) as r:
        blob = r.read()
    digest = hashlib.sha256(blob).hexdigest()
    if digest != DGGS_ZIP_SHA256:
        raise RuntimeError(f"DGGS zip changed: {digest}")
    archive = zipfile.ZipFile(io.BytesIO(blob))
    limits = {row["ANALYSIS"]: row for row in csv.DictReader(io.StringIO(archive.read(DGGS_LIMITS).decode("utf-8-sig")))}
    rows = [r for r in csv.DictReader(io.StringIO(archive.read(DGGS_TABLE).decode("utf-8-sig"))) if r["SIZE_FRACTION"] == "-200"]

    # One column per element; gold uses the primary fire assay (PGM-MS23), as the rest of the site does.
    columns = {}
    for analysis, row in limits.items():
        element = row["CHEMICAL_ABBREV"]
        if analysis.startswith("Au_") and analysis != "Au_ppm_PGM-MS23":
            continue
        if element in ("Pt", "Pd"):
            continue
        columns[element] = {"analysis": analysis, "name": row["CHEMICAL"], "unit": "%" if row["UNITS"] == "percent" else "ppm",
                            "lower": float(row["LOWER_DETECTION_LIMIT"]), "upper": float(row["UPPER_DETECTION_LIMIT"]),
                            "method": row["LAB_CODE"]}
    samples, ranked = [], {e: [] for e in columns}
    for r in rows:
        values = {}
        for element, col in columns.items():
            raw = r[col["analysis"]].strip()
            if raw == "":
                values[element] = None
            elif raw == "-1":
                values[element] = {"below": col["lower"]}
                ranked[element].append(col["lower"])
            elif raw == "-2":
                values[element] = {"above": col["upper"]}
                ranked[element].append(col["upper"])
            else:
                values[element] = float(raw)
                ranked[element].append(float(raw))
        samples.append({"id": r["SAMPLE"], "lon": float(r["LONGITUDE"]), "lat": float(r["LATITUDE"]),
                        "values": values, "notes": {k.lower(): r[k] for k in FIELD_NOTES if r.get(k)}})
    thresholds = {}
    for element, values in ranked.items():
        values.sort()
        if len(values) >= 20:
            thresholds[element] = {f"p{int(p * 100)}": round(percentile(values, p), 6) for p in (0.5, 0.9, 0.98)}
    order = KEY_ELEMENTS + sorted(e for e in columns if e not in KEY_ELEMENTS)
    write("geochem.json", {"source": {"url": DGGS_ZIP, "sha256": digest, "doi": "https://doi.org/10.14509/29688",
                                      "table": DGGS_TABLE, "size_fraction": "-200 mesh"},
                           "key_elements": KEY_ELEMENTS, "order": order, "elements": columns,
                           "thresholds": thresholds, "samples": samples})
    print(f"geochem: {len(samples)} samples, {len(columns)} elements")


ARDF_WFS = "https://mrdata.usgs.gov/services/wfs/ardf"
OCCURRENCE_BOX = (-144.3, 62.85, -142.8, 63.45)  # a little wider than the claims box, to show neighbours


def build_occurrences():
    """Known mines, prospects and occurrences from the USGS Alaska Resource Data File (ARDF)."""
    west, south, east, north = OCCURRENCE_BOX
    params = dict(service="WFS", version="1.1.0", request="GetFeature", typeName="ardf", srsName="EPSG:4326",
                  bbox=f"{south},{west},{north},{east},EPSG:4326")
    with get(f"{ARDF_WFS}?{urllib.parse.urlencode(params)}") as r:
        xml = r.read().decode("utf-8")
    tag = lambda block, name: (re.search(rf"<ms:{name}>(.*?)</ms:{name}>", block, re.S) or [None, ""])[1]
    records = []
    for block in re.findall(r"<ms:ardf\b.*?</ms:ardf>", xml, re.S):
        geology = html.unescape(tag(block, "geol_desc")).split("|")[0]
        records.append({"id": tag(block, "ardf_num"), "name": html.unescape(tag(block, "site")),
                        "lon": float(tag(block, "longitude")), "lat": float(tag(block, "latitude")),
                        "commodities": tag(block, "comm_main").split(";") if tag(block, "comm_main") else [],
                        "other": tag(block, "comm_other").split(";") if tag(block, "comm_other") else [],
                        "type": tag(block, "site_type"), "status": tag(block, "status"),
                        "model": html.unescape(tag(block, "dep_model")), "production": html.unescape(tag(block, "production")),
                        "geology": geology[:600], "url": html.unescape(tag(block, "url"))})
    write("occurrences.json", {"source": ARDF_WFS, "retrieved": date.today().isoformat(), "box": OCCURRENCE_BOX,
                               "records": records})
    print(f"occurrences: {len(records)}")


MACROSTRAT = "https://macrostrat.org/api/v2/geologic_units/map"
SIM3340_SOURCE_ID = 21  # Macrostrat's copy of the USGS Geologic Map of Alaska (SIM 3340, Wilson and others, 2015)


def build_geology():
    """The mapped bedrock unit under each sample, from SIM 3340 via Macrostrat (CC-BY 4.0)."""
    units = {}
    samples = json.loads((OUT / "geochem.json").read_text())["samples"]
    for s in samples:
        data = fetch_json(MACROSTRAT, dict(lat=s["lat"], lng=s["lon"], format="json"))["success"]["data"]
        unit = next((u for u in data if u["source_id"] == SIM3340_SOURCE_ID), None)
        units[s["id"]] = None if unit is None else {
            "name": unit["name"], "lith": unit["lith"], "description": unit["descrip"][:300],
            "age": unit["best_int_name"], "top_ma": unit["t_age"], "bottom_ma": unit["b_age"], "color": unit["color"]}
    write("geology.json", {"source": "USGS SIM 3340 (Wilson and others, 2015) via Macrostrat",
                           "source_url": "https://doi.org/10.3133/sim3340", "api": MACROSTRAT, "license": "CC-BY 4.0",
                           "tiles": "https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png",
                           "retrieved": date.today().isoformat(), "units": units})
    print(f"geology: {sum(u is not None for u in units.values())} of {len(units)} samples matched")


def build_market():
    """Land and deal prices over time (Arjin's tables) and the comparable deals the engine prices exits from."""
    land = list(csv.DictReader(io.StringIO(show(LAND_REF, "research/tok-land/alaska_land_sales_by_year.csv"))))
    rent = list(csv.DictReader(io.StringIO(show(LAND_REF, "research/tok-land/alaska_holding_costs_by_year.csv"))))
    deals = list(csv.DictReader(io.StringIO(show(LAND_REF, "research/tok-land/gold_deal_comparables.csv"))))
    comps = list(csv.DictReader(io.StringIO(show(ENGINE_REF, "research/decision-engine/bid-comparables.csv"))))
    keep_scope = ("Statewide", "Richardson, Alaska Highways")  # the DNR region that holds Tok
    write("market.json", {
        "sources": [source(LAND_REF, "research/tok-land/alaska_land_sales_by_year.csv",
                           "research/tok-land/alaska_holding_costs_by_year.csv", "research/tok-land/gold_deal_comparables.csv"),
                    source(ENGINE_REF, "research/decision-engine/bid-comparables.csv")],
        "land_sales": [{"year": int(r["year"]), "scope": r["scope"], "parcels": int(r["parcels"]),
                        "median_usd_per_acre": float(r["median_usd_per_acre"])} for r in land if r["scope"] in keep_scope],
        "rent_160ac": [{"year": int(r["mining_year_starting_sep_1"]),
                        "new": float(r["ak_rent_160ac_age_0_5"]) if r["ak_rent_160ac_age_0_5"] else None,
                        "age_6_10": float(r["ak_rent_160ac_age_6_10"]) if r["ak_rent_160ac_age_6_10"] else None,
                        "age_11_plus": float(r["ak_rent_160ac_age_11_plus"]) if r["ak_rent_160ac_age_11_plus"] else None}
                       for r in rent],
        "deals": [{k: r[k] for k in ("acquirer", "target", "asset_location", "deal_date", "price_usd_m", "stage",
                                     "link_to_tok_sites", "quality_flag", "source_url")} for r in deals],
        "comparables": [{"id": r["comp_id"], "region": r["region"], "date": r["announce_date"], "acres": float(r["acres"] or 0),
                         "usd_per_acre": float(r["usd_per_acre"]), "type": r["contract_type"], "stage": r["stage"],
                         "url": r["source_url"]} for r in comps if r["used"] == "yes" and r["usd_per_acre"]],
    })


def inside(lon, lat, ring):
    """Ray casting: whether a point is inside one polygon ring of [lon, lat] pairs."""
    hit = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lon < x1 + (lat - y1) * (x2 - x1) / (y2 - y1):
            hit = not hit
    return hit


def in_feature(lon, lat, geometry):
    polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return any(inside(lon, lat, poly[0]) and not any(inside(lon, lat, hole) for hole in poly[1:]) for poly in polygons)


OPEN_PLOT_M = 804.67  # one side of a 160-acre square, the size of a state claim


def build_plots():
    """The land plot each sample sits on: the real DNR claim that contains it (an active claim
    first, else the most recent lapsed one), or a drawn 160-acre square on unclaimed ground."""
    claims = json.loads((OUT / "claims.geojson").read_text())["features"]
    samples = json.loads((OUT / "geochem.json").read_text())["samples"]
    plots, by_claim = [], {}
    for s in samples:
        hits = [c for c in claims if in_feature(s["lon"], s["lat"], c["geometry"])]
        hits.sort(key=lambda c: (c["properties"]["status"] != "active", -(c["properties"]["start"] or 0)))
        if hits:
            c = hits[0]
            key = c["properties"]["id"]
            if key not in by_claim:
                by_claim[key] = {"kind": "claim", **c["properties"], "geometry": c["geometry"], "samples": []}
                plots.append(by_claim[key])
            by_claim[key]["samples"].append(s["id"])
        else:
            half_lat = OPEN_PLOT_M / 2 / 111_320
            half_lon = half_lat / math.cos(math.radians(s["lat"]))
            w, e, so, n = s["lon"] - half_lon, s["lon"] + half_lon, s["lat"] - half_lat, s["lat"] + half_lat
            plots.append({"kind": "open", "id": f"open:{s['id']}", "samples": [s["id"]],
                          "geometry": {"type": "Polygon", "coordinates": [[[w, so], [e, so], [e, n], [w, n], [w, so]]]}})
    describe_plots(plots, claims, samples)
    claimed = sum(p["kind"] == "claim" for p in plots)
    write("plots.json", {"claims_retrieved": json.loads((OUT / "claims.geojson").read_text())["retrieved"],
                         "open_plot_note": "Drawn 160-acre square centred on a sample on ground with no claim on record",
                         "plots": plots})
    print(f"plots: {len(plots)} ({claimed} claims holding {sum(len(p['samples']) for p in plots if p['kind'] == 'claim')} samples, "
          f"{len(plots) - claimed} open)")


TOK = (-142.9856, 63.3367)
MERIDIANS = {"C": "Copper River", "F": "Fairbanks", "K": "Kateel River", "S": "Seward", "U": "Umiat"}
PATHFINDERS = ["As", "Sb", "Bi", "Te", "W", "Mo", "Cu", "Ag"]


def mtrs_label(code):
    """DNR's MTRS reference, e.g. C017N008E23 -> Copper River Meridian, T17N R8E, Sec. 23."""
    m = re.fullmatch(r"([A-Z])(\d{3})([NS])(\d{3})([EW])(\d{2})", code or "")
    if not m:
        return None
    mer, t, ns, r, ew, sec = m.groups()
    return f"{MERIDIANS.get(mer, mer)} Meridian, T{int(t)}{ns} R{int(r)}{ew}, Sec. {int(sec)}"


def ring_of(geometry):
    return geometry["coordinates"][0] if geometry["type"] == "Polygon" else geometry["coordinates"][0][0]


def km_between(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(h))


def describe_plots(plots, claims, samples):
    """Give each plot a short ID (A-01 west site, B-01 east site, numbered west to east), its
    position, distances, ground summary and bedrock, all from files already in the showcase."""
    site_of = {}
    for site in ("a", "b"):
        for f in json.loads((OUT.parent / f"tok-gold/site-{site}/samples.geojson").read_text())["features"]:
            site_of[f["properties"]["sample_id"]] = site.upper()
    geochem = json.loads((OUT / "geochem.json").read_text())
    units = json.loads((OUT / "geology.json").read_text())["units"]
    occurrences = json.loads((OUT / "occurrences.json").read_text())["records"]
    gold_sites = [o for o in occurrences if "Au" in o["commodities"] + o["other"]]
    held = [c for c in claims if c["properties"]["status"] == "active"]
    by_sample = {s["id"]: s for s in samples}
    p90 = {e: geochem["thresholds"][e]["p90"] for e in PATHFINDERS}

    def level(value):
        return value if isinstance(value, (int, float)) else (value or {}).get("above") if value and "above" in value else None

    for plot in plots:
        ring = ring_of(plot["geometry"])
        pts = ring[:-1] if ring[0] == ring[-1] else ring
        centre = (sum(x for x, _ in pts) / len(pts), sum(y for _, y in pts) / len(pts))
        plot["site"] = site_of.get(plot["samples"][0], "?")
        plot["centre"] = [round(centre[0], 5), round(centre[1], 5)]
        plot["km_to_tok"] = round(km_between(centre, TOK), 1)
        nearest_held = 0.0 if plot.get("status") == "active" else min(
            km_between(centre, v) for c in held for v in ring_of(c["geometry"]))
        plot["km_to_held_claim"] = round(nearest_held, 1)
        g = min(gold_sites, key=lambda o: km_between(centre, (o["lon"], o["lat"])))
        plot["nearest_gold_site"] = {"name": g["name"], "type": g["type"], "km": round(km_between(centre, (g["lon"], g["lat"])), 1), "url": g["url"]}
        plot["pathfinders"] = [e for e in PATHFINDERS
                               if any((level(by_sample[s]["values"].get(e)) or 0) >= p90[e] for s in plot["samples"])]
        plot["bedrock"] = sorted({units[s]["name"] for s in plot["samples"] if units.get(s)})
        plot["notes"] = by_sample[plot["samples"][0]]["notes"]
        if plot["kind"] == "claim":
            plot["mtrs_label"] = mtrs_label(plot.get("mtrs"))
    for site in ("A", "B"):
        ranked = sorted((p for p in plots if p["site"] == site), key=lambda p: p["centre"][0])
        for n, plot in enumerate(ranked, 1):
            plot["label"] = f"{site}-{n:02d}"


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
                plan = solver.policy()
                lapse = next((m["month"] for m in plan if m["action"] == "LAPSE"), None)
                checks = de.analyse(c, arrival.with_q(q), policy["budget_usd"], policy["loss_limit_usd"])
                # Cash put in by each month on the no-buyer path (stages paid plus carry), undiscounted.
                spent, outlay = float(c["stages"][0]["payment_usd"]), []
                for m in plan:
                    if m["action"] == "PAY_STAGE":
                        spent += m["stage_payment_usd"]
                    elif m["action"] == "HOLD":
                        spent += c["carry_usd_per_month"] if m["position"] != "owned" else c["carry_after_exercise_usd_per_month"]
                        outlay.append(round(spent, 2))
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
                               "lapse_month_if_no_buyer": lapse,
                               # The engine's own month-by-month plan: sell if an offer reaches this, else hold.
                               "sell_if_offer_at_least_usd": [m["sell_if_offer_at_least_usd"] for m in plan if m["action"] == "HOLD"],
                               "outlay_usd_by_month": outlay,
                               "break_even": {k: (round(v, 4) if isinstance(v, float) else v) for k, v in checks["break_even"].items()},
                               "value_if_acceleration_flipped_usd": round(checks["assumption_checks"]["value_if_acceleration_flipped_usd"], 2)})
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
        # What buyers might offer for the 640-acre block (the headline bid set), per acre.
        "exit_offers_usd_per_acre": sorted(round(b["usd"] / bm["acres"], 2) for b in contract["bids"]),
        "bids_label": spec["labels"]["bids"],
        "gates": {k: v["status"] for k, v in spec["gates"].items()}})


if __name__ == "__main__":
    steps = {"claims": build_claims, "history": build_history, "town": build_town, "decision": build_decision,
             "geochem": build_geochem, "occurrences": build_occurrences, "geology": build_geology, "market": build_market,
             "plots": build_plots}
    for name in sys.argv[1:] or steps:
        steps[name]()
