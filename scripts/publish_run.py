#!/usr/bin/env python3
"""Publish a workstream's output to the website's Convex backend.

    python3 scripts/publish_run.py land research/tok-land
    python3 scripts/decision_engine.py research/decision-engine/tok-demo.json \\
        | python3 scripts/publish_run.py decision - --input research/decision-engine/tok-demo.json
    python3 scripts/publish_run.py swarm swarm/records/results/results.json

Reads CONVEX_SITE_URL and INGEST_SECRET_<WORKSTREAM> from the environment or from
.env.publish at the repository root (see .env.publish.example and docs/infrastructure.md).
A run with the same --run-id and identical content is accepted again without change.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import urllib.error
import urllib.request

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish_adapters  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.publish"
MAX_BODY_BYTES = 8 * 1024 * 1024
MODES = ("measured", "evidence_only", "scenario", "empirical")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_env_file(path):
    values = {}
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def setting(name, env_file=ENV_FILE):
    return os.environ.get(name) or read_env_file(env_file).get(name)


def git_state(where):
    """The producing checkout's commit and whether it had uncommitted changes."""
    where = Path(where)
    cwd = where if where.is_dir() else where.parent
    try:
        commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=cwd, capture_output=True, text=True, check=True).stdout.strip()
        dirty = bool(subprocess.run(["git", "status", "--porcelain"], cwd=cwd, capture_output=True, text=True, check=True).stdout.strip())
        return commit, dirty
    except (OSError, subprocess.CalledProcessError):
        return None, False


def load_source(workstream, source):
    """Returns the adapter's (payload, summary, rows) and the files that were read."""
    adapter = publish_adapters.ADAPTERS[workstream]
    if workstream == "land":
        return adapter(Path(source)), publish_adapters.land_files(source)
    raw = sys.stdin.read() if source == "-" else Path(source).read_text(encoding="utf-8")
    return adapter(json.loads(raw)), [] if source == "-" else [Path(source)]


def build_body(workstream, source, *, run_id=None, mode=None, extra_inputs=(), producer=None):
    (payload, summary, rows), files = load_source(workstream, source)
    payload_json = json.dumps(finite(payload), sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
    inputs = [{"name": path.name if workstream != "land" else str(path.relative_to(source)), "sha256": digest(path.read_bytes())}
              for path in files]
    inputs += [{"name": Path(p).name, "sha256": digest(Path(p).read_bytes())} for p in extra_inputs]
    commit, dirty = git_state(source if source != "-" else ".")
    body = {
        "runId": run_id or f"{workstream}-{digest(payload_json.encode())[:12]}",
        "schemaVersion": 1,
        "mode": mode or publish_adapters.DEFAULT_MODES[workstream],
        "producer": {"script": producer or publish_adapters.PRODUCERS[workstream], "gitCommit": commit, "dirty": dirty},
        "inputs": inputs,
        "summary": summary,
        "payloadJson": payload_json,
    }
    if rows is not None:
        body["landMatches"] = rows
    return body


def finite(value):
    """Replaces Infinity and NaN with None so the payload is strict JSON.

    decision_engine.py documents unbounded values as null, but some fields (for example
    forgetting_sweep[].half_life_years) reach stdout as Infinity, which json.loads accepts.
    """
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {k: finite(v) for k, v in value.items()}
    if isinstance(value, list):
        return [finite(v) for v in value]
    return value


def describe(body):
    """The body without its payload, for --dry-run and logs."""
    shown = {k: v for k, v in body.items() if k not in ("payloadJson", "landMatches")}
    shown["payloadBytes"] = len(body["payloadJson"].encode())
    shown["payloadSha256"] = digest(body["payloadJson"].encode())
    if "landMatches" in body:
        shown["landMatches"] = f"{len(body['landMatches'])} rows"
    return shown


def publish(workstream, body, site_url, secret, timeout=60):
    data = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode()
    if len(data) > MAX_BODY_BYTES:
        raise SystemExit(f"run is {len(data)} bytes; the backend accepts at most {MAX_BODY_BYTES}")
    request = urllib.request.Request(
        f"{site_url.rstrip('/')}/ingest/{workstream}", data=data, method="POST",
        headers={"Authorization": f"Bearer {secret}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as error:
        with error:
            try:
                detail = json.loads(error.read() or b"{}")
            except json.JSONDecodeError:
                detail = {"error": error.reason}
            return error.code, detail


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("workstream", choices=sorted(publish_adapters.ADAPTERS))
    parser.add_argument("source", help="output file, '-' for stdin, or the research/tok-land directory for land")
    parser.add_argument("--run-id", help="stable id; defaults to <workstream>-<payload sha256 prefix>")
    parser.add_argument("--mode", choices=MODES, help="defaults: decision/swarm scenario, land measured")
    parser.add_argument("--input", action="append", default=[], help="extra input file to fingerprint (repeatable)")
    parser.add_argument("--producer", help="producing script path, if not the default for the workstream")
    parser.add_argument("--dry-run", action="store_true", help="print what would be sent and stop")
    args = parser.parse_args(argv)

    body = build_body(args.workstream, args.source, run_id=args.run_id, mode=args.mode,
                      extra_inputs=args.input, producer=args.producer)
    if args.dry_run:
        print(json.dumps(describe(body), indent=2))
        return 0
    site_url = setting("CONVEX_SITE_URL")
    secret_name = f"INGEST_SECRET_{args.workstream.upper()}"
    secret = setting(secret_name)
    if not site_url or not secret:
        missing = [n for n, v in (("CONVEX_SITE_URL", site_url), (secret_name, secret)) if not v]
        raise SystemExit(f"set {' and '.join(missing)} in the environment or {ENV_FILE.name}")
    status, detail = publish(args.workstream, body, site_url, secret)
    print(json.dumps({"httpStatus": status, **detail}, indent=2))
    return 0 if status < 400 else 1


if __name__ == "__main__":
    sys.exit(main())
