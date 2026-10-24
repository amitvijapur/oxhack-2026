# Plan: gold stakeholder society at Tok, Alaska (MiroFish)

Status: **approved by Muhd, 24 Oct 2026 ~22:20** (revision 2, from the /plan interview with Muhd). It replaces the three-variant plan approved at ~20:30 (PR #22, commit `75d9bd1`, this file's previous version). Owner: Muhd. MiroFish runs on Muhd's laptop (team decision).

## 1. What changed

| Approved plan (PR #22) | This revision | Why |
|---|---|---|
| Three swarms: cautious, moderate, free | One society of 60; each agent has its own temperament | A society is diverse people forming a whole (Muhd) |
| Temperament via `sentiment_bias`, `stance`, echo chamber, recency, `narrative_direction` | Temperament via persona text plus `activity_level` | MiroFish never reads the old settings (section 2) |
| Shocks via `scheduled_events` | Shocks via a small runner patch | `scheduled_events` is always empty and never read |
| A baseline and 3 shocks per swarm; 18 runs | 7 scenarios on one society; 9 runs | A placebo and two mirrors test whether the society reacts to what the news says |
| Winner by a 40/30/20/10 score | No winner: four checks, then ranked effects | There is nothing left to compare |
| Place open (Nevada roles) | Tok, Alaska | Matches the team's gold packs |
| Tiers gpt-5.5 / middle / gpt-5.5-mini | gpt-5.5 / gpt-5.4-mini / gpt-5-mini | gpt-5.5-mini doesn't exist on the key |
| Cold / warm / hot undefined | Support for gold mining at Tok, 0–10 | The calls and the mirror check need a direction |
| Pilot of 10 rounds | Pilot of one simulated day (24 rounds) | The clock starts at midnight and agents sleep until 08:00, so 10 rounds would be mostly idle |

## 2. MiroFish facts this plan relies on

Checked in the source of commit `7657031`. Paths are under `MiroFish/backend/`; OASIS is `camel-oasis 0.2.5` in the backend venv.

- **Who acts:** each round, the runner reads only two per-agent settings, `active_hours` and `activity_level` (`scripts/run_parallel_simulation.py:1063–1080`). `sentiment_bias`, `stance`, `influence_weight`, posting rates, `recency_weight`, `echo_chamber_strength`, `narrative_direction` and `hot_topics` are saved in `simulation_config.json` but never read.
- **What an agent reads about itself:** its persona text, `persona` in `reddit_profiles.json` and `user_char` in `twitter_profiles.csv` (OASIS `social_agent/agents_generator.py:585`, `:630`).
- **Models:** OASIS gives every agent the same model (`agents_generator.py:598–604`, `:640–646`). MiroFish creates one model per platform (`run_parallel_simulation.py:1130`, `:1322`) and passes it to the graph builders (`:1138`, `:1329`).
- **News:** `scheduled_events` is always `[]` (`app/services/simulation_config_generator.py:725`) and never read. Only round-0 `initial_posts` get published (`run_parallel_simulation.py:1180–1207`), and that code silently skips errors (line 1202).
- **Randomness:** nothing is seeded. Who acts comes from Python's global `random` (`run_parallel_simulation.py:1063–1080`).
- **Clock:** simulated time starts at midnight (`:1235–1237`). By default agents are active 08:00–22:00 (`:1068`).
- **Command line:** `--config`, `--max-rounds`, `--twitter-only`, `--reddit-only`, `--no-wait` (`:1494–1521`). Without `--no-wait`, the runner stays open after the last round for interview commands. Its IPC handles only interview, batch interview and close (`:210–214`).
- **Logs:** every action goes to `<simulation folder>/twitter/actions.jsonl` and `reddit/actions.jsonl`, with its round, agent and content.
- **Requests:** MiroFish drops temperature and uses `max_completion_tokens` only for model names starting `gpt-5` (`app/utils/openai_chat_compat.py:13–17`). It never sets a reasoning effort, so each model's default applies.

## 3. Requirements

| Decision | Choice |
|---|---|
| Predicts | How stakeholder support for gold mining at Tok moves (1) the gold price the market expects, (2) state policy (approvals, tax), (3) political leaning |
| TIME angle | When each group moves after the news, and which group moves first, over 5 simulated days |
| Place | Tok River area, Alaska. Matches Amit's gold packs (Site A = Tok west, Site B = Tok east; `research/gold-evidence-results.md`) |
| Society | 60 stakeholders plus a silent news wire (section 4) |
| Temperaments | Role realism; counts fixed before any run (section 4) |
| Models | Tier 1: 6 agents on gpt-5.5. Tier 2: 18 on gpt-5.4-mini. Tier 3: 36 on gpt-5-mini |
| Simulated time | 5 days. Day 1: gold breaks out from about $4,000 to a record $4,500/oz (gold futures closed at $4,008 on 23 Oct). Day 3: the scenario's news |
| Scenarios | 7 (section 5) |
| Runs | 9: the 7 scenarios with seed 1, plus the baseline with seeds 2 and 3 |
| Sentiment | Support for gold mining at Tok, 0–10: cold 0–3, warm 4–6, hot 7–10 |
| Evaluation | Forward-only. Four checks fixed before any run, then ranked effects (section 6) |

## 4. The society (61 agents)

### Temperaments

| Temperament | Added to the persona text | `activity_level` |
|---|---|---|
| Cautious | "You wait for confirmation before changing your view, trust official sources, and rarely post first." | 0.4 |
| Moderate | "You update your view when the news is credible and react in proportion to it." | 0.55 |
| Free | "You act on instinct, take positions early and say what you think." | 0.7 |

The activity levels are the midpoints of the approved bands (0.3–0.5, 0.4–0.7, 0.5–0.9).

| Group (n) | Cautious | Moderate | Free | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|---|---|---|
| Government (10) | 6 | 3 | 1 | 2 | 6 | 2 |
| Land side (20) | 5 | 8 | 7 | 2 | 5 | 13 |
| Funds (24) | 8 | 12 | 4 | 2 | 7 | 15 |
| Retail (6) | 1 | 2 | 3 | 0 | 0 | 6 |
| Total (60) | 20 | 25 | 15 | 6 | 18 | 36 |

### Cast

These are roles, not real people. The seed documents carry public facts with sources (section 11).

**Government (10)**

| Role | Tier | Temperament |
|---|---|---|
| Governor of Alaska | 1 | Moderate |
| Commissioner, Department of Natural Resources (DNR) | 1 | Cautious |
| Director, DNR mining division | 2 | Cautious |
| BLM Alaska state director | 2 | Cautious |
| State legislator for the Tok district | 2 | Free |
| State tax official (mining tax) | 2 | Cautious |
| Regional director, Department of Transportation (the ore-haul highway) | 2 | Moderate |
| Regional official, Department of Environmental Conservation (water) | 2 | Cautious |
| DNR field inspector | 3 | Cautious |
| Highway maintenance supervisor, Tok | 3 | Moderate |

**Land side (20): industry 13, community 7**

| Role | Sub-group | Tier | Temperament |
|---|---|---|---|
| Mine operator's Alaska general manager | Industry | 1 | Cautious |
| Tetlin village council chief (landowner) | Industry | 1 | Cautious |
| Regional Native corporation representative | Industry | 2 | Cautious |
| Ore-haul trucking contractor manager | Industry | 2 | Moderate |
| Mine crew lead | Industry | 3 | Moderate |
| Mine crew members (2) | Industry | 3 | Moderate |
| Ore-haul truck drivers (2) | Industry | 3 | 1 free, 1 moderate |
| Fort Knox mill worker | Industry | 3 | Moderate |
| Fuel and supply business owner, Tok | Industry | 3 | Moderate |
| Placer miners (2) | Industry | 3 | Free |
| Tok community council head | Community | 2 | Cautious |
| Road-safety campaigner on the ore-haul route | Community | 2 | Free |
| Environmental group lead | Community | 2 | Free |
| Lodge owner on the Alaska Highway | Community | 3 | Cautious |
| Subsistence hunter | Community | 3 | Free |
| School bus driver | Community | 3 | Moderate |
| Tok parent | Community | 3 | Free |

**Funds (24)**

| Role | Tier | Temperament |
|---|---|---|
| Largest gold macro hedge fund | 1 | Moderate |
| Largest gold ETF manager | 1 | Moderate |
| Mining-equity funds (3) | 2 | 2 moderate, 1 cautious |
| Trend-following fund (CTA) | 2 | Free |
| Central-bank-flows fund | 2 | Cautious |
| Pension allocator | 2 | Cautious |
| Bullion bank desk | 2 | Moderate |
| Junior-miner funds (2) | 3 | Free |
| Quant momentum fund | 3 | Free |
| Family offices (3) | 3 | Cautious |
| Long-only gold funds (2) | 3 | Cautious |
| Multi-strategy funds (3) | 3 | Moderate |
| Commodity trading desks (2) | 3 | Moderate |
| Risk-parity funds (2) | 3 | Moderate |

**Retail (6), all tier 3:** a retirement saver (cautious), two regular investors (moderate), three momentum traders (free).

**News wire (agent 61):** a fictional local news wire with `activity_level` 0, so it never acts by itself. It only posts the day-1 and day-3 news. Tier 3.

## 5. Scenarios and run order

Day 1, round 0, in every scenario: the news wire posts that gold has broken out from about $4,000 to a record $4,500/oz. The seed documents describe a new open-pit mine near Tok as a pending application.

The news wire posts the day-3 news in the first round of day 3 (simulated hour 48):

| # | Day-3 news | Measures |
|---|---|---|
| 0 | None (baseline; the mine stays pending) | Drift with no news |
| 1 | The state approves the new mine | Policy shock |
| 2 | Alaska proposes raising its tax on gold mining | Policy shock |
| 3 | A local protest over water and land | Social shock |
| 4 | Placebo: Tok school sports results | Reaction to irrelevant news |
| 5 | A court blocks the new mine | Mirror of 1 |
| 6 | Gold drops back to $4,000 | Mirror of the breakout |

Runs go in this order. If time runs short, drop runs from the bottom:

| Run | Scenario | Seed |
|---|---|---|
| 1 | 0 baseline | 1 |
| 2 | 0 baseline | 2 |
| 3 | 0 baseline | 3 |
| 4 | 4 placebo | 1 |
| 5 | 1 mine approved | 1 |
| 6 | 5 court blocks the mine | 1 |
| 7 | 2 tax rise | 1 |
| 8 | 3 protest | 1 |
| 9 | 6 gold back to $4,000 | 1 |

Runs 1–6 are the minimum: together they give the chance band, the placebo and the mirror pair.

## 6. Measurement (committed before the first scored run)

- **Support score:** a fixed judge prompt on gpt-5.4-mini scores every post and comment in both `actions.jsonl` files from 0 to 10 for support for gold mining at Tok. Posts that aren't about it are marked n/a and left out.
- **Measurement groups:** government (10), land-side industry (13), land-side community (7), funds (24), retail (6). The news wire is excluded.
- **Daily support:** a group's mean score on one simulated day, both platforms pooled. **Heat:** the group's posts per day.
- **Effect** of a scenario on a group: its mean support over days 3–5 minus the same figure for the seed-1 baseline.
- **Chance band** for a group: max minus min of the days 3–5 mean across the three baseline runs. This is conservative, because the baselines also differ in who acts and the seed-1 comparisons don't.
- **Timing:** the first day (3, 4 or 5) on which the daily difference from the baseline exceeds the chance band.
- **Calls:** after each run, MiroFish's batch interview puts the same three questions to all 24 tier-1 and tier-2 agents:
  - (a) Where is gold heading by day 5 (up, flat or down), and roughly how far?
  - (b) What will the state do next about mining near Tok, and when?
  - (c) Are people around Tok leaning for or against mining and the politicians backing it?

  The run's call is the majority answer: the price call from the funds, the policy call from government, the leaning call from the land side.

### Expected directions

These compare each scenario with the baseline over days 3–5. They are a proposal for Muhd to confirm before pre-registration.

| # | News | Expected |
|---|---|---|
| 1 | Mine approved | Funds up, government up, community down |
| 2 | Tax rise | Funds down, industry down |
| 3 | Protest | Community down, government down, funds down |
| 4 | Placebo | No group beyond its chance band |
| 5 | Court blocks the mine | Funds down |
| 6 | Gold back to $4,000 | Funds and retail down |

### Checks (pass or fail)

| Check | Passes when |
|---|---|
| Placebo | The placebo moves no group beyond its chance band, and each real shock moves at least one expected group in the expected direction by more than both its chance band and the placebo's move for that group |
| Mirrors | The funds' effects in 1 and 5 have opposite signs and both exceed the chance band; in 6, the funds and retail fall beyond their chance bands |
| Stability | The three baseline runs agree in at least 2 of 3 on each call (price, policy, leaning) |
| Grounding | At least 14 of 20 randomly sampled interview answers cite a post in that run's logs or a fact in the seed documents |

A failed check is reported as a finding, not hidden.

**Output:**
- One JSON record per run: scenario, seed, tiers, MiroFish commit, patch hash, daily support and heat per group, and the three calls.
- A results table: the four checks first, then each scenario's effects per group, ranked by size, with the chance band and timing.
- A chart of daily support per group across the 5 days.

## 7. Steps

| # | Step | Owner | Done when |
|---|---|---|---|
| 0 | Finish `MiroFish\.env`: `LLM_MODEL_NAME=gpt-5.5`, a Zep Cloud key, delete the three `LLM_BOOST_*` lines, add `LLM_TIER1_MODEL=gpt-5.5`, `LLM_TIER2_MODEL=gpt-5.4-mini`, `LLM_TIER3_MODEL=gpt-5-mini`. Set a budget alert in the OpenAI dashboard. Start MiroFish with `npm run dev` | Muhd | Backend on :5001 and frontend on :3000 start without errors |
| 1 | Seed documents: Tok and Manh Choh facts with sources, the pending new-mine application, the gold market on 23 Oct, the 61-role cast, and the simulation requirement | Muhd + Claude | MiroFish extracts the 61 roles; any extra or missing agents get fixed in step 3 |
| 2a | Tier patch: build both agent graphs agent by agent, taking each agent's model from its `tier` (replaces the calls at `run_parallel_simulation.py:1138` and `:1329`) | Muhd + Claude | A 2-round smoke run logs each agent's model, with one agent per tier checked and no API errors |
| 2b | Seeded activation: one `random.Random(seed)` per platform to choose who acts (`:1063–1080`), with the seed read from the config and the active agent ids logged each round | Muhd + Claude | Two smoke runs with the same seed and different news log identical active agents per round |
| 2c | Day-3 news: read `scheduled_events` entries (`round`, `poster_agent_id`, `content`) and publish each at its round, reusing the round-0 posting code (`:1180–1207`), on both platforms | Muhd + Claude | The news appears once in each platform's `actions.jsonl`, at the scheduled round |
| 3 | Build the graph and personas once in MiroFish. Then append the temperament paragraphs and set each agent's `activity_level` and `tier` and the news wire's settings. Copy the simulation folder 9 times and set each run's news and seed | Muhd + Claude | Profile checksums match across the 9 folders; the configs differ only in `scheduled_events` and seed |
| 4 | Pre-register the judge prompt, the expected directions, the checks and the thresholds in the team repo | Muhd | The commit is timestamped before run 1 starts |
| 5 | Timed pilot: the baseline with all 61 agents and the tiers, both platforms, one simulated day (`--max-rounds 24`), heavy apps closed. Record seconds per round, peak RAM, tokens and cost, and interview and scoring time. Muhd hand-scores 30 pilot posts to check the judge | Muhd | Measurements recorded; judge within 2 points on at least 24 of 30 posts; round length (60 or 120 min) and cut-off fixed |
| 6 | Run the 9 runs headless in the section 5 order (`uv run python scripts/run_parallel_simulation.py --config ...`), with interviews after each | Muhd | Every run has its JSON record, or the cut order (section 9) was applied and noted |
| 7 | Score: judge all posts; compute effects, chance bands, timing and the four checks; build the results table and chart | Muhd + Claude | One script regenerates the table from the records |
| 8 | Share the results in the repo and agree with the team what feeds Salman's solver | Muhd + team | Results doc merged |

Proposed home in the team repo: a `swarm/` folder for the seed documents, patch files, configs, judge prompt, scoring scripts and per-run records. Raw run logs and databases stay on the laptop, since `AGENTS.md` keeps large generated data out of Git.

## 8. Acceptance criteria

1. The society has exactly 61 agents with the group, tier and temperament counts in section 4, checked from the profile files and config.
2. The smoke runs show the right model per tier, identical activation for a shared seed, and the day-3 news on both platforms.
3. All 9 run folders have identical profile files (checksums), and their configs differ only in news and seed.
4. The pre-registration commit is older than run 1.
5. The judge passes its 30-post check before any scoring.
6. Every completed run has a JSON record with scenario, seed, tiers, MiroFish commit, patch hash, daily support and heat per group, and the three calls.
7. The results table shows all four checks as pass or fail, and every scenario's effect per group with its chance band and timing.

## 9. Risks, mitigations and cut order

| Risk | Mitigation |
|---|---|
| Time: everything must fit before 12:00 Sunday | The checks' runs come first; the cut order is below; the last run finishes by Sun 08:00 |
| Cost per run is unknown, and 9 runs multiply it | The pilot measures tokens and cost; a budget alert is set in step 0. The first saving is lowering tier 3's reasoning effort, which MiroFish leaves at the model default |
| A patch breaks MiroFish | Three small, separate patches, each smoke-tested. If the tier patch fails: everyone on gpt-5.4-mini, reported as such |
| RAM: free RAM swung between 1.2 and 7.3 GB, and a community log hit a 10-round ceiling on 8 GB | Close heavy apps; the pilot tracks memory over a full simulated day; each run is a fresh process |
| Rate limits: up to 30 concurrent calls per platform (`run_parallel_simulation.py:1159`) | The pilot shows any 429 errors; lower the limit if needed |
| The judge misreads posts | The 30-post human check; the same judge scores every run, so its bias largely cancels in the differences |
| Each scenario rests on one run | The chance band from three baselines plus the placebo; said plainly in the results |
| Extraction creates extra agents (for organisations named in the seed documents) | Fix the profile files before freezing (step 3) |
| The laptop sleeps or updates overnight | Sleep off, plugged in, updates paused |
| Forward-only results can't be checked against reality | Present the results as scenario exploration with pre-registered checks; MiroFish's FAQ says its output is not a calibrated forecast |

Cut order if the pilot shows the 9 runs won't finish by the cut-off:
1. 120-minute rounds instead of 60 (half the rounds).
2. One platform only (`--twitter-only`), about half the model calls.
3. Drop runs from the end of the run order: run 9, then 8, then 7.

Never cut runs 1–4 (the three baselines and the placebo): every check depends on them.

## 10. Defaults accepted with approval

Change any of these by telling Muhd; item 7 needs the team.

1. At Tok, scenario 1 is the state DNR approving the mine, as it approved Manh Choh's reclamation plan. BLM Alaska stays in the cast for federal land.
2. Scenario 3 stays "water and land"; naming the ore trucks too (a documented local grievance) is an option.
3. A 61st, silent agent (a fictional local news wire) posts the news.
4. The last run must finish by Sun 08:00.
5. Thresholds: the judge within 2 points on 24 of 30 posts; grounding 14 of 20.
6. Muhd does the patches and runs with Claude.
7. To agree with the team: what the results feed (for example, policy-risk and price scenarios for Salman's solver), and the `swarm/` folder.

## 11. Sources

- Alaska DNR, Manh Choh field inspection report, 25 Sep 2025 (dnr.alaska.gov, `mc2025.09.25_IR.pdf`).
- Alaska DNR, Manh Choh annual activity report for 2024.
- manhchoh.com and kinross.com project pages.
- Alaska/Richardson/Steese Highways Corridor Action Plan, executive summary (Kinney Engineering).
- OpenAI API pricing, developers.openai.com/api/docs/pricing, read 24 Oct 2026.
- MiroFish source, commit `7657031`, and OASIS `camel-oasis 0.2.5` (section 2).
