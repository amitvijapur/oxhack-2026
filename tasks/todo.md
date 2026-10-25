## Prepare forecast changes for push and squash merge

Owner: Amit. Codex prepares the integration branch and an independent reviewer checks its final scope. User requested local staging for publication.

- [x] Integrate current main while preserving the shared pitch-deck work and all previously verified forecast/demo behavior.
- [x] Review the complete branch diff, run relevant integration checks and resolve any failures.
- [x] Prepare the pull-request description, verification evidence and squash-merge handoff.

Publication scope includes the swarm-to-gold forecast, hypothetical-only option website, percentage-return synthetic preset and attributed historical event pilot. No historical predictive edge is claimed. Push and protected-main merge remain separate publication steps.

Preparation review: `codex/gold-forecast-ready` includes main `eef7ac2` and all six feature commits. Only task-log conflicts required resolution; upstream pitch assets and their task section are preserved exactly. Independent integration review passed. Local verification passed 137 model/event, 35 frontend, 21 backend, 16 publisher, 5 scanner and 13 tooling tests, totaling 227, plus 29 specification checks, source audit, backend typecheck, production build, actionlint and redacted Git-history secret scan. Application lint has zero errors and four incumbent warnings. Prior browser checks apply to byte-identical application code. A PR description and publication checklist are prepared locally. This completes staging; push, hosted checks and squash merge have not been performed.

## Show percentage returns and a conservative synthetic demo

Owner: Amit. Codex integrates; one UI worker owns presentation and preset tests, with separate arithmetic review. Scope is website presentation and an explicitly assumed preset, reusing the canonical engine.

- [x] Trace the cash outputs and define return denominators, percentage-point deltas and unavailable states.
- [x] Present performance summaries, comparisons and holding-period charts as percentages; retain price/cost inputs and detailed cash equations in their actual units.
- [x] Add a modest positive synthetic demo with explicit pricing, probability and signal assumptions; preserve the historical pilot result and recorded-source provenance.
- [x] Verify arithmetic, meaningful tests, production build and browser behavior; record results and remaining limits.

The expected return denominator is upfront capital at risk. Gold movement, assignment-price movement and return changes must remain distinct. A synthetic positive expectation is a demonstration, not a measured trading edge.

Review: percentage presentation reuses unchanged canonical cash math. The default/reset synthetic preset has a 1% cap, invented +0.5 signal and 50% retention, giving +0.25% gold, 1.52% 90-day cash return versus 1.09% baseline and +0.44 percentage points. No-sale probability remains 51.2%; positive upfront capital has a -100% no-sale cash return. The 30-day result remains -58.39%. Recorded scores, source failures and negative historical pilot are unchanged.

Verification: 35 frontend tests passed, including eight new arithmetic/actual JSX-render tests; typecheck, scoped lint, production build and whitespace checks passed. Independent review passed. Local browser checks verified preset/default/reset, recorded approval at the current 1% cap, missing scenarios, premium-driven negative returns, zero-capital unavailable percentages, imported-source clearing and 1440/320-pixel layouts without overflow. No browser errors. The local site on port 5182 serves the new build. No push, hosted deployment or new API runs.

## Build a real-data Alaska project event pilot

Owner: Amit. Codex integrates event-source research, a reproducible evaluator, website evidence view and independent review. Prioritise speed with a small fixed scope. No paid swarm reruns.

- [x] Freeze a source-based event ledger before inspecting returns, and obtain attributed daily market data.
- [x] Evaluate delayed-entry returns against gold-only and simple event-direction baselines, with a chronological held-out set and no simulated swarm labels.
- [x] Display actual study results, sources, dates, limitations and failed/unsupported comparisons in the existing website.
- [x] Independently check data timing and arithmetic, run relevant checks and verify the local production page.

Result: 12 frozen real announcements and four attributed daily price series support a reproducible retrospective pilot. Event-model MAE is 8.06pp versus gold-only 3.13pp and no-change 2.56pp on five primary test events. No positive edge was manufactured. UI exposes both horizons, sources, source-selection/precision limits and unavailable swarm lift. Independent verification reproduced inputs, dates and arithmetic. Final build/browser verification is recorded in the pilot report.

## Assess a defensible edge with current data

Owner: Amit. Codex assesses sources and no-budget tests; the application remains unchanged.

- [x] Audit actual market outcome labels, availability dates and independent sample counts, including whether swarm runs can be paired with observed returns.
- [x] Check the most plausible prediction target and a minimal baseline comparison using existing data and primary sources.
- [x] Run any valid bounded offline diagnostic, document what it does and does not establish, and state the smallest remaining evidence requirement.

Result: [edge feasibility](../research/edge-feasibility.md) records zero observed feature/outcome pairs, the target mismatch, primary-source support for a local-risk hypothesis and the next empirical test. Offline canonical sensitivity finds liquidity assumptions dominate the current swarm cash deltas. No measured predictive edge or retrospective backtest was claimed; application unchanged.

## Complete the hypothetical swarm-to-gold forecast

Owner: Amit. Codex coordinates a model worker, UI worker and independent reviewer.
Scope: the current website branch, canonical model, focused tests and current docs.

- [x] Replace direct option markup with one explicit hypothetical Au price response, then recompute mineral value, assignment value and interval cash outcomes.
- [x] Show baseline and scenario gold prices, return, assumptions and downstream deltas in the existing Decision calculator. Keep financial mode hypothetical only.
- [x] Check positive/negative/zero signals, horizons, absent signals, mixed materials, source provenance and publication boundaries; independently review the math.
- [x] Run relevant model/frontend/backend checks, rebuild and verify the local website, document results and current limits.

Design: baseline P(t)=P0*(1+g)^(t/365); scenario gold P(t)=baseline P(t)*(1+cap*s*exposure*retention). The editable cap defaults to 0.07 and is bounded by 0.07. Apply once to Au only at each valuation/sale date, with a constant retained relative effect across the modeled holding period. Recompute assignment as pGeo*max(ownership*kappa*sum(Q*scenarioP)-K,0), without any second option multiplier. Industry/funds weights, original failed source checks, null missing scenarios, geology and sale hazard retain their meanings. The forecast is an uncalibrated assumption using mining-support contrasts, not measured market skill; the common day-1 gold jump is not a new return. Version and export metadata must distinguish the changed method.

# OXHack preparation

Review: model v2 routes the bounded hypothetical response through Au price before the assignment floor. Independent monthly-growth and recorded-source arithmetic passed. Model tests: 126; frontend: 23; Convex: 21; Python publisher/transport: 16. Type checks, scoped lint, production Webpack build, 29 specification checks and source audit passed. The publication reviewer found and resolved acceptance of old direct-markup cash under a v2 label; horizon and interval traces now match canonical evaluation. Browser checks cover baseline, actual approval/block, zero cap, synthetic positive/negative, missing tax and 320-pixel layout. No browser errors. The production site on local port 5182 runs the new build. No new paid swarm calls, hosted deployment, push or merge.

Default 90-day actual contrasts: approval gold USD1996.47490377, assignment USD1495.59362971, cash USD5.44969130, cash delta USD-2.15030870; block gold USD2004.30280642, assignment USD1505.37850803, cash USD10.22471192, cash delta USD2.62471192. Baseline cash remains USD7.60. Predictions are hypothetical and uncalibrated; original source research checks remain failed.

## Make the website option calculator hypothetical-only, 25 October 2026

Human owner: Amit. UI owner: Codex, with an independent canonical-math check.
Scope: the website always uses hypothetical financial inputs. Preserve observed
evidence and recorded simulation sources, model math and backend boundaries.

- [x] Start and reset the website calculator in hypothetical demo mode; remove other financial-mode choices.
- [x] Clearly distinguish positive total expected cash from a negative change versus baseline.
- [x] Verify positive/negative premium cases and exact break-even conditions with the existing model.
- [x] Verify default/reset/source interactions and responsive production behavior.
- [x] Record the result and update current instructions.

Result: the website opens and resets in hypothetical mode only. Baseline total
expected cash is USD7.60, approval USD6.31 and blockage USD9.17. A negative
approval change of USD-1.29 does not make its total negative. With other flat
90-day defaults fixed, premium USD500 gives USD157.60, USD800 gives USD-142.40,
and baseline break-even is USD657.60. The UI reads the break-even figure directly
from canonical diagnostics. Production browser/default/reset/source cases,
23 frontend tests, typecheck/build, scoped lint and independent review pass.
Canonical engine/API defaults, gates and financial math are unchanged.

## Share the five-minute pitch deck, 25 October 2026

Human owner: Amit. Integration owner: Codex. Scope is the approved Palantir-style
deck, editable presentation objects, PDF, rehearsal notes and supporting assets.
The earlier local-only limit is superseded by Amit's explicit push-and-merge request.

- [x] Rebuild and visually compare all nine slides with the selected reference compositions.
- [x] Verify editable chart and tables, nine speaker-note parts, cash arithmetic and the 300-second main sequence.
- [x] Package the approved deck and portable team handoff, with independent scope review.
- [x] Prepare an isolated publication branch for the required hosted checks and squash merge.

Seven main slides carry the five-minute talk; two appendix slides support questions.
The neutral title is Mineral option timing. Naming options remain open. Presentation
editing, source images and rehearsal instructions are in [pitch/README.md](../pitch/README.md).
Native PowerPoint opening and its font rendering have not been tested; the PDF
preserves the approved appearance.

Publication review: the PPTX and PDF match the approved originals byte-for-byte.
All 16 changed paths belong to the pitch package and its two repository index notes.
Whitespace, portable documentation links, editable chart/workbook and tables, note
timings, asset attribution and a redacted secret scan passed. Required hosted
checks and final merge status are recorded on the publication pull request.

## Connect existing swarm results to the website, 25 October 2026

Human owner: Amit. Source owner: Muhd. Integration owner: Codex.
Branch: `codex/swarm-website-replay`. No new swarm or judge API calls.

- [x] Add a bounded, explicit illustrative policy to the canonical workbench using matching actual Claude runs.
- [x] Add website controls, provenance and live recalculation of values/cash/deltas.
- [x] Preserve failed research checks, null real outputs, unsupported scenarios and source identity.
- [x] Check publication metadata and run focused model/UI/boundary checks.
- [x] Independently review and verify the working website on desktop/mobile.
- [x] Document the result, remaining limitations and reproducible demo instructions.

Result: **Decision > Use existing swarm results** now calculates approval
USD6.31 and court blockage USD9.17 expected cash versus USD7.60 baseline under
the default assumptions. Exposure zero restores the baseline; costs and weights
use the same live model. Source checks remain failed and actual scenarios with
no results remain unavailable. The current local production website is served
at `http://127.0.0.1:5182/`. No hosted deployment or Git publication was made.

Verification: 108 model, 23 frontend, 19 Convex and 16 Python publisher tests
pass, with frontend/backend typechecks, production build, 29 specification
checks and independent boundary review. Lint has four incumbent warnings and
no errors. Browser checks cover mode changes, signed deltas, exposure/cost
recalculation, real/missing-scenario null states and 1440/390/320-pixel layouts.

## Plan a no-new-API swarm demo, 25 October 2026

Human owner: Amit. Simulation source owner: Muhd. Analysis and model-plan owner:
Codex. Scope: reuse existing results with explicit hackathon assumptions. No new
simulation/judge calls, algorithm edits or deployment are authorized by this plan.

- [x] Compute same-configuration scenario contrasts and local cash sensitivities.
- [x] Separate usable post scores, missing interview inputs and failed research checks.
- [x] Review an explicit exploratory demo path while preserving strict readiness.
- [x] Write the model integration contract and exact no-cost handoff for Muhd.
- [x] Record the plan, assumptions, verification and deferred paid work.

Review: `research/swarm-no-api-demo-plan.md` recommends a post-only illustrative
comparison of the matching Claude runs. Offline weighted signals are -0.02517926
for approval and +0.03073433 for blockage versus placebo. Full assumed transfer
gives USD6.31/USD9.17 expected cash versus USD7.60 baseline. Independent review
passed. Existing strict failures remain; no new paid call or application change.

## Check Muhd's latest swarm data, 25 October 2026

Human owner: Amit. Review owner: Codex. Read-only audit of current remote branches,
raw run files and the integrated source bundle. Visualization is deferred.

- [x] Verify remote swarm/main heads and recent result-related pushes.
- [x] Compare report coverage and raw score/interview files with the bundled source.
- [x] Independently check whether missing runs or readiness evidence exist upstream.
- [x] Report any omitted data, remaining gaps and the exact reviewed source revision.

Review: `f2fe2971` is still the remote source head. All six scored runs are
already connected. Full-tree/blob comparison and 36 source fingerprints pass;
raw recount confirms 3,499 score rows, 3,121 numeric and 130/288 nonempty
interviews. Runs 07–09 have no committed outputs. The empty interviews and
readiness failures exist upstream. Read `research/swarm-latest-data-check.md`.

## Visualize the integrated pipeline, 25 October 2026

Human owner: Amit. Integration and review owner: Codex. Scope: local explanatory
visualization of current main, with no model, publication or deployment changes.

- [x] Audit actual source, browser, model, API and optional publishing connections.
- [x] Generate checked traces from the canonical engine, including blocked states.
- [x] Prepare the flow interactively with source types, gates and separate cash/marks.
- [ ] Finish browser layout checks and show the visualization. Deferred at Amit's request while latest swarm pushes are audited.
- [ ] Record findings and the remaining real-input gaps in the build log.

## Canonical application integrated, 25 October 2026

Human owner: Amit. Integration owner: Codex. The active app is the Next.js/Cesium
land explorer with the shared assignment model in `model/tok-option/`.

- [x] Preserve source heads and squash frontend PR 27.
- [x] Classify prompt-cache scanner false positives and land the narrow, tested correction in PR 36.
- [x] Replay and squash canonical model PR 29, with explicit model/source CI and three required checks.
- [x] Refresh actual simulation evidence in PR 37 while preserving failed/incomplete readiness.
- [x] Consolidate canonical optional backend and publishing in PR 38; reject inconsistent/legacy decision payloads.
- [x] Consolidate the latest explorer through `1ce08e4` in PR 39; remove the old decision path and verify production behavior.
- [x] Verify resulting main with Repository checks, Secret scan and Frontend checks all green.
- [x] Close the ten superseded PRs and prepare the final source/merge handoff record.

Verification: 23 frontend tests, 94 model tests, 17 Convex tests, 16 Python
publisher/transport tests, typechecks and production build pass. Lint has four
nonblocking incumbent warnings. Browser checks cover rendered terrain, land
context, cash recalculation, SKIP, real-mode gaps, synthetic deltas and
1440/390/320-pixel layouts. Independent source/visual review passed.

Read [architecture](../docs/architecture.md), [remaining work](../docs/remaining-work.md),
[handoff](../research/integration-handoff.md) and [exact merges](../research/integration-merges.json).
Real contracts, resources, liquidity and predictive validation remain missing;
simulation completion/readiness and optional hosting/storage configuration remain
external work. Automated dependency PR 35 is outside this integration scope.

PRs 23–26, 28 and 30–34 are closed as superseded with replacement links. Their
source branches are retained. Implementation merge revisions are recorded in
`research/integration-merges.json`; the final documentation PR records publication
and its required checks.

## Publish the Tok option model, 25 October 2026

Human owner: Amit. Integration owner: Codex. Scope: pure assignment-only option
model, minimal frontend integration, pinned source bundles and gap report.
Publication base: frontend PR 27, commit `e9d60c8`. Salman's deployment PR 28 is
independent and preserved.

- [x] Implement model, exact cash and break-even diagnostics, and swarm checks.
- [x] Connect the 67-sample land context, historical gold means and swarm pilot.
- [x] Document missing option terms, resources, liquidity, completed simulations and measured predictive edge.
- [x] Verify the exact publication tree and complete independent package review.
- [x] Prepare `codex/tok-option-model` for publication and team review.

The source branches are pinned at land `34eaf1d` and swarm `d7717cd`. Read
`research/tok-option-model/integration-review.md` and `model/tok-option/README.md`
for reproducible checks and the model's limits. This publication does not deploy
the website, merge other branches or execute trades.

Publication checks: all 93 application/model tests, 29 specification checks,
production build, model demo and source audit passed in the isolated checkout.
Independent package review confirmed source/fixture completeness, scoped edits,
working documentation links and no secret findings. Existing MapLibre chunk-size
advisory remains. Hosted check results are recorded on the pull request.

## Frontend baseline for team improvements, 24 October 2026

Owner: Amit for publication and integration. The website source is under `frontend/`; use [the team guide](../frontend/CONTRIBUTING.md) for bounded file ownership and changes. Land/contracts remains with Arjin, simulation/prediction with Muhd and the decision algorithm with Salman.

- [x] Package the complete React/MapLibre website and its small public display snapshot, preserving A33/B34 measurements, qualification rules, provenance and pending states.
- [x] Include current design guidance, a desktop preview, setup commands, regression checks and module-level improvement instructions.
- [x] Add a pinned frontend CI job and npm dependency updates without replacing main's existing checks or optional-tooling verification.
- [ ] Integrate actual teammate outputs after agreeing their display contracts; keep placeholders pending until then.

Delivery branch: `codex/tok-evidence-frontend`. Publication uses a pull request; it does not deploy the site or merge unrelated research. Larger raw/generated packs remain outside Git; the bundled website snapshot is self-contained.

## Gold stakeholder swarm on MiroFish (owner: Muhd)

Plan: [gold swarm plan](../research/gold-swarm-plan.md). Approved by Muhd; MiroFish runs on Muhd's laptop (team decision).

- [ ] Step 0: set up MiroFish on Muhd's laptop (Zep Cloud key, OpenAI key, disk check, pick the middle model tier).
- [ ] Agree with the team what this swarm feeds (for example, policy-risk and price scenarios for Salman's solver) and who writes the per-agent model-tier patch.
- [ ] Timed pilot, then fix rounds and run count from measured numbers.

## Resolve and merge gold evidence PR #20

Owner: Amit. Explicitly authorised to resolve conflicts, pass checks and merge PR #20. Preserve both contributors' changes and the published gold A/B release; no repository-policy changes.

- [x] Integrate current main into the PR branch and resolve only actual conflicts with independent review.
- [x] Verify local gold/soil extraction tests and release/source integrity against the resolved branch state. All 27 evidence tests passed; hosted checks are the remaining merge gate.
Protected execution: push and mark ready; require both GitHub checks and resolved conversations on the exact head before squash merge. [PR #20](https://github.com/amitvijapur/oxhack-2026/pull/20) records the live check and merge outcome. After merge, verify main contents and record the merged commit and data access in Obsidian.

Pre-merge review: conflicts were limited to the two task documents and resolved by retaining both sides. Main's duplicate-recorder removal and reference update are preserved. Gold code, source catalogue/selection and release ZIPs are unchanged. Independent review passed. Team instructions now use `main` plus the verified release downloads.

## Publish gold branch and downloadable A/B data

Owner: Amit. Publish the existing branch and a prerelease handoff in the existing private repository. No merge or repository-setting change.

- [x] Verify local artifact hashes and push the branch with clear team download instructions.
- [x] Publish separate A/B ZIPs, the complete source/method handoff and archive manifest as GitHub release assets.
- [x] Update draft PR #20 to the gold scope, verify downloaded assets and remote commit, and inspect current CI results.
- [x] Record verified access instructions and publication links in Obsidian and the final handoff.

Review: [gold-evidence-v1](https://github.com/amitvijapur/oxhack-2026/releases/tag/gold-evidence-v1) is published with A/B ZIPs, the complete bundle and archives.json. Independent fresh downloads matched all sizes/hashes and 77 internal checksums. A33/B34 coverage and all three teammate accounts' read access were verified. [Draft PR #20](https://github.com/amitvijapur/oxhack-2026/pull/20) describes the gold scope. GitHub reports conflicts with main and no current CI checks; integration remains with the repository-maintenance workstream. No merge or settings change.

## Build approved Tok River gold A/B packs

Owner: Amit, covering both areas. Approved scope: Tok River, Alaska stream sediment; gold primary, lithium secondary from the same source. Continue on `codex/site-a-soil-evidence`. MiroFish and actual land-contract acquisition remain separate.

- [x] Freeze the verified 67-location, -200 mesh coordinate split (A33/B34) and document source IDs, exact URLs, dates, hashes and reuse terms.
- [x] Build a deterministic standard-library gold extractor and both packs, preserving original sample/lab IDs, assay methods, censoring and secondary lithium.
- [x] Export GeoJSON sample points and a future land-match contract with explicit CRS, spatial/date provenance, unmatched status and no fabricated contract IDs.
- [x] Independently verify every selected row and assay, A/B disjoint coverage, geospatial order, hashes, repeatability and meaningful rejection cases.
- [x] Package a portable source/method/data handoff, update current documentation and Obsidian, and report reviewable outputs. Preserve copper artifacts.

Review: [gold A/B results](../research/gold-evidence-results.md). Both 13-file packs passed independent verification of every record and all hashes. The complete source/method handoff reproduced A/B byte-identically; 12 focused tests passed with no skips in the fresh bundle. All 67 land templates remain not_evaluated. Work is on the existing branch; no push or merge is part of this turn.

## Verify a primary US gold dataset before rebuilding

Owner: Amit. Scope: source acquisition and feasibility audit only; lithium stays secondary. Preserve the copper extractor and packs and keep MiroFish separate.

- [x] Find an official accessible US gold measurement source and save immutable source files with checksums and acquisition metadata outside Git.
- [x] Audit identifiers, Au units/methods/qualifiers, coordinates, media, dates, restrictions and duplicate/missing records.
- [x] Test two non-overlapping candidate areas with the same sample medium and assay method, selecting boundaries independently of gold values.
- [x] Independently verify coverage and limitations, then save a clear go/no-go research note and update Obsidian. No pack rebuild or site commitment in this task.

Review: [Tok River gold source](../research/us-gold-dataset-feasibility.md) passes the descriptive evidence gate. Independent raw-data and document reviews passed. The final read-only CLI passed ten checks and rejected a changed source hash. Candidate A/B have 33/34 unique locations; lithium is measured at all 67. This proposes Alaska stream sediment in place of Arizona soil. No gold packs, discovery model, MiroFish changes, commit, push or merge occurred.

## Correct commodity scope to gold primary and lithium secondary

Owner: Amit. This supersedes copper as the intended target in the entries below. See [verified coverage and transition plan](../research/gold-lithium-scope-correction.md). The copper packs remain prototype artifacts.

- [x] Record Amit's commodity correction and inspect the actual source schema.
- [x] Independently audit lithium units, flags and usable coverage; confirm that the soil table has no gold column.
- [x] Make a bounded check of the existing USGS gold-source lead and document the access limitation. Official MRDS service and ZIP returned HTTP 403; no gold extract is verified yet.
- [x] Mark the earlier plan and README so the copper utility is not mistaken for the intended gold/lithium output.
- [x] Verify a usable primary gold source and its evidence type before adapting the extractor or selecting gold A/B windows. Tok River passes the evidence gate; the Alaska comparison windows remain proposed.
- [x] Build and validate gold packs first; add lithium second with commodity-specific fields and censor rules. Both use the approved Tok River source; see gold A/B results.

Review: the extraction infrastructure is reusable; gold measurements cannot be obtained from this soil table. No source substitution or regenerated commodity pack has been claimed. MiroFish stays separate.

## Generate Site B while Amit covers Arjin

Review: all 89 B rows and summary metrics independently match the source. Median copper is 18.0 mg/kg. A/B cover all 177 records without overlap; output and archive hashes pass. The method and previous artifacts are unchanged.

Owner: Amit for this extraction; Arjin can review the pack and continue display work when available. Use the existing source, split and extractor. No MiroFish or algorithm changes.

- [x] Generate B and verify the source records, summaries, checksums and repeatability without changing the extraction method.
- [x] Package B and a combined A/B handoff; preserve the existing Site A artifacts.
- [x] Prepare the reviewed [Site B results](../research/site-b-evidence-results.md) for the existing evidence PR and Obsidian handoff record. No source or extractor changes.

## Build Site A soil evidence and reusable B extraction

Results: [verified Site A evidence](../research/site-a-evidence-results.md). A has 88 rows, 87 quantified copper measurements and one retained missing sample. Median copper is 17.4 mg/kg. Independent review passed; the source-and-method archive regenerated A identically and generated B in a clean temporary directory.

Owner: Amit. Branch: `codex/site-a-soil-evidence`. MiroFish, prompts, algorithm implementation and repository-policy changes are outside this task.

- [x] Isolate work on a new branch and freeze the coordinate-only Arizona A/B selection against the existing source checksum.
- [x] Implement a shared standard-library extractor and meaningful tests with a bounded worker; keep raw/derived data ignored.
- [x] Generate Site A and a portable handoff archive; independently validate source rows, counts, summaries, provenance and B-method compatibility.
- [x] Document the evidence contract, reusable commands and development/review loop; run 15 focused tests, independent raw-source checks and portable archive reproduction.
- [x] Commit the implementation branch and publish the shared method in [draft PR #20](https://github.com/amitvijapur/oxhack-2026/pull/20). Remote extractor matches local; both initial required CI checks passed. Record the final handoff in the backed-up Obsidian log.

## Approved minimal cleanup

Owner: Amit, with Codex maintaining the repository. Preserve every potentially
useful plan, dataset, source note and experiment; no archival moves are approved.

- [x] Verify the two cryptocurrency recorders are byte-identical and remove only the generated local probe cache.
- [x] Delete the duplicate recorder and point its documentation to the retained script.
- [x] Verify the retained recorder is unchanged, references resolve, and no other files are removed; prepare the change for the existing protected PR flow.

Review: the retained recorder matches the duplicate's original SHA-256; all 11
local links in the updated README resolve, no deleted-name references remain,
and the only tracked removal is the duplicate. Six ignored local cache files
were removed. All 25 original checkout research/task files checked retained
their hashes. Whitespace, actionlint and all 13 existing tooling tests passed.
Hosted CI and integration results are recorded in the PR and Obsidian build log.

## Reviewable US soil build plan

- [x] Apply the user-specified names throughout the current plan and working split.
- [x] Validate the named assignments and prepare the reviewed documents for publication on the existing research branch.

Owner: Amit. America is selected. Arjin owns Site B, Muhd owns prompts and agent information, Salman owns the decision algorithm, and Amit owns Site A/local MiroFish. The implementation plan remains for review before extraction or building.

- [x] Draft the single-table scope, two-area selection, shared evidence format, MiroFish handoff, numerical decision contract and four-person responsibilities. See [US soil build plan](../research/us-soil-build-plan.md).
- [x] Independently review the plan for missing ownership, inconsistent inputs and overstated prediction claims. Added explicit independence/validation assumptions and a shared solver-output contract.
- [x] Save the plan for Amit and request its display in Codex, update the working split and Obsidian, and leave implementation pending review. The panel open request was queued; the file link is available directly.

## Revised site ownership and dataset choice

Owner: Amit. See [working split](../research/team-working-split.md).

- [x] Record two site-evidence owners, a separate prompt owner, an algorithm owner and local MiroFish execution on Amit’s laptop.
- [x] Inventory existing project data and compare US regional soil chemistry with Australian local drilling.
- [x] Amit selected America and the existing US soil dataset. Broad regional scope is proposed in the build plan; exact A/B boundaries remain unassigned. Owners are Amit for A/local MiroFish, Arjin for B, Muhd for prompts and Salman for the algorithm.
- [ ] Agree the shared evidence/agent/algorithm fields, then extract both site packs in parallel while prompts and the solver are prepared.

## One-source US mineral decision simulator, discussion proposal

Owner: Amit. Scope: simplify the hackathon idea and publish a discussion plan before the team chooses the build. Named roles are recorded in the current US soil plan.

- [x] Read the existing LODESTAR and newer claims research; propose one mineral-occurrence source and two illustrative US sites.
- [x] Write the real-data versus hypothetical boundary, Bayesian decision algorithm, demo, roles and relative schedule in [the proposal](../research/mineral-hackathon-proposal.md).
- [ ] Team discusses the proposal, confirms available time and selects a familiar stack before implementation.

Publication scope: this proposal and task entry only. No new datasets, models, dependencies or repository-policy changes. Previous empirical studies remain separate evidence, and no real mineral or financial edge is claimed.

## Optional pieces from Muhammad's team kit

Owner: Amit, with Codex integrating the selected tools. The kit source is the
archive on `ahmed/team-kit-proposal` at `d517f31f842f9e8223d72175d797345a783743ef`.

- [x] Inspect the actual archive and audit the selected source before execution.
- [x] Adapt only the staged secret hook, manual debug and cleanup skills, and an explicitly loaded Claude deny profile.
- [x] Document provenance, activation, limitations, and compatibility with Cortex and shared rules.
- [x] Verify staged-only scanning, redaction, missing-tool behavior, skill safety, and unchanged workflow and approval requirements.
- [x] Prepare integration through the existing protected PR flow. Track final hosted CI, merge, policy readback, and build-log completion in the PR and Obsidian log.

- [x] Close Discord research at Amit's request. No server messages were accessed.
- [x] Save Amit's Granola brief and label uncertainties and transcription issues.
- [x] Inspect local Git tooling and prepare a minimal repository plan.
- [x] Review the brief and repository proposal against Amit's notes.
- [x] Agree and publish the shared repository scaffold and main coding harness while idea selection continues.

## Remove mandatory teammate approval

Owner: Amit, with Codex maintaining the repository configuration and documentation.

- [x] Synchronize the stored branch-protection configuration with Amit's request for zero required approvals while preserving CI and security requirements.
- [x] Update the current team workflow and resolve the superseded pending approval for PR #3.
- [x] Capture the preference in session lessons, validate the diff and configuration, and record verification results.

## Repository and harness discussion

- [x] Inspect the session's actual working directory and applicable instructions. It remains `/Users/amit/Desktop/Hackathons/OXHack/`.
- [x] Review the existing proposal and verify Delta's current product description from its official site.
- [x] Clarify the team setup. Amit uses Codex with Cortex; teammates use Claude Code and shared repository rules.
- [x] Agree repository owner, name, and initial visibility: `amitvijapur/oxhack-2026`, private. Amit requires public visibility before submission.
- [x] Verify teammate handles from Amit's supplied image and send write-access invitations to `meep-boop`, `arjn15`, and `iloveclouduk`.
- [x] Create the agreed minimal shared scaffold and private remote; verify main and the scaffold from a fresh clone.
- [x] Verify accepted write access for `meep-boop`, `arjn15`, and `iloveclouduk` through GitHub's collaborator permissions API.
- [ ] Once application code exists, verify application setup from a fresh clone.

## Mixed-tool harness comparison

- [x] Verify Cortex's local capabilities and portability constraints without copying personal configuration into the team repo.
- [x] Check official Codex and Claude Code docs for shared project instructions and repository skills.
- [x] Compare GSD, OpenSpec, GitHub Spec Kit, and Superpowers against the existing Cortex/OMC setup and a 25-hour time budget.
- [x] Recommend the minimum shared repository harness and at most one additional workflow, with evidence and clear tradeoffs. See `research/harness-comparison.md`.
- [x] Record findings in the repository plan and Obsidian, and complete an independent portability review.
- [x] Agree the proposed shared harness with Amit. Cortex stays local to Amit; the team follows shared repository rules.

## Shared scaffold and Rust/Zed assessment

- [x] Create portable `AGENTS.md`, the `CLAUDE.md` import, README, and ignore rules, without application dependencies or a framework.
- [x] Check official Zed language support and distinguish the editor choice from the Delta prize condition in the supplied brief.
- [x] Confirm the workload requiring speed is the project algorithm. Amit wants Rust kept under consideration without selecting a language or framework yet.
- [ ] Confirm Rust experience if needed when selecting the implementation language.
- [x] Review shared rules for compatibility and verify the initial files without running package installs. The Claude import and local Markdown links pass; no Cargo or application dependency manifest was created.
- [x] Record agreed decisions and remaining questions in the repository plan. The existing Obsidian build log is maintained separately.
- [x] Initialize and publish `amitvijapur/oxhack-2026`; verify its private visibility, main branch, and initial remote commit.
- [ ] Make the repository public before submission, after reviewing its contents and confirming event repository rules. Exact submission time remains unknown.

## Team access, CI, and repository security

- [x] Verify `meep-boop`, `arjn15`, and `iloveclouduk` from Amit's image, invite them, and confirm all three accepted with write access.
- [x] Confirm the supplied Granola ceremony notes are present on GitHub and link them clearly from the README.
- [x] Inspect workflow permissions and security settings, then confirm private-repo branch protection by a successful update and independent readback.
- [x] Add stack-neutral CI for repository hygiene and secret scanning, with pinned dependencies and minimal permissions. Local positive and negative checks and independent review passed.
- [x] Initially configure one approval, current GitHub Actions checks, resolved conversations, linear history, admin enforcement, and protections against force pushes/deletions. The approval requirement is superseded by Amit's request for zero required approvals; the other safeguards remain active.
- [x] Verify CI with both passing runs and a safe deliberate failure, independently review the change, and integrate it. PR #2 merged as `ce40669`; clean PR run `40092846642` and main run `40092935972` passed.
- [x] Prove hosted CI rejects a temporary trailing-whitespace defect. Run `40092708257` failed `Repository checks` on that defect and passed `Secret scan`; remove the probe before merge.
- [x] Verify effective GitHub settings and accepted collaborator access. Actions require full SHA pins, permit GitHub-owned actions, use read-only tokens, and cannot approve PRs. Dependabot alerts and security fixes are enabled.
- [x] Merge the follow-up configuration/verification PR. PR #3 merged as `c08a66a`; the stored request omits legacy `contexts` when using `checks`.

## Event context (owner: Ahmed)

- [x] Compile the official slide deck and ceremony audio into `research/event-context.md`: schedule, Sunday 12:00 hacking cutoff, prize rubrics, corrected MLH prize names, venue, and the team's brainstorm leanings.
- [ ] Confirm with an organiser whether Sunday 12:00 is also the Devpost deadline, plus team size and repository rules.

## Ideas list (owner: Ahmed)

- [x] Add the full scored ideas list as `research/all-ideas.md`, with a section cross-checking it against the event context and the Fed Millisecond brief.
- [ ] Team picks the direction: Fed Millisecond or Golden Hour (financial), Flag Fall or Memento Mori (non-financial), Bang the Close as backup.

## Review

24 October 2026, optional kit import: inspected Muhammad's actual archive at
`d517f31`, then adapted only the staged scan, two manual skills and supporting
references, and an explicitly loaded deny profile. All 13 disposable-repository
tests passed with Gitleaks 8.30.1. Shell syntax, JSON parsing, actionlint,
whitespace, 17 local documentation links, manual skill metadata, both skill
security audits, and the directory secret scan passed. Independent review
caught and resolved environment-example negation syntax and preservation of
default Git hooks. Pure-matcher probes against Claude Code 2.1.238 verified
the intended example exceptions, but no full Claude tool permission invocation
was tested. No hooks were activated in contributors' clones. The same two
required checks and zero-approval policy were read back unchanged. Final hosted
CI and integration results are recorded in the PR and external build log.

24 October 2026, approval-policy update: the stored protection JSON changes only
the required approval count from one to zero, stale-review dismissal to false,
and latest-push approval to false. Both strict GitHub Actions checks and every
other protection are unchanged. `git diff --check` passed; Python parsed the
JSON, compared it against the prior configuration, checked the six-file edit
scope, and verified all nine local Markdown links in the changed documents.
The live protection update and independent API readback were completed in the
coordinating maintenance session. Hosted CI and integration of this follow-up
remain to be completed there.

24 October 2026: Discord was inaccessible and Amit then cancelled that research. The Granola notes are the working event brief. Local Git and author identity are available. GitHub CLI authentication for `amitvijapur` was successfully verified outside the sandbox; the earlier restricted check is superseded and no re-login is needed. The plan is in `research/repository-plan.md`. Repository identity, visibility, harness, and accepted teammate access are confirmed. Stack, data source, and exact submission deadline remain open.

The private repository is live at https://github.com/amitvijapur/oxhack-2026 with the shared Cortex/Codex/Claude Code arrangement and supplied Granola notes. All three teammates from the image have accepted write access. PR #2 added CI, dependency controls, and team documentation; the deliberate whitespace defect was rejected and removed before the clean revision merged. Both required jobs passed on the PR and main. PR #3 merged as `c08a66a`, correcting the stored API payload and recording verification. Main protection now requires zero approving reviews at Amit's request. Stale-review dismissal and latest-push approval are disabled. Current GitHub Actions-issued checks, resolved conversations, linear history, no force pushes/deletions, and admin enforcement remain active and were independently read back from GitHub. No application exists yet, so runtime correctness/performance checks remain pending. Rust is a candidate for algorithm performance. Keep the repo private until the planned review and public transition before submission; exact deadline and event eligibility rules remain open.
