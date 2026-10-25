# Publish Decide diagnostics and the compact Land overview, 25 October 2026

Human owner: Amit. Integration owner: Codex. User explicitly authorized push and squash merge. The frontend worker owns UI conflict resolution; an independent reviewer checks the combined model wiring. Preserve main's Swarm tab, whole-contract pricing, source research and pitch assets.

- [x] Integrate current main, preserving the $30,000 historical initial-payment assumption, separate fees/obligations and current canonical negative decisions.
- [x] Verify the combined frontend, model, source audit, backend and publisher checks; build and inspect desktop/mobile flows; independently review the final diff.
- [ ] Push a bounded PR, attach it to the task and wait for all three required checks on its current head.
- [ ] Squash merge only while up to date with main and conversations resolved, then verify the merged commit and remove the completed remote branch.

The earlier verification sections below are historical records of the two local UI changes before integration. Current economics and detailed-model/history access follow the newer whole-contract implementation on main. Local integration review: preserved main ab66f47 and all canonical model/source/pitch changes. Current default premium is $30,000 plus $50 entry fee, so the compact 90-day synthetic example returns -97.64% and correctly says Skip. The geological screen is a separate eligibility result. Swarm wording distinguishes its frozen 7% response cap from Decide's 1% cap and 50% retention.

Verification on Node 24.14.0: 69 frontend tests, 146 canonical model/event tests, 21 backend tests, 16 publisher tests and 29 specification checks passed. Source audit, frontend/backend typechecks, production build and independent integration review passed. Lint has zero errors and six existing backend warnings. Production checks confirmed four tabs, whole-contract negative outcomes, 30/90-day and recorded comparisons, Site B detailed-model initialization, plot-to-Decide handoff and Swarm access. All 57 Land tiles and selected details fit at 1440x900 and 320x844 with no scroll or horizontal overflow; no browser console errors. The final Swarm wording correction passed 18 focused tests and scoped lint. The legacy browser-smoke script is updated but was not run end to end. Hosted publication results will be recorded on the PR.

# Share Orecast branding and the revised pitch deck

## Align the whole platform to the Orecast contract lot, 25 October 2026

Human owner: Amit. Codex owns integration and review. Model worker owns shared
lot/economics/serialization; UI worker owns consumers; deck worker owns the
existing Orecast presentation. Amit selected the existing risk ratios at an
approximately US$1.5m demo fund. The exact fund is US$1,502,500, giving US$30,050
per option and US$150,250 open/lifetime committed risk for five indivisible lots.

- [x] Define one shared US$30,000 whole-contract initial-payment reference with historical provenance; keep fees and obligations separate.
- [x] Align model defaults, capital policy, UI, exports and regenerated snapshots. Preserve independent valuation inputs and distinguish return hurdles from forecasts.
- [x] Refresh active documentation and the approved Orecast deck/handoff without changing its visual language.
- [x] Run meaningful model, publication, frontend and build checks; inspect the platform and changed slides; independently review the result.

The existing 500oz valuation remains unchanged. At the new entry basis its
US$1,500 assignment assumption yields a negative expectation and SKIP. A 25%
expected-return resale hurdle is underwriting arithmetic, not an observed price
or model forecast. The US$30k reference is two selected historical initial
payments and excludes full contract commitments.


25 October 2026. Human owner: Amit. Integration owner: Codex. User authorized
push and merge of the completed Orecast package. Scope is presentation and brand
assets plus repository index notes; application code is unchanged.

- [x] Prepare the Orecast brand guide, wordmarks, palette tokens and fonts.
- [x] Revise the nine-slide deck against the gold-first model and independently review content and renders.
- [x] Verify editable chart/tables, speaker notes, 300-second main sequence and portable assets.
- [x] Complete independent publication review and prepare the bounded PR for required CI and squash merge.

Start from [the Orecast guide](../pitch/orecast/README.md) or
[the brand kit](../brand/orecast/BRAND.md). The earlier neutral deck is retained.
The deck's frozen source revision is fee2e0d4, with all 26 pinned calculation and
evaluation inputs unchanged in later main 39002ac. Financial outputs remain
hypothetical and the separate historical equity pilot did not establish an edge.
Native PowerPoint opening and system font rendering have not been tested.
Final hosted checks and merge status are recorded on the publication pull request.

Publication review confirmed the approved PPTX/PDF bytes, nine matching note parts,
300-second main sequence, native chart/workbook and tables, relative links,
licences and image attribution. Whitespace and redacted directory scans passed.
The 29 changed paths contain only brand/presentation assets and their index notes.

Integration review: preserved main's new Decide/Land/Crowd panel from PR 48
and the additional Swarm walkthrough tab from PR 49.
Decide separates observed evidence PASS/FAIL from the canonical whole-lot cash
decision, keeps live gold separate, and exposes the detailed calculator and
negative historical validation through disclosures. The financial model,
exports, frozen Swarm trace, current deck and documentation share one lot basis.
An independent review also found and repaired a publisher check that accepted
forged decision labels despite canonical risk failure.

Verification: 135 model, 58 frontend, 21 backend and 16 publisher tests
passed, plus 29 specification checks, frontend/backend typechecks and production
builds. Parent inspected all nine slide renders and refreshed pages after repair.
The presentation finalizer reports zero findings and warnings. Desktop and mobile browser review passed, including Site B initialization/reset,
whole-lot costs, negative expected returns, source/hurdle distinctions and no
horizontal page overflow. The current deck has nine slides and a 300-second main
sequence. The protected PR records hosted checks and merge status.

# Streamline Land into a compact plot overview

Owner: Amit. Codex coordinates one layout worker and a separate integration review. User chose all plots in a compact grid with selected details alongside. Preserve the completed Decide financial section and current Orecast styling.

- [x] Replace the long plot list and separate card view with a persistent grid of all 57 plots and a compact selected-plot summary.
- [x] Give Land a wider desktop layout and an appropriate mobile height so the grid and core details fit together without nested scrolling at normal supported viewport sizes.
- [x] Preserve map hover/selection, sort/filter, claim/source distinctions, 3D/zoom/DNR actions and the selected area's handoff to Decide.
- [x] Verify desktop/mobile layout in one batched inspection, fix findings together, then confirm once; run relevant tests/build/lint and the required design detector.
- [x] Record verified results and refresh the local preview without push or merge.

Acceptance: all plot IDs remain directly reachable in the default grid; selection does not replace or hide the overview. Core gold measurement, claim status/owner, distance and next action are visible together. Supplemental details remain accessible without implying available rights, recoverable gold or a plot-specific valuation. Do not clip content to manufacture a no-scroll result; retain a safe overflow fallback for zoom or unusually short viewports.

Review: Land now keeps all 57 plot identities beside one selected context in an 820px desktop panel; phones stack the same grid and context below the top bar. Repeated owner/claim rows and gold bars were replaced with compact labelled tiles. Selected details retain sediment gold, sample count/class, claim status and owner, distance and the Decide action. Comparable project deals and source context remain expandable. View on map opens the existing selected-plot map view, and Full details returns to the same selection. Filters, order and previous/next share one visible set; an explicit clear selection clears the detail and selected tile together. The 14 held claims and all 67 sample assignments are preserved.

Verification on Node 24.14.0: all 63 frontend tests passed, including four new grid/navigation/source-context tests and the six preceding financial tests. Typecheck and production build passed; full lint has zero errors and four inherited backend warnings. Independent integration review passed. The design detector returned no findings. One batched visual inspection found floating map-control overlap and small short-screen overflow; one fix batch and final production confirmation resolved both. At 1440x900, 1280x720, 390x844 and 320x844 all 57 tiles, default details and footer fit without vertical or horizontal scrolling. Production interaction checks passed for keyboard selection, Held/All counts, sort, previous/next, Escape, unmatched-area caveats, map roundtrip, exact plot/site handoff to Decide and 3D open/close, with no console errors. Expanded disclosures and shorter/zoomed viewports keep accessible overflow. The broader legacy browser-smoke harness was updated but not run end to end. Model/data/dependencies and the completed Decide financial files are unchanged. Production preview refreshed at http://127.0.0.1:5192/. No push, merge or hosted deployment.

# Clarify the geological screen and show financial diagnostics in Decide

Owner: Amit. Codex coordinates a scoped frontend worker and independent review. Build on Muhd's merged Decide/Land/Crowd layout. Keep the canonical model and source datasets unchanged.

- [x] Replace geological BUY/SKIP wording with explicit screen outcomes, including incomplete evidence and the area-level scope of selected plots.
- [x] Add a visible hypothetical financial section in Decide using the existing canonical engine, selected site, horizon and clearly identified scenario assumptions.
- [x] Show expected return and baseline delta, probability of no sale and negative net cash, median/worst cash returns, and existing break-even premium/liquidity diagnostics with their units and limitations.
- [x] Verify A/B, 30/90/180-day and unavailable states through meaningful tests, build/type checks and desktop/mobile browser inspection; independently review the calculation wiring and wording.
- [x] Record verification and the local preview. No automatic push or merge is part of this change.

Acceptance: geological PASS alone never appears as a buy instruction; economic action comes from canonical entryAction and cannot override a failed screen. Financial inputs remain hypothetical, the live gold quote is separate from the assumed model price, and an unsold mark is never presented as cash. Reuse the existing conservative website preset without changing weights, coefficients or source observations. Recorded scenarios, if exposed, retain their illustrative provenance and unavailable conditions remain unavailable.

Review: Decide now shows Screen passed/failed/incomplete, followed by a separate hypothetical financial decision and risk section. The current site, holding period and labelled synthetic/baseline/recorded scenario feed the canonical engine. Fixed financial assumptions, including the separate USD2,000/oz model price, 1% gold-response cap and 50% retention, are explicit. Crowd and the explanatory story use matching terminology. The full adjustable legacy workbench is not remounted.

Verification on Node 24.14.0: `npm test` passed 59 tests, including six new numerical/rendering tests; canonical model and event tests passed 137; specification validation passed 29 checks; typecheck and production build passed. Full lint has zero errors and four inherited backend warnings. Independent source/arithmetic review passed. Production browser checks at 1440px and 320px confirmed A/B gates, all three horizons, all four scenarios, selected plot B-19 synchronisation, keyboard selection, readable diagnostics, no horizontal overflow and no console errors. Missing evidence and missing scenario states were verified in tests. The broader legacy browser-smoke harness was updated but not run end to end. Canonical model, source data and dependencies are unchanged. Local production preview: http://127.0.0.1:5192/. No push, merge or hosted deployment.

## Publish and squash merge the verified forecast

Owner: Amit. Codex publishes the already reviewed branch. Amit explicitly authorized push and squash merge after all checks pass.

- [x] Refresh main and verify the prepared branch and prior local validation.
- [ ] Push the forecast branch and open its pull request with the prepared scope and verification evidence.
- [ ] Require all current-head hosted checks to pass and resolve any findings before protected squash merge.
- [ ] Verify the merged main commit and record the publication result.

This publication includes the hypothetical swarm-to-gold forecast, percentage-return synthetic preset and attributed retrospective pilot. No hosted application deployment or actual trade is included. The pull request and build log will record the final check and merge result.

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

## Apply the Orecast brand to the website, 25 October 2026

Owner: Salman. Source: Amit's brand kit (#46, `brand/orecast/`). Local only until Salman has tested it.

- [x] Check #46 in depth: deck figures recomputed from the canonical model on main match exactly (baseline 30/90/180 days; mine approval and court blockage at 90 days); every relative link resolves; no app code changed.
- [x] Rename the site to Orecast (header, page titles, `SITE_NAME`), with the draft descriptor in page metadata only; replace the "LA" favicon with the brand's thin ring and green signal arc.
- [x] Typography per BRAND.md: no 600–800 weights; headings and the wordmark at DM Sans 400, large metrics at light 300 DM Sans, small emphasis at 500; wordmark at least 100px wide.
- [ ] Salman tests on localhost, then push and PR.

## Deploy every passing push to main, 25 October 2026

Owner: Salman. Repository secrets: Amit (owner).

- [x] Deploy current main (39002ac, with #42-#44) to https://oxhack-land-arbitrage.vercel.app and check the opening, Decision tab and /swarm.
- [x] Add `.github/workflows/deploy.yml`: after CI passes on a push to main, deploy with the Vercel CLI; never on PRs.
- [ ] Amit sets VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID; confirm the first automatic deploy.

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

## Homepage: history into a five-year projection, and a smoother map, 25 October 2026

Owner: Salman. Scope: `frontend/` explorer and map only; the model is unchanged.

- [x] Open on the history time-lapse (2016 to today, or since 1975), then continue the gold price to 2031 with the model's 2020–25 trend and the middle half of past five-year runs. Claims are not projected.
- [x] Replace plot dots and drawn squares with a glow per stream sample (gold-ramp by anomaly class), real claim outlines with value-tinted fills, and decluttered value chips.
- [x] Load smoothly: stills of each view (and of each history year's claims) show at once; the live map fades in only when fully sharp. `scripts/capture-map-snapshots.mjs` regenerates them.

## Publish and merge the swarm workflow frontend

Owner: Amit. Codex publishes the verified workflow page, source-pinned display adapters, navigation cleanup, tests and scoped documentation. Preserve other open model/map work.

- [x] Prepare a bounded commit, independently review its publication scope and update against current main.
- [ ] Push the frontend branch, create and attach its pull request, and pass the required checks on the current head.
- [ ] Squash merge through the protected branch, verify main and record the result.

Review: user authorized push and merge. No hosted deployment or repository-policy change is included.

## Clarify workflow layout and primary output

Owner: Amit. Codex owns only the local workflow layout, inspection and verification. Preserve all financial calculations and pinned data.

- [x] Simplify the main graph into a clear progression from swarm signal through gold forecast and option valuation to one model output.
- [x] Move both research findings into one expandable validation summary, retaining their actual results outside the calculation path.
- [x] Verify financial values, replay, A/B and horizon changes, keyboard access and responsive layout, then refresh localhost5183 and document the result.

Review: one primary Model output follows the simplified graph, with expected return, upfront-risk denominator and model decision. Both research findings now live in one expandable summary. All 41 tests, Node 24 production build/TypeScript, scoped lint, whitespace and detector passed. Production browser checks passed at five widths; independent source/seven-capture review returned ship. Mobile shows the output first. No model, source, dependency or publishing changes.

## Compare cross-session algorithm and clarify validation status

Owner: Amit. Codex owns the local workflow view; the other session owns algorithm and return-presentation work.

- [x] Compare the latest completed integration revision against the displayed model and identify real flow differences.
- [x] Refresh the attributed snapshot, add the separate historical-test result, and replace the misleading research lock with source-derived validation status.
- [x] Verify calculation invariants, validation messaging and desktop/mobile rendering, then refresh localhost5183 and record the result.

Review: the completed 8399adb revision preserves the financial engine and adds the separate historical pilot. The 35-node graph now uses source-derived validation status, with no padlock or validation-to-financial edges. All 41 tests, Node 24 production build/TypeScript, scoped lint, detector and whitespace passed. Production browser checks passed across five widths; fresh independent source/seven-capture review returned ship. In-progress work in the other session was preserved. No push, merge or deployment.

## Align the workflow with the current gold/land algorithm

Owner: Amit. Codex updates the local visualisation only. Authoritative source is the newer local integration clone; preserve its active work and all engine files in this branch.

- [x] Trace the latest canonical model and pin its actual calculation path and provenance.
- [x] Generate a reproducible calculation snapshot from that engine and update the graph, pairing and inspection details to match.
- [x] Verify source arithmetic, replay/state boundaries, responsive layout and production build, then document and refresh localhost:5183.

Review: the 34-node graph now reads a reproducible source-pinned v2 calculation snapshot from integration revision 646e5b92. All 39 frontend tests, Node 24 production build/TypeScript, scoped lint, detector and whitespace passed. Production browser checks passed at five widths with exact values, correct pairing, A/B eligibility, horizons and missing states. Fresh independent source/six-capture review returned ship. DESIGN.md and model files are unchanged. Preview refreshed at localhost:5183; no push, merge or hosted deployment.

## Tentative downstream swarm workflow, 25 October 2026

Owner: Amit, with Codex handling the local visual layer. Scope: swarm component/CSS, browser verification and local documentation. Algorithm integration belongs to Amit; preserve all model code and source data.

- [x] Extend the graph with gold quantity assumptions, gold price projection, option/land value projection and a decision output.
- [x] Clearly label tentative connections and pending algorithm values, with current swarm monetary readiness separate from baseline inputs.
- [x] Verify replay, node inspection, missing runs, keyboard access and desktop/mobile layout, then update the local build log.

Review: 26-node tentative graph complete. All 31 frontend tests, Node 24 production build/TypeScript, scoped lint, whitespace and detector passed. Production browser checks passed at five widths with no runtime errors or document overflow. Fresh independent source/six-capture review returned ship. Algorithm/source files and DESIGN.md are unchanged. Local preview is port 5183. No push, merge or deployment requested.


## Visual network workflow refinement, 25 October 2026

Owner: Amit for visual direction. A bounded UI worker owns frontend/src/components/swarm/; the parent owns the interaction checks, local integration and review. Keep the source adapter, canonical model and existing site styling intact. The supplied node diagram is loose visual inspiration, not a literal model architecture.

- [x] Inspect the supplied image, current workflow, source constraints and style kit; record the clarified visual emphasis.
- [x] Make a layered animated network the dominant workflow view, with sparse labels and optional node inspection.
- [x] Verify replay, run changes, absent data, blocked output, reduced motion and desktop/mobile layout; complete independent visual/source review and document the local result.

Review: complete at http://127.0.0.1:5183/swarm. A sparse 22-node animated workflow replaces the dashboard-first composition, with source/context fan-out, stakeholder groups, actual daily scores, same-seed baseline deltas, weighted merge and blocked model boundary. Details open only on node interaction. Recorded playback, pulse motion, pause/reset, scenario choice, news timing, exact source payloads, keyboard focus/pan, missing runs and reduced motion passed in production. Widths 1440/1280/744/390/320 have no document overflow. All 31 frontend tests, Node 24 production build/TypeScript, scoped lint, whitespace and detector passed. A fresh independent six-capture/source review returned ship with no material findings; DESIGN.md remains appropriate and unchanged. Source adapter/model/data are unchanged by this refinement. Prior UI is backed up outside Git. Local only, with no commit, publication or deployment.

## Local swarm workflow page, 25 October 2026

Owner: Amit for direction and integration. This worktree owns the local /swarm page, its pure display adapter/tests and bounded navigation links. A UI worker owns frontend/src/components/swarm/; a data worker owns frontend/src/lib/swarm-workflow.mjs and its tests; the parent owns route/navigation, context, integration and independent verification. Preserve each other's edits. No publish, merge or deployment.

- [x] Check live GitHub status and inspect the actual integrated localhost demo and design kit.
- [x] Implement a truthful results-led HFT-style replay showing source, simulation, scoring, aggregation, validation and guarded model output.
- [x] Verify interaction, unavailable/blocked states, desktop/mobile layout and production checks; record independent review and local handoff.

Review: completed at http://127.0.0.1:5183/swarm on local `codex/swarm-workflow`, based on main `57c6f32`. Existing styling preserved. All 31 frontend and 94 canonical-model tests passed; Node 24 production build, TypeScript, source lint, whitespace and the design detector passed. Final production browser checks passed all workflow controls, missing/blocked states, replay chronology, four widths and explorer navigation with zero runtime/hydration exceptions. A bounded Cesium cleanup guard fixes the route-exit error exposed by the new navigation. Independent four-capture/source review returned ship, with no material findings; DESIGN.md remains unchanged after comparison. See frontend/WORKFLOW-VERIFICATION.md. No commit, push, merge or deployment.

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


## Orecast public README, 25 October 2026

Human owner: Amit. Integration and final review: Codex. Scope: root README and new README-specific brand assets; preserve application, model, dependencies and all historical planning files. Work in an isolated checkout of main.

- [x] Verify the current application, brand tokens, demo route, setup and model claims. Owner: repository explorer and Codex.
- [x] Build a branded cover and a focused GitHub README using existing Orecast assets. Owner: README worker.
- [x] Check local links, document hygiene, factual consistency and desktop/mobile rendering. Owner: Codex.
- [x] Record results and prepare a bounded handoff without merging or deploying application changes. Owner: Codex.

Review: the public README now uses the Orecast typography, charcoal cover and temporal ring, with an actual deployed four-tab explorer capture. It links the demo, current deck and preserved source/setup guides, and distinguishes observed samples, simulated runs and assumed contract economics. Independent factual review passed. All 47 local README references resolve; disclosure/fence/anchor checks and git diff --check passed. The cover regenerated byte-for-byte from committed fonts and tokens. Browser review covered light/dark desktop layouts and a 390-pixel viewport, with both images loaded and no page overflow. The screenshot keeps map credits and separate capture provenance. Application, model, dependency and workflow files are unchanged. Hosted CI and publication status are recorded with the PR and external build log.
