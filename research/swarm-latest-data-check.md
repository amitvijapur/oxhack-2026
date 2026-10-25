# Latest swarm data check, 25 October 2026

Checked the remote repository through 05:54:07 UTC. Muhd's
`ahmed/gold-society-plan` branch remains at
`f2fe2971d9f041a819f7b7ff4a78e10f840884f5`, committed at 03:36:07 UTC. Integrated
main remains at `57c6f320a8e0a5346643ab80c9e492b7cc4b2be0`. No later swarm-result
branch or open result PR was found. No source import, model or remote write was
made during this audit.

## What is already connected

The current model includes all six completed score sets. The complete remote
tree matches the local Git object inventory, and all 36 bundled source-file
SHA-256 fingerprints, byte counts and Git blob identities match upstream.

| Run | Scored rows | Numeric scores | Nonempty parsed interviews | Model |
| --- | ---: | ---: | ---: | --- |
| 01 baseline seed 1 | 715 | 605 | 24/48 | Included |
| 02 baseline seed 2 | 684 | 613 | 48/48 | Included |
| 03 baseline seed 3 | 723 | 619 | 48/48 | Included |
| 04 sports placebo | 474 | 436 | 0/48 | Included |
| 05 mine approved | 454 | 423 | 0/48 | Included |
| 06 court blocks mine | 449 | 425 | 10/48 | Included |
| Total | 3,499 | 3,121 | 130/288 | |

The other 378 scored rows are null/off-topic, not silently discarded completed
scenarios. The raw interview files themselves contain empty responses. Runs
04 and 05 each have 48 null responses; run 06 has 38. Metadata says `completed`
and `outcome: ok`, which does not establish answer coverage. The upstream
handoff attributes run 01's missing Reddit interviews to a context limit and
runs 04–06's interview losses to Claude credit exhaustion.

## What is still missing

Runs 07 tax rise, 08 protest and 09 gold reversal have frozen inputs but no
committed score/interview output folders. Commit `ec480764` explicitly paused
these runs: run 07's partial execution was stopped and its folder reset, while
08 and 09 had not started. The later head commit only repairs handoff paths.

The actual bundle still has an unknown source knowledge cutoff, differing
baseline/news model configurations, failed placebo and approval/block mirror
checks, failed grounding and incomplete interviews. These failures were already
present upstream and remain monetary blockers.

## Extra upstream material

The 68 swarm files outside the compact 36-file source manifest are raw
action/activation logs, generated profiles, older pilot material, alternative
judge keys/cache, a rendered report and setup/seed inputs. They do not contain
additional completed runs 07–09. The one-day pilot does not replace the required
days 3–5 scenario comparisons. The model deliberately keeps bulky raw text out
of its compact bundle while retaining the score means, source identities and
check results.

Independent recomputation of all 150 daily group means and 30 days-3-to-5 means
found no mismatch against the report or compact bundle.

All alternative judge agreement checks pass, including the current GLM Flash
judge at 26/30. This cannot clear independent run-quality failures. The raw
grounding sample still confirms 8/20 against the required 14/20.

Conclusion: integration is complete for the six pushed runs. Further usable
evidence requires completed missing scenarios, repaired interview coverage,
comparable configurations and attributable source cutoffs. The visualization
was deferred at Amit's request while this audit was performed.
