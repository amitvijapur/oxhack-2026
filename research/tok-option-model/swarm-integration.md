# Swarm data integration

25 October 2026. The source bundle contains descriptive simulator results. It supplies no validated financial signal.

## Pinned source and actual coverage

Branch `ahmed/gold-society-plan` is pinned at `f2fe2971d9f041a819f7b7ff4a78e10f840884f5`, committed at `2026-10-25T03:36:07Z`. The complete Git tree is not truncated. All nine input configurations exist. The [upstream report](https://github.com/amitvijapur/oxhack-2026/blob/f2fe2971d9f041a819f7b7ff4a78e10f840884f5/swarm/records/results/results.json) contains six judged five-day runs and three unjudged input-only rows. Runs 07 tax rise, 08 protest and 09 gold reversal have no scored outputs at this commit.

| Run | Score rows | Numeric support | Nonempty interviews | Expected interviews |
| --- | ---: | ---: | ---: | ---: |
| 01 baseline, seed 1 | 715 | 605 | 24 | 48 |
| 02 baseline, seed 2 | 684 | 613 | 48 | 48 |
| 03 baseline, seed 3 | 723 | 619 | 48 | 48 |
| 04 sports placebo | 474 | 436 | 0 | 48 |
| 05 mine approved | 454 | 423 | 0 | 48 |
| 06 court blocks mine | 449 | 425 | 10 | 48 |
| Total | 3,499 | 3,121 | 130 | 288 |

The remaining 378 score rows are null/off-topic. Interview wrappers say `completed`, including the two runs with zero nonempty responses. Counts come from the response values, not wrapper status or claimed slot counts. Expected coverage is 24 tier-1/tier-2 interviewees on two platforms per run. The compact report also preserves parsed-answer counts. A simulation finishing successfully does not establish interview completion.

The [handoff](https://github.com/amitvijapur/oxhack-2026/blob/f2fe2971d9f041a819f7b7ff4a78e10f840884f5/swarm/HANDOFF.md) records OpenAI GPT baselines and Claude placebo/approval/block runs. The latter use different models, simulator revisions and patch hashes, 100,000-token memory caps, ten comments per post and a concurrency setting of ten. Baseline caps are absent from run metadata; the handoff describes their memory as uncapped. Baseline provider attribution is explicitly marked as inferred from the recorded GPT bundle and runner default, since its metadata has no provider field. These comparisons combine news and configuration changes. Subtracting the baseline cannot identify a news-only effect. The adapter does not substitute placebo-relative comparisons into the canonical model.

## Checks and limits

| Check | Result |
| --- | --- |
| Three-baseline range bands | Available from days 3–5 |
| Baseline interview majority calls | Upstream pass |
| Placebo | Fail, including government and industry effects outside baseline bands |
| Approval versus court-block mirror | Fail, fund effects are both positive |
| Sampled grounding | Fail, 8/20 against a required 14/20 |
| Comparable configuration | Fail |
| Complete nonempty parsed interviews | Fail |
| Exact source knowledge cutoff | Unknown |
| Overall scenario readiness | Fail |

The current scoring judge is `glm-5.3-flash`, replacing the pre-registered GPT judge after its budget ran out. Recomputing agreement from the [GLM sample key](https://github.com/amitvijapur/oxhack-2026/blob/f2fe2971d9f041a819f7b7ff4a78e10f840884f5/swarm/records/judge-check/sample_key_glm-5.3-flash.csv) and [human marks](https://github.com/amitvijapur/oxhack-2026/blob/f2fe2971d9f041a819f7b7ff4a78e10f840884f5/swarm/records/judge-check/sample.csv) gives 26/30 within two points, above the 24/30 threshold. The legacy `validation.txt` describes the earlier judge at 27/30 and is not reused as the GLM result. Judge agreement measures scoring consistency only.

No input knowledge cutoff was supplied. It remains `null`. Generation, commit, retrieval and simulation start times are separate facts and never replace input information availability. Simulator support, interview price guesses and baseline range bands do not establish market probabilities, confidence intervals or predictive trading performance.

## Files and API

`model/tok-option/data/swarm-source.json` is a compact, attributed extract of the actual report, with daily means, true post counts, original check results, runtime comparison evidence and interview coverage. Its 36 source-file entries retain exact commit URLs, byte lengths and SHA-256 hashes. Downloaded bytes were verified against the pinned Git blob identities. Raw score text, agent profiles, interview text, credentials and large logs remain outside Git.

`model/tok-option/integrations/swarm.mjs` preserves the public entry points:

- `normalizeSwarmReport(report, metadata)` maps the upstream scenario/group names. A monetary import still requires explicit `sourceId`, `knowledgeCutoff` and `eventDefinition`. Missing cutoff returns `runs: null` and a cutoff error. When all other structural fields are valid, the added `diagnosticRuns` retains the original null cutoff and descriptive scores. Other malformed fields cannot use this diagnostic exception.
- `inspectNormalizedSwarmDiagnostics(document, scenarioId)` recomputes baseline bands, placebo, direction and mirror checks. It also requires a verified cutoff, matching recorded configurations and complete interviews for passed readiness. Missing evidence is unknown and explicit failures remain failures. Synthetic fixtures report `synthetic` and never claim passed simulator checks.
- `inspectSwarmSource(source, scenarioId)` exposes `rawReport` and `diagnosticRuns` for inspection. The current bundle returns `status: 'fail'`, `runs: null`, failed scenario readiness, failed full-run readiness and an unknown cutoff. Consumers continue to use `runs` for monetary imports. Merely displaying `diagnosticRuns` does not make it an eligible import.

The normalized daily score array contains one published group mean, marked `scoreAggregation: 'daily_group_mean'`. `sourcePostCounts[day][group]` retains the underlying number of scored posts. That singleton must never be displayed as one underlying post. `configuration` and `interviewCoverage` are preserved per normalized run. The configuration diagnostic compares provider, model tiers, simulator revision, patch, time step, tier counts and recorded memory/comment/concurrency settings. Missing settings cannot produce a pass.

## Verification and refresh

### Explicit website illustration

The website can use the already-recorded post means under a separate
`illustrative_contrast` policy selected explicitly in demo mode. Pairwise
configuration checks compare Claude run 04 with selected Claude run 05 or 06.
The whole-experiment OpenAI/Claude configuration check and other original
research failures remain unchanged. The use policy retains actual simulated
provenance, comparison IDs, source revision and an unknown source cutoff.

The method equally averages days 3–5 per group, subtracts the sports-placebo
reference and applies the current stakeholder weights after dividing score
differences by ten. Approval's normalized contrast is -0.0251792588 and court
blockage's is +0.0307343316. Under the existing hypothetical 7% transfer these
become -0.17625% and +0.21514% gold-price shifts. The default model's expected
cash becomes USD5.45 and USD10.22, alongside USD7.60 without a support adjustment.
This is a hypothetical gold forecast followed by mineral/option revaluation.
It is uncalibrated and does not turn the original experiment checks into passes.

Missing interviews are not imputed into this post-only illustration. Tax, protest
and gold-reversal results remain unavailable. The strict import/default policy
and real-input mode keep their existing source/economic restrictions. Read the
[no-API plan](../swarm-no-api-demo-plan.md) for the comparison limits and Muhd's
remaining manual handoff.

The 87 model tests pass, including 25 focused swarm/workbench integration tests. They cover the actual pinned report and hashes, exact aggregate counts, recomputed baseline bands, failed checks, null cutoff diagnostics, a historical pilot fixture, isolated provider/runtime confounds, missing/null/unparsed interviews, malformed imports and preserved baseline monetary oracles. Invented passing fixtures supply explicit, matching runtime and complete interview evidence. They do not replace actual results.

```sh
node --test model/tok-option/tests/*.test.mjs
node model/tok-option/audit.mjs
git diff --check
```

To refresh, verify the branch head and complete Git tree, retrieve the report and its referenced evidence at that exact commit, and decode Git blob content to preserve source bytes. Compare SHA-256 and byte counts against `sourceFiles`. Count numeric score rows, inspect all interview response values, recompute judge agreement against the matching judge key, and compare runtime metadata. Keep unavailable settings and source cutoffs unknown. Require comparable runs and passed checks before authorizing model adjustments. Input configurations alone are not completed runs.

## Refresh plan and review

Owner: Amit for integration; the data worker owns the compact swarm source, adapter and integration tests. The parent maintains the shared task plan.

- [x] Verify the current upstream commit and source hashes; summarize actual report, runtime and interview coverage.
- [x] Preserve raw report diagnostics with an unknown input cutoff while blocking monetary imports; enforce configuration and interview completeness.
- [x] Test the actual source bundle and adverse boundaries, review the diff, and hand off only the owned files.

Review: the refreshed source remains blocked for monetary use. No model formula, workbench implementation, UI, package or CI file was changed. The baseline expected-net-cash oracle remains $7.60. Actual news scenarios retain null monetary signals and mapped cash results.
