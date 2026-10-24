# Running the Tok society on another PC

The society is already built and frozen. `swarm/runs/` holds the 9 run folders (inputs only), and `swarm/mirofish-tok-society.bundle` holds the 4 MiroFish patch commits (branch `tok-society` on top of `7657031`). No graph build, persona generation or web UI is needed: the runs call OpenAI only.

## One-time set-up (Windows, about 15–20 minutes)

1. Install Git and uv if missing: `winget install Git.Git astral-sh.uv`. Open a new terminal afterwards.
2. Put both repos in the same parent folder, for example `C:\Oxhack`:
   ```
   cd C:\Oxhack
   git clone https://github.com/amitvijapur/oxhack-2026
   git -C oxhack-2026 switch ahmed/gold-society-plan
   git clone https://github.com/666ghj/MiroFish
   cd MiroFish
   git fetch ..\oxhack-2026\swarm\mirofish-tok-society.bundle tok-society:tok-society
   git switch tok-society
   cd backend
   uv sync
   ```
   Check: `git -C C:\Oxhack\MiroFish log --oneline -5` shows the 4 patch commits on top of `7657031`.
3. Create `C:\Oxhack\MiroFish\.env` and type the key yourself (never paste it into chat):
   ```
   LLM_API_KEY=<your OpenAI key>
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_MODEL_NAME=gpt-5.5
   LLM_TIER1_MODEL=gpt-5.5
   LLM_TIER2_MODEL=gpt-5.4-mini
   LLM_TIER3_MODEL=gpt-5-mini
   ```
   `run_one.py` also passes the model names itself, so only the key really matters. Zep isn't needed for the runs.
4. Copy the frozen runs outside the repo, so run outputs never end up in Git:
   ```
   xcopy /E /I C:\Oxhack\oxhack-2026\swarm\runs C:\Oxhack\swarm-runs
   ```

## Run (about 80–90 minutes per wave of 3)

```
cd C:\Oxhack\oxhack-2026
python swarm\run_all.py C:\Oxhack\swarm-runs --parallel 3
```

It runs the 9 runs in plan order, 3 at a time. Re-running the same command skips finished runs. Each run's progress is in `C:\Oxhack\swarm-runs\<run>.out` and `<run>\runner.log`. Count API errors with `findstr /C:"HTTP/1.1 429" <run>\runner.log`.

Keep the PC awake (sleep off, plugged in) until it finishes. The last run should end by Sun 08:00 (plan section 9).

## Score

```
python swarm\score.py judge C:\Oxhack\swarm-runs\01_baseline_s1 ... C:\Oxhack\swarm-runs\09_gold_back_to_4000_s1
python swarm\score.py report C:\Oxhack\swarm-runs
```

`results.md` and `results.json` land in `C:\Oxhack\swarm-runs`. Copy them and each run's `run_meta.json` and `interviews.json` into `swarm\records\`, not the raw logs.
