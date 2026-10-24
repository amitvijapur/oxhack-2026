# Lithium Land Data Pack (sample) — built 2026-10-24

Purpose: data backbone for predicting lithium land/claim value and finding buy-low/sell-high opportunities.

## Files
| File | Rows | What it is | Source / quality |
|---|---|---|---|
| 00_source_catalogue.csv | 20 | Every source rated 1-5 with fields, licence, cost, URL | research |
| 01_us_lithium_deposits_usgs.csv | 46 | US lithium resource estimates with coordinates; contained Li converted to LCE (Li x 5.323) | USGS, CC0, static 2020 |
| 02_wa_minedex_lithium_sites.csv | 623 | Every WA mine/deposit/prospect listing lithium, with stage and lat/lon | DMIRS live pull 2026-10-24 |
| 03_wa_tenements_lithium_named_holders.csv | 258 | Live WA tenements whose holder name contains "LITHIUM", with expiry + days_to_expiry | DMIRS live pull 2026-10-24 |
| 04_quebec_lithium_projects.csv | 184 | Quebec lithium projects by company, stage and region | Quebec open data 2026-10-24 |
| 05_deal_comparables.csv | 8 | Real deals with price, resource and $/t LCE | press releases; see quality_flag |
| 06_land_holding_costs.csv | 10 | Carrying costs (BLM, WA rents, Quebec fees, Arkansas royalty) | official fee schedules |
| 07_price_and_supply.csv | 19 | Price history, spot points, production by country | USGS MCS 2026 (verified) + others |

## Data-quality notes (read before modelling)
- File 03 is a proxy filter: it only catches holders with "LITHIUM" in their name. For full coverage, spatially join ALL WA tenements to file 02 lithium sites.
- WA dates were epoch ms, converted to ISO dates (UTC).
- USGS deposit data is from 2020 and resource classes vary (Inferred vs M&I); never mix them without a class weight.
- Deal values are mostly equity, not EV; resource vintages don't always match deal dates (Thacker Pass especially).
- Brine land trades per acre, hard rock per t LCE — model them separately.
- Mindat and IEDA are non-commercial licences; avoid them in a commercial product.
- Rules that kill flips: Quebec Bill 63 (claim transfers in first 3 years need ministerial approval since 2025-11-29); Ontario Bill 5 lets the minister revoke claims; Zimbabwe raw-ore export ban (2026-02-25); Chile lithium is non-concessible.

## Suggested join keys
- Spatial: lat/lon (files 01, 02) to tenement polygons (DMIRS-003, Ontario MLAS, Quebec SGM:Actifs, BLM claims).
- Company: holder/SOCIETE names to deal and exchange-filing data.
