# Plan: three-variant gold stakeholder swarm on MiroFish

Status: **approved by Muhd, 24 Oct 2026 ~20:30; shared for team review**. Owner: Muhd (prompts and agent information, and now the MiroFish runtime). Drafted 24 Oct 2026 ~20:15 from an interview with Muhd. Team decision: MiroFish runs on Muhd's laptop. Still to reconcile with Amit's US soil build plan (`research/us-soil-build-plan.md`): what this swarm feeds into.

## 1. Requirements summary

| Decision | Choice |
|---|---|
| Runtime | MiroFish on Muhd's Windows laptop (team decision), not AgentSociety 2. Measured this session: 15.7 GB RAM with 1.2–7.3 GB free depending on open apps; ~7.7 GB free disk; Python 3.13 and uv available |
| What it predicts | How stakeholder sentiment around gold land moves (1) the gold price and market reaction, (2) government policy (contracts, permits, tax), (3) political leaning |
| Commodity and place | Gold first (copper parked). Place to confirm: the Tok River area, Alaska (recommended: matches the team's approved gold evidence packs, Tok west and east, in `research/gold-evidence-results.md`) or a Nevada gold district (the original assumption). Section 2 uses Nevada roles and gets renamed if Tok is chosen |
| Starting event | Gold breaks out from about $4,000 to a record $4,500/oz on day 1 (gold futures closed at $4,008 on 23 Oct 2026) |
| Simulated length | 5 days. Rounds = 5 × 24 × 60 ÷ minutes_per_round: 120 rounds at 60 min or 60 rounds at 120 min (MiroFish max). Chosen after the pilot |
| Cast | 60 agents per swarm: government 10, land side 20 (workers across the chain plus directly affected locals), buyers 30 (24 funds + 6 retail = 80/20) |
| Model tiers | 3 tiers: 6 agents on gpt-5.5, 18 on a middle model (chosen from the key's model list), 36 on gpt-5.5-mini. Identical tiers in every swarm |
| Variants | Cautious, moderate, free (section 3) |
| Sentiment scale | Cold / warm / hot per group. Assumed meaning: temperature towards the land or project (cold = hostile or uninterested, warm = cautiously positive, hot = enthusiastic or frenzied). To confirm |
| Evaluation | Forward-only (no backtest). "Best" judged on pre-registered proxies (section 5) |
| Run budget | Set from a timed pilot, not guessed. Starting design: per variant 3 baseline runs + 3 shock runs = 18 runs |

## 2. Cast and tiers (60 agents)

| Group | Agents | Tier 1: gpt-5.5 (6) | Tier 2: middle model (18) | Tier 3: gpt-5.5-mini (36) |
|---|---|---|---|---|
| Government | 10 | Governor; BLM Nevada state director | State mining regulator, county commission chair, state legislators, tax office, environmental agency, tribal liaison | 2 junior officials |
| Land side | 20 | Mine company head; tribal chair | Union leader, town mayor, rancher association head, environmental group lead, water district manager | Exploration geologists, mine crews, haul drivers, mill workers, suppliers, residents, ranchers |
| Buyers | 30 (24 funds, 6 retail) | Largest gold macro fund; largest gold ETF manager | Mining-equity funds, commodity trading adviser, central-bank watcher fund, pension allocator, bullion bank desk | Smaller funds and all 6 retail investors |

Each cast member is written into the seed documents by name and role, so MiroFish extracts exactly these entities as agents. MiroFish creates one agent per extracted entity.

## 3. Variant settings (everything else identical)

| Setting (MiroFish `simulation_config.json`) | Cautious | Moderate | Free |
|---|---|---|---|
| `narrative_direction` | "Weigh the evidence, cite the briefing, update gradually" | "React in proportion; balance evidence and opinion" | "Explore bold reactions and knock-on effects" |
| `stance` mix | About half neutral or observer | About a third neutral or observer, rest split | Mostly supportive or opposing |
| `sentiment_bias` range | ±0.3 | ±0.6 | ±0.9 |
| `activity_level` | 0.3–0.5 | 0.4–0.7 | 0.5–0.9 |
| `echo_chamber_strength` | 0.2 | 0.45 | 0.7 |
| `recency_weight` | 0.3 | 0.45 | 0.6 |
| Persona addendum | "Wait for confirmation before changing your view" | "Update your view when the news is credible" | "Act on instinct; take positions early" |

Held identical across variants: personas (generated once, then copied), model tiers, `influence_weight`, seed documents, rounds, shock timing, random seeds.

## 4. Runs

- **Baseline:** day-1 gold breakout only; 3 runs per variant with different random seeds.
- **Shocks**, injected via MiroFish `scheduled_events` at the start of day 3 (one shock per run, 1 run each per variant):
  1. The BLM approves a new open-pit gold mine near the town.
  2. Nevada proposes raising its gold mining tax.
  3. A local protest over water and land.
- **Pilot first:** cautious variant, full 60 agents and tiers, 10 rounds, on the machine that will run MiroFish. Record seconds per round, actions per round, peak RAM, token use and cost (OpenAI dashboard), and report-generation time.
- **Total time** = runs × (rounds × measured seconds per round + measured report time). If it exceeds the time left before judging, cut in this order: shock runs to 2 per variant, then 120 → 60 rounds, then baseline seeds 3 → 2.

## 5. How the winner is chosen (pre-registered before any run)

| Criterion | Weight | Measure |
|---|---|---|
| Stress-test pass rate | 40% | For each shock, the expected direction per group is written down in advance: tax hike → miners and funds cool; mine approval → government warm, locals split or cool; protest → government cools, locals heat up. Score = share of checks passed |
| Stability | 30% | Across the 3 baseline seeds: share of the three predictions (price direction, policy move, political leaning) that agree in at least 2 of 3 runs, plus the spread of daily group sentiment |
| Grounding | 20% | In a sample of 20 predictions per variant, the share that point to specific agent posts or seed facts |
| Specificity | 10% | The share of predictions giving a direction, a size and a timeframe |

The variant with the highest weighted score is "best". Ties go to stability.

## 6. Outputs per run

After each run, interview every group with the same fixed questions and extract a JSON record per run:
- daily sentiment per group (cold / warm / hot);
- gold price direction and size over the 5 days, as the market group expects it;
- the most likely government policy move and its timing;
- the direction of political leaning among locals and the public;
- supporting evidence (post or seed references).

The record also stores the variant, seed, shock, model tiers and MiroFish version.

## 7. Implementation steps (after approval)

| # | Step | Owner | Done when |
|---|---|---|---|
| 0 | Set up MiroFish on Muhd's laptop: create a Zep Cloud key, put the OpenAI and Zep keys in MiroFish's `.env` (never committed), check disk space for its dependencies, list the key's models and pick the middle tier | Muhd | Model names verified against `/v1/models`; MiroFish backend and frontend start on Windows |
| 1 | Write the seed documents (place, gold market context, the 60-person cast) and the simulation requirement | Muhd | MiroFish extracts exactly 60 agents, with the group split in section 2 |
| 2 | Patch the MiroFish runner for per-agent model tiers: a tier field in profiles; build the OASIS agent graph agent by agent instead of one model per platform (`backend/scripts/run_parallel_simulation.py`, `create_model` at line 984, used at lines 1130 and 1322) | To assign | A 2-agent smoke run logs the expected model per agent |
| 3 | Build the graph and personas once; freeze and copy them into each variant's simulation | Muhd | Profile files identical across variants (checksums) |
| 4 | Write the three variant configs (section 3) and three shock events (section 4) | Muhd | Diff between variant configs shows only the section 3 fields |
| 5 | Timed pilot (section 4), with heavy apps closed | Muhd | Seconds per round, peak RAM, free disk, cost and report time recorded |
| 6 | Fix rounds and run count from the pilot, then run the schedule | Muhd | All planned runs finish, or cuts applied in the documented order |
| 7 | Extract outputs (section 6) and score (section 5) | Muhd + Salman | One score table per variant; winner named |

## 8. Acceptance criteria

1. All three variants use the same 60 personas (checksums match) and the same model tiers.
2. The per-agent tier patch is verified by logs showing each agent's model.
3. Pilot measurements exist before the full schedule starts.
4. Every planned run has a JSON output record with variant, seed, shock, tiers and MiroFish version.
5. The scoring rules in section 5 are committed before the first scored run.
6. The final score table shows all four criteria per variant and names a winner.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| The tier patch breaks MiroFish | Keep the patch small and separate; fallback is everyone on one model with tier expressed only through `influence_weight` |
| RAM runs out on long runs (a community log saw a 10-round ceiling on an 8 GB machine; this laptop's free RAM swung between 1.2 and 7.3 GB) | Close heavy apps (Firefox tabs, WizTree) before runs; measure peak RAM in the pilot; cut rounds or agents first |
| Disk fills up (~7.7 GB free) during MiroFish install or runs | Check dependency size before installing; removing the unused AgentSociety `.venv` frees about 1 GB (only with Muhd's go-ahead) |
| Rate limits at up to 30 concurrent calls (runner semaphore, line 1159) | Pilot reveals throttling; lower concurrency or add a second key via `LLM_BOOST_*` |
| GPT-5-family models may reject custom temperature | Don't rely on temperature; variants differ through the section 3 settings |
| Model names differ from the assumed ones | Step 0 verifies names against the key's model list |
| Forward-only results can't be checked against reality | Present them as scenario exploration with pre-registered consistency scoring. The MiroFish FAQ itself says output is not a calibrated forecast |
| Runs don't fit before judging | Pilot-based budget and the documented cut order |
| Conflict with Amit's soil plan | Agree with the team what this swarm feeds: for example, policy-risk and price-outlook scenarios for Salman's solver |

## 10. Assumptions to confirm
- Cold / warm / hot meaning (section 1).
- The place: Tok River area, Alaska (matches the team's gold data) or Nevada.
- The scoring weights in section 5.
- Who owns the tier patch (step 2).
