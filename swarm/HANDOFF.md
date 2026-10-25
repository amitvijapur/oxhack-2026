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
- **Cause (found 25 Oct 00:45, desktop):** OASIS's Twitter recommender runs every profile and post through BERT in one batch of up to 1000. One pass over 100 long texts peaks near 10 GB, so three runs on this 16 GB PC ran out of memory and torch crashed (Windows event log: 0xC0000005 in `torch\lib\c10.dll`). Runs 04 and 06 had not crashed; they were stopped with Ctrl+C. Fix: MiroFish commit `743a0b8` caps the batch at 8 (peak 1.9 GB, identical vectors); the bundle is updated. It changes `patch_sha256` in `run_meta.json`.
- Hypotheses before that, now ruled out:
  1. A first-run download of a model for OASIS's Twitter recommender, colliding across 3 parallel runs.
  2. A missing dependency after `uv sync`.
  3. A path problem: MiroFish must sit next to the repo, at `C:\Oxhack\MiroFish`.
- To test, run one run alone first, from `C:\Oxhack\oxhack-2026`:
  `uv run --no-project --python 3.12 python swarm\run_one.py C:\Oxhack\swarm-runs\01_baseline_s1`
- Before re-running a failed run, reset its folder, because the old databases and logs would mix in:
  `Remove-Item -Recurse -Force C:\Oxhack\swarm-runs\01_baseline_s1; Copy-Item -Recurse swarm\runs\01_baseline_s1 C:\Oxhack\swarm-runs\`
- When one run works, re-run `powershell -ExecutionPolicy Bypass -File swarm\desktop_run.ps1`. Reset any failed run folders first; finished runs are skipped.

## Status (25 Oct ~03:35, desktop)
- **Runs 01-03** (baselines): OpenAI (gpt-5.5 / gpt-5.4-mini / gpt-5-mini), agent memory uncapped. Complete with interviews; run 01 lost its Reddit interviews when one agent's memory passed the 272k-token limit. They cost about $54: every call resends the agent's whole memory, and Reddit feeds carry every comment.
- **Runs 04-06** (placebo, mine approved, court blocks mine): Claude (claude-sonnet-5 tier 1, claude-haiku-4-5 tiers 2-3) through MiroFish's native Anthropic backend, with memory capped at 100k tokens and 10 comments per Reddit post. Simulations complete; interviews mostly lost (0, 0 and 10 of 48) when the Claude credit ran out mid-interview. About $95.
- **Runs 07-09**: running on GLM (glm-5.3 tier 1, glm-5.3-flash tiers 2-3, same caps), one at a time.
- **Judge**: glm-5.3-flash scores every run (26 of 30 within 2 points on Muhd's hand check; the pre-registered gpt-5.4-mini was out of budget).
- **Interim checks (01-06)**: stability pass; placebo, mirrors and grounding fail (`records/results/results.md`). Runs 04-09 differ from the baselines in model and memory caps as well as the news, so their effects against the baselines include that difference; comparing 05-09 with the placebo (04) removes it for the Claude runs. Heat (posts per day) is not comparable across providers: the Claude runs have about 450 posts each, the OpenAI runs about 700.

## Rules
- Never print, paste or commit the OpenAI key. It lives only in `C:\Oxhack\MiroFish\.env`.
- Commit as `Muhammad Ahmed <266575487+meep-boop@users.noreply.github.com>`, on branch `ahmed/gold-society-plan`. Never add AI or co-author trailers.
- Don't change the pre-registered items: `swarm/scenarios.json`, `swarm/judge_prompt.txt`, `swarm/cast.json`, the interview prompt in `run_one.py`, the checks in plan section 6. If a fix must touch one, say so in the commit and the results.
- Don't commit raw databases or runner logs. `desktop_run.ps1`'s last step copies the right files to `swarm/records/results/`.
- Deadline: the runs should finish by Sun 08:00; hacking ends Sun 12:00. If short of time, cut in plan section 9's order (never runs 01–04).
