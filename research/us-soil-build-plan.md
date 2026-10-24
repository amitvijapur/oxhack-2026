# US soil investigation planner

> **Commodity correction, 24 October 2026:** Amit specifies **gold primary, lithium secondary**. The copper scope below is superseded and retained as the history of the existing prototype. The soil table contains lithium but no gold measurements. The approved Tok River gold source and rebuilt packs are recorded in [gold A/B results](gold-evidence-results.md). See the [commodity correction](gold-lithium-scope-correction.md). MiroFish remains separately scoped.

24 October 2026. Owner: Amit. **Dataset direction agreed; this build plan is awaiting review. No extraction, MiroFish setup or application implementation is authorised by this document alone.**

## 1. What we will demonstrate

Compare two US study areas using recorded soil chemistry. Have MiroFish examine the evidence and produce clearly labelled scenarios, then use a numerical algorithm to decide where to investigate and whether waiting for more information is worthwhile.

The question is: **“With one investigation budget and a deadline, do we investigate A, investigate B, survey first, or skip?”**

Real soil measurements anchor the demonstration. Future investigation outcomes, success probabilities, survey accuracy, costs and rewards are hypothetical. The prototype demonstrates a decision process, not discovery of an economic deposit or identification of land available to buy.

## 2. Freeze the small data scope

- Use only the existing USGS C-horizon soil table, `Appendix_4b_Chorizon_18Sept2013.txt`, and its documentation. The other soil horizons are not additional inputs in version one.
- Use **copper**, measured in mg/kg, as the single primary element.
- Start in **Arizona**, where the earlier audit counted 177 sites and 176 numeric C-horizon copper measurements. Confirm those counts during extraction.
- Select two non-overlapping study areas from coordinate coverage before comparing their copper summaries. Aim for at least ten usable measurements per area, widening areas if necessary. This is a demo-coverage rule, not statistical proof of prospectivity.
- A and B are regional study windows, not individual parcels. The survey density is approximately one sample per 1,600 square kilometres, and the samples are soil rather than exploration boreholes.

The nationwide table contains 4,857 sites. The previous audit found 4,766 numeric copper measurements, 14 below detection and 77 missing/insufficient samples. It was collected in 2007–2011 and published in 2013. Preserve missing/censored flags; do not replace them with zero or infer current conditions.

Source: [USGS Data Series 801](https://pubs.usgs.gov/ds/801/) and the [C-horizon table](https://pubs.usgs.gov/ds/801/downloads/Appendix_4b_Chorizon_18Sept2013.txt). These files are already on Amit's laptop in the original project's ignored data folder. Do not acquire more sources for this build.

## 3. Four people, four parallel responsibilities

| Owner | Work | First handoff |
|---|---|---|
| **Amit: Site A and local MiroFish** | Coordinate the common schema; extract A; later bootstrap and run MiroFish on his laptop | Site A evidence pack, then the saved swarm run |
| **Arjin: Site B** | Extract B using the same source and rules | Site B evidence pack |
| **Muhd: prompts and agent information** | Prepare agent roles, prompts, input packaging and structured output requirements | Prompt bundle that Amit can load locally |
| **Salman: decision algorithm** | Build the decision engine against labelled example inputs while extraction proceeds | Working solver with hand-checked examples |

The named assignments are agreed. Prompt preparation and runtime hosting are separate responsibilities. No fifth person is required. After the packs are complete, Arjin prepares the A/B display and Amit integrates the saved outputs into a minimal demo. A full dashboard is optional polish.

## 4. One evidence-pack format for both sites

Each owner produces:

1. **`samples.csv`**: source SiteID, coordinates, copper value, unit, original quality/censoring flag, and collection date where available. Preserve original record identity and original values.
2. **`site.json`**: A/B ID, geographic boundary, source filename/version/checksum, extraction rule and row counts. Include valid, censored and missing counts.
3. **`evidence.md`**: a short summary of coverage, median/range of quantified copper values, unusual observations and limitations, with references to exact records. Describe these as sampled-soil statistics, not deposit probabilities. State when a statistic excludes censored or missing rows.
4. **`assumptions.json`**: a separate, initially unfilled list of proposed scenario assumptions. Do not present invented probabilities, costs or survey times as source data.

Use identical filters, units and summary definitions. Both owners cross-check one record and the row counts in the other's pack. Keep the raw source immutable and outside Git. Decide how the team shares the small derived packs before copying ignored files into another checkout; do not assume teammates receive them through `git pull`.

## 5. MiroFish handoff

Muhd prepares three complementary roles:

- **Evidence analyst:** summarises what each pack supports, citing record IDs.
- **Sceptic:** identifies gaps, conflicting interpretations and unsupported conclusions.
- **Scenario analyst:** proposes low/base/high assumptions for the decision experiment and explains their effect.

Use the same roles and instructions for both sites. Treat evidence text as data, not instructions. Agents must identify unsupported claims and distinguish measured facts from assumptions. Agent consensus is not a calibrated probability.

Amit loads both packs and the versioned prompt bundle into the local MiroFish installation, runs the analysis, and saves the input/prompt versions and output. Runtime repository, setup steps and actual export format will be checked when implementation begins; this plan does not assume a verified MiroFish API.

Muhd supplies the semantic output schema, and Salman supplies a small adapter for the actual export. Required output is `site_id`, supported findings with record references, unknowns, and labelled proposed scenarios. Reject missing IDs, invented references and malformed numeric fields. Amit reviews and freezes any scenario inputs before they reach the solver.

## 6. Decision algorithm

The solver receives explicit site success probabilities, investigation cost/reward/duration, survey sensitivity/specificity/cost/duration, one shared budget and a remaining-time limit. All quantities have units and assumption IDs. Required inputs that remain unknown cause a clear “insufficient scenario inputs” result, not an invented default.

Assume independent site outcomes; a survey updates only its own site. Validate probabilities in `[0,1]` and nonnegative costs and durations. Charge survey cost once and require enough budget and time for the final investigation.

Version one permits at most one survey and one final investigation:

1. Calculate the expected utility of investigating A or B immediately, and of skipping.
2. For each possible survey result, update the surveyed site's assumed probability using Bayes' rule.
3. Subtract survey cost and time; select the best feasible subsequent action in each branch.
4. Compare the probability-weighted branch values and return the best first action, its explanation and sensitivity across the agreed scenarios.

Freeze the output contract during the first 20 minutes: `chosen_action`, `expected_utility` and its unit, required budget/time, branch values, scenario/assumption IDs and an explanation. Give this contract to Arjin so the interface can use fixtures.

The engine starts immediately with explicit fixtures, independent of MiroFish. The worked example in [the earlier proposal](mineral-hackathon-proposal.md#the-algorithm-we-build) supplies a numerical check. MiroFish does not calculate the final scores or silently change the algorithm.

## 7. Sequence and acceptance

Indicative schedule from approval, subject to actual time remaining:

| Window | Outcome |
|---|---|
| First 20 minutes | Agree area-selection rules, pack fields and scenario schema |
| Next 60–90 minutes, parallel | Both packs extracted; prompts prepared; solver running on fixtures |
| Next 45–60 minutes | Amit checks local runtime and runs MiroFish; team reviews structured scenarios |
| Next 45–60 minutes | Adapter and solver connected; end-to-end A/B recommendation works |
| Final 60–90 minutes | Verify boundary cases, compare policies, assemble simple display and rehearse |

If local runtime setup stalls, use an explicitly marked fixture to test integration while Amit resolves it. Do not claim a fixture is a MiroFish run. Preserve the evidence packs and solver so the whole team is not blocked.

Done means both packs trace back to the source, the solver matches hand calculations, and the team can show one case where surveying is worthwhile, one where the deadline favours immediate action, and one where skipping is best. Compare against highest-prior-first, survey-first and skip using identical constraints. Any simulated performance is conditional on the stated assumptions, not historical discovery accuracy. Save a local run so the presentation does not depend on a live call.

## 8. Review decision

Review the proposed copper/Arizona scope, regional A/B scale and available build time. Named assignments are Amit, Arjin, Muhd and Salman as set out above. The source choice is already settled. The exact areas, scenario values and stack remain open. No geophysical layers, land-contract feeds, real land valuations or additional research programme are required for this version.
