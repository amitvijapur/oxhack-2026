"""Turn MiroFish's prepared society into frozen run folders, one per scenario and seed.

Usage:
    python swarm/build_runs.py <prepared_sim_dir> <out_dir> [--minutes-per-round 60] [--pilot-only]

Reads swarm/cast.json (the 61 roles with group, tier and temperament) and
swarm/scenarios.json (the pre-registered news). MiroFish's own persona text is
kept; only the temperament sentence, activity level, tier, news and seed change,
so every run shares one society (plan sections 4-5).
"""

import argparse
import csv
import difflib
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

TEMPERAMENT = {
    "cautious": ("You wait for confirmation before changing your view, trust official sources, "
                 "and rarely post first.", 0.4),
    "moderate": ("You update your view when the news is credible and react in proportion to it.", 0.55),
    "free": ("You act on instinct, take positions early and say what you think.", 0.7),
}

RUN_ORDER = [  # plan section 5: what the checks need comes first
    (1, "baseline", 1), (2, "baseline", 2), (3, "baseline", 3), (4, "placebo", 1),
    (5, "mine_approved", 1), (6, "court_blocks_mine", 1), (7, "tax_rise", 1),
    (8, "protest", 1), (9, "gold_back_to_4000", 1),
]

SIM_HOURS = 120  # 5 simulated days
DAY3_HOUR = 48
# MiroFish's own default for 61 entities (entities//15, entities//5). Its LLM-written config
# allowed up to 50 agents a round, roughly 5,000 model calls a run.
AGENTS_PER_HOUR = (4, 12)
# MiroFish stores countries in Chinese even when the prompts are English.
COUNTRY = {"美国": "United States", "加拿大": "Canada", "日本": "Japan", "瑞士": "Switzerland",
           "英国": "United Kingdom", "中国": "United States", "": "United States", None: "United States"}
# Personas sometimes describe how the character "would act in a simulation"; an agent that
# reads that may play itself as simulated, so those sentences are removed.
META = re.compile(r"\b(simulat\w*|fiction\w*|invented)\b", re.I)


def strip_meta(text: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", text or "")
    return " ".join(s for s in sentences if not META.search(s)).strip()


def norm(name: str) -> str:
    return re.sub(r"[^a-z ]", "", name.lower()).strip()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_prepared(sim_dir: Path):
    with open(sim_dir / "twitter_profiles.csv", newline="", encoding="utf-8") as f:
        twitter = list(csv.DictReader(f))
    reddit = json.loads((sim_dir / "reddit_profiles.json").read_text(encoding="utf-8"))
    config = json.loads((sim_dir / "simulation_config.json").read_text(encoding="utf-8"))
    return twitter, reddit, config


def match_cast(cast, reddit, config):
    """Map each cast member to a prepared agent id by name; unmatched cast members get None."""
    by_id = {a["agent_id"]: a for a in config.get("agent_configs", [])}
    names = {}
    for i, r in enumerate(reddit):
        # Zep may reword a name slightly, so the config's entity_name is a second chance.
        names[i] = {norm(r.get("name", "")), norm(by_id.get(i, {}).get("entity_name", ""))} - {""}
    taken, mapping = set(), {}
    for c in cast:
        target = norm(c["name"])
        exact = [i for i, ns in names.items() if target in ns and i not in taken]
        if exact:
            mapping[c["name"]] = exact[0]
        else:
            best, score = None, 0.0
            for i, ns in names.items():
                if i in taken:
                    continue
                s = max(difflib.SequenceMatcher(None, target, n).ratio() for n in ns) if ns else 0
                if s > score:
                    best, score = i, s
            mapping[c["name"]] = best if score >= 0.85 else None
        if mapping[c["name"]] is not None:
            taken.add(mapping[c["name"]])
    extras = [reddit[i].get("name") for i in names if i not in taken]
    return mapping, extras


def build_society(cast, twitter, reddit, config):
    mapping, extras = match_cast(cast, reddit, config)
    by_id = {a["agent_id"]: a for a in config.get("agent_configs", [])}
    tw_rows, rd_rows, agent_cfgs, report = [], [], [], {"extras_dropped": extras, "synthesized": []}
    for new_id, c in enumerate(cast):
        old = mapping[c["name"]]
        if old is None:
            # Missing from extraction: build the profile from the cast sheet instead of dropping the role.
            report["synthesized"].append(c["name"])
            handle = re.sub(r"[^a-z0-9]", "_", c["name"].lower())
            rd = {"username": handle, "name": c["name"], "bio": c["role"][:150], "persona": c["background"],
                  "karma": 1000, "age": 40, "gender": "other", "mbti": "ISTJ", "country": "United States"}
            base_cfg = {}
        else:
            rd = dict(reddit[old])
            base_cfg = dict(by_id.get(old, {}))
        sentence, activity = TEMPERAMENT[c["temperament"]]
        persona = f"{strip_meta(rd.get('persona', ''))} {sentence}".strip()
        rd.update({"user_id": new_id, "name": c["name"], "persona": persona,
                   "bio": strip_meta(rd.get("bio", ""))[:150] or c["role"][:150]})
        rd["country"] = COUNTRY.get(rd.get("country"), rd.get("country"))
        rd_rows.append(rd)
        # The Reddit bio is cut to 150 characters; the Twitter description keeps the full one.
        full_bio = twitter[old].get("description") if old is not None and old < len(twitter) else None
        bio = strip_meta(full_bio or rd.get("bio") or c["role"]).replace("\n", " ") or c["role"]
        tw_rows.append({"user_id": new_id, "name": c["name"], "username": rd["username"],
                        "user_char": f"{bio} {persona}".replace("\n", " "), "description": bio})
        cfg = {k: v for k, v in base_cfg.items() if k not in ("agent_id",)}
        cfg.update({"agent_id": new_id, "entity_name": c["name"], "tier": c["tier"],
                    "activity_level": 0.0 if c["group"] == "News wire" else activity})
        cfg.setdefault("active_hours", list(range(8, 23)))
        agent_cfgs.append(cfg)
    return tw_rows, rd_rows, agent_cfgs, report


def write_run(out: Path, config, tw_rows, rd_rows, agent_cfgs, scenarios, scenario, seed, minutes):
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "twitter_profiles.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["user_id", "name", "username", "user_char", "description"])
        w.writeheader()
        w.writerows(tw_rows)
    (out / "reddit_profiles.json").write_text(json.dumps(rd_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    wire = next(a["agent_id"] for a in agent_cfgs if a["activity_level"] == 0.0)
    cfg = json.loads(json.dumps(config))
    cfg["agent_configs"] = agent_cfgs
    cfg["seed"] = seed
    cfg["scenario"] = scenario
    tc = cfg.setdefault("time_config", {})
    tc["total_simulation_hours"] = SIM_HOURS
    tc["minutes_per_round"] = minutes
    tc["agents_per_hour_min"], tc["agents_per_hour_max"] = AGENTS_PER_HOUR
    ev = cfg.setdefault("event_config", {})
    ev["initial_posts"] = [{"poster_agent_id": wire, "poster_type": "NewsWire", "content": scenarios["day1"]}]
    day3 = scenarios["day3"].get(scenario)
    ev["scheduled_events"] = ([{"round": DAY3_HOUR * 60 // minutes, "poster_agent_id": wire, "content": day3}]
                              if day3 else [])
    (out / "simulation_config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"folder": out.name, "scenario": scenario, "seed": seed,
            "twitter_profiles_sha256": sha256(out / "twitter_profiles.csv"),
            "reddit_profiles_sha256": sha256(out / "reddit_profiles.json")}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prepared", type=Path)
    p.add_argument("out", type=Path)
    p.add_argument("--minutes-per-round", type=int, default=60)
    p.add_argument("--pilot-only", action="store_true")
    a = p.parse_args()

    cast = json.loads((HERE / "cast.json").read_text(encoding="utf-8"))
    scenarios = json.loads((HERE / "scenarios.json").read_text(encoding="utf-8"))
    twitter, reddit, config = load_prepared(a.prepared)
    tw_rows, rd_rows, agent_cfgs, report = build_society(cast, twitter, reddit, config)

    runs = [(0, "baseline", 1)] if a.pilot_only else RUN_ORDER
    manifest = {"prepared_from": str(a.prepared), "minutes_per_round": a.minutes_per_round,
                "agents": len(agent_cfgs), **report, "runs": []}
    for n, scenario, seed in runs:
        name = "pilot_baseline_s1" if n == 0 else f"{n:02d}_{scenario}_s{seed}"
        manifest["runs"].append(write_run(a.out / name, config, tw_rows, rd_rows, agent_cfgs,
                                          scenarios, scenario, seed, a.minutes_per_round))
    (a.out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    shas = {(r["twitter_profiles_sha256"], r["reddit_profiles_sha256"]) for r in manifest["runs"]}
    print(json.dumps({k: v for k, v in manifest.items() if k != "runs"}, ensure_ascii=False, indent=2))
    print(f"{len(manifest['runs'])} run folders; identical profiles across runs: {len(shas) == 1}")
    return 0 if len(shas) == 1 else 1


if __name__ == "__main__":
    sys.exit(main())
