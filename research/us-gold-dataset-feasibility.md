# Verified US gold source for candidate A/B areas

> **Follow-up:** Amit approved these Tok River windows. Both packs are now built and independently verified; see [gold A/B results](gold-evidence-results.md). The feasibility findings below remain the basis for their scope.

24 October 2026. Owner: Amit. Gold remains primary; lithium remains secondary. This is a source-feasibility check on `codex/site-a-soil-evidence`, not a rebuilt evidence pack or a MiroFish task.

## Decision

**GO for two descriptive gold evidence packs and a hypothetical investigation-decision demo**, using Alaska DGGS RDF 2016-10, Tok River. This requires moving the proposed A/B comparison from Arizona to Alaska and from soil to stream sediment. The existing Arizona packs are unchanged. The two new windows below are candidates, not a final geological site selection.

**Not verified:** identifying undrilled deposits or a profitable land trade. This source supplies real measured gold, but no drilling-status inventory, unbiased exploration outcomes, reserves or current land rights. It can anchor a transparent decision simulation; it cannot establish a calibrated discovery probability.

## Source and access

[Official publication and downloads](https://dggs.alaska.gov/pubs/id/29688): Naibert, Werdon, Lande and Wypych (2016), *Trace-element geochemical data from stream sediments collected in the Tok River area, Tanacross A-5 and A-6 quadrangles, Alaska in 2016*, Alaska DGGS RDF 2016-10, [DOI](https://doi.org/10.14509/29688).

The [official CSV ZIP](https://dggs.alaska.gov/webpubs/data/rdf2016_010_tok-stream-sediment-geochemistry.zip) downloaded successfully without an account or key: HTTP 200, 139,924 bytes. It includes the assay table, method/limit table, metadata and study outline. Original bytes and a checksum manifest are saved in the ignored `data/raw/gold-feasibility/tok-river-2016/` folder.

| File | SHA-256 |
|---|---|
| ZIP | `2ac0b7eaeeb1bf114172ad80e2afde2065a9af1946a3be163f843cb736e91d86` |
| Assay CSV | `3833f09686ce03ba823881df5ff662768e24a05f12091ee1c097b1e2ec7c30d1` |
| Method/limit CSV | `94a81641f92af2e0fd94864cf56a2106a27792408da817e6061b012769772ed5` |

The national USGS compilation is a larger alternative with many assay methods, but its DOI download route returned HTTP 403 in this session. MRDS is an occurrence catalogue rather than an assay source. Neither is needed for this compact demo.

## Actual data audit

Two independent reads reproduced **90 rows, 67 unique sampling locations**. There are 67 records prepared at `SIZE_FRACTION=-200` and 23 companion `-80` records. Use the 67 consistent `-200` records; counting both fractions would double-count locations. No duplicate sample/fraction keys or invalid selected coordinates were found.

The candidate split was specified using coordinates before gold summaries: median longitude **-143.793381**, with A west of the boundary and B at or east. The groups are disjoint and cover all 67 selected records. This demonstrates coverage; it is not a geological boundary. Each exceeds a practical demo requirement of ten quantified primary gold observations, which is not a statistical-power guarantee.

| Audit result | Candidate A, Tok west | Candidate B, Tok east |
|---|---:|---:|
| Unique locations | 33 | 34 |
| Numeric primary gold assays | 33 | 33 |
| Gold above primary method range | 0 | 1 |
| Numeric primary Au median, ppm | 0.013 | 0.008 |
| Numeric primary Au range, ppm | 0.004–0.326 | 0.003–0.863 |
| Separate gold retest | None required | 1.1 ppm |
| Numeric lithium observations | 33 | 34 |
| Lithium median, ppm | 31.6 | 21.0 |

Primary-only B statistics exclude one upper-censored value and have denominator 33, not 34. These descriptive statistics do not rank deposit potential. In particular, the direction of the A/B median difference varies by lab batch, and the original sampling was targeted.

The same file already supplies secondary lithium. No second lithium dataset is needed for these candidate windows. Keep the commodity summaries separate and do not treat sediment concentrations as deposit grades.

## Rules a later extractor must preserve

- Gold uses `Au_ppm_PGM-MS23` (fire assay/ICP-MS), with limits 0.001–1 ppm. `16MBW012` has raw `-2`, meaning above the upper limit. Its separate `Au_ppm_Au-AA25` retest is 1.1 ppm. Retain both results and method IDs; never average them or interpret `-2` as a negative concentration. Blank retests mean not analyzed.
- Lithium uses `Li_ppm_ME-MS61`, with limits 0.2–10,000 ppm. All 67 selected values are quantified.
- Preserve `SAMPLE` and `LAB_SAMPLE_NUMBER` separately. Four published IDs, `16TJN008`–`16TJN011`, have different laboratory IDs. Keep the documented mapping. Normalize batch whitespace only in a derived grouping field.
- Preserve raw values, size fraction, coordinates, batch, limits and source references. Report quantified/censored denominators. Reject unexpected codes rather than silently coercing them.

## Time, spatial meaning and reuse

[Official metadata](https://dggs.alaska.gov/webpubs/metadata/RDF2016-10.faq.html) documents June/July 2016 field campaigns and WGS84 GPS locations, with reported position error of 1–10 m. Publication was November 2016. Individual observation dates are absent, and no updates are planned. Do not treat collection time as public availability or claim a chronological backtest from this snapshot.

Sampling targeted known or suspected mineralised drainages. A sediment sample represents transported material from upstream; its GPS point is not a deposit boundary. Coordinate groups can share drainage influences and are not independent trials. Neither window has verified undrilled status. The raw-data report was not technically reviewed, although it documents laboratory methods and QC procedures.

Use terms require source attribution, disclosure of modifications and no implication of DGGS approval. Preserve these terms with derived packs. Free download does not mean this state release should be labelled federal public domain.

## Reproduce the source check

From the repository root, obtain the official ZIP above, verify its hash, and extract its unchanged members into `data/raw/gold-feasibility/tok-river-2016/source/`. Then run the audit only:

```sh
python3 research/verification/audit_tok_gold.py \
  --source data/raw/gold-feasibility/tok-river-2016/source/tables/rdf2016-10-stream-sed-trace-element.csv \
  --limits data/raw/gold-feasibility/tok-river-2016/source/tables/rdf2016-10-stream-sed-trace-element-limits.csv
```

This read-only standard-library check validates the exact snapshot and emits candidate-window statistics and record IDs. It does not create production packs. Raw data remains outside Git; a pull alone does not transfer it.

## Next build, after review

Reuse source hashing, provenance and packaging, but introduce a sediment-specific adapter and the correct gold assay/censor rules. Generate A/B gold evidence first, retaining lithium as a secondary view from the same observations. Keep the decision engine's probabilities, costs, future survey outcomes and timing explicitly hypothetical. Leave MiroFish separate. No extraction rebuild, predictive model, additional geological layer or framework is needed to complete this feasibility decision.

## Verification outcome

Independent source, raw-record and report reviews passed. The final CLI passed ten checks against the saved source and limits tables, and a deliberately altered temporary source was rejected with a checksum error. `git diff --check` passed. The existing soil extractor, its tests and the Arizona selection remain identical to branch HEAD. Audit output is saved separately at `data/generated/gold-feasibility/tok-gold-audit.json`; no production evidence pack was regenerated.
