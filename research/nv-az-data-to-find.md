# Mining Claims Prediction — Data Status & What to Find

24 Oct 2026, Arjin.

We predict which 1-square-mile cells in Nevada (lithium, gold) and Arizona (copper) will see a burst of new mining claims in the next 12 months. The core data is in hand. The gaps below are what we need you to hunt for. Full details: [nv-az-data-sources.md](nv-az-data-sources.md).

## What we already have

No need to search for these.

| Data | Source | Coverage |
| --- | --- | --- |
| Mining claims with location + closed dates | NDOM "All States Historic Claims" | NV + AZ, 1850 – Mar 2025, 2.4M claims (downloading) |
| Current claims | NDOM (NV), BLM (AZ) | Up to Oct 2026 |
| Which Nevada claims are for lithium | NDOM inferred lithium placer claims | 24,416 claims |
| Known deposits (gold, copper, lithium) | USGS MRDS | 28,350 sites in NV + AZ |
| Mines and prospects | USGS USMIN topo mine symbols | 165k points |
| Mining districts | NBMG (NV), AZGS (AZ) | 535 NV, 287 AZ |
| Copper and gold prices | World Bank Pink Sheet | Monthly, 1960 – Sep 2026 |
| Lithium prices | USGS Mineral Commodity Summaries | Yearly, 2011 – 2025 |
| Magnetic, radiometric, gravity grids | USGS mrdata.usgs.gov | Whole US, links checked |
| Confirmed lithium cases | Thacker Pass, Clayton Valley (company filings) | Sourced |

## What to look for

Most useful first. Items 1–4 are files we know exist but our scripts can't download (the sites block them), so they need a browser.

| # | What | Where to look | A good result looks like |
| --- | --- | --- | --- |
| 1 | ASTER hydrothermal alteration map, SW US (spectral) | [doi 10.5066/F7CR5RK7](https://doi.org/10.5066/F7CR5RK7) on ScienceBase | A zip with `.img` raster files covering NV and AZ |
| 2 | GeoDAWN magnetics + radiometrics (Clayton Valley) | [doi 10.5066/P93LGLVQ](https://doi.org/10.5066/P93LGLVQ) | Grid files (`.grd` / `.tif`) for magnetic and K/Th/U |
| 3 | State geologic map (rock types) | [doi 10.5066/P1A3DQZK](https://doi.org/10.5066/P1A3DQZK) | Geodatabase or shapefile with a lithology field |
| 4 | USGS Mineral Commodity Summaries 2026 data (CSV) | [doi 10.5066/P1WKQ63T](https://doi.org/10.5066/P1WKQ63T) | CSV files for lithium, copper, gold |
| 5 | Lithium price before 2011, or monthly lithium prices | USGS historical statistics (Data Series 140), free price sites, papers | A free table with year/month and price, plus its source |
| 6 | Dates of lithium discoveries and resource announcements in Nevada | Company press releases, NI 43-101 reports (SEDAR), SEC filings | Project, date of first sampling, drilling, resource report. Clayton Valley (Cypress Dean & Glory, Noram Zeus), Bonnie Claire, Thacker Pass. |
| 7 | Same for Arizona copper projects | Company filings, AZGS | Project, county, key dates, resource size |
| 8 | Check the copper break-even prices | Freeport Q2 2026 10-Q (Bagdad, ~$4.00/lb), Gunnison Copper March 2026 study ($4.60/lb) | The exact sentence and page with the number |
| 9 | Arizona copper deposits list | [AZGS Mine Data](https://minedata.azgs.arizona.edu/) (didn't load for us) | Downloadable list with coordinates and commodity |
| 10 | NASA EMIT mineral scenes over Clayton Valley / Thacker Pass | [NASA Earthdata Search](https://search.earthdata.nasa.gov/), product EMITL2BMIN (free login) | Scene IDs and dates that cover those areas |

Also: tell us what's in your gold dataset (prices, deposits, mines, production?) and where it came from.

## Rules for anything you find

- **Free and public:** no paid data, no trial accounts we can't keep.
- **Has dates:** we predict timing, so data without dates is only useful as a map layer.
- **Covers Nevada or Arizona.**
- **Send the link, not just the file:** we cite every source.
- **Don't commit big files to GitHub:** anything over 100 MB gets rejected. Put it in a shared drive and send the link.
- **If a number looks odd or something is missing, say so.** We don't fill gaps with guesses.
