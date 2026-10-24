# Gold primary, lithium secondary

> **Current state:** Amit approved Tok River, Alaska and both gold packs have been built and independently verified, with lithium secondary from the same source. See [gold A/B results](gold-evidence-results.md) and the [source and land-matching contract](gold-evidence-contract.md). Prior notes below record the source-selection history.

> **Follow-up verification:** A usable official gold source has now passed the A/B evidence-coverage audit: [Tok River, Alaska feasibility report](us-gold-dataset-feasibility.md). It also measures lithium. This is a proposed move from Arizona soil to Alaska stream sediment; no evidence packs have been rebuilt. The earlier access gap below records the prior MRDS check.

24 October 2026. Owner: Amit. This records Amit's corrected commodity priority and supersedes copper as the intended product target. America remains selected. MiroFish is a separate workstream.

## Verified now

The existing USGS C-horizon soil source contains `C_Li` in mg/kg and no gold measurement column. An independent local audit found 4,773 numeric lithium values, seven `<1` values, 75 `N.S.` and two `INS` across 4,857 records. Arizona has 176 numeric lithium values and one retained `N.S.` record (SiteID 11191), across 177 records. Metadata describes ICP-AES after near-total digestion. These are soil observations, not deposit grades.

Source: `data/raw/us-soil/Appendix_4b_Chorizon_18Sept2013.txt`, SHA256 `4aa8080f81f690587f762300bada16e33e376eea0003243d5333b47c78b4c90c`, plus the existing Appendix 5 metadata. Both remain outside Git.

The shared extraction, source hashing, record references, quality flags, validation and handoff packaging can be reused. The current implementation hardcodes copper. Lithium needs its own field names, expected counts and `<1` mg/kg detection-limit handling; it is not ready merely by changing a display label.

The completed copper A/B packs are retained as verified pipeline prototypes. Their values and rankings must not be used as gold evidence. The existing Arizona windows are not yet approved or checked for gold coverage.

## Smallest next step

1. Verify one US gold source with actual records, coordinates, units where applicable, provenance and usable coverage. Prefer measurements if the pitch requires a measured gold anomaly.
2. If only historical occurrence records are practical, explicitly scope the demo as a decision simulation grounded in known occurrences. Occurrences are not gold concentration measurements, negative exploration outcomes or proof that nearby land is undrilled. Do not silently replace the agreed soil source with a different data type.
3. Freeze two comparable study windows once the primary gold source passes that check. Preserve the common evidence format and keep scenario probabilities, costs and rewards separate from observed data.
4. Adapt and validate the gold packs first. Add lithium as a secondary component only after the gold path works; keep gold and lithium statistics separate.

The team's existing lead is [USGS MRDS](https://www.usgs.gov/publications/mineral-resources-data-system-mrds). USGS describes records for deposits, mines, prospects and occurrences. Its [service description](https://energy.usgs.gov/arcgis/rest/services/Hosted/Mineral_Resource_Data_System/FeatureServer/0) warns that ownership, land status and operating information may be out of date. On this check, the official service and ZIP download returned HTTP 403, so an accessible gold extract has **not** been verified. This is an access gap, not evidence that US gold data does not exist.

## Review

Gold-first remains a feasible project direction, conditional on a small source check. The current dataset is enough for lithium soil evidence but cannot support gold measurements. This correction does not claim validated mineral-discovery predictions or a financial edge. No source substitution, geographic move, extractor change, pack regeneration, merge or MiroFish work occurred in this check.
