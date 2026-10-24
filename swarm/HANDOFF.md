# Handoff: getting the Tok society runs working on the desktop

For a Claude session on Muhd's desktop. Written 25 Oct 2026 ~00:35 by the laptop session.

## What this is
- The plan is `research/gold-swarm-plan.md` (approved, revision 2): one society of 61 agents at Tok, Alaska, 7 day-3 scenarios and 9 runs, scored by four pre-registered checks.
- The society is already built and frozen in `swarm/runs/` (01–09: inputs only).
- The MiroFish patches are in `swarm/mirofish-tok-society.bundle`: branch `tok-society` on upstream `7657031`. They add per-agent model tiers, seeded activation, scheduled news, and person personas for invented entity types.
- Scripts:
  - `swarm/run_one.py`: one run, then interviews via IPC files.
  - `swarm/run_all.py`: runs in waves; skips finished runs.
  - `swarm/score.py`: judge, report, sample, validate.
  - `swarm/desktop_run.ps1`: does everything and pushes the results.
- Proven on the laptop: a 1-day pilot of the same society ran cleanly (30 min, 373 OpenAI calls all HTTP 200, 48 interview answers). The laptop was too slow for 3 runs at once, so everything moved here.

## Current problem (25 Oct 00:27)
`desktop_run.ps1` set up fine, but every run in wave 1 failed about 5 minutes after starting.
- Read `C:\Oxhack\swarm-runs\01_baseline_s1.out` (the driver's `run_meta`, with the error) and `C:\Oxhack\swarm-runs\01_baseline_s1\runner.log` (the MiroFish runner's output; `OPENAI_LOG=info` shows each API request's status).
- Hypotheses, unverified:
  1. A first-run download of a model for OASIS's Twitter recommender, colliding across 3 parallel runs.
  2. A missing dependency after `uv sync`.
  3. A path problem: MiroFish must sit next to the repo, at `C:\Oxhack\MiroFish`.
- To test, run one run alone first, from `C:\Oxhack\oxhack-2026`:
  `uv run --no-project --python 3.12 python swarm\run_one.py C:\Oxhack\swarm-runs\01_baseline_s1`
- Before re-running a failed run, reset its folder, because the old databases and logs would mix in:
  `Remove-Item -Recurse -Force C:\Oxhack\swarm-runs\01_baseline_s1; Copy-Item -Recurse swarm\runs\01_baseline_s1 C:\Oxhack\swarm-runs\`
- When one run works, re-run `powershell -ExecutionPolicy Bypass -File swarm\desktop_run.ps1`. Reset any failed run folders first; finished runs are skipped.

## Rules
- Never print, paste or commit the OpenAI key. It lives only in `C:\Oxhack\MiroFish\.env`.
- Commit as `Muhammad Ahmed <266575487+meep-boop@users.noreply.github.com>`, on branch `ahmed/gold-society-plan`. Never add AI or co-author trailers.
- Don't change the pre-registered items: `swarm/scenarios.json`, `swarm/judge_prompt.txt`, `swarm/cast.json`, the interview prompt in `run_one.py`, the checks in plan section 6. If a fix must touch one, say so in the commit and the results.
- Don't commit raw databases or runner logs. `desktop_run.ps1`'s last step copies the right files to `swarm/records/results/`.
- Deadline: the runs should finish by Sun 08:00; hacking ends Sun 12:00. If short of time, cut in plan section 9's order (never runs 01–04).
