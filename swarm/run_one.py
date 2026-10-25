"""Run one prepared MiroFish simulation folder headless, then interview it.

Usage:
    python swarm/run_one.py <sim_dir> [--max-rounds N] [--timeout-hours H] [--provider openai|glm]

The runner keeps its environment open after the last round and takes interview
commands as JSON files (MiroFish run_parallel_simulation.py, ParallelIPCHandler),
so the interviews happen against the agents' own memories of the run.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# MiroFish is cloned next to this repo (…/Oxhack/MiroFish), so the path works on any machine.
MIROFISH_BACKEND = Path(os.environ.get("MIROFISH_DIR", Path(__file__).resolve().parents[2] / "MiroFish")) / "backend"

# Passed in the environment because the runner's load_dotenv never overrides it:
# an editor saving an old .env mid-session once silently reverted these lines.
MODEL_ENV = {
    "LLM_MODEL_NAME": "gpt-5.5",
    "LLM_TIER1_MODEL": "gpt-5.5",
    "LLM_TIER2_MODEL": "gpt-5.4-mini",
    "LLM_TIER3_MODEL": "gpt-5-mini",
    "LLM_BOOST_API_KEY": "",
    # OASIS swallows agent API errors and MiroFish mutes that logger; the client's own
    # request lines are the only record of rate limits or rejected calls.
    "OPENAI_LOG": "info",
}

# Z.ai's GLM coding plan, used after the OpenAI budget ran out (runs 04-09, 25 Oct). The key is read
# from MiroFish's .env (GLM_API_KEY) and passed to the runner only; run_meta records these settings.
GLM_ENV = {
    "LLM_BASE_URL": "https://api.z.ai/api/coding/paas/v4",
    "LLM_MODEL_NAME": "glm-5.3",
    "LLM_TIER1_MODEL": "glm-5.3",
    "LLM_TIER2_MODEL": "glm-5.3",
    "LLM_TIER3_MODEL": "glm-5.3-flash",
    "LLM_BOOST_API_KEY": "",
    "OPENAI_LOG": "info",
    # Uncapped Reddit memories reached 277k tokens on OpenAI; cap them and show 10 comments per post.
    "AGENT_MEMORY_TOKEN_LIMIT": "100000",
    "MAX_COMMENTS_PER_POST": "10",
    "LLM_SEMAPHORE": "10",
}

# Anthropic's native Messages API with prompt caching (MiroFish scripts/anthropic_native.py). The key is
# ANTHROPIC_API_KEY in MiroFish's .env, which the runner loads itself; run_meta records these settings.
CLAUDE_ENV = {
    "LLM_PROVIDER": "anthropic",
    "LLM_MODEL_NAME": "claude-haiku-4-5",
    "LLM_TIER1_MODEL": "claude-sonnet-5",
    "LLM_TIER2_MODEL": "claude-haiku-4-5",
    "LLM_TIER3_MODEL": "claude-haiku-4-5",
    "LLM_BOOST_API_KEY": "",
    "OPENAI_LOG": "info",
    "ANTHROPIC_LOG": "info",
    "AGENT_MEMORY_TOKEN_LIMIT": "100000",
    "MAX_COMMENTS_PER_POST": "10",
    "LLM_SEMAPHORE": "10",
}
# $ per million tokens: input, 5-minute cache write, cache read, output (platform.claude.com pricing).
CLAUDE_PRICES = {"claude-haiku-4-5": (1.00, 1.25, 0.10, 5.00), "claude-sonnet-5": (2.00, 2.50, 0.20, 10.00)}


def claude_cost(usage_log: Path, state: dict) -> float:
    """Running dollar cost from the backend's per-call usage log."""
    try:
        with open(usage_log, "rb") as f:
            f.seek(state["pos"])
            chunk = f.read()
    except OSError:
        return state["usd"]
    end = chunk.rfind(b"\n") + 1  # only whole lines; the rest is read next time
    state["pos"] += end
    for line in chunk[:end].splitlines():
        u = json.loads(line)
        price = next((p for name, p in CLAUDE_PRICES.items() if u["model"].startswith(name)), max(CLAUDE_PRICES.values()))
        state["usd"] += (u["input"] * price[0] + u["cache_write"] * price[1] + u["cache_read"] * price[2]
                         + u["output"] * price[3]) / 1e6
    return state["usd"]


# Fixed before any scored run (plan section 6); changing it breaks comparability.
INTERVIEW_PROMPT = (
    "Answer as yourself, based only on what you have seen, said and know so far. "
    "Reply with JSON only, using these keys: "
    '"gold_direction" ("up", "flat" or "down": where the gold price is heading by the end of day 5), '
    '"gold_move_pct" (a number: your rough guess of the percentage move by the end of day 5), '
    '"state_next_move" (one sentence: what the Alaska state government will do next about gold mining near Tok), '
    '"state_move_timing" ("days", "weeks" or "months"), '
    '"local_leaning" ("for", "against" or "split": are people around Tok leaning for or against mining '
    "and the politicians backing it), "
    '"evidence" (one specific post you saw or fact you know that most drives your view).'
)


def now():
    return datetime.now(timezone.utc).isoformat()


def read_status(sim_dir: Path):
    try:
        return json.loads((sim_dir / "env_status.json").read_text(encoding="utf-8")).get("status")
    except (OSError, json.JSONDecodeError):
        return None


def send_command(sim_dir: Path, command_type: str, args: dict) -> str:
    command_id = f"{command_type}_{int(time.time() * 1000)}"
    commands = sim_dir / "ipc_commands"
    commands.mkdir(exist_ok=True)
    # Write then rename, so the runner never polls a half-written file.
    tmp = commands / f"{command_id}.tmp"
    tmp.write_text(json.dumps({"command_id": command_id, "command_type": command_type, "args": args}), encoding="utf-8")
    tmp.rename(commands / f"{command_id}.json")
    return command_id


def wait_response(sim_dir: Path, command_id: str, proc, timeout_s: float):
    path = sim_dir / "ipc_responses" / f"{command_id}.json"
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                pass  # the runner may still be writing it
        if proc.poll() is not None:
            raise RuntimeError(f"runner exited (code {proc.returncode}) while waiting for {command_id}")
        time.sleep(2)
    raise TimeoutError(f"no response to {command_id} after {timeout_s:.0f}s")


def glm_key() -> str:
    env = dict(line.split("=", 1) for line in (MIROFISH_BACKEND.parent / ".env").read_text(encoding="utf-8-sig").splitlines()
               if "=" in line and not line.lstrip().startswith("#"))
    key = (env.get("GLM_API_KEY") or env.get("LLM_API_KEY") or "").strip()
    if not key or key.startswith("sk-"):
        raise RuntimeError("no Z.ai key in MiroFish's .env (GLM_API_KEY, or LLM_API_KEY without the OpenAI sk- prefix)")
    return key


def count_api_errors(log_path: Path, state: dict) -> int:
    """Failed API calls since the last successful one in the runner log. OASIS swallows agent API
    errors, so without this a run that ran out of quota or spend would carry on with silent
    agents; occasional rate limits that a retry gets past don't add up."""
    try:
        with open(log_path, "rb") as f:
            f.seek(state["pos"])
            chunk = f.read()
    except OSError:
        return state["n"]
    state["pos"] += len(chunk)
    for status in re.findall(rb"HTTP/1\.1 (\d{3})", chunk):
        state["n"] = 0 if status == b"200" else state["n"] + 1
    return state["n"]


def kill_tree(proc):
    # uv starts python as a child; on Windows terminate() would leave it running.
    if os.name == "nt":
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
    else:
        proc.kill()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("sim_dir", type=Path)
    parser.add_argument("--max-rounds", type=int, default=None)
    parser.add_argument("--timeout-hours", type=float, default=4.0)
    parser.add_argument("--provider", choices=["openai", "glm", "claude"], default="openai")
    parser.add_argument("--budget-usd", type=float, default=None,
                        help="claude only: stop the run when its API cost passes this")
    args = parser.parse_args()
    model_env = {"glm": GLM_ENV, "claude": CLAUDE_ENV}.get(args.provider, MODEL_ENV)
    secret_env = {"LLM_API_KEY": glm_key()} if args.provider == "glm" else {}
    if args.provider == "claude":
        env_file = (MIROFISH_BACKEND.parent / ".env").read_text(encoding="utf-8-sig")
        if not re.search(r"^(ANTHROPIC_API_KEY=.+|LLM_API_KEY=\s*sk-ant-)", env_file, re.M):
            raise SystemExit("no Anthropic key in MiroFish's .env (ANTHROPIC_API_KEY, or an sk-ant- LLM_API_KEY)")

    sim_dir = args.sim_dir.resolve()
    config_path = sim_dir / "simulation_config.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    # A folder copied from another run may still say "alive" or hold old replies,
    # which would make this run look finished or answered before it started.
    (sim_dir / "env_status.json").unlink(missing_ok=True)
    for ipc_dir in ("ipc_commands", "ipc_responses"):
        for f in (sim_dir / ipc_dir).glob("*.json") if (sim_dir / ipc_dir).exists() else []:
            f.unlink()

    interviewees = sorted(
        a["agent_id"] for a in config.get("agent_configs", []) if a.get("tier") in (1, 2)
    )
    git = lambda *a: subprocess.run(["git", "-C", str(MIROFISH_BACKEND.parent), *a],
                                    capture_output=True, encoding="utf-8", errors="replace").stdout or ""
    meta = {"sim_dir": str(sim_dir), "scenario": config.get("scenario"), "seed": config.get("seed"),
            "max_rounds": args.max_rounds, "interviewees": interviewees, "started": now(),
            "mirofish_commit": git("rev-parse", "HEAD").strip(),
            # Hash of every patch on top of upstream MiroFish, so a result can be tied to exact code.
            "patch_sha256": hashlib.sha256(git("diff", "7657031", "HEAD").encode("utf-8")).hexdigest()}

    cmd = ["uv", "run", "python", "scripts/run_parallel_simulation.py", "--config", str(config_path)]
    if args.max_rounds:
        cmd += ["--max-rounds", str(args.max_rounds)]
    usage_log = sim_dir / "anthropic_usage.jsonl"
    usage_log.unlink(missing_ok=True)
    run_env = {"ANTHROPIC_USAGE_LOG": str(usage_log)} if args.provider == "claude" else {}
    log = open(sim_dir / "runner.log", "w", encoding="utf-8")
    proc = subprocess.Popen(cmd, cwd=MIROFISH_BACKEND, stdout=log, stderr=subprocess.STDOUT,
                            env={**os.environ, **model_env, **secret_env, **run_env})
    meta["provider"] = args.provider
    meta["models"] = model_env
    t0 = time.time()
    cost = {"pos": 0, "usd": 0.0}

    try:
        deadline = t0 + args.timeout_hours * 3600
        errors = {"pos": 0, "n": 0}
        while read_status(sim_dir) != "alive":
            if count_api_errors(sim_dir / "runner.log", errors) > 50:
                raise RuntimeError(f"{errors['n']} failed API calls in a row; quota, spend or rate limit reached")
            if args.budget_usd and claude_cost(usage_log, cost) > args.budget_usd:
                raise RuntimeError(f"API cost ${cost['usd']:.2f} passed the run budget ${args.budget_usd:.2f}")
            if proc.poll() is not None:
                raise RuntimeError(f"runner exited (code {proc.returncode}) before the simulation finished")
            if time.time() > deadline:
                raise TimeoutError("simulation did not finish within the timeout")
            time.sleep(5)
        meta["simulation_seconds"] = round(time.time() - t0, 1)
        meta["simulation_finished"] = now()

        t1 = time.time()
        interviews = [{"agent_id": i, "prompt": INTERVIEW_PROMPT} for i in interviewees]
        command_id = send_command(sim_dir, "batch_interview", {"interviews": interviews})
        response = wait_response(sim_dir, command_id, proc, timeout_s=1800)
        (sim_dir / "interviews.json").write_text(json.dumps(response, ensure_ascii=False, indent=2), encoding="utf-8")
        meta["interview_seconds"] = round(time.time() - t1, 1)
        meta["interview_status"] = response.get("status")

        close_id = send_command(sim_dir, "close_env", {})
        wait_response(sim_dir, close_id, proc, timeout_s=120)
        try:
            proc.wait(timeout=180)
        except subprocess.TimeoutExpired:
            kill_tree(proc)
        meta["outcome"] = "ok"
    except Exception as exc:
        meta["outcome"] = f"failed: {exc}"
        kill_tree(proc)
    finally:
        if args.provider == "claude":
            meta["api_cost_usd"] = round(claude_cost(usage_log, cost), 2)
        meta["finished"] = now()
        meta["total_seconds"] = round(time.time() - t0, 1)
        log.close()
        (sim_dir / "run_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        print(json.dumps(meta, indent=2))
    return 0 if meta["outcome"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
