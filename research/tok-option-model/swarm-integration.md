# Swarm data integration

25 October 2026. This is the source handoff for the model integration, not an empirical trading result.

## Pinned source and actual coverage

Branch `ahmed/gold-society-plan` is pinned at `d7717cd459b9e567bd3162a86b84ff55c9b0bfc3`. Its complete, non-truncated Git tree contains nine **run input configurations**, one day-one pilot and the pilot judge check. It contains no `swarm/records/results/results.json` or completed scenario-score exports elsewhere. The [upstream handoff](https://github.com/amitvijapur/oxhack-2026/blob/d7717cd459b9e567bd3162a86b84ff55c9b0bfc3/swarm/HANDOFF.md) records desktop memory failures and a batch-size fix, but does not prove the replacement runs completed.

The [pilot README](https://github.com/amitvijapur/oxhack-2026/blob/d7717cd459b9e567bd3162a86b84ff55c9b0bfc3/swarm/records/pilot/README.md) explicitly calls it a timing and format test, not one of the nine scored runs. The pinned score file contains 296 rows, all day 1: 277 on-topic scores and 19 null/off-topic scores. There are no day-three interventions or days 3–5 observations. Therefore this pilot cannot supply the model's scenario-minus-baseline effect.

| Group | On-topic posts | Mean support, 0–10 |
| --- | ---: | ---: |
| Government | 23 | 5.0435 |
| Industry | 67 | 5.7910 |
| Community | 35 | 4.6857 |
| Funds | 114 | 5.2982 |
| Retail | 38 | 5.6579 |

These are descriptive simulated post statistics. They are neither independent market respondents nor predicted price probabilities. [Human judge agreement](https://github.com/amitvijapur/oxhack-2026/blob/d7717cd459b9e567bd3162a86b84ff55c9b0bfc3/swarm/records/judge-check/validation.txt) is reported as 27/30 scores within two points, above the pre-registered 24/30 requirement. This checks scoring agreement, not market forecasting.

## Files and API

- `model/tok-option/data/swarm-source.json` is a compact bundle of these source facts, exact commit, source file URLs, SHA-256 hashes, retrieval time, commit time, pilot times and limitations. It excludes agent text, credentials, raw logs and large profile files. Source knowledge cutoff is explicitly null; none was supplied.
- `model/tok-option/integrations/swarm.mjs` exports `inspectSwarmSource(source, scenarioId)`, `normalizeSwarmReport(report, metadata)` and `inspectNormalizedSwarmDiagnostics(document, scenarioId)`.
- The current bundled source returns `PENDING_SWARM`, `runs: null`, a passed pilot judge check and unknown full-run diagnostics. No scenario signal is invented.

When the final report arrives, `normalizeSwarmReport` accepts the actual `swarm/score.py report` schema. Explicit metadata must supply `sourceId`, `knowledgeCutoff` and `eventDefinition`; report generation time never substitutes for input information availability. Metadata may also supply the human `judgeCheck`. The normalizer explicitly maps `mine_approved` to `mine_approval`, `court_blocks_mine` to `mine_blocked`, `tax_rise` to `proposed_tax`, `gold_back_to_4000` to `gold_reversal`, `placebo` to `sports_placebo`, and the two `land_*` groups to `industry`/`community`.

The upstream report contains daily means and post counts, not raw scored posts. Each normalized score array therefore holds one published daily mean, marked `scoreAggregation: 'daily_group_mean'`; `sourcePostCounts[day][group]` preserves the original post counts. Consumers must not display the singleton aggregate as one underlying post. No raw observations are fabricated.

Diagnostics recompute chance bands from complete days 3–5 of baseline seeds 1, 2 and 3; compare the placebo against those bands; check each scenario's pre-registered expected responses; and check approval/block and gold-reversal mirrors. They preserve upstream baseline interview-call stability and sampled-answer grounding. Missing checks remain unknown. A reported failure is not promoted to a pass. Per-scenario readiness exposes the applicable checks and reasons. Synthetic fixtures explicitly return `synthetic` and never claim passed simulator checks. All these checks concern simulator consistency, not predictive market skill.

## Verification and refresh

`node --test model/tok-option/tests/swarm-integration.test.mjs` passes twelve focused tests covering the exact pinned source coverage, explicit schema mapping, daily aggregate/count preservation, required cutoff, missing observations, placebo failures, mirror scoping, synthetic labels, rejected values, partial-check states and malformed diagnostic metadata. Test reports are invented fixtures, clearly marked in the tests.

To refresh, inspect the latest branch commit and complete Git tree, fetch the final report and referenced run evidence at that same commit, verify source hashes, and supply the actual knowledge cutoff and event definition. Keep the branch commit and retrieval timestamp separate. Do not replace the pilot with guessed day-three scores or treat configuration files as simulation results.
