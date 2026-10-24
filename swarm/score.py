"""Score the gold swarm runs with the measurement pre-registered in research/gold-swarm-plan.md section 6.

Usage:
    python swarm/score.py judge <run_dir>...
    python swarm/score.py report <runs_root>
    python swarm/score.py sample <run_dir> [--n 30] [--force]
    python swarm/score.py validate <sample_csv> <key_csv>

judge scores every post, comment and quote by a non-news-wire agent with swarm/judge_prompt.txt on
gpt-5.4-mini and writes <run_dir>/scores.jsonl. Replies are cached in swarm/records/judge_cache.jsonl
by the prompt's sha256, so re-running costs nothing. report reads the run folders under the names
swarm/build_runs.py gives them and writes <runs_root>/results.json and results.md. sample and validate
are the 30-post human check of the judge (plan section 7, step 5).
"""

import argparse
import csv
import hashlib
import json
import math
import random
import re
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from build_runs import RUN_ORDER

HERE = Path(__file__).resolve().parent
ENV_FILE = Path(__file__).resolve().parents[2] / "MiroFish" / ".env"  # MiroFish sits next to this repo
CACHE_FILE = HERE / "records" / "judge_cache.jsonl"
MODEL = "gpt-5.4-mini"
WORKERS = 8
ATTEMPTS = 8
SEED = 2026  # fixed, so the grounding sample and the human-check sample can be redrawn exactly

# The author's own words. Other action_args (post_content, original_content, comment_content)
# quote someone else, and likes and reposts add no text.
TEXT_FIELD = {"CREATE_POST": "content", "CREATE_COMMENT": "content", "QUOTE_POST": "quote_content"}

GROUPS = {  # cast.json group -> measurement group; the news wire is not measured
    "Government": "government",
    "Land side: industry": "land_industry",
    "Land side: community": "land_community",
    "Funds": "funds",
    "Retail": "retail",
}
MEASURED = list(GROUPS.values())
DAYS = (1, 2, 3, 4, 5)
AFTER_NEWS = (3, 4, 5)

EXPECTED = {  # plan section 6, "Expected directions", against the seed-1 baseline: +1 up, -1 down
    "mine_approved": {"funds": 1, "government": 1, "land_community": -1},
    "tax_rise": {"funds": -1, "land_industry": -1},
    "protest": {"land_community": -1, "government": -1, "funds": -1},
    "court_blocks_mine": {"funds": -1},
    "gold_back_to_4000": {"funds": -1, "retail": -1},
}

# call -> (interview field, allowed answers, cast groups whose majority makes the call). The policy
# question's "what" is a free sentence, so its timing is the part a majority can be taken over.
CALLS = {
    "price": ("gold_direction", ("up", "flat", "down"), ("Funds",)),
    "policy": ("state_move_timing", ("days", "weeks", "months"), ("Government",)),
    "leaning": ("local_leaning", ("for", "against", "split"), ("Land side: industry", "Land side: community")),
}

GROUNDING_PROMPT = '''You are checking one interview answer from a social media simulation about gold mining near Tok, Alaska.

After the simulation, an agent was asked for "one specific post you saw or fact you know that most drives your view". Decide whether its answer refers to a post from the simulation run or to a fact in the seed documents the simulation was built from. The posts listed below are the five from that run whose wording is closest to the answer.

Answer "yes" if the answer refers to one of these posts, or states a fact found in the seed documents, even in paraphrase. Answer "no" if it refers to something found in neither, or names no specific post or fact.

Reply with JSON only: {"grounded": "yes" or "no", "reason": "<at most 12 words>"}

Seed documents:
{seed}

Closest posts from the run:
{posts}

The agent's answer:
"""
{evidence}
"""
'''

STOPWORDS = frozenset(
    "a an and are as at be been but by for from had has have i if in into is it its me my of on or our so "
    "that the their them they this to was we were what when which who will with would you your".split())


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path):
    rows, bad = [], 0
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                bad += 1  # a run killed mid-write leaves a torn last line
    if bad:
        print(f"warning: skipped {bad} unreadable lines in {path}")
    return rows


def read_csv(path):
    # Excel may re-save the sheet in the local code page; only id and muhd_score need to survive.
    with open(path, encoding="utf-8-sig", errors="replace", newline="") as f:
        return list(csv.DictReader(f))


def load_cast():
    return {c["name"]: c for c in load_json(HERE / "cast.json")}


def identify(name, cast):
    c = cast.get(name)
    return (c["group"], c["role"]) if c else ("unknown", "unknown role")


def run_name(n, scenario, seed):
    return f"{n:02d}_{scenario}_s{seed}"  # build_runs.py's folder names


def mean(values):
    values = [v for v in values if v is not None]
    return sum(values) / len(values) if values else None


def beyond(x, band):
    # Means of integer scores can tie a band exactly; the margin keeps float noise from breaking the tie.
    return abs(x) > band + 1e-9


def day_of(round_num, minutes_per_round):
    # Logged round r >= 1 starts at simulated minute (r - 1) * minutes_per_round; round 0 is the day-1 news.
    return (max(round_num, 1) - 1) * minutes_per_round // 1440 + 1


def run_posts(run_dir, config):
    """Every distinct post, comment and quote text in a run, both platforms, in log order."""
    minutes = config.get("time_config", {}).get("minutes_per_round", 30)  # the runner's own default
    posts, seen = [], set()
    for platform in ("twitter", "reddit"):
        path = run_dir / platform / "actions.jsonl"
        if not path.exists():
            continue
        for a in read_jsonl(path):
            field = TEXT_FIELD.get(a.get("action_type"))
            text = (a.get("action_args") or {}).get(field) if field else None
            # Round-0 posts are logged again at round 1, so an identical row is the same post.
            if not isinstance(text, str) or not text.strip() or (platform, a["agent_id"], text) in seen:
                continue
            seen.add((platform, a["agent_id"], text))
            posts.append({"platform": platform, "round": a["round"], "day": day_of(a["round"], minutes),
                          "agent_id": a["agent_id"], "name": a.get("agent_name", f"Agent_{a['agent_id']}"),
                          "text": text})
    return posts


def news_wire_ids(config, cast):
    """The agents whose posts are the injected news rather than reactions to it."""
    events = config.get("event_config", {})
    posted = (events.get("initial_posts") or []) + (events.get("scheduled_events") or [])
    ids = {p.get("poster_agent_id") for p in posted}
    ids |= {a["agent_id"] for a in config.get("agent_configs", [])
            if identify(a.get("entity_name"), cast)[0] == "News wire"}
    return ids


class StopCalls(RuntimeError):
    """An error every further call would hit too: a bad key, model or URL, or no quota left."""


class Client:
    """Chat completions on the key MiroFish already uses. The key is never printed."""

    def __init__(self):
        env = {}
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            name, sep, value = line.partition("=")
            if sep and not name.strip().startswith("#"):
                env[name.strip()] = value.strip().strip("'\"")
        self.url = env["LLM_BASE_URL"].rstrip("/") + "/chat/completions"
        self._key = env["LLM_API_KEY"]
        self.calls = 0
        self._lock = threading.Lock()

    def _redact(self, text):
        # OpenAI's 401 body echoes a masked key; nothing key-shaped goes to the console.
        return re.sub(r"sk-[\w*-]+", "sk-<redacted>", text.replace(self._key, "<key>"))

    def complete(self, prompt):
        # Low reasoning effort was accepted by gpt-5.4-mini in a test call; a short JSON label needs no more.
        body = json.dumps({"model": MODEL, "messages": [{"role": "user", "content": prompt}],
                           "response_format": {"type": "json_object"},
                           "reasoning_effort": "low"}).encode("utf-8")
        for attempt in range(ATTEMPTS):
            with self._lock:
                self.calls += 1
            request = urllib.request.Request(self.url, data=body, method="POST", headers={
                "Authorization": f"Bearer {self._key}", "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    return json.loads(response.read())["choices"][0]["message"]["content"]
            except urllib.error.HTTPError as e:
                detail = self._redact(e.read().decode("utf-8", "replace"))[:300]
                # An empty quota comes back as a 429 too, but waiting won't refill it.
                if e.code in (401, 403, 404) or "insufficient_quota" in detail:
                    raise StopCalls(f"HTTP {e.code}: {detail}") from None
                if e.code != 429 and e.code < 500:
                    raise RuntimeError(f"HTTP {e.code}: {detail}") from None
                try:
                    wait = float(e.headers.get("Retry-After") or 2 ** attempt)
                except ValueError:
                    wait = 2 ** attempt
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                wait = 2 ** attempt
            if attempt < ATTEMPTS - 1:
                time.sleep(min(wait, 60) + random.random())
        raise RuntimeError(f"no answer after {ATTEMPTS} attempts (rate limits or server errors)")


class Cache:
    """Model replies keyed by the prompt's sha256, appended as they arrive so an interrupted run keeps its work."""

    def __init__(self, path):
        self.path = path
        self.replies = {row["key"]: row["content"] for row in read_jsonl(path)} if path.exists() else {}
        self._lock = threading.Lock()

    @staticmethod
    def key(prompt):
        return hashlib.sha256(prompt.encode("utf-8")).hexdigest()

    def get(self, prompt):
        return self.replies.get(self.key(prompt))

    def put(self, prompt, content):
        with self._lock:
            self.replies[self.key(prompt)] = content
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.path, "a", encoding="utf-8") as f:
                f.write(json.dumps({"key": self.key(prompt), "model": MODEL, "content": content},
                                   ensure_ascii=False) + "\n")


def fetch(cache, prompts, parse):
    """Ask the model every prompt not cached yet, WORKERS at a time. Returns ({prompt: error}, API calls)."""
    todo = [p for p in dict.fromkeys(prompts) if cache.get(p) is None]
    if not todo:
        return {}, 0
    client = Client()
    errors = {}

    def ask(prompt):
        content = client.complete(prompt)
        parse(content)  # a malformed reply stays uncached, so the next run asks again
        cache.put(prompt, content)

    start, stopped = time.time(), False
    with ThreadPoolExecutor(WORKERS) as pool:
        futures = {pool.submit(ask, p): p for p in todo}
        for done, future in enumerate(as_completed(futures), 1):
            if future.cancelled():
                continue
            try:
                future.result()
            except StopCalls as exc:
                errors[futures[future]] = str(exc)
                if not stopped:
                    # Thousands of queued posts would each hit the same wall, so the queue is dropped.
                    print(f"  stopping: {exc}")
                    stopped = True
                    for f in futures:
                        f.cancel()
            except Exception as exc:
                errors[futures[future]] = str(exc)
            if done % 100 == 0 or done == len(todo):
                print(f"  {done}/{len(todo)} done, {len(errors)} failed, {time.time() - start:.0f}s")
    if stopped:
        print(f"  {sum(f.cancelled() for f in futures)} prompts were never sent")
    return errors, client.calls


def parse_score(content):
    """(score, reason) from a judge reply, with None for n/a. Raises ValueError if malformed."""
    reply = json.loads(content)
    if not isinstance(reply, dict):
        raise ValueError(f"judge replied {content[:80]!r}")
    score = reply.get("score")
    if isinstance(score, str) and score.strip().lower() == "n/a":
        score = None
    elif isinstance(score, str) and score.strip().isdigit():
        score = int(score)
    elif isinstance(score, float) and score.is_integer():
        score = int(score)
    if score is not None and (isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 10):
        raise ValueError(f"judge gave score {score!r}")
    return score, str(reply.get("reason", ""))


def parse_grounded(content):
    reply = json.loads(content)
    verdict = str(reply.get("grounded", "")).strip().lower() if isinstance(reply, dict) else ""
    if verdict not in ("yes", "no", "true", "false"):
        raise ValueError(f"grounding judge gave {verdict!r}")
    return verdict in ("yes", "true"), str(reply.get("reason", ""))


def cmd_judge(args):
    cast = load_cast()
    template = (HERE / "judge_prompt.txt").read_text(encoding="utf-8")
    runs = []
    for run_dir in args.run_dirs:
        config = load_json(run_dir / "simulation_config.json")
        wire = news_wire_ids(config, cast)
        posts = [p for p in run_posts(run_dir, config) if p["agent_id"] not in wire]
        for p in posts:
            p["group"], role = identify(p["name"], cast)
            # The text goes in last, so a post that happens to contain "{role}" is left as written.
            p["prompt"] = template.replace("{author}", p["name"]).replace("{role}", role).replace("{text}", p["text"])
        runs.append((run_dir, posts))

    cache = Cache(CACHE_FILE)
    prompts = [p["prompt"] for _, posts in runs for p in posts]
    uncached = sum(1 for p in dict.fromkeys(prompts) if cache.get(p) is None)
    print(f"{len(prompts)} posts to score in {len(runs)} runs; {uncached} need an API call")
    errors, calls = fetch(cache, prompts, parse_score)
    print(f"API calls made: {calls}")

    failed_runs = 0
    for run_dir, posts in runs:
        rows, failures = [], []
        for p in posts:
            content = cache.get(p["prompt"])
            try:
                if content is None:
                    raise ValueError(errors.get(p["prompt"], "no reply"))
                score, reason = parse_score(content)
            except ValueError as exc:
                failures.append(f"{p['platform']} round {p['round']} {p['name']}: {exc}")
                continue
            rows.append({"platform": p["platform"], "round": p["round"], "day": p["day"],
                         "agent_id": p["agent_id"], "name": p["name"], "group": p["group"],
                         "score": score, "reason": reason, "text": p["text"]})
        if failures:
            # A partial scores.jsonl would read as n/a downstream, so the run waits for a clean re-run.
            failed_runs += 1
            print(f"{run_dir}: {len(failures)} posts failed, scores.jsonl not written; re-run judge to retry them")
            for line in failures[:5]:
                print(f"  {line}")
            continue
        with open(run_dir / "scores.jsonl", "w", encoding="utf-8") as f:
            for row in rows:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        on_topic = sum(1 for r in rows if r["score"] is not None)
        print(f"{run_dir}: {len(rows)} posts scored ({on_topic} on topic, {len(rows) - on_topic} n/a)")
    return 1 if failed_runs else 0


def daily(rows):
    """Daily support (mean score) and heat (on-topic posts) per measured group."""
    scores = defaultdict(list)
    for r in rows:
        group = GROUPS.get(r["group"])
        if group and r["score"] is not None and r["day"] in DAYS:
            scores[group, r["day"]].append(r["score"])
    return {g: {d: {"support": mean(scores[g, d]), "heat": len(scores[g, d])} for d in DAYS} for g in MEASURED}


def parse_answer(response):
    """The JSON object in an interview reply, or None. Agents sometimes wrap it in prose or a code fence."""
    if isinstance(response, dict):
        return response
    if not isinstance(response, str):
        return None
    for text in (response, response[response.find("{"):response.rfind("}") + 1]):
        try:
            answer = json.loads(text)
        except json.JSONDecodeError:
            continue
        if isinstance(answer, dict):
            return answer
    return None


def load_answers(run_dir, config, cast):
    """One answer per agent and platform from MiroFish's batch-interview response, or None if not interviewed."""
    path = run_dir / "interviews.json"
    if not path.exists():
        return None
    results = (load_json(path).get("result") or {}).get("results") or {}
    names = {a["agent_id"]: a.get("entity_name") for a in config.get("agent_configs", [])}
    answers = []
    for key in sorted(results):
        r = results[key]
        name = names.get(r.get("agent_id"), f"Agent_{r.get('agent_id')}")
        entry = {"key": key, "platform": r.get("platform"), "agent_id": r.get("agent_id"), "name": name,
                 "group": identify(name, cast)[0], "answer": parse_answer(r.get("response"))}
        if entry["answer"] is None:
            entry["unparsed"] = r.get("response")
        answers.append(entry)
    return answers


def number(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"[-+]?\d+(?:\.\d+)?", str(value or ""))
    return float(match.group()) if match else None


def make_calls(answers):
    """The run's call per question: the most common answer in its group; a tie makes no call."""
    calls = {}
    for call, (field, allowed, groups) in CALLS.items():
        mine = [a for a in answers if a["group"] in groups]
        votes = Counter()
        for a in mine:
            value = str((a["answer"] or {}).get(field, "")).strip().lower()
            if value in allowed:
                votes[value] += 1
        ranked = votes.most_common()
        top = ranked[0][0] if ranked and (len(ranked) == 1 or ranked[0][1] > ranked[1][1]) else None
        calls[call] = {"call": top, "votes": dict(ranked), "answers": len(mine)}
    # Agents disagree on whether a fall is a negative move, so the size is taken unsigned.
    moves = [abs(x) for a in answers if a["group"] == "Funds" and a["answer"]
             and str(a["answer"].get("gold_direction", "")).strip().lower() == calls["price"]["call"]
             and (x := number(a["answer"].get("gold_move_pct"))) is not None]
    calls["price"]["median_move_pct"] = statistics.median(moves) if moves else None
    calls["policy"]["statements"] = [
        {"name": a["name"], "platform": a["platform"], "timing": (a["answer"] or {}).get("state_move_timing"),
         "next_move": (a["answer"] or {}).get("state_next_move")}
        for a in answers if a["group"] == "Government"]
    return calls


def summarize(run_dir, cast):
    config = load_json(run_dir / "simulation_config.json")
    run = {"folder": run_dir.name, "scenario": config.get("scenario"), "seed": config.get("seed"),
           "minutes_per_round": config.get("time_config", {}).get("minutes_per_round", 30),
           "tiers": dict(sorted(Counter(str(a.get("tier")) for a in config.get("agent_configs", [])).items()))}
    meta = run_dir / "run_meta.json"
    if meta.exists():
        m = load_json(meta)
        run["models"] = {k: v for k, v in (m.get("models") or {}).items() if "MODEL" in k}
        run["outcome"] = m.get("outcome")
    run["status"] = "judged" if (run_dir / "scores.jsonl").exists() else "not judged"
    if run["status"] == "judged":
        rows = read_jsonl(run_dir / "scores.jsonl")
        run["daily"] = daily(rows)
        run["days3to5"] = {g: mean(run["daily"][g][d]["support"] for d in AFTER_NEWS) for g in MEASURED}
        # A name missing from cast.json would silently drop that agent out of every group mean.
        run["unmapped_posts"] = sum(1 for r in rows if r["group"] not in GROUPS)
    answers = load_answers(run_dir, config, cast)
    if answers is not None:
        run["calls"] = make_calls(answers)
        run["unparsed_answers"] = sum(1 for a in answers if a["answer"] is None)
    return run, config, answers


def compute_effects(runs):
    """Chance band per group, and effect and timing per scenario and group (plan section 6)."""
    judged = {name: r for name, r in runs.items() if "daily" in r}
    baselines = [judged.get(run_name(n, s, seed)) for n, s, seed in RUN_ORDER if s == "baseline"]
    base = judged.get(run_name(1, "baseline", 1))
    band = {}
    for g in MEASURED:
        values = [r["days3to5"][g] for r in baselines if r is not None]
        band[g] = max(values) - min(values) if len(values) == len(baselines) and None not in values else None
    effects = {}
    if base is None:
        return band, effects
    for n, scenario, seed in RUN_ORDER:
        run = judged.get(run_name(n, scenario, seed))
        if scenario == "baseline" or run is None:
            continue
        effects[scenario] = {}
        for g in MEASURED:
            x, b = run["days3to5"][g], base["days3to5"][g]
            effect = x - b if x is not None and b is not None else None
            timing = None
            if band[g] is not None:
                timing = "none"
                for d in AFTER_NEWS:
                    s, t = run["daily"][g][d]["support"], base["daily"][g][d]["support"]
                    if s is not None and t is not None and beyond(s - t, band[g]):
                        timing = d
                        break
            effects[scenario][g] = {
                "effect": effect, "band": band[g],
                "beyond_band": beyond(effect, band[g]) if effect is not None and band[g] is not None else None,
                "expected": {1: "up", -1: "down"}.get(EXPECTED.get(scenario, {}).get(g)),
                "timing": timing,
            }
    return band, effects


def num(x, signed=False):
    if x is None:
        return "n/a"
    return f"{x:+.2f}" if signed else f"{x:.2f}"


def part(name, status, detail):
    return {"part": name, "status": status, "detail": detail}


def check(parts):
    statuses = {p["status"] for p in parts}
    if "fail" in statuses:
        status = "fail"
    elif statuses <= {"not run"}:
        status = "not run"
    elif "not run" in statuses:
        status = "pass, partly not run"
    else:
        status = "pass"
    return {"status": status, "parts": parts}


def check_placebo(effects, band):
    placebo = effects.get("placebo")
    missing = [g for g in MEASURED if band[g] is None]
    if placebo is None:
        return check([part("placebo and real shocks", "not run", "the placebo run (04) is missing or not judged")])
    if missing:
        return check([part("placebo and real shocks", "not run",
                           f"no chance band for {', '.join(missing)} (needs runs 01-03 judged)")])
    quiet = all(placebo[g]["effect"] is not None and not beyond(placebo[g]["effect"], band[g]) for g in MEASURED)
    moves = "; ".join(f"{g} {num(placebo[g]['effect'], True)} (band {num(band[g])})" for g in MEASURED)
    parts = [part("placebo moves no group beyond its band", "pass" if quiet else "fail", moves)]
    for scenario, directions in EXPECTED.items():
        shock = effects.get(scenario)
        if shock is None:
            parts.append(part(scenario, "not run", "run missing or not judged"))
            continue
        hit, notes = False, []
        for g, sign in directions.items():
            x, p = shock[g]["effect"], placebo[g]["effect"]
            ok = (x is not None and p is not None and x * sign > 0 and beyond(x, band[g])
                  and abs(x) > abs(p) + 1e-9)
            hit = hit or ok
            notes.append(f"{g} {num(x, True)} (expected {'up' if sign > 0 else 'down'}; band {num(band[g])}, "
                         f"placebo {num(None if p is None else abs(p))}){' qualifies' if ok else ''}")
        parts.append(part(scenario, "pass" if hit else "fail", "; ".join(notes)))
    return check(parts)


def check_mirrors(effects, band):
    parts = []
    approved, blocked = effects.get("mine_approved"), effects.get("court_blocks_mine")
    name = "funds move opposite ways after mine approved and court blocks, both beyond the band"
    if approved is None or blocked is None or band["funds"] is None:
        parts.append(part(name, "not run", "needs runs 05 and 06 and the three baselines judged"))
    else:
        x, y = approved["funds"]["effect"], blocked["funds"]["effect"]
        ok = x is not None and y is not None and x * y < 0 and beyond(x, band["funds"]) and beyond(y, band["funds"])
        parts.append(part(name, "pass" if ok else "fail",
                          f"mine_approved {num(x, True)}, court_blocks_mine {num(y, True)}, band {num(band['funds'])}"))
    back = effects.get("gold_back_to_4000")
    name = "funds and retail fall beyond their bands when gold drops back"
    if back is None or band["funds"] is None or band["retail"] is None:
        parts.append(part(name, "not run", "needs run 09 and the three baselines judged"))
    else:
        ok = all(back[g]["effect"] is not None and back[g]["effect"] < 0 and beyond(back[g]["effect"], band[g])
                 for g in ("funds", "retail"))
        parts.append(part(name, "pass" if ok else "fail", "; ".join(
            f"{g} {num(back[g]['effect'], True)} (band {num(band[g])})" for g in ("funds", "retail"))))
    return check(parts)


def check_stability(runs):
    baselines = [runs.get(run_name(n, s, seed)) for n, s, seed in RUN_ORDER if s == "baseline"]
    if any(r is None or "calls" not in r for r in baselines):
        return check([part("baseline calls", "not run", "needs interviews.json in runs 01-03")])
    parts = []
    for call in CALLS:
        values = [r["calls"][call]["call"] for r in baselines]
        top = Counter(v for v in values if v is not None).most_common(1)
        ok = bool(top) and top[0][1] >= 2
        parts.append(part(call, "pass" if ok else "fail", " / ".join(v or "no majority" for v in values)))
    return check(parts)


def words(text):
    # Commas go first, so "$4,500" and "$4500" count as the same word.
    return set(re.findall(r"[a-z0-9$%]+", text.lower().replace(",", ""))) - STOPWORDS


def check_grounding(pool, posts_by_run, cache):
    """At least 14 of 20 sampled answers cite a post in their run or a seed fact. Returns (check, sample, calls)."""
    if len(pool) < 20:
        return check([part("20 sampled answers", "not run", f"only {len(pool)} interview answers so far")]), [], 0
    seed_text = "\n\n".join(f"=== {p.name} ===\n{p.read_text(encoding='utf-8').strip()}"
                            for p in sorted((HERE / "seed").glob("*.md")))
    sample = []
    for folder, a in random.Random(SEED).sample(pool, 20):
        evidence = (a["answer"] or {}).get("evidence")
        if evidence is not None and not isinstance(evidence, str):
            evidence = json.dumps(evidence, ensure_ascii=False)
        item = {"run": folder, "name": a["name"], "platform": a["platform"], "evidence": evidence}
        if evidence and evidence.strip():
            target = words(evidence)
            # sorted() is stable, so equal overlaps keep log order.
            closest = sorted(posts_by_run[folder], key=lambda p: -len(target & words(p["text"])))[:5]
            listed = "\n".join(f"{i}. [{p['platform']}, day {p['day']}] {p['name']}: {' '.join(p['text'].split())}"
                               for i, p in enumerate(closest, 1))
            item["prompt"] = (GROUNDING_PROMPT.replace("{seed}", seed_text).replace("{posts}", listed or "(none)")
                              .replace("{evidence}", evidence))
        sample.append(item)
    errors, calls = fetch(cache, [s["prompt"] for s in sample if "prompt" in s], parse_grounded)
    for s in sample:
        prompt = s.pop("prompt", None)
        if prompt is None:
            s["grounded"], s["reason"] = False, "no evidence given, or the answer was not JSON"
        elif cache.get(prompt) is None:
            s["grounded"], s["reason"] = None, f"error: {errors.get(prompt, 'no reply')}"
        else:
            s["grounded"], s["reason"] = parse_grounded(cache.get(prompt))
    if any(s["grounded"] is None for s in sample):
        return check([part("20 sampled answers", "not run", "some grounding calls failed; re-run report")]), \
            sample, calls
    yes = sum(1 for s in sample if s["grounded"])
    return check([part("20 sampled answers", "pass" if yes >= 14 else "fail",
                       f"{yes} of 20 grounded (needs 14)")]), sample, calls


def cmd_report(args):
    root = args.runs_root
    cast = load_cast()
    runs, posts_by_run, pool = {}, {}, []
    expected = {run_name(n, s, seed): (n, s, seed) for n, s, seed in RUN_ORDER}
    for run_dir in sorted(p for p in root.iterdir() if (p / "simulation_config.json").exists()):
        run, config, answers = summarize(run_dir, cast)
        runs[run_dir.name] = run
        if run_dir.name in expected:
            _, scenario, seed = expected[run_dir.name]
            if (run["scenario"], run["seed"]) != (scenario, seed):
                print(f"warning: {run_dir.name} config says scenario {run['scenario']!r}, seed {run['seed']!r}")
            if answers:
                posts_by_run[run_dir.name] = run_posts(run_dir, config)
                pool += [(run_dir.name, a) for a in answers]
        if "daily" not in run:
            print(f"note: {run_dir.name} has no scores.jsonl; run `score.py judge` on it first")
        elif run["unmapped_posts"]:
            print(f"warning: {run_dir.name} has {run['unmapped_posts']} posts by agents outside cast.json's groups")
    order = list(expected) + sorted(set(runs) - set(expected))

    band, effects = compute_effects(runs)
    grounding, sample, calls = check_grounding(pool, posts_by_run, Cache(CACHE_FILE))
    results = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "judge_model": MODEL,
        "checks": {"placebo": check_placebo(effects, band), "mirrors": check_mirrors(effects, band),
                   "stability": check_stability(runs), "grounding": grounding},
        "chance_band": band,
        "effects": {scenario: dict(sorted(groups.items(), key=lambda kv: (kv[1]["effect"] is None,
                                                                          -abs(kv[1]["effect"] or 0))))
                    for scenario, groups in effects.items()},
        "runs": [runs[name] if name in runs else {"folder": name, "scenario": expected[name][1],
                                                  "seed": expected[name][2], "status": "not run"}
                 for name in order],
        "grounding_sample": sample,
    }
    (root / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    (root / "results.md").write_text(render(results, expected), encoding="utf-8")

    missing = [name for name in expected if name not in runs]
    print(f"{len(runs)} run folders; missing from the run order: {', '.join(missing) or 'none'}")
    for name, c in results["checks"].items():
        print(f"  {name}: {c['status']}")
    print(f"API calls made: {calls}")
    print(f"wrote {root / 'results.json'} and {root / 'results.md'}")
    return 1 if any(s["grounded"] is None for s in sample) else 0


def render(results, expected):
    out = ["# Gold swarm results", "",
           f"Generated {results['generated']} by `swarm/score.py report`. Support is scored 0-10 by "
           f"{results['judge_model']} with the pre-registered prompt (`swarm/judge_prompt.txt`).", "",
           "## Checks", "", "| Check | Result | Detail |", "|---|---|---|"]
    for name, c in results["checks"].items():
        detail = "<br>".join(f"{p['part']}: **{p['status']}**. {p['detail']}" for p in c["parts"])
        out.append(f"| {name.capitalize()} | **{c['status']}** | {detail.replace('|', '/')} |")

    out += ["", "## Effects", "",
            "Effect: a group's mean daily support over days 3-5 minus the seed-1 baseline's. Chance band: max minus "
            "min of that mean across the three baselines. Timing: the first day (3-5) whose daily difference from "
            "the baseline exceeds the band. Groups are ranked by the size of their effect within each scenario.", "",
            "| Run | Scenario | Group | Effect | Chance band | Beyond band | Expected | Timing |",
            "|---|---|---|---|---|---|---|---|"]
    for name, (n, scenario, _) in expected.items():
        if scenario == "baseline":
            continue
        if scenario not in results["effects"]:
            out.append(f"| {n:02d} | {scenario} | all | not run | | | | |")
            continue
        for g, e in results["effects"][scenario].items():
            beyond_band = {True: "yes", False: "no", None: "n/a"}[e["beyond_band"]]
            expected_move = e["expected"] or ("no move" if scenario == "placebo" else "")
            timing = {None: "n/a", "none": "none"}.get(e["timing"], f"day {e['timing']}")
            out.append(f"| {n:02d} | {scenario} | {g} | {num(e['effect'], True)} | {num(e['band'])} | {beyond_band} "
                       f"| {expected_move} | {timing} |")

    out += ["", "## Calls", "",
            "The most common interview answer: price from the funds, policy timing from government, leaning from "
            "the land side. Counts are answers (each agent answers once per platform).", "",
            "| Run | Scenario | Seed | Price (funds) | Policy timing (government) | Leaning (land side) |",
            "|---|---|---|---|---|---|"]
    with_calls = [r for r in results["runs"] if "calls" in r]
    for r in with_calls:
        cells = []
        for call in CALLS:
            c = r["calls"][call]
            votes = ", ".join(f"{k} {v}" for k, v in c["votes"].items())
            cell = f"{c['call'] or 'no majority'} ({votes or 'no valid answers'}; of {c['answers']})"
            if call == "price" and c.get("median_move_pct") is not None:
                cell += f", median move {c['median_move_pct']:g}%"
            cells.append(cell)
        out.append(f"| {r['folder']} | {r['scenario']} | {r['seed']} | " + " | ".join(cells) + " |")
    if not with_calls:
        out.append("| none | | | no interviews.json yet | | |")
    for r in with_calls:
        statements = r["calls"]["policy"]["statements"]
        if statements:
            out += ["", f"<details><summary>{r['folder']}: what government expects the state to do next</summary>", ""]
            out += [f"- {s['name']} ({s['platform']}, {s['timing'] or 'no timing'}): "
                    f"{s['next_move'] or '(no parseable answer)'}" for s in statements]
            out += ["", "</details>"]

    out += ["", "## Daily support", "", "Mean score per day, with heat (on-topic posts that day) in brackets."]
    for r in results["runs"]:
        if "daily" not in r:
            continue
        out += ["", f"### {r['folder']} ({r['scenario'] or 'no scenario'}, seed {r['seed']})", "",
                "| Group | " + " | ".join(f"Day {d}" for d in DAYS) + " |", "|---|" + "---|" * len(DAYS)]
        for g in MEASURED:
            cells = [f"{num(r['daily'][g][d]['support'])} ({r['daily'][g][d]['heat']})" for d in DAYS]
            out.append(f"| {g} | " + " | ".join(cells) + " |")
    return "\n".join(out) + "\n"


def cmd_sample(args):
    out, key_out = args.run_dir / "sample.csv", args.run_dir / "sample_key.csv"
    if out.exists() and not args.force:
        print(f"{out} already exists and may hold your scores; pass --force to draw a new sample")
        return 1
    rows = [r for r in read_jsonl(args.run_dir / "scores.jsonl") if r["score"] is not None]
    by_group = defaultdict(list)
    for r in rows:
        by_group[r["group"]].append(r)
    # Equal shares per group; a group that runs out hands its share to the others.
    quota = dict.fromkeys(sorted(by_group), 0)
    target = min(args.n, len(rows))
    while sum(quota.values()) < target:
        for g in quota:
            if quota[g] < len(by_group[g]) and sum(quota.values()) < target:
                quota[g] += 1
    rng = random.Random(SEED)
    picked = [r for g in quota for r in rng.sample(by_group[g], quota[g])]
    rng.shuffle(picked)
    # utf-8-sig so Excel shows curly quotes and dashes instead of mojibake.
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "platform", "day", "name", "group", "text", "muhd_score"])
        w.writerows([i, r["platform"], r["day"], r["name"], r["group"], r["text"], ""]
                    for i, r in enumerate(picked, 1))
    with open(key_out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "judge_score", "judge_reason"])
        w.writerows([i, r["score"], r["reason"]] for i, r in enumerate(picked, 1))
    if target < args.n:
        print(f"warning: only {target} on-topic posts in this run")
    print(f"wrote {len(picked)} posts ({', '.join(f'{g} {q}' for g, q in quota.items())}) to {out}")
    print(f"the judge's scores are in {key_out}; score {out.name} without opening it")
    return 0


def cmd_validate(args):
    human = {r["id"]: r for r in read_csv(args.sample_csv)}
    key = read_csv(args.key_csv)
    within, blank, misses = 0, 0, []
    for k in key:
        row = human.get(k["id"], {})
        mark = (row.get("muhd_score") or "").strip()
        if not mark:
            blank += 1
            continue
        try:
            ok = abs(float(mark) - float(k["judge_score"])) <= 2
        except ValueError:
            ok = False  # e.g. "n/a": the human found the post off topic where the judge scored it
        within += ok
        if not ok:
            text = " ".join(row.get("text", "").split())[:100]
            misses.append(f"  id {k['id']}: judge {k['judge_score']}, muhd {mark}: {text}")
    need = math.ceil(24 * len(key) / 30)  # plan section 7, step 5: within 2 points on at least 24 of 30
    print(f"{within} of {len(key)} human scores within 2 points of the judge; the plan needs {need} of {len(key)}")
    if misses:
        print("outside 2 points:")
        print("\n".join(misses))
    if blank:
        print(f"incomplete: {blank} posts have no muhd_score yet")
        return 1
    print("judge check: " + ("pass" if within >= need else "fail"))
    return 0 if within >= need else 1


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("judge", help="score every post in one or more run folders")
    p.add_argument("run_dirs", type=Path, nargs="+")
    p = sub.add_parser("report", help="effects, chance bands, timing, calls and the four checks")
    p.add_argument("runs_root", type=Path)
    p = sub.add_parser("sample", help="draw the posts for the human check of the judge")
    p.add_argument("run_dir", type=Path)
    p.add_argument("--n", type=int, default=30)
    p.add_argument("--force", action="store_true", help="overwrite an existing sample.csv")
    p = sub.add_parser("validate", help="compare the human's scores with the judge's")
    p.add_argument("sample_csv", type=Path)
    p.add_argument("key_csv", type=Path)
    args = parser.parse_args()
    commands = {"judge": cmd_judge, "report": cmd_report, "sample": cmd_sample, "validate": cmd_validate}
    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
