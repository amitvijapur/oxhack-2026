# Amit's work plan: Site A soil evidence

24 October 2026. Status: **implemented and verified for Site A**. See [the build results](site-a-evidence-results.md). Owner: Amit. This plan covers Site A data preparation and the common evidence handoff. MiroFish setup/execution, prompts, the decision algorithm and dashboard implementation are separate workstreams.

## Finish line

Deliver a small, reproducible Site A pack that answers:

1. Which measured soil samples are included, and why?
2. What copper concentrations were recorded, with what depths and data gaps?
3. What can Muhd and Salman use as evidence, and what remains an assumption?

The deliverable is evidence, not a new-deposit prediction. No additional datasets or model experiment is needed for this task.

## Ownership and handoffs

| Person | Responsibility relevant to this task |
|---|---|
| **Amit** | Agree the shared format, provide the common extraction method, prepare Site A and its evidence narrative |
| **Arjin** | Agree the non-overlapping B boundary, reuse the same method for B, and cross-check A's counts |
| **Muhd** | Consume the evidence pack and use stable record references in his prompts; owns prompt writing |
| **Salman** | Consume documented measurements and missingness; owns the numerical model and hypothetical scenario inputs |

Amit owns the common extractor and Site A outputs. Arjin owns Site B outputs. Agree changes to the shared fields before changing them. Do not independently invent two cleaning methods or edit each other's packs. This is a data-preparation choice, not selection of the application's framework.

## Step 1: agree the two study cohorts, about 10 minutes

Recommended default: filter `StateID == AZ`, then calculate the median longitude using all 177 Arizona records, including the record with missing copper. Assign **A to longitude below the split and B to longitude at or above it**. All boundary ties go to B. This gives an objective, non-overlapping west/east comparison without selecting areas by copper concentration.

Execution update: Amit authorised the planned coordinate-only default; the split and IDs are now frozen in the shared manifest. Arjin can reuse that manifest for B; no separate confirmation from him is claimed. If Arjin already has an agreed boundary, reconcile it first rather than overwrite his work. Check that each side has at least ten quantified measurements. If the geometry does not satisfy that simple coverage requirement, revise the geometry jointly before comparing concentration summaries.

These are broad study cohorts, not individual parcels or uniform geological formations. The nominal survey density is roughly one sample per 1,600 square kilometres. Show sample points and the selection rule; do not draw a smooth mineral-probability heatmap between them.

## Step 2: make one reliable reader, about 20 minutes

Use the existing `Appendix_4b_Chorizon_18Sept2013.txt` and its metadata. The source currently resides in the original checkout's ignored `data/raw/mineral-feasibility/` folder, not automatically in every worktree. Accept a source-file path as an input rather than relying on a machine-specific location.

Proposed implementation when approved: one small Python script using the existing standard library (`csv`, `datetime`, `hashlib`, `json`, `statistics`). No new package or framework installation.

The source review verified:

- Tab-delimited text, with the header on physical line 13 and a units row on line 14.
- Four trailing blank rows; genuine data records have 82 fields.
- National baseline: 4,857 unique SiteIDs; 4,766 numeric copper values, 14 `<0.5`, 75 `N.S.` and two `INS`.
- Arizona baseline: 177 records, 176 numeric copper values and one `N.S.`. No below-detection Arizona copper values occur in this snapshot.

Find and validate the expected header, skip the identified units row and blank rows, and check record widths. Do not silently drop unexplained nonblank rows. Reproduce these counts before selecting A. If they differ, inspect the source/version or parser rather than forcing the counts.

## Step 3: extract A without losing provenance, about 10 minutes

Use this common mapping for both site packs:

| Source field | Output field | Handling |
|---|---|---|
| `SiteID` | `sample_id` | Preserve as a string |
| `C_LabID` | `lab_id` | Preserve the laboratory identifier |
| `StateID` | `state` | Keep `AZ` |
| `Latitude`, `Longitude` | `latitude`, `longitude` | WGS84 decimal degrees |
| `CollDate` | `collection_date_raw`, `collection_date` | Preserve original text; parse actual `MM/DD/yy` into ISO date and validate the source period |
| `C_Depth` | `depth_raw_cm` | Preserve ranges such as `50-100`; do not invent a common depth |
| `C_Cu` | `copper_raw`, `copper_mg_kg`, `copper_status`, `detection_limit_mg_kg` | Retain the exact token plus parsed interpretation |

Numeric copper becomes `quantified`. `<0.5` becomes `below_detection`, with concentration unknown and limit 0.5. `N.S.` becomes `no_sample`; `INS` becomes `insufficient_sample`. The latter statuses have unknown concentration, not zero. Unexpected encodings are flagged for inspection instead of coerced. Empty CSV numeric cells represent null values; document that convention.

Add `study_area_id=A` and `source_id=usgs_ds801_c_horizon` to each row. Keep missing records in the area inventory. Collection dates are not publication dates; this is a static historical dataset published in 2013, not a live information stream.

## Step 4: build the useful evidence, about 20 minutes

Calculate only a small descriptive set:

- Total, quantified, censored and missing counts, with the exact status breakdown.
- Median, minimum, maximum and quartiles of quantified copper, with the denominator stated. Use Python’s inclusive quartile convention (`statistics.quantiles(values, n=4, method="inclusive")`) for both areas.
- Collection-date range and the observed depth strings/ranges, without implying equal-depth sampling.
- The three highest quantified copper observations, retaining their IDs and raw values. Label them as observed high values, not discoveries.

Produce `evidence.md` as a short briefing: area definition, measurement coverage, descriptive findings with record IDs, important limitations and unresolved questions. Every numerical statement must be traceable to the exported rows or summary. Do not invent an explanation for high copper or translate a concentration into a probability of a profitable deposit.

Keep `assumptions.json` separate. Initially it can contain an empty `assumptions` list and a list of unanswered scenario inputs for Salman, such as investigation success probability, cost, duration and payoff. These unknowns do not block completing the measured-data pack.

## Step 5: verify the pack, about 20 minutes

Verify source and output checksums, unique IDs, valid coordinates and units, status counts, date parsing, and reproducibility of the area membership. Confirm A and B IDs are disjoint and their union is all 177 Arizona records under the default split. Summary counts must reconcile with the actual CSV.

Check three records manually against the raw source: an ordinary measurement, a high value and the Arizona `N.S.` record wherever it lands. Keep small parsing examples for `<0.5` and `INS` even though those do not occur in the Arizona copper subset. Recalculate one summary independently. Amit and Arjin each check a row and counts from the other's pack.

Rerunning with the same source and frozen selection must produce the same analytical rows and statistics. Keep run timestamps outside those deterministic payloads. These checks verify correct evidence preparation, not mineral prediction accuracy.

## Step 6: package and hand off, about 10 minutes

Expected pack contents:

```text
site-a/
  samples.csv
  site.json
  summary.json
  evidence.md
  assumptions.json
  README.md
```

`site.json` records the source name/checksum, extraction version, frozen boundary/rule and selection-manifest reference. `README.md` explains units, statuses, exclusions, the exact regeneration command and how to cite records. `summary.json` is the machine-readable version of the descriptive statistics. Its schema is shared with Arjin.

Proposed source-controlled files are one extractor, the shared evidence contract and the small geometry/selection manifest. Keep the raw source and generated packs in ignored data folders. Prepare an archive with a checksum for handoff through the team's agreed file-sharing method; a Git pull alone will not deliver ignored data. No automatic messages or uploads are part of this plan.

- **Arjin receives:** the same source/version, extractor, selection manifest and output contract before writing his narrative.
- **Muhd receives:** the A pack and stable evidence-reference convention, so he can cite measurements rather than paraphrased guesses.
- **Salman receives:** the measured-data schema, summary and explicit list of unknown scenario inputs. His solver can continue using labelled fixtures independently.

## Time budget and cut line

Target about **90 minutes of focused work**, plus any teammate response time. First deliver the shared reader/contract so Arjin is not blocked, then finish A. Do not spend this slot on new sources, more elements, geophysical joins, a probability model, land prices, prompts, runtime setup or interface work.

Completion means a teammate can regenerate A, trace every evidence claim to the source and consume the files without asking what each column means. The first implementation step was to freeze the coordinate-only split and shared format; the next team handoff is to give Arjin the method and manifest. Execution update: the shared extractor, frozen selection and Site A pack are now built; the details above retain the agreed implementation plan. See the results and shared contract for actual commands and verification.
