# Tok land data: mining claims and gold deals

24 October 2026. Owner: Arjin. Land data for the gold Site A (Tok west) and Site B (Tok east) in [the gold evidence results](../gold-evidence-results.md). Claims were downloaded on 24 October 2026; claim records change daily.

## What the data shows

Site B is held and still being staked. Site A was staked and then mostly abandoned.

| | Site A (Tok west) | Site B (Tok east) |
|---|---:|---:|
| Samples inside an active state claim | 2 of 33 | **20 of 34** |
| Samples inside a closed state claim | 12 of 33 | 1 of 34 |
| Median distance to the nearest active claim | 3,427 m | 0 m |
| Owners of the active claims at samples | Great Land Minerals (2) | Contango Minerals (17), Sibits (2), Peak Gold (1) |
| Main staking wave (claims overlapping the window) | 2011: 114 claims, 112 now closed | 2016–17: 406 claims, 236 still active |
| Claims with a 2025 start date | 0 | 30 |

In the whole search box there are 706 active and 763 closed state claims. The largest active holders are Contango Minerals Alaska (403), Peak Gold (116) and Delta Project LLC (80).

**A September 2026 sale sits next to Site A.** Agnico Eagle agreed on 8 September 2026 to sell the Delta project to Vizsla Copper. Vizsla's release describes Delta as 249 state mining claims. The DNR data has exactly 249 active claims held by Delta Project LLC, and 13 of them overlap the Site A window. The nearest Site A sample is about 3 km away. Consideration was about C$32 million in Vizsla shares for Delta and the Helm Bay project together, plus up to C$20 million in Delta milestones. Delta is a polymetallic deposit with gold, not a pure gold project.

## Files

| File | Contents |
|---|---|
| [tok_sample_claim_matches.csv](tok_sample_claim_matches.csv) | One row per sample–claim pair (a sample can sit in several claims), or one `outside_state_claims` row. Includes claim status, case ID, owner, start date and the distance to the nearest active claim. |
| [tok_land_summary.json](tok_land_summary.json) | Per-site counts, owners and claims by start year. |
| [gold_deal_comparables.csv](gold_deal_comparables.csv) | Ten Alaska deals with prices and sources: six project sales and four claim-package deals, in the same layout as the [lithium deal table](../lithium-data/land-pack/05_deal_comparables.csv). Shows how each one relates to the Tok sites. |
| [site-a/](site-a/summary.md), [site-b/](site-b/summary.md) | Per site: `land_matches.csv`, which fills the gold pack's `land_match_template.csv` columns with every state mining claim and state land record containing each sample, plus a `summary.md`. 29/33 Site A and 28/34 Site B samples sit on state land records; none sit in a mineral order or Native allotment. Built by [site_land_matches.py](site_land_matches.py). |
| [claims-vs-gold.md](claims-vs-gold.md) | Timing check: Alaska-wide claim staking compares only weakly with the gold price, so price alone is not a buy/sell signal. Built by [claims_vs_gold.py](claims_vs_gold.py) into [alaska_claims_vs_gold.csv](alaska_claims_vs_gold.csv). |
| [tok_land_claims.py](tok_land_claims.py) | Downloads the claims, checks the gold source hash and rebuilds the first two files. |

Regenerate the files from the repository root with Python 3. The script uses only the standard library and takes about 30 seconds:

```sh
python3 research/tok-land/tok_land_claims.py
```

Raw downloads go to `data/raw/tok-land/`, which Git ignores. If a file is already there, the script reuses it; delete it to fetch fresh data. The gold source CSV must match the SHA-256 in [gold-site-selection.json](../gold-site-selection.json), or the script stops.

## Limits

- **The start date is not confirmed.** The date comes from the DNR field `NTPSTDT`, which DNR does not document. It is probably the date the claim was located. DNR's case-file pages block scripts, so check one in a browser before relying on it. Example: case ADL 715614, field value 22 August 2012.
- **State claims only.** The BLM Alaska federal claims service returned "Service not started" on 24 October 2026. Native corporation land and the state land-status layers are not checked yet.
- **No open-market price for individual claims.** Alaska state claims are rented, not bought, and small claim sales are rarely published. The deal table has four claim-package prices. Raw claim packages run about $170–205 per acre (Avidian 2024, US Antimony 2025), while advanced projects sell for tens of millions of dollars or more. The only priced deal inside the Tok area is the June 2021 sale of ~13,000 acres for $50,000 (~$3.85 per acre). It was between related parties (Contango owned 30% of the buyer), so it is not a market price. The yearly rent found so far comes from the 2000 statute: $20, $40 or $100 per 40 acres a year, by claim age. That statute requires a CPI revision every ten years, so the current rate is unverified.
- **A point inside a claim is only a spatial relationship.** It does not show where the sediment's gold came from, who owns the minerals, or whether land is available. This follows the [gold evidence contract](../gold-evidence-contract.md#future-land-record-join-contract).
- **Distances are approximate.** They use a local flat projection, which is accurate to well under 1% across this area. A cross-check with geopandas in Alaska Albers (EPSG:3338) gave the same matches and a median within 5 m.
- **Window counts use the sample bounding boxes,** which are search aids, not parcel boundaries.
- **The deal table needs care.** Delta's price covers two projects. The Gold Reserve purchase closing was not confirmed. The Tanacross option was terminated in 2024. The US Antimony claims are for antimony, not gold. The Avidian price was not re-read in the filing itself. Values marked "our arithmetic" are simple calculations, such as scaling a 70% price to 100%.

## Sources

- Alaska DNR State Mining Claims: [active](https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer/0), [closed](https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer/2). © Alaska Department of Natural Resources.
- Gold samples: Alaska DGGS RDF 2016-10, [DOI 10.14509/29688](https://doi.org/10.14509/29688).
- Delta sale: [Agnico Eagle 6-K, 8 September 2026](https://www.sec.gov/Archives/edgar/data/0000002809/000110465926106256/tm2625112d1_ex99-1.htm). Claim count from [Vizsla's release](https://ca.finance.yahoo.com/news/vizsla-copper-acquire-delta-polymetallic-220200522.html).
- Claim rent: [Alaska statute amendment, 2000](https://www.akleg.gov/pdf/21/Bills/final/CH%2074%20SLA%202000.pdf); [CPI revision rule, 1989](https://www.akleg.gov/pdf/16/Bills/Final/CH%20101%20SLA%201989.pdf).
- Sources for the other deals are listed in each row of the deal table.
