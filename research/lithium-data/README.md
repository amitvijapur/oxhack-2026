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
| `nevada_lithium_1976_1980_NURE.csv` | 14,572 | NURE [sediment](https://mrdata.usgs.gov/nure/sediment/nuresed-csv.zip) and [water](https://mrdata.usgs.gov/nure/water/nurewtr-csv.zip) CSVs, filtered to Nevada and lithium | ❓ |
| `usgs_us_lithium_deposits/` (11 tables) | `Site.csv`: 21 sites | [USGS Lithium Deposits in the US](https://www.sciencebase.gov/catalog/item/5d0baffce4b0e3d31162044c) | ❓ |
| `world_lithium_pegmatite_deposits_grade_tonnage.csv` | 86 | [USGS Li-Cs-Rb pegmatite grade-tonnage v2.0](https://www.sciencebase.gov/catalog/item/66db3cb7d34eef5af66d9306) | ❓ |
| `usgs_mrds_lithium_sites_US.csv` | 566 | [MRDS](https://mrdata.usgs.gov/mrds/mrds-csv.zip), filtered to US records that mention lithium | ❓ |

Not included because it's too large: the USGS Produced Waters Geochemical Database v3 (oil-field brines, 80 MB): [ScienceBase 64fa1e71d34ed30c2054ea11](https://www.sciencebase.gov/catalog/item/64fa1e71d34ed30c2054ea11).

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

## Notes

- **Line endings:** files keep their original CRLF line endings. `.gitattributes` in this folder turns off Git's text and whitespace handling here, so the files stay identical to what was downloaded.
- **Live data dates:** the live registry pulls (WA, Quebec) are as of 24 Oct 2026. Re-pull them before modelling.
- **Licences:** USGS data is public domain or CC0. WA and Quebec data is CC BY 4.0. Check each source's own terms before any commercial use.
