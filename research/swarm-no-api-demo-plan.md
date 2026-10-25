# No-new-API swarm demonstration plan

25 October 2026. Human owner: Amit. Simulation source owner: Muhd. Model
integration owner: Codex. This is a proposed hackathon policy and handoff, not a
claim of validated trading performance. No application behavior has changed.

## Decision

Do not spend more API credits to complete the original experiment for the
hackathon. Reuse the existing post-score data in an explicitly exploratory
demonstration. Preserve the actual source, its failed research checks and its
missing answers. Demonstration eligibility is separate from research readiness.

Use the three matching Claude runs for event contrasts:

- `04_placebo_s1` is the available comparison run.
- `05_mine_approved_s1` supplies the approval scenario.
- `06_court_blocks_mine_s1` supplies the court-block scenario.

Their provider, model tiers, seed, simulation duration, time step, simulator
revision, patch and recorded memory/comment/concurrency settings match. Their
scenario and scheduled day-3 news differ. The common day-1 gold jump is present
in all runs and must not be applied again as a separate estimated return.

The sports placebo is not an untreated control. A contrast with it does not
identify a causal news effect. One seed per event does not estimate uncertainty.
The three OpenAI baselines provide descriptive context, but their spread is not
a calibrated noise band for the Claude runs.

## What the six runs can supply

| Material | Use now | Keep out of the price calculation |
| --- | --- | --- |
| Three OpenAI baselines | Display support levels, paths and descriptive seed variation | A noise/confidence estimate for Claude event runs |
| Claude placebo, approval and block | Within-configuration support contrasts and time paths | Claims of isolated causal or predictive effects |
| Numeric post scores | Five stakeholder means, with original counts and score units | Null/off-topic scores; invented replacements |
| Existing interviews | Optional qualitative inspection, clearly showing coverage | Missing-answer imputation or mandatory input to the post-only demo |
| Earlier one-day pilot | Timing/format illustration | Days-3-to-5 event comparison |
| Tax, protest and gold-reversal inputs | Named hypothetical sensitivity cases, if wanted | Claims that those simulations were completed |

The judge-to-human post-scoring agreement passes at 26/30. The separate 8/20
grounding check samples interviews. Ten of its twelve failures are blank or
unparsed answers; two concern cited posts. This distinguishes a failed interview
channel from a blanket rejection of every scored post. It does not validate the
post scores as price forecasts.

## Proposed local calculation

For each group, average its daily mean scores equally over days 3, 4 and 5.
Subtract the placebo mean from the event mean and divide by ten, since scores
range from zero to ten. Combine groups with the agreed weights: industry 40%,
funds 40%, government 10%, community 7% and retail 3%.

Keep the actual resulting sign. A court-block result that moves support upward
must remain upward; do not force it negative to pass a mirror check. Check a
days-1-to-2 versus days-3-to-5 change comparison as a separate sensitivity, never
select the estimator because it produces the preferred story.

Pass this descriptive support contrast to the existing assignment/cash math
only under an explicit demo policy. The +/-7% transfer ceiling is a modeling
assumption. Show transfer strength from zero to the existing full transfer, so
the baseline is always visible. Any reduced strength is an arbitrary stress
assumption, not a measured confidence or reliability score. It does not repair
the underlying experiment.

Version 2 routes the contrast through a hypothetical gold forecast before
recomputing material value and assignment proceeds. The adjustable 0–7% cap
bounds the gold response, not the option movement. The effect is held constant
across monthly sale dates and applied once. This is an uncalibrated
sentiment-to-gold assumption; source post scores are not financial return labels.

### Current v2 results

The numeric post scores were re-aggregated directly from the committed JSONL
files at source `f2fe2971`, with no new API calls. A separate sensitivity adjusts
for the pre-event days 1–2; it preserves the same aggregate signs.

| Event versus matching placebo | Weighted normalized support contrast | Hypothetical gold shift at full assumed transfer | 90-day demo expected cash |
| --- | ---: | ---: | ---: |
| No monetary transfer | 0 | 0% | USD7.60 |
| Mine approval | -0.02517926 | -0.17625% | USD5.45 |
| Court blocks mine | +0.03073433 | +0.21514% | USD10.22 |

The cash figures use the existing pure canonical model with its default
USD1,500 assignment proxy, USD700 upfront cash and assumed 48.8% sale probability.
These are sensitivity outputs, not observed returns. The zero-transfer baseline
should be the default until the user explicitly selects a hypothetical transfer.
Show zero and full assumed transfer together; a halfway sensitivity is optional.

Approval is below placebo in all five stakeholder groups and on all three
post-event weighted daily comparisons. The court-block aggregate is negative
on day 3 and positive on days 4–5. Funds' positive support response drives its
positive combined result. The surprising signs survive the comparison change.
They must be visible in the demo and discussed as findings, not reversed or
discarded to create the expected story.

## Minimal model integration contract

The canonical workbench should gain a clearly labeled exploratory replay policy
inside explicit demo mode. Do not disguise these real simulated observations as
a synthetic fixture, rewrite the placebo as a neutral baseline, delete failed
checks, or change strict real-mode readiness.

Carry these fields through the model output and export summary:

- Source revision, event run ID, comparison run ID and simulator configuration.
- Score window, group means, source post counts, weights and signed contrasts.
- `comparisonMethod: matched_configuration_placebo_contrast`.
- Underlying `provenance: simulated`, plus a separate
  `usagePolicy: illustrative_contrast` and method version. Keep the original
  research checks; do not substitute a new source type into the current parser.
- Explicit hypothetical transfer settings and unchanged resource/contract/sale
  assumptions.
- Separate `demoEligible` and `researchReadiness` fields. Financial output status
  stays `illustrative`; real financial outputs stay unavailable.

Structural checks remain mandatory even in this mode: known run IDs, matching
recorded configurations, complete required days/groups, finite scores in range,
valid weights and explicit economic assumptions. Missing interviews, absent
other scenarios and failed research diagnostics become visible limitations for
this post-only demonstration, not hidden passes. No UI should claim a confirmed
buy signal or calibrated probability from the support score.

The configuration check is pairwise: compare run 04 with the selected run 05 or
06, allowing only the scenario and scheduled-news differences. The original
whole-experiment comparison against the OpenAI baselines remains failed.

Reuse the existing canonical valuation, sale/no-sale cash and portfolio math.
Sentiment changes neither the assumed sale hazard nor the geology. Preserve
separate unsold marks, costs and the full no-sale cash branch.

## Muhd's zero-API handoff

The pushed artifacts already suffice to calculate the proposed contrasts. The
items below improve provenance and interpretation; unavailable interview text
does not block a post-only hackathon demonstration.

1. Confirm the current six output folders are the intended final artifacts.
   Supply any already-generated local outputs that have not been copied to Git.
   No regeneration is necessary merely to re-export existing files.
2. Record the scenario definitions, day-3 intervention time, run configuration
   and what source information was supplied. Provide a real source cutoff if it
   can be established; otherwise retain unknown. Simulation start and commit
   times are not substitutes.
3. Check local raw logs/databases for already-generated missing interview text.
   Recover it only if it exists. The pushed approval/placebo responses are literal
   nulls and cannot be restored by reparsing. If nothing exists, leave them null
   and mark the interview channel unavailable.
   Do not run `run_one.py` merely to recover text: its setup clears IPC responses
   and normal execution uses paid models. The upstream `score.py report` can
   also call a model for uncached grounding checks; use a genuinely offline
   aggregator or explicit human review rather than assuming that command is free.
4. Manually inspect a fixed, recorded sample of posts from all five groups across
   the three Claude runs. Check event relevance, group mapping and scoring
   direction. Record corrections and a new analysis version if needed. Do not
   remove a post merely because its opinion is unexpected.
5. Explain unusual responses using the available posts. Clarify whether support
   for mining is being confused with willingness to buy a land option. Treat the
   price mapping as hypothetical either way.

## Paid work deferred beyond the hackathon

If later establishing a research result, run a neutral no-news Claude control
and matched event/control repeats with fixed settings, seeds and source cutoff.
Complete the interviews only if using interview-dependent features. Finish the
missing scenarios when they are needed. Estimate variation from comparable
runs, then evaluate a dated financial prediction target against a simple
chronological baseline. Current demonstration assumptions are not validation.

## Verification before implementing

- Recompute contrasts from the pinned actual group means and check per-day signs.
- Show zero and full transfer plus a negative-signal sensitivity. Do not tune the
  transfer to make expected cash positive.
- Confirm no interview null becomes zero, no failed check becomes pass, and no
  unsupported scenario receives a simulated result.
- Confirm demo outputs remain illustrative and real-mode cash remains null.
- Review the new signal/export provenance alongside the same canonical money
  calculation. This plan authorizes no trade execution or new paid API run.

## Plan review and current state

Independent review confirmed the matched-input comparison, distinction between
post scoring and interview grounding, and a viable post-only demo policy.
Offline recalculation verified the figures above through the existing canonical
cash engine. Actual source readiness remains failed in every sensitivity case.
No runtime, model formula, schema, UI or publication behavior was changed in this
planning session. Implementation is a small, explicit canonical-workbench policy
and a coherent source/summary/UI update, followed by focused boundary checks.
