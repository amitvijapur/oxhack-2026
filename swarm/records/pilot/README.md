# Pilot run: one simulated day of the Tok society

A timing and format test, not one of the 9 scored runs (plan section 7, step 5). Run on Muhd's laptop on 24 Oct 2026.

- Baseline scenario (no day-3 news), seed 1, 61 agents, both platforms, 24 rounds of 60 minutes = simulated day 1 only. The day-1 news (gold jumps from about $4,000 to about $4,500) was posted at round 0.
- 1792 s of simulation, then 298 s of interviews. 373 OpenAI calls, all HTTP 200.
- The real runs use 120-minute rounds over 5 days, with each scenario's news on day 3, so this file shows the output format, not any scenario effect.

## Files
- `twitter-actions.jsonl`, `reddit-actions.jsonl`: every action. Keys: `round, timestamp, agent_id, agent_name, action_type, action_args, result, success`. Post text is in `action_args.content`. Round r covers simulated hours (r-1)*1 to r*1.
- `twitter-activation.jsonl`, `reddit-activation.jsonl`: which agents were picked to act in each round (the seeded schedule).
- `scores.jsonl`: one line per on-topic post with the judge's 0-10 support for gold mining at Tok (cold 0-3, warm 4-6, hot 7-10). Keys: `platform, round, day, agent_id, name, group, score, reason, text`; `score` is null when the post is off topic. The judge passed Muhd's 30-post hand check, 27 of 30 within 2 points (`../judge-check/`).
- `interviews.json`: answers from the 24 tier-1 and tier-2 agents on both platforms, under `result.results["<platform>_<agent_id>"].response`. Each answer is JSON with `gold_direction, gold_move_pct, state_next_move, state_move_timing, local_leaning, evidence`.
- `run_meta.json`: timings, seed, models and the outcome.

## Day 1 at a glance

| Group | On-topic posts | Mean support (0-10) |
|---|---|---|
| Government | 23 | 5.0 |
| Land side: industry | 67 | 5.8 |
| Land side: community | 35 | 4.7 |
| Funds | 114 | 5.3 |
| Retail | 38 | 5.7 |

Interview answers, counted across both platforms:

| Group | Gold direction | State timing | Local leaning |
|---|---|---|---|
| Government | flat 12, up 4 | weeks 15, days 1 | split 16 |
| Land side: industry | flat 6, up 2 | weeks 7, days 1 | split 8 |
| Land side: community | up 3, flat 3 | weeks 4, days 2 | split 6 |
| Funds | flat 10, up 8 | weeks 16, days 2 | split 18 |
