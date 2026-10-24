# Lithium data pack (OxHack, 24 Oct 2026)

| File | What | Source |
|---|---|---|
| nevada_lithium_1976_1980_NURE.csv | 14,572 Nevada lithium measurements (sediment ppm, water ppb) from the 1976-80 NURE survey, with coordinates, Cs, Rb, B, U | https://mrdata.usgs.gov/nure/sediment/nuresed-csv.zip , https://mrdata.usgs.gov/nure/water/nurewtr-csv.zip |
| usgs_us_lithium_deposits/ | USGS "Lithium Deposits in the United States": 21 sites; resources (tonnage, grade), dated history (discovery, drilling, reports), production, polygons | https://www.sciencebase.gov/catalog/item/5d0baffce4b0e3d31162044c |
| world_lithium_pegmatite_deposits_grade_tonnage.csv | 86 hard-rock lithium deposits worldwide: tonnage, Li2O %, Cs, Rb, Ta, Sn (USGS ver. 2.0, June 2026) | https://www.sciencebase.gov/catalog/item/66db3cb7d34eef5af66d9306 |
| usgs_mrds_lithium_sites_US.csv | 566 US mineral-site records mentioning lithium (MRDS) | https://mrdata.usgs.gov/mrds/mrds-csv.zip |

Not included (large): USGS National Produced Waters Geochemical Database v3 (oil-field brines incl. lithium, 80 MB xlsx): https://www.sciencebase.gov/catalog/item/64fa1e71d34ed30c2054ea11

## Key finding
Every one of the 9 Nevada lithium deposits in the USGS database lies 1.0-3.3 km from a top-5% lithium sample taken in 1976-1980.
Random Nevada points: median 23.8 km, 10th percentile 5.3 km.
Includes deposits only discovered or explored decades later: Clayton Valley-Cypress (2015, 2.0 km), Clayton Valley-Zeus (claims 2016, 1.9 km), Bonnie Claire (2015-18, 3.3 km; 5.37 Mt Li inferred, 2018).
Caveats: 6 of 9 deposits cluster in Clayton Valley; NURE sampling density varies; "top 5%" threshold chosen by us (sediment >= 46 ppm, water >= 257.6 ppb).
