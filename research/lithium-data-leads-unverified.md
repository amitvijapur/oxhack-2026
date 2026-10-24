# Lithium data leads (unverified)

Saturday 24 Oct 2026, added by Salman. These are leads only. Related notes: [LODESTAR](lodestar.md), [the land-buy plan](lodestar-land-buy.md) and [the LODESTAR data check](lodestar-data-check.md).

> ## ⚠️ Read this first: the data is included, but double-check it
>
> The data files are in [`lithium-data/`](lithium-data/). We recommend checking them against the official sources before you use them. Most of this note comes from **AI-generated summaries** of those two data packs. Row counts, prices, dates, deal values and legal rules **may be wrong, out of date or made up**.
>
> - **Don't cite any number from this file.** Open the original source, find the figure there, and cite that.
> - When you check something, update its **Status** in this file: ✅ verified (with where you found it), ❌ wrong (with the correct value), or ❓ couldn't reach.
> - If the pack's CSV and the official registry disagree, the official registry wins.

## 1. Source links

Link checks were run on 24 Oct 2026 and only show whether the page loads. They say nothing about whether the data matches the claims below.

| Link | What it's said to be | Loads? | Status |
|---|---|---|---|
| [ScienceBase 5d0baffce4b0e3d31162044c](https://www.sciencebase.gov/catalog/item/5d0baffce4b0e3d31162044c) | USGS lithium deposits in the US | 403 to scripts, so open it in a browser | ❓ unverified |
| [ScienceBase 66db3cb7d34eef5af66d9306](https://www.sciencebase.gov/catalog/item/66db3cb7d34eef5af66d9306) | Unknown. Possibly the world Li pegmatite grade-tonnage data. Check it. | 403 to scripts | ❓ unverified |
| [ScienceBase 64fa1e71d34ed30c2054ea11](https://www.sciencebase.gov/catalog/item/64fa1e71d34ed30c2054ea11) | Unknown. Check it. | 403 to scripts | ❓ unverified |
| [NURE sediment](https://mrdata.usgs.gov/nure/sediment/) | NURE stream and soil sediment geochemistry, 1970s–80s | 200 | ❓ unverified |
| [NURE water](https://mrdata.usgs.gov/nure/water/) | NURE groundwater and surface-water geochemistry | 200 | ❓ unverified |
| [MRDS](https://mrdata.usgs.gov/mrds/) | USGS Mineral Resources Data System | 200 | ❓ unverified |
| [USGS MCS 2026: Lithium](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf) | Annual price, production and reserves by country | 200 | ❓ unverified |
| [WA Mining Tenements DMIRS-003](https://catalogue.data.wa.gov.au/dataset/mining-tenements-dmirs-003) | Live WA tenements with holders and expiry dates (daily, CC BY 4.0) | not checked | ❓ unverified |
| [WA SLIP MapServer (DMIRS-026, dead tenements)](https://public-services.slip.wa.gov.au/public/rest/services/SLIP_Public_Services/Industry_and_Mining/MapServer) | Expired and surrendered WA tenements, which could serve as churn labels | not checked | ❓ unverified |
| [WA MINEDEX DMIRS-001](https://catalogue.data.wa.gov.au/dataset/minedex-dmirs-001) | WA mines and prospects with stage and coordinates | not checked | ❓ unverified |
| [Ontario MLAS GIS zip](https://www.geologyontario.mines.gov.on.ca/mmd/mines/documents/claimaps/mlas_operational_gis_data.zip) | About 408k Ontario cell claims with due dates, plus cancelled claims (206 MB) | not checked | ❓ unverified |
| [Quebec Activités minières](https://www.donneesquebec.ca/recherche/dataset/activites-minieres) | Quebec projects by company and stage | not checked | ❓ unverified |
| [Quebec SGM WFS](https://servicesvectoriels.atlas.gouv.qc.ca/IDS_SGM_WFS/service.svc/get) | About 231k live title polygons, without expiry dates | not checked | ❓ unverified |
| [BLM MLRS Mining Claims Not Closed](https://catalog.data.gov/dataset/blm-natl-mlrs-mining-claims-not-closed) | All active US federal mining claims. The pack said the service was down on 24 Oct. | not checked | ❓ unverified |
| [Nevada Division of Minerals](https://minerals.nv.gov) | Claim density and fee layers already joined to sections | not checked | ❓ unverified |
| [USGS pegmatite grade-tonnage v2.0](https://www.usgs.gov/data/grade-and-tonnage-data-lithium-cesium-and-rubidium-pegmatite-deposits-ver-20-june-2026) | Global hard-rock Li grade and tonnage, June 2026 | not checked | ❓ unverified |
| [Trading Economics: Lithium](https://tradingeconomics.com/commodity/lithium) | Free daily China carbonate price (CNY/t) | not checked | ❓ unverified |
| [Benchmark Minerals prices](https://www.benchmarkminerals.com/lithium/prices/index) | Industry-standard price assessments; history is paywalled | not checked | ❓ unverified |

## 2. Pack A: Nevada / USGS geology pack (claimed)

The data is in [`lithium-data/nevada-usgs-pack/`](lithium-data/nevada-usgs-pack/). The table below is the summary as it was given to us.

| File | Claimed contents | Claimed sample row |
|---|---|---|
| `nevada_lithium_1976_1980_NURE.csv` | 14,572 Nevada lithium readings from soil, sediment and water, with GPS, plus Cs, Rb, B and U | water, 1980, 37.80°N −117.56°W, 26,412 ppb Li, well |
| `usgs_us_lithium_deposits/` | USGS US lithium deposits database: 21 sites with resources, dated history and production | Thacker Pass, 2018: 179.4 Mt at 3,283 ppm, about 589,000 t Li contained |
| `world_lithium_pegmatite_deposits_grade_tonnage.csv` | 86 hard-rock Li deposits worldwide (USGS, updated June 2026) | Greenbushes: 261 Mt at 1.93% Li₂O |
| `usgs_mrds_lithium_sites_US.csv` | 566 US mineral sites that mention lithium | Silver Peak, NV, producer |

**Claimed key finding (from the pack's README, to be re-tested):** all 9 Nevada lithium deposits in the USGS database lie 1.0–3.3 km from a top-5% NURE lithium sample taken in 1976–80. For random Nevada points, the median distance is 23.8 km and the 10th percentile is 5.3 km. This includes deposits found decades later, such as Clayton Valley-Cypress (2015) and Bonnie Claire (2015–18). Caveats: 6 of the 9 deposits are clustered in Clayton Valley, NURE sampling density varies, and the "top 5%" threshold was picked by hand (sediment ≥ 46 ppm, water ≥ 257.6 ppb). Re-run it from the CSVs before quoting it.

## 3. Pack B: `lithium_land_data` (claimed)

This is a sample pack built on 24 Oct 2026. It claims about 1,170 rows pulled from official registries. The data is in [`lithium-data/land-pack/`](lithium-data/land-pack/).

| File | Rows | Claimed contents |
|---|---|---|
| `00_source_catalogue.csv` | 20 | Every source rated 1–5, with fields, licence, cost and URL (the links are in section 1) |
| `01_us_lithium_deposits_usgs.csv` | 46 | US resource estimates. Contained Li is converted to LCE as Li × 5.323. |
| `02_wa_minedex_lithium_sites.csv` | 623 | WA mines and prospects that list lithium, with stage and lat/lon |
| `03_wa_tenements_lithium_named_holders.csv` | 258 | Live WA tenements whose holder name contains "LITHIUM", with expiry and days to expiry |
| `04_quebec_lithium_projects.csv` | 184 | Quebec lithium projects by company, stage and region |
| `05_deal_comparables.csv` | 8 | Deals with price and $/t LCE (table below) |
| `06_land_holding_costs.csv` | 10 | Holding costs: BLM fees, WA rents, Quebec fees, Arkansas royalty |
| `07_price_and_supply.csv` | 19 | Price history, spot prices, production by country |

**Headline claims, all to be checked:**

- The WA tenement register (DMIRS-003) is said to be the best land data anywhere: it updates daily and includes holders, grant dates and expiry dates. Its expired-tenements layer could give training labels for predicting when land drops.
- Ontario is said to be next best, with about 408,000 claims with due dates plus cancelled claims.
- Deals for development-stage and producing assets are said to cluster around **US$150–190 per tonne of LCE**.
- Brine land is said to trade per acre. Exxon reportedly paid more than ~US$830/acre in Arkansas.
- Small US claim flips are said to sell for about US$4,000 per claim, against a BLM holding cost of $200 per claim per year.
- Rules that would block a flip:
  - Quebec Bill 63: transfers in a claim's first 3 years need ministerial approval, reportedly since 2025-11-29.
  - Ontario Bill 5: the minister can reportedly revoke claims without compensation.
  - Chile: lithium is reportedly non-concessible.
  - Zimbabwe: raw-ore export ban, reportedly from 2026-02-25.
- Prices are said to have nearly doubled from their 2025 lows. China lithium carbonate is said to have been 97,000 CNY/t on 23 Oct 2026, down 27% on the month.

**Gaps the pack itself admits:**

- The BLM US claims service was down, so US claims are catalogued but not sampled.
- File 03 only catches holders with "lithium" in their name. Full coverage needs a spatial join of all WA tenements to the 623 sites.
- Deal values are mostly equity, not enterprise value (EV), and resource vintages don't always match deal dates.
- USGS resource classes are mixed (Inferred vs Measured and Indicated). Don't combine them without weighting.
- Mindat and IEDA use non-commercial licences.

**Deal comparables (claimed, with the pack's own quality flag):**

| Acquirer → target | Date | Price (US$m) | $/t LCE | Pack's quality flag | Source |
|---|---|---|---|---|---|
| Rio Tinto → Arcadium Lithium | 2024-10 (closed 2025-03) | 6,700 (equity) | 150 | medium: equity basis | [BusinessWire](https://www.businesswire.com/news/home/20250305025109/en/Rio-Tinto-completes-acquisition-of-Arcadium-Lithium) |
| Pilbara Minerals → Latin Resources | 2024-08 (closed 2025-02) | ~365 (A$560m at ~0.65) | 165 | medium: FX and share-price basis | [Stockhead](https://stockhead.com.au/resources/pilbara-minerals-to-become-global-hard-rock-lithium-player-with-560m-buyout-of-latin-resources) |
| Zhejiang Huayou → Atlantic Lithium | 2026-05 (pending) | 210 | 188 | medium: pending vote | [Skillings](https://www.skillings.net/zhejiang-huayou-cobalt-to-acquire-atlantic-lithium-in-210m-deal-commit-to-sole-funding-ewoyaa-development/) |
| GM → 38% of Thacker Pass JV | 2024-10-16 | 625 | 37 or ~275 | low: resource vintage mismatch | [CIM](https://magazine.cim.org/en/news/2024/gm-investing-us-625-million-in-joint-venture-with-lithium-americas-en/) |
| Titan (UAE) → Global Lithium | 2026-09-22 | ~218 (A$333m) | n/a | low: resource not verified | [Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2881117-uae-s-titan-to-acquire-australia-s-global-lithium) |
| ExxonMobil → Galvanic Energy (~120k acres) | ~2023 | >100 | n/a (>~830/acre) | low: reported secondhand | [Daily Upside](https://www.thedailyupside.com/industries/energy/exxonmobil-breaks-into-the-lithium-market-with-arkansas-land-purchase/) |
| Chevron → TerraVolta + ETNR (~125k acres) | 2025-06-17 | undisclosed | n/a | low: no price | [OGJ](https://ogj.com/energy-transition/article/55297744/chevron-enters-us-lithium-sector-with-leasehold-acquisitions) |
| Cruz Battery Metals → Clayton Valley claims (29) | 2025-01-22 | 0.115 + 7m shares | n/a (~4,000/claim) | high: primary release | [Newsfile](https://www.newsfilecorp.com/release/238004/Cruz-Battery-Metals-Closes-the-Central-Clayton-Valley-Lithium-Brine-Project-Acquisition) |

## 4. Things that already look off: check these first

These came up while writing this note and haven't been resolved:

1. **Site counts don't match.** Pack A's `Site.csv` has 21 rows and its `Resources.csv` has 73. Pack B's `01_us_lithium_deposits_usgs.csv` has 46 rows from what looks like the same source, and its catalogue says "~20 sites". Which resource rows did Pack B keep, and why?
2. **"Prices nearly doubled from 2025 lows."** MCS 2026 is quoted with a 2025e US price of $9,000/t. 97,000 CNY/t is roughly US$13–14k/t at today's rate. BMI's 2026 forecast is quoted at $20,100/t. Which series supports "nearly doubled"?
3. **Production and reserve figures** (Australia 92kt, China 62kt, Chile 56kt, world reserves 37 Mt Li and so on) are flagged by the pack itself as "check against PDF". Compare them with the MCS 2026 PDF.
4. **The GM / Thacker Pass $/t LCE** swings from 37 to ~275 depending on which resource vintage you use. Don't use it as a comparable until this is resolved.
5. **Deal $/t LCE uses equity value and assumed FX** (A$ to US$ at ~0.65). Recompute it on an EV basis using the FX rate on the deal date.
6. **Legal dates:** confirm Quebec Bill 63 (2025-11-29), Ontario Bill 5 and the Zimbabwe ban (2026-02-25) against official government text, not news articles.
7. **The two unknown ScienceBase items** (`66db3cb7…` and `64fa1e71…`) need a person or a browser agent to open them and record what they actually are.
8. **The Thacker Pass arithmetic** checks out (179.4 Mt × 3,283 ppm ≈ 589,000 t Li). That doesn't confirm the source figures are right.

## 5. How to check a lead

1. Open the source link (use a browser for ScienceBase) and confirm the dataset exists, along with its licence and last-updated date.
2. Spot-check at least 3 numbers from the claims against the source.
3. Update the **Status** column or the matching item in section 4, and include the source URL plus the page or field you used.
4. If a claim is wrong, correct it here. Don't delete it, so others can see what changed.
5. For LODESTAR, the most useful leads are probably the WA tenement and dead-tenement layers and the Quebec GESTIM data already covered in [the data check](lodestar-data-check.md).
