"""Drive MiroFish's backend API to build the society, without the web UI.

    python swarm/prepare_society.py ingest            # upload seed docs, build the Zep graph, list entities
    python swarm/prepare_society.py prepare <project_id> <graph_id> <EntityType,EntityType,...>

ingest writes swarm/records/ingest.json; check the entity list there before
choosing which entity types become agents (organisations should not).
"""

import json
import sys
import time
import uuid
from pathlib import Path
from urllib import error, request

BASE = "http://localhost:5001"
# MiroFish picks its prompt language from this header and defaults to Chinese, which it
# then carries into background tasks (app/utils/locale.py:28-32).
LANG = {"Accept-Language": "en"}
# MiroFish's progress messages can contain Chinese, which the Windows console code page can't print.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = Path(__file__).resolve().parent
SEED = HERE / "seed"
RECORDS = HERE / "records"


def call(method, path, payload=None, timeout=900):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {**LANG, "Content-Type": "application/json"} if data is not None else dict(LANG)
    req = request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:2000]}")


def upload(path, fields, files, timeout=1800):
    boundary = uuid.uuid4().hex
    body = b""
    for key, value in fields.items():
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode("utf-8")
    for f in files:
        body += (f'--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="{f.name}"\r\n'
                 f"Content-Type: text/markdown\r\n\r\n").encode("utf-8") + f.read_bytes() + b"\r\n"
    body += f"--{boundary}--\r\n".encode("utf-8")
    req = request.Request(BASE + path, data=body, method="POST",
                          headers={**LANG, "Content-Type": f"multipart/form-data; boundary={boundary}"})
    try:
        with request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))
    except error.HTTPError as e:
        raise SystemExit(f"POST {path} -> HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:2000]}")


def wait(poll, label, every=10, limit=5400):
    start = time.time()
    while time.time() - start < limit:
        data = poll()
        status = data.get("status")
        print(f"[{label}] {status} {data.get('progress', '')}% {str(data.get('message', ''))[:90]}", flush=True)
        if status in ("completed", "ready"):
            return data
        if status == "failed":
            raise SystemExit(f"{label} failed: {json.dumps(data, ensure_ascii=False)[:2000]}")
        time.sleep(every)
    raise SystemExit(f"{label} timed out")


def ingest():
    files = sorted(SEED.glob("*.md"))
    requirement = (SEED / "simulation-requirement.txt").read_text(encoding="utf-8").strip()
    t0 = time.time()
    onto = upload("/api/graph/ontology/generate",
                  {"simulation_requirement": requirement, "project_name": "Tok gold society"}, files)["data"]
    project_id = onto["project_id"]
    print("project:", project_id)
    print("entity types:", [e.get("name") for e in onto["ontology"].get("entity_types", [])])

    call("POST", "/api/graph/build", {"project_id": project_id, "graph_name": "tok-gold"})
    collect_entities(project_id, extra={"seconds_to_build_start": round(time.time() - t0),
                                        "files": [f.name for f in files]})


def collect_entities(project_id, extra=None):
    """Wait for the project's graph build (it runs inside the backend), then record its entities."""
    project = call("GET", f"/api/graph/project/{project_id}")["data"]
    task_id = project.get("graph_build_task_id")
    if task_id:
        wait(lambda: call("GET", f"/api/graph/task/{task_id}")["data"], "graph")
    project = call("GET", f"/api/graph/project/{project_id}")["data"]
    graph_id = project.get("graph_id")
    print("graph:", graph_id)

    entities = call("GET", f"/api/simulation/entities/{graph_id}?enrich=false")["data"]
    RECORDS.mkdir(exist_ok=True)
    record = {"project_id": project_id, "graph_id": graph_id, **(extra or {}),
              "ontology": project.get("ontology"), "entities": entities}
    (RECORDS / "ingest.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    ents = entities.get("entities", [])
    by_type = {}
    for e in ents:
        by_type.setdefault(e.get("entity_type") or ",".join(e.get("labels", [])), []).append(e.get("name"))
    for k, v in sorted(by_type.items()):
        print(f"{k} ({len(v)}): {', '.join(sorted(v))}")
    print(f"{len(ents)} entities in total; saved to {RECORDS / 'ingest.json'}")


def prepare(project_id, graph_id, types):
    sim = call("POST", "/api/simulation/create",
               {"project_id": project_id, "graph_id": graph_id, "enable_twitter": True, "enable_reddit": True})["data"]
    sim_id = sim["simulation_id"]
    print("simulation:", sim_id)
    t0 = time.time()
    started = call("POST", "/api/simulation/prepare",
                   {"simulation_id": sim_id, "entity_types": types.split(","),
                    "use_llm_for_profiles": True, "parallel_profile_count": 5})["data"]
    task_id = started.get("task_id")
    wait(lambda: call("POST", "/api/simulation/prepare/status",
                      {"task_id": task_id, "simulation_id": sim_id})["data"], "prepare")
    record = {"project_id": project_id, "graph_id": graph_id, "simulation_id": sim_id,
              "entity_types": types.split(","), "seconds": round(time.time() - t0)}
    RECORDS.mkdir(exist_ok=True)
    (RECORDS / "prepare.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "ingest":
        ingest()
    elif len(sys.argv) == 3 and sys.argv[1] == "entities":
        collect_entities(sys.argv[2])
    elif len(sys.argv) == 5 and sys.argv[1] == "prepare":
        prepare(*sys.argv[2:])
    else:
        raise SystemExit(__doc__)
