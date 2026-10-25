# Tok land data integration

25 October 2026. Human owner: Amit. Scope: the pinned land-source bundle and pure inspection adapter. This integration supplies research context and sample joins; it does not create a verified available option.

## Pinned source and lineage

Branch `arjin/tok-land-data`, revision `34eaf1d6e87fedd54c46b04dec093b0cc2b18581`, in [the source repository](https://github.com/amitvijapur/oxhack-2026/tree/34eaf1d6e87fedd54c46b04dec093b0cc2b18581/research/tok-land).

The compact bundle is `model/tok-option/data/land-source.json`. It records the source revision, retrieval timestamp, underlying claim snapshot date, report dates, source-file URLs and SHA-256 hashes. Thirteen source files were read. Original source bytes were retained for verification under `/private/tmp/oxhack-land-34eaf1d/`; that temporary snapshot is not a runtime dependency. Download time does not stand in for historical publication time.

The 24 October claim snapshot is distinct from June/July 2016 sediment sampling. The report on holding costs and surface sales is dated 25 October. The dated per-site CSVs and newer cost report take precedence over stale README statements about unchecked state-land layers and old rent schedules. We have not independently established current legal rates or title.

## What is now supplied

| Source fact | Area A | Area B |
| --- | ---: | ---: |
| Original samples joined by stable key and exact coordinates | 33 | 34 |
| Unique samples inside an active state claim | 2 | 20 |
| Unique samples inside a closed state claim | 12 | 1 |
| Unique samples inside state-land records | 29 | 28 |
| No overlap in the checked layers | 4 | 6 |

There are 112 sample–record pairs across 67 samples. A sample can overlap several records. The adapter deduplicates both sample keys and record pairs; counts never use the row count as a sample denominator. Duplicate/conflicting records cannot establish full coverage. Missing record arrays remain unknown, not zero matches.

The recorded active-claim holder at two A samples is Great Land Minerals. B has 17 sample overlaps with Contango Minerals Alaska holdings, two with Michael Sibits and one with Peak Gold. These are holder names in source records, not verified counterparties offering assignable interests. A record match cannot establish the source of sediment mineralization.

The source includes nominal annual World Bank gold means. A five-year descriptive CAGR uses the complete 2020 and 2025 annual means, $1,770.25 and $3,441.50 per troy ounce. All six complete annual observations are required. The 2026 value contains only nine months and is excluded. `goldTrend` may support an explicit hypothetical growth scenario; it does not automatically replace demo inputs, supply a current quote or constitute an out-of-sample forecast. Historical publication timestamps are absent.

Statewide surface-sale summaries and ten heterogeneous mineral deals are retained as context. The 2025 statewide median is $6,885.76 per acre over 109 surface parcels. These are changing mixes of homesites, recreational parcels and other surface sales, not a Tok mineral-interest price index or a guaranteed option-value floor. The source's nearby regional summary has only one sale in 2025. The mineral deals include unclosed agreements, a related-party option exercise, a terminated option, mature projects and an antimony package. Their individual limitations remain in the bundle. No comparable is marked as a verified available Tok assignment.

The holding-cost schedule is attributed to the July 2021 DNR rent fact sheet and carries the source's 2026 mining-year entries. Its current legal applicability, the relevant claim age, annual-labour obligations and the contract party responsible remain unverified. It is not assigned automatically to our fund's cash costs. Federal BLM fees are not treated as state-claim obligations.

## Remaining model gaps

- Verified mineral title, federal and Native corporation status, and an available assignable option.
- Executable premium, exercise consideration, expiry, consent, release and capped payment obligations.
- Recoverable quantities, geological success probability and the conversion factor from material value to the mineral-interest proxy.
- A current compatible commodity quote and dated historical publication information.
- Comparable Tok mineral-interest prices and realized option-assignment outcomes for liquidity calibration.

Neither sample overlap nor a claim-activity count closes these gaps. The land adapter returns no assignment value, cash return, recoverable quantity, sale probability or candidate action.

## Interface and verification

```js
import { inspectLandSource } from './model/tok-option/integrations/land.mjs';
const result = inspectLandSource(source, { area: 'A' });
```

The result has `sampleMatches`, `summary`, scalar-valued `facts`, `coverage`, `goldTrend`, `holdingCosts`, `dealComparables`, `provenance`, `limitations` and `reasons`. Overall status remains `partial` while economic inputs are absent. Individual supplied data categories can still be complete. Absent source data is `missing`; conflicting input is `blocked`. Runtime inspection performs no network calls and adds no dependencies.

To retrieve an original file for hash verification, use its exact path and revision from `sources` with the authenticated GitHub contents API, base64-decode `content`, then compare its SHA-256. The bundle preserves one row per unique sample and projects the original record ID, layer type, geometry hash, snapshot, recorded holder and unconfirmed status/start-date fields. The full raw sources remain external to the model package.

Verification command:

```sh
node --test model/tok-option/tests/land-integration.test.mjs
```

Result: **9 tests passed**. Checks cover all 67 exact source-key/coordinate joins, per-area observed count oracles, duplicate and conflicting records, missing inputs, complete-year CAGR selection and partial-year exclusion, economic-gap preservation, deal limitations, and source lineage. The adapter was also run directly for both areas to inspect the actual outputs. No current title or legal-rate verification is claimed.
