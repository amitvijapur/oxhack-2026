# Site A evidence build: verified result

24 October 2026. Owner: Amit. Branch: `codex/site-a-soil-evidence`. The measured-data pack and shared A/B extraction method are implemented. MiroFish, prompts, the decision algorithm and dashboard remain separate.

## Delivered

The [shared extractor](../scripts/soil_evidence.py) reads one pinned USGS soil source, preserves its raw identifiers/values and flags, checks the [coordinate-only selection](site-evidence-selection.json), and produces the same file contract for A or B. It uses Python's standard library and performs no network requests.

The [contract](soil-evidence-contract.md) explains the commands, field meanings and provenance graph. The [15 focused tests](../tests/test_soil_evidence.py) exercise valid and invalid encodings, malformed data/metadata, source and manifest mismatches, partition rules, hand-calculated statistics, reproducibility and safe output handling.

## Measured Site A evidence

| Measure | Result |
|---|---:|
| Included records | 88 |
| Quantified copper | 87 |
| No sample | 1, SiteID 11191 |
| Below detection in A | 0 |
| Median copper | 17.4 mg/kg |
| Inclusive first / third quartile | 13.5 / 23.85 mg/kg |
| Minimum / maximum | 3.1 / 126 mg/kg |
| Collection dates | 20 April 2009 to 26 July 2010 |

The highest quantified observations are SiteID 3511 at 126 mg/kg, 2487 at 77.2 mg/kg, and 7607 at 67.7 mg/kg. The missing sample remains in the pack with unknown copper and its raw unknown depth. Statistics use only the 87 quantified measurements, with that denominator stated.

These are observed historical soil concentrations. They do not establish a deposit, a land purchase opportunity or a predictive advantage. No success probabilities, costs or payoffs were invented; the assumptions file leaves those inputs unresolved.

## Verification evidence

- A separate reviewer independently recalculated all 88 rows and the statistics directly from the source, without relying on the extractor's calculations.
- All 15 focused tests passed, including an independent test run. Source checksum, output hashes, quality flags and the provenance references were reviewed.
- An identical A rerun leaves the existing pack unchanged. A changed or unrelated output directory is refused.
- Both cohorts match the frozen split at longitude -111.5453: A has 88 records, B has 89, with no overlap and complete coverage of the 177 Arizona records.
- The source-and-method archive was extracted into a clean temporary directory. Its file checksums passed; the included command regenerated A byte-for-byte and generated B successfully with 89 quantified records. Those temporary B outputs were removed. Amit has subsequently completed the final B pack while Arjin was away; see [the B results](site-b-evidence-results.md).

The development loop was worker implementation, meaningful tests, independent source/code review, and parent integration/portable reproduction. No new dependency, framework, CI policy or MiroFish component was introduced.

## Local handoff artifacts

Raw and generated files remain outside Git:

- Site A files: `data/generated/us-soil/site-a/`
- Site A archive: `data/generated/us-soil/handoff/site-a-evidence.zip`, 10,956 bytes
- Source, metadata, extractor, tests and selection for Arjin: `data/generated/us-soil/handoff/soil-source-and-method.zip`, 598,306 bytes
- Archive checksums: `data/generated/us-soil/handoff/archives.json`

Site A archive SHA-256: `39979a8f65442bd5bf50ce4e0d4392178052cc293cfa172fda690c8a8650e4b4`.

Source-and-method archive SHA-256: `70cdd78a6dc9485fd48e2fc26f6fa16b3e2f9c9b9fead312b69a9a4818927586`.

A Git pull supplies the method, manifest, tests and documents. The archives need a separate file handoff; no message or upload to a teammate has been sent. After receiving the exact source snapshot, Arjin changes only `--area B` and the output directory, as shown in the contract.
