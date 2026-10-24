# Running the Tok society on another PC

The society is already built and frozen. `swarm/runs/` holds the 9 run folders, and `swarm/mirofish-tok-society.bundle` holds the 4 MiroFish patch commits. No graph build, persona generation or web UI is needed; the runs only call OpenAI.

## One command

Needs Git and a GitHub login with access to this private repo.

```
git clone https://github.com/amitvijapur/oxhack-2026 C:\Oxhack\oxhack-2026
cd C:\Oxhack\oxhack-2026
git switch ahmed/gold-society-plan
powershell -ExecutionPolicy Bypass -File swarm\desktop_run.ps1
```

`swarm\desktop_run.ps1` does everything else:
1. It installs uv if it's missing.
2. It clones MiroFish next to the repo, loads the patches and runs `uv sync`.
3. It asks for the OpenAI key once, in a hidden prompt, writes it to `MiroFish\.env` and checks that the three tier models work.
4. It keeps the PC awake and runs the 9 runs, 3 at a time, in plan order (about 80–90 minutes per wave).
5. It scores the runs, then commits and pushes the data and `results.md` to `swarm/records/results/`.

If it stops for any reason, run the same command again: finished steps and finished runs are skipped. Use `-Parallel 2` if the PC struggles. Progress for each run is in `C:\Oxhack\swarm-runs\<run>.out`.
