# Site B evidence: completed while Amit covers Arjin

24 October 2026. At Amit's request, Site B was generated using the existing shared method while Arjin was unavailable. No extractor, source, selection rule or model was changed. Arjin can review the evidence and continue the comparison display when available; MiroFish remains separate.

## Measured results

| Measure | Result |
|---|---:|
| Included records | 89 |
| Quantified copper | 89 |
| Missing or below-detection copper | 0 |
| Median copper | 18.0 mg/kg |
| Inclusive first / third quartile | 10.9 / 32.3 mg/kg |
| Minimum / maximum | 3.2 / 2,540 mg/kg |
| Collection dates | 19 April 2009 to 15 July 2010 |

The three highest recorded values are SiteID 13012 at 2,540 mg/kg, 6420 at 109 mg/kg, and 11156 at 101 mg/kg. The largest value is retained exactly as reported, not removed as an assumed error. Its cause and geological significance are not established by this pack. Recorded soil chemistry does not prove a discovery, economic deposit or financial advantage.

## Verification

A separate reviewer compared all 89 exported records against the raw source and independently recalculated the summary. IDs, coordinates, dates, depths, units and copper values agree. Every recorded output hash and source checksum matches. A repeated extraction returned `unchanged`.

A and B contain no overlapping sample IDs and together cover all 177 Arizona records: 176 quantified copper measurements and the one retained missing record in A. The extraction code is unchanged from the version whose 15 focused tests passed; those tests were not unnecessarily rerun for this output-only extension.

Both the B-only archive and combined A/B archive were extracted into temporary directories. Their archive file lists and every included pack checksum passed verification. Existing A and source-and-method archives were checked and remain unchanged.

## Handoff

Use the [shared extraction contract](soil-evidence-contract.md) for the same reproducible A/B commands and field definitions. Both packs contain samples, source/selection metadata, summaries, cited evidence, empty scenario assumptions, provenance and validation hashes. No runtime or agent output is included.

Local generated artifacts remain ignored by Git:

- `data/generated/us-soil/site-b/`
- `data/generated/us-soil/handoff/site-b-evidence.zip`, 11,019 bytes
- `data/generated/us-soil/handoff/sites-a-and-b-evidence.zip`, 21,742 bytes
- `data/generated/us-soil/handoff/archives.json`, checksums for all handoff archives

B archive SHA-256: `4ed72e7230b0c2efe512560f8be39867cc6ed6017baf75ebd5d5534eefe5bb78`.

Combined archive SHA-256: `3dba8e383819c80638d1f9bff4b18cbadb56aff70de724a6150e1f606ba48c3f`.

The combined archive is ready to share with Muhd and Salman as measured evidence. Their scenario probabilities, costs and outcomes remain separate assumptions. No automatic teammate message or upload was performed.
