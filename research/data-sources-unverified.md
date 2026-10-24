# Data sources catalogue (unverified)

Saturday 24 Oct 2026, added by Salman. These are leads only. For lithium, see also [the lithium leads note](lithium-data-leads-unverified.md) and [the lithium data folder](lithium-data/README.md). For markets and HRT, see [`hrt-data/`](hrt-data/README.md).

> ## ⚠️ Read this first: double-check every source before you use it
>
> An AI assistant put this list together. The **"Reported"** column is what that assistant claimed (for example, "✅ Downloaded and analysed"). That happened on someone else's machine, and **none of those downloads are in this repo**. Sample counts, layer sizes and descriptions **may be wrong or out of date**.
>
> - **"Loads today?"** is our own quick request on 24 Oct 2026. It only shows whether the URL answered, not whether the data is what's described. 403 usually means the site blocks scripts, so try a browser.
> - When you check a source, fill in **Checked by agent** with ✅ (and what you confirmed), ❌ (and what's wrong), or ❓ (couldn't reach).
> - Large files (NURE, MRDS, ITCH, FCC and others) are deliberately **not** committed. Download them yourself, following AGENTS.md: keep large raw data out of Git.

## Minerals and land

| Dataset name (link) | What it's said to give | Reported | Loads today? | Checked by agent |
|---|---|---|---|---|
| [USGS NURE Hydrogeochemical and Stream Sediment Reconnaissance: sediment CSV](https://mrdata.usgs.gov/nure/sediment/nuresed-csv.zip) | 1970s survey of soil and sediment: lithium plus about 40 other elements, said to be 397,609 samples | ✅ Downloaded | 200 (page) | ❓ |
| [USGS NURE Hydrogeochemical and Stream Sediment Reconnaissance: water CSV](https://mrdata.usgs.gov/nure/water/nurewtr-csv.zip) | 1970s survey of wells and springs, with lithium in ppb | ✅ Downloaded | 200 (page) | ❓ |
| NURE overview pages: [sediment](https://mrdata.usgs.gov/nure/sediment/) · [water](https://mrdata.usgs.gov/nure/water/) | Documentation | ✅ | 200 | ❓ |
| [USGS Mineral Resources Data System (MRDS) CSV](https://mrdata.usgs.gov/mrds/mrds-csv.zip) | Known mineral sites (26 MB) | ✅ File exists | 206 | ❓ |
| [USGS USMIN Mineral Deposit Database](https://mrdata.usgs.gov/usmin/) | Modern mines and prospects by state (e.g. `usmin-NV.zip`) | ✅ Downloads listed | 200 | ❓ |
| [USGS National Geochemical Database (NGDB): rock](https://mrdata.usgs.gov/ngdb/rock/) | Rock geochemistry | ✅ Page up | 200 | ❓ |
| [USGS National Produced Waters Geochemical Database v3](https://www.sciencebase.gov/catalog/item/64fa1e71d34ed30c2054ea11) | Oil-field brine chemistry, including lithium | ✅ Page up | 403 to scripts | ❓ |
| [BLM Mining Claims MapServer](https://nlsdbpubgis.blm.gov/arcgis/rest/services/Mining_Claims/MiningClaims/MapServer) | US mining claims. Layer 1 is said to have 594,679 active claims and layer 2 3,808,267 closed claims. | ✅ Worked, then started refusing requests; retry | 200 | ❓ |
| [BLM MLRS Reports (Geographic Report, Serial Register Page)](https://reports.blm.gov/reports/MLRS) | Mining claim reports with dates, exportable to CSV or Excel | ✅ Site up; bot check, so use a browser | 200 | ❓ |
| [Nevada Division of Minerals: BLM 2024 External MLRS Reports guide](https://minerals.nv.gov/uploadedFiles/mineralsnvgov/content/Programs/Mining/BLM%202024%20External%20MLRS%20Reports.pdf) | How to use the MLRS reports | ✅ | 206 | ❓ |
| [BLM Natl MLRS Mining Claims Not Closed (data.gov)](https://catalog.data.gov/dataset/blm-natl-mlrs-mining-claims-not-closed) | Claims dataset page (bulk download said to be switched off) | ✅ | **404 today**, possibly moved | ❓ |
| [World Bank Commodity Markets (Pink Sheet) Historical Data, Monthly](https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx) | Monthly metal prices, 1960 to Sept 2026 (gold, copper, nickel, tin and others; check whether lithium is included) | ✅ Downloaded | 200 | ❓ |
| [USGS Mineral Commodity Summaries 2026: Lithium](https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-lithium.pdf) | Annual production, reserves and price. Committed to `lithium-data/usgs-publications/`. | n/a | 200 | ❓ |
| [USGS Mineral Commodity Summaries 2025: Lithium](https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-lithium.pdf) | The previous year. Committed. | ✅ | 200 | ❓ |
| [USGS Fact Sheet 2024-3052](https://pubs.usgs.gov/fs/2024/3052/fs20243052.pdf) | Title not confirmed. Committed. | n/a | 200 | ❓ |
| [USGS: Evaluation of the lithium resource in the Smackover Formation brines of southern Arkansas using machine learning](https://www.usgs.gov/publications/evaluation-lithium-resource-smackover-formation-brines-southern-arkansas-using-machine) | ML estimate of Li in Arkansas brines. Title taken from the URL. | n/a | 403 to scripts | ❓ |
| [USGS data release: Lithium observations, machine learning predictions, and mass estimates from the Smackover Formation](https://www.usgs.gov/data/lithium-observations-machine-learning-predictions-and-mass-estimates-smackover-formation) | The data behind the paper above. Worth downloading in a browser. | n/a | 403 to scripts | ❓ |
| [SRK Consulting: Province-scale lithium prospectivity](https://www.srk.com/en/projects/province-scale-lithium-prospectivity) | Consultancy case study on prospectivity mapping | n/a | 403 to scripts | ❓ |
| [SEC EDGAR full-text search: "technical report summary" lithium, 10-K](https://efts.sec.gov/LATEST/search-index?q=%22technical%20report%20summary%22%20lithium&forms=10-K) | S-K 1300 mining technical reports (resources and economics) | ✅ Responds | 200 | ❓ |
| [NASA EMIT L2B Estimated Mineral Identification (EMITL2BMIN v001)](https://lpdaac.usgs.gov/products/emitl2bminv001/) | Surface mineral maps from the ISS | ✅ Page up (free NASA Earthdata login needed) | 200 | ❓ |
| [FDD: China pauses some rare-earth export curbs (12 Nov 2025)](https://www.fdd.org/analysis/2025/11/12/china-pauses-some-rare-earth-export-curbs-while-retaining-levers-of-control/) | Timeline of export controls (an analysis piece, not a dataset) | ✅ | 403 to scripts | ❓ |
| [Mindat API](https://api.mindat.org/) | Mineral localities worldwide. Needs a free API key. The licence is **non-commercial**. | ⚠️ Needs API key | 401 (expected without a key) | ❓ |

## Markets and HRT

The market and HRT sources (Nasdaq ITCH, IEX, the Fed statement, FCC, SEC, FINRA, Treasury, Binance, CFTC and the HRT blog) are in [`hrt-data/README.md`](hrt-data/README.md), alongside the Fed Millisecond work.

## Other world data

| Dataset name (link) | What it's said to give | Reported | Loads today? | Checked by agent |
|---|---|---|---|---|
| [NESO System Frequency Data](https://www.neso.energy/data-portal/system-frequency-data) | UK grid frequency, every second | ✅ Data opened | 200 | ❓ |
| [Carbon Intensity API (GB)](https://api.carbonintensity.org.uk/intensity) | UK carbon intensity, forecast vs actual | ✅ | 200 | ❓ |
| [Open-Meteo Historical Weather API](https://archive-api.open-meteo.com/v1/archive) | Weather history | ✅ (rate-limited) | 200 | ❓ |
| [OpenSky Network: state vectors](https://opensky-network.org/api/states/all) | Live aircraft positions | ✅ | 200 | ❓ |
| [TeleGeography Submarine Cable Map: cable geometry](https://www.submarinecablemap.com/api/v3/cable/cable-geo.json) | Undersea cable routes | ✅ | 206 | ❓ |
| [GDELT 2.0 event feed (`lastupdate.txt`)](http://data.gdeltproject.org/gdeltv2/lastupdate.txt) | Global news events, every 15 minutes | ✅ | 206 | ❓ |

## Mismatches found while writing this

- **data.gov page:** the BLM data.gov dataset page returned **404** today, although the list reported it as ✅. It may have moved.
- **SEC:** the SEC daily index returned 403. SEC asks for a descriptive `User-Agent` header, so it's probably fine with one.
- **NURE sample count:** the reported 397,609 sediment samples haven't been checked. Count the rows after downloading.
