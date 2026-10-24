"""Run one prepared MiroFish simulation folder headless, then interview it.

Usage:
    python swarm/run_one.py <sim_dir> [--max-rounds N] [--timeout-hours H]

The runner keeps its environment open after the last round and takes interview
commands as JSON files (MiroFish run_parallel_simulation.py, ParallelIPCHandler),
so the interviews happen against the agents' own memories of the run.
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

MIROFISH_BACKEND = Path(r"C:\Users\ahmed\Downloads\Oxhack\MiroFish\backend")

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
    args = parser.parse_args()

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
                                    capture_output=True, text=True).stdout
    meta = {"sim_dir": str(sim_dir), "scenario": config.get("scenario"), "seed": config.get("seed"),
            "max_rounds": args.max_rounds, "interviewees": interviewees, "started": now(),
            "mirofish_commit": git("rev-parse", "HEAD").strip(),
            # Hash of every patch on top of upstream MiroFish, so a result can be tied to exact code.
            "patch_sha256": hashlib.sha256(git("diff", "7657031", "HEAD").encode("utf-8")).hexdigest()}

    cmd = ["uv", "run", "python", "scripts/run_parallel_simulation.py", "--config", str(config_path)]
    if args.max_rounds:
        cmd += ["--max-rounds", str(args.max_rounds)]
    log = open(sim_dir / "runner.log", "w", encoding="utf-8")
    proc = subprocess.Popen(cmd, cwd=MIROFISH_BACKEND, stdout=log, stderr=subprocess.STDOUT,
                            env={**os.environ, **MODEL_ENV})
    meta["models"] = MODEL_ENV
    t0 = time.time()

    try:
        deadline = t0 + args.timeout_hours * 3600
        while read_status(sim_dir) != "alive":
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
        meta["finished"] = now()
        meta["total_seconds"] = round(time.time() - t0, 1)
        log.close()
        (sim_dir / "run_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        print(json.dumps(meta, indent=2))
    return 0 if meta["outcome"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
