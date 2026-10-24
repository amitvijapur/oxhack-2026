# Get the gold A and B packs

Release: [Gold A/B data handoff v1](https://github.com/amitvijapur/oxhack-2026/releases/tag/gold-evidence-v1). Sign in to GitHub with an account that has access to `amitvijapur/oxhack-2026`; the repository remains private. This is a data handoff prerelease from the feature branch, not a merge into main.

## Downloads

| File | Contents |
|---|---|
| [Complete team handoff](https://github.com/amitvijapur/oxhack-2026/releases/download/gold-evidence-v1/tok-gold-team-handoff.zip) | Recommended. Both A/B packs, exact original source, catalogue, selection, code, tests and instructions |
| [Gold A pack](https://github.com/amitvijapur/oxhack-2026/releases/download/gold-evidence-v1/tok-gold-site-a.zip) | 33 locations, 13 evidence files, with secondary lithium |
| [Gold B pack](https://github.com/amitvijapur/oxhack-2026/releases/download/gold-evidence-v1/tok-gold-site-b.zip) | 34 locations, 13 evidence files, with secondary lithium |
| [Archive manifest](https://github.com/amitvijapur/oxhack-2026/releases/download/gold-evidence-v1/archives.json) | Byte sizes and SHA-256 hashes for all three ZIPs |

Download these named assets from the release. GitHub's automatically generated “Source code” archives do not contain the ignored data files. Each handoff ZIP includes `SHA256SUMS` for its contents. The expected ZIP hashes also appear in [the committed results](gold-evidence-results.md).

For the easiest standalone use, unzip the complete team handoff into a **fresh directory**, open `HANDOFF.md`, and run its commands there. This avoids overwriting work in an existing checkout.

## Pull the code and obtain the data in a checkout

In your existing repository, with your normal GitHub CLI authentication:

```sh
gh pr checkout 20 --repo amitvijapur/oxhack-2026
gh release download gold-evidence-v1 --repo amitvijapur/oxhack-2026 --pattern 'tok-gold-team-handoff.zip' --pattern 'archives.json' --dir data/raw/gold-release-v1
shasum -a 256 data/raw/gold-release-v1/tok-gold-team-handoff.zip
```

Compare the printed hash with `d9431e52ff3761e5bd8f0ed45d826e91b56470acba558ae85f4765e47e988a12`. Then extract only the bundle's data files, leaving code and documents in your checkout intact:

```sh
unzip -n data/raw/gold-release-v1/tok-gold-team-handoff.zip 'data/*' -d .
python3 -m unittest discover -s tests -p 'test_gold_evidence.py' -v
```

`unzip -n` keeps any existing files. If the pinned-source tests reject an existing snapshot, use the complete bundle in a fresh directory instead of overwriting your data. All 12 tests should pass with no skips after the source is present.

Without the GitHub CLI, fetch and check out `codex/site-a-soil-evidence` using your Git client, then download the assets in your signed-in browser. A Git pull alone transfers code and docs, not the data packs.

## What to open

- `data/generated/tok-gold/site-a/samples.csv` and `site-b/samples.csv`: normalized gold and secondary lithium observations.
- `samples.geojson` in either pack: sampling points in longitude,latitude order.
- `source_records.csv`: original source fields for that area's selected records.
- `evidence.md` and `summary.json`: method-specific descriptive summaries.
- `source_catalog.json`, `provenance.json`, `validation.json`: origin, transformations, exact code/source hashes and integrity checks.
- `land_match_template.csv`: future matching template. Contract fields are empty and every row is `not_evaluated`.

Read [the source and land-matching contract](gold-evidence-contract.md) before joining to claims or contracts. The sample point, upstream sediment source, land geometry and mineral interest are separate concepts. Gold retests remain separate from primary assays; blank and censored values are not zero.

## Source and version

Original data: Alaska DGGS RDF 2016-10, [DOI 10.14509/29688](https://doi.org/10.14509/29688). Source attribution and modification disclosure travel in every pack and the complete bundle. The release preserves the verified v1 files; future changed data should use a new handoff version.
