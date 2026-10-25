# Publication note

The sections below record the local implementation and checks before publication.
The user subsequently authorized a frontend pull request and protected squash
merge. Earlier statements that no commit, push or merge occurred describe those
historical local steps. Current release status is recorded in tasks/todo.md and
the pull request.

# Local swarm workflow verification

25 October 2026. Base integrated main: `57c6f320a8e0a5346643ab80c9e492b7cc4b2be0`.
Local branch: `codex/swarm-workflow`. Preview: http://127.0.0.1:5183/swarm.
This is a separate managed worktree. The existing demo on port 5182 remains available.

The current GitHub check found main's Frontend checks, Repository checks and
Secret scan successful. PRs 37–40 completed canonical integration. The older
Salman implementation branches were closed as superseded; dependency PR 35
remained open at that check. This local extension was not committed or pushed.

## Implemented and preserved

The user clarified that the existing styling should stay unchanged and the new
work should be the workflow layer. The extension inherits the integrated kit
and links from the Decision tab. It provides nine run choices, six actual
scored runs, a five-day replay, six inspectable stages, baseline comparisons,
actual daily group summaries, a payload inspector and a recorded processing trace.
The compact server display adapter preserves nulls, source provenance, same-seed
baselines, equal-day aggregation and the canonical readiness diagnostics.
The full comparison is unavailable before day five. Missing runs remain empty.

Full-run exports contain daily means and counts. Playback does not launch agents
or invent raw posts or processing latency. Current failed/unknown checks keep
the monetary transfer blocked. The baseline has no additional day-three event.
No model constants, source fixtures, financial outputs, package versions, backend
configuration or global design system were changed.

A new route exposed an existing Cesium cleanup-order error when leaving the
explorer. Three bounded cleanup guards now avoid accessing an already-destroyed
widget; the navigation check reproduced the failure before the fix and passes
afterward.

## Results

- Official Node.js 24.14.0 runtime used for the final checks.
- Frontend suite: 31 tests passed, including eight new display-adapter tests.
- Canonical option model suite: all 94 tests passed.
- Production build passed, including the static `/swarm` route and TypeScript.
- Application source ESLint passed; whitespace validation passed.
- Impeccable detector returned no findings on the workflow route/components and
  Decision-tab addition.
- Production browser checks passed stage payloads, stakeholder selection, replay
  play/pause/reset, keyboard day scrubber, missing-run behavior, withheld future
  comparisons, baseline news wording, reduced motion and navigation from the
  explorer through Decision into `/swarm`. Zero runtime/hydration exceptions.
- Document widths matched viewport widths at 1440, 1280, 390 and 320 pixels.
  Narrow data tables scroll inside labelled regions. All four final captures
  were opened and checked, including a corrected capture after an early
  malformed small-phone screenshot.
- Fresh independent source and four-viewport visual review returned **ship**,
  with no material fixes. The reviewer did not rerun the parent's tests.

## Design documentation and limits

The independent check compared the built CSS/components and four screenshots
with the inspected incumbent demo and DESIGN.md. Charcoal panels, white controls,
DM Sans, Plex Mono data and labelled green/red states match. DESIGN.md and its
sidecar remain unchanged for this ordinary extension. Review screenshots are
local verification artifacts, not shipping UI assets. No new raster assets ship.

This is not a full accessibility/browser audit or evidence of predictive skill.
The current recorded-data and readiness limits remain visible in the interface.
No deployment, merge, publishing, simulation billing or trade execution occurred.

## Visual network revision

The user subsequently clarified that the default view should be a layered,
animated data-flow network, loosely inspired by a supplied connected-node image.
The detailed dashboard-first composition above is historical. The current
refinement keeps the existing styling and source adapter, moves explanation to
optional node inspection, and uses graph relationships as a workflow schematic.
The preceding browser results describe the earlier dashboard. The replacement
now passes its own final verification:

- A 22-node layered graph is the main view; no initial tables or inspector.
- Actual daily support and full-precision payloads remain attributable. The
  displayed 6.31 example retains 6.3125 in its source payload.
- Replay pulse movement was measured through changing SVG transformation
  coordinates. Pause and reduced motion stop it. No pulse crosses the blocked
  gate, and absent runs cannot play or substitute neutral values.
- Reset, keyboard day controls, node selection, optional payload inspection,
  Escape/focus return, and narrow-canvas keyboard panning passed.
- Day 1–2 preserve common news; the separate scenario event appears from day 3.
- Five tested widths, 1440/1280/744/390/320, have no document overflow. Six final
  screenshots, including the optional inspector, were opened and checked.
- All 31 frontend tests, Node 24 production build/TypeScript, scoped ESLint,
  whitespace validation and detector (zero findings) passed. The source adapter
  and canonical model were unchanged by this visual refinement.
- Final production browser checks reported no runtime/hydration errors.
- A fresh independent source/six-capture review returned **ship**, with no
  material findings. DESIGN.md was compared and preserved.

The browser harness takes the origin of its open localhost page. The current
production preview is still port 5183. The graph uses schematic workflow
relationships, not learned neural weights; full-run source granularity remains
daily group summaries. Narrow canvases intentionally pan. No new simulation,
publishing, deployment or source-model change occurred.

## Tentative valuation branch, 25 October 2026

The local visual workflow now has 26 nodes. Gold quantity and projected gold
price feed a proposed gold-value input; that value and the guarded swarm signal
join the land/option-value projection and decision output. The new nodes expose
suggested canonical field bindings in optional payload details. Values and
decisions remain null. These are tentative visual connections, not algorithm
integration or a verified land appraisal. Gold quantity stays independent of
swarm sentiment. The status now names the swarm-only disabled valuation transfer.

The five proposed links are dashed and have no transfer pulses. The recorded
source, readiness rules and canonical financial engine are unchanged. Amit owns
the algorithm integration.

Verification for this extension:

- All 31 existing frontend tests passed under Node 24.
- Production build and TypeScript passed. Scoped component ESLint, whitespace
  validation and the design detector (zero findings) passed.
- The final production browser harness on port 5183 returned `passed: true`,
  `issues: []`, `errors: []`. It checks new topology and pending payloads, null
  quantity/decision values, no swarm-to-resource relationship, no pulses on
  tentative edges, actual recorded pulse movement, scenario availability,
  replay/reset, optional inspection, keyboard access and reduced motion.
- All five widths, 1440/1280/744/390/320, have no document overflow. Narrow graph
  panning remains intentional. Six captures, including node inspection, are
  saved locally under `.impeccable/review/swarm-downstream/`.
- Independent finish review returned **ship** with no blocking findings after
  opening all six final captures and comparing source, the incumbent preview,
  PRODUCT.md, DESIGN.md and the surface contract. DESIGN.md remains unchanged.

The updated production preview remains `http://127.0.0.1:5183/swarm`. No model
change, source update, push, merge or hosted deployment is part of this task.

## Current land/gold algorithm graph, 25 October 2026

This revision replaces the tentative branch with a 34-node view of calculated
snapshots from the newer integration model, `tok-option-demo-v2`, pinned at
`646e5b92f86ee0658959e661d336248f0ff25097`. The generator records SHA256 hashes
and verifies executed model/source/feature files match the commit before and
after execution. The snapshot regenerated byte-identically. No engine code was
copied or modified. This branch's older explorer engine and the active
integration checkout were preserved.

The recorded approval/blockage contrast uses the matching Claude sports placebo.
Its weighted signal changes Au price once under an uncalibrated assumed response.
Assumed quantity and price feed gross material value, ownership/economic
conversion, geological probability and the assignment floor. Monthly sale hazard,
fees and upfront costs produce sale/no-sale expected cash. Evidence, terms,
expiry, risk and positive cash feed the entry decision and portfolio screen.
Research readiness stays failed on a separate branch. Land context and sediment
measurements do not establish available rights, land prices or recoverable gold.

A/B and 30/90/180-day selectors choose frozen canonical outputs. They do not
synchronize with another page's controls. Derived outputs appear only at the
full five-day replay window. Unsupported conditions stay unavailable. A baseline
zero is an explicit no-event assumption, not a measured swarm effect.

Verification:

- 39 frontend tests passed, including eight snapshot contract/arithmetic tests.
- Independent direct-engine arithmetic confirmed the default approval example:
  signal -0.02517925880444946, gold USD1996.474903767377/oz, assignment
  USD1495.5936297092217 and expected net cash USD5.449691298100333.
- Area A passes evidence and can be an illustrative buy; B fails evidence and
  is skipped despite identical hypothetical economic assumptions.
- Final Node 24 production build/TypeScript, scoped lint, whitespace and detector
  (zero findings) passed.
- Final production browser returned `passed: true`, `issues: []`, `errors: []`.
  It checked actual formula outputs and placebo pairing, A/B action, 30-day cash,
  blockage sign, missing-run unavailable state, delayed derived values, actual
  pulse movement, strict research boundary, keyboard/Escape and reduced motion.
- Five widths, 1440/1280/744/390/320, have no document overflow. Six final captures
  are under `.impeccable/review/swarm-algorithm/`. Narrow canvas panning remains
  intentional. The missing-run payload was corrected before this final check.
- Independent source/six-capture review returned **ship** with no material
  findings. The existing DESIGN.md remains appropriate and unchanged.

The preview remains `http://127.0.0.1:5183/swarm`. No commit, push, merge,
deployment, new simulations or financial-engine changes occurred.

## Cross-session comparison and validation status, 25 October 2026

Compared the latest completed integration revision 8399adb6 with the previous
646e5b92 snapshot. The tok-option engine is byte-identical between them, so the
gold/material/option/cash diagram remains correct. The addition is a separate
historical equity event pilot. In-progress percentage/preset presentation work
in the other session was preserved and not imported.

The snapshot now pins 8399adb6 and verifies the committed event-study artifact
with its input hashes. A compact study summary retains seven training and five
held-out primary events, five trading sessions, actual MAE results and missing
swarm predictive lift. Gold-only error 3.1291 pp is lower than gold-plus-event
error 8.0596 pp; no-change error is 2.5562 pp. These are equity forecast errors,
not Tok option returns or observed swarm accuracy.

The 35-node graph replaces the research padlock with a source-derived science
status. Actual failed/unknown checks remain unchanged. Baselines display a
no-event reference; a failed scenario displays Checks failed. A separate
Historical event test node displays Below baseline and exposes the results on
inspection. Neither validation node supplies financial inputs or blocks the
working hypothetical calculation.

Verification passed: all 41 frontend tests, scoped lint, full TypeScript and
Node 24 production build, whitespace and detector with zero findings. The snapshot
regenerated byte-identically. Final production browser checks returned
passed:true with issues:[] and errors:[] across 1440/1280/744/390/320 widths,
including exact financial values, no research padlock, source-derived failure,
negative study result, no historical-study financial edges, A/B/horizons,
missing states, recorded motion, keyboard and reduced motion. Seven final
captures are under `.impeccable/review/swarm-validation/`.

Fresh independent source/seven-capture review returned **ship** with no blocking
visual or presentation-truth findings. DESIGN.md remains appropriate and unchanged. The local preview remains
http://127.0.0.1:5183/swarm. Engine/source checkouts were unchanged. No push,
merge, deployment or paid simulation occurred.

## Clear primary output layout, 25 October 2026

The 25-node SVG network now reads left to right from the recorded stakeholder
signal through gold forecast and option valuation into one HTML Model output.
Supporting price, quantity and option assumptions remain in the graph; expanded
mathematics remain inspectable. The previous two red research circles are
replaced by one expandable validation summary in the output panel. All failed
checks, historical errors and missing swarm lift remain accessible.

The output shows expected option return with its full upfront-risk denominator,
forecast prices, expected net cash and illustrative action. The default example
is 0.7785273283% before rounding, from USD5.4496912981 expected net cash divided
by USD700 at risk. It is distinct from the assumed gold-price movement. No
engine, source snapshot, dependency or financial-model change was made.

Playback now starts paused at day 5 and scenario changes keep the output stable.
Play still runs the actual recorded replay; early-window and absent-scenario
outputs remain unavailable. Desktop puts the output to the right; mobile places
it above the pannable graph. Phone/tablet pages intentionally scroll vertically.

Checks passed: all 41 frontend tests, scoped ESLint, full TypeScript, Node 24
production build, whitespace and detector with zero findings. Final production
browser returned passed:true, issues:[], errors:[] across five widths. It checked
one output, one expandable validation summary, preserved historical errors,
full-precision gold/option/cash values, percentage denominator, A/B decisions,
30-day negative cash, missing/early replay states, actual motion, reduced motion,
keyboard inspection and Escape focus restoration. No document horizontal
overflow occurred, and output is immediately reachable at every tested width.
Seven captures are in `.impeccable/review/swarm-layout/`.

Fresh independent source/seven-capture layout review returned **ship** with no
material findings. DESIGN.md and its sidecar remain appropriate and unchanged. Preview remains
http://127.0.0.1:5183/swarm. No commit, push, merge or deployment occurred.

## Publication integration checks

The workflow commit was rebased onto main b93a84f after forecast PR #43 merged.
The Decision tab retains the historical EventStudy, current workbench and source
wording alongside the new workflow link. README and task/lesson conflicts retain
both contributors' work. Independent publication and focused conflict-resolution
reviews returned ship.

Combined local checks passed: 53 frontend tests, 137 canonical model/event tests,
21 backend tests, 16 publisher tests, 29 specification checks and source audit.
Backend typecheck and the Node 24 production build/TypeScript passed. Full lint
has zero errors and four pre-existing backend warnings. No engine, dependency,
CI-policy or unrelated feature changes are part of this workflow commit.
