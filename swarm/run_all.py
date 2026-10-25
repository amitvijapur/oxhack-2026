"""Run the frozen runs in plan order, N at a time:  python swarm/run_all.py <runs_root> [--parallel 3]

Runs whose run_meta.json already says "ok" are skipped, so an interrupted night can be resumed.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ORDER = [  # plan section 5: the runs every check needs come first
    "01_baseline_s1", "02_baseline_s2", "03_baseline_s3", "04_placebo_s1", "05_mine_approved_s1",
    "06_court_blocks_mine_s1", "07_tax_rise_s1", "08_protest_s1", "09_gold_back_to_4000_s1",
]


def done(run: Path) -> bool:
    try:
        return json.loads((run / "run_meta.json").read_text(encoding="utf-8")).get("outcome") == "ok"
    except (OSError, json.JSONDecodeError):
        return False


def main():
    p = argparse.ArgumentParser()
    p.add_argument("root", type=Path)
    p.add_argument("--parallel", type=int, default=3)
    p.add_argument("--provider", choices=["openai", "glm", "claude"], default="openai")
    p.add_argument("--budget-usd", type=float, default=None)
    a = p.parse_args()
    here = Path(__file__).resolve().parent
    todo = [n for n in ORDER if (a.root / n).exists() and not done(a.root / n)]
    print(time.strftime("%H:%M"), "to run:", todo, flush=True)
    for i in range(0, len(todo), a.parallel):
        wave = todo[i:i + a.parallel]
        print(time.strftime("%H:%M"), "wave:", wave, flush=True)
        procs = [(n, subprocess.Popen([sys.executable, "-u", str(here / "run_one.py"), str(a.root / n),
                                       "--provider", a.provider]
                                      + (["--budget-usd", str(a.budget_usd)] if a.budget_usd else []),
                                      stdout=open(a.root / f"{n}.out", "w", encoding="utf-8"),
                                      stderr=subprocess.STDOUT)) for n in wave]
        for n, proc in procs:
            proc.wait()
            print(time.strftime("%H:%M"), n, "ok" if done(a.root / n) else f"FAILED (see {n}.out)", flush=True)
    print(time.strftime("%H:%M"), "finished", flush=True)


if __name__ == "__main__":
    main()
