# Lithium sample data (double-check before use)

> ## ⚠️ Recommended: double-check this data against the official source before you use it
>
> An AI assistant collected and processed these files on 24 Oct 2026. They are copied here byte-for-byte as they were received. Filters, unit conversions, row counts and the "key finding" in the Nevada pack's README **have not been independently checked**. They are a starting point for exploring. They are not ground truth.
>
> Before relying on a file, re-download the official source (links below), spot-check some rows against it, and record what you found in [the leads note](../lithium-data-leads-unverified.md).

Commentary, claims and things that already look off are in [`lithium-data-leads-unverified.md`](../lithium-data-leads-unverified.md).

## `nevada-usgs-pack/`: geology and geochemistry

| File | Data rows | Official source | Status |
|---|---|---|---|
| `nevada_lithium_1976_1980_NURE.csv` | 14,572 | USGS NURE Hydrogeochemical and Stream Sediment Reconnaissance ([sediment CSV](https://mrdata.usgs.gov/nure/sediment/nuresed-csv.zip), [water CSV](https://mrdata.usgs.gov/nure/water/nurewtr-csv.zip)), filtered to Nevada and lithium | ❓ |
| `usgs_us_lithium_deposits/` (11 tables) | `Site.csv`: 21 sites | [USGS Lithium Deposits in the US](https://www.sciencebase.gov/catalog/item/5d0baffce4b0e3d31162044c) | ❓ |
| `world_lithium_pegmatite_deposits_grade_tonnage.csv` | 86 | [USGS Li-Cs-Rb pegmatite grade-tonnage v2.0](https://www.sciencebase.gov/catalog/item/66db3cb7d34eef5af66d9306) | ❓ |
| `usgs_mrds_lithium_sites_US.csv` | 566 | [USGS Mineral Resources Data System (MRDS)](https://mrdata.usgs.gov/mrds/mrds-csv.zip), filtered to US records that mention lithium | ❓ |

Not included because it's too large: [USGS National Produced Waters Geochemical Database v3](https://www.sciencebase.gov/catalog/item/64fa1e71d34ed30c2054ea11) (oil-field brines, 80 MB).

## `land-pack/`: land tenure, deals and prices

| File | Data rows | Official source | Status |
|---|---|---|---|
| `00_source_catalogue.csv` | 20 | Research list of sources, with URLs | ❓ |
| `01_us_lithium_deposits_usgs.csv` | 46 | Same USGS deposits release, converted to LCE as Li × 5.323 | ❓ |
| `02_wa_minedex_lithium_sites.csv` | 623 | [WA MINEDEX DMIRS-001](https://catalogue.data.wa.gov.au/dataset/minedex-dmirs-001) | ❓ |
| `03_wa_tenements_lithium_named_holders.csv` | 258 | [WA Mining Tenements DMIRS-003](https://catalogue.data.wa.gov.au/dataset/mining-tenements-dmirs-003). Holder name contains "LITHIUM". | ❓ |
| `04_quebec_lithium_projects.csv` | 184 | [Quebec Activités minières](https://www.donneesquebec.ca/recherche/dataset/activites-minieres) | ❓ |
| `05_deal_comparables.csv` | 8 | Press releases (one URL per row; see `quality_flag`) | ❓ |
| `06_land_holding_costs.csv` | 10 | Official fee schedules (one URL per row) | ❓ |
| `07_price_and_supply.csv` | 19 | [USGS MCS 2026](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf) and others (one URL per row) | ❓ |

The row counts above come from counting lines (`wc -l` minus the header). They only show what is in these files, not that the files are correct.

## `usgs-publications/` and linked sources

| Dataset / publication name | Year | In repo? | What it might give us | Status |
|---|---|---|---|---|
| [USGS Mineral Commodity Summaries 2026: Lithium](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf) | 2026 | `mcs2026-lithium.pdf` | Official world production, reserves and price. Use it to check `land-pack/07_price_and_supply.csv`. | ❓ |
| [USGS Mineral Commodity Summaries 2025: Lithium](https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-lithium.pdf) | 2025 | `mcs2025-lithium.pdf` | The previous year, to see how the figures were revised | ❓ |
| [USGS Fact Sheet 2024-3052](https://pubs.usgs.gov/fs/2024/3052/fs20243052.pdf) (title not confirmed) | 2024 | `fs20243052.pdf` | Unknown until someone reads it | ❓ |
| [USGS: Evaluation of the lithium resource in the Smackover Formation brines of southern Arkansas using machine learning](https://www.usgs.gov/publications/evaluation-lithium-resource-smackover-formation-brines-southern-arkansas-using-machine) | 2024? | link only (page blocks scripts) | An ML estimate of Li in Arkansas brines | ❓ |
| [USGS data release: Lithium observations, machine learning predictions, and mass estimates from the Smackover Formation](https://www.usgs.gov/data/lithium-observations-machine-learning-predictions-and-mass-estimates-smackover-formation) | 2024? | **not yet**. Download it in a browser and add it here. | Brine Li observations and predicted grids. Pair them with the Arkansas brine deals in `land-pack/05_deal_comparables.csv`. | ❓ |
| [SRK Consulting: Province-scale lithium prospectivity](https://www.srk.com/en/projects/province-scale-lithium-prospectivity) | ? | link only (page blocks scripts) | Industry method for prospectivity mapping. Probably no data. | ❓ |

Titles marked "?" or "not confirmed" were taken from the URL because the page blocked automated access. Confirm them in a browser.

More sources (minerals, markets, other world data) are listed in [`../data-sources-unverified.md`](../data-sources-unverified.md).

## Notes

- **Line endings:** files keep their original CRLF line endings. `.gitattributes` in this folder turns off Git's text and whitespace handling here, so the files stay identical to what was downloaded.
- **Live data dates:** the live registry pulls (WA, Quebec) are as of 24 Oct 2026. Re-pull them before modelling.
- **Licences:** USGS data is public domain or CC0. WA and Quebec data is CC BY 4.0. Check each source's own terms before any commercial use.
