# Nevada and Arizona gold land-contract comparables

Retrieved 24 October 2026. Owner: Salman. This is a table of 40 real contracts on gold land in Nevada (29) and Arizona (11), signed between 2017 and 2026. It gives the gold algorithm reference prices for buying, optioning, leasing and earning into gold claims, and for buying royalties on them. The table uses the same plain layout as Arjin's Alaska table (`research/tok-land/gold_deal_comparables.csv` on the `arjin/tok-land-data` branch) and the [lithium deal table](../lithium-data/land-pack/05_deal_comparables.csv). The main difference is the extra contract columns: payment schedule, work commitment, term and royalty.

## Files

| File | Contents |
|---|---|
| [nv_az_gold_contracts.csv](nv_az_gold_contracts.csv) | One row per deal, 35 columns. Each row has a `source_url` that we opened and checked against the row. |
| [catalogue_check.py](catalogue_check.py) | Validates the table and prints the statistics below. Run `python3 research/gold-contract-comparables/catalogue_check.py` from the repository root. |

## How the rows were found

- We searched for junior-miner news releases and SEC filings on optioned, leased, bought or royalty-sold gold claims in Nevada and Arizona from 2015 on.
- SEC filings were used where they exist (10-K, S-1, 8-K, 6-K and CB/A exhibits), because their property sections list the full payment schedules. Examples are Nevada Canyon Gold, Austin Gold, Augusta Gold, Athena Gold, EMX, and Canex Metals' statements inside Gold Basin's CB/A.
- Newsfile, GlobeNewswire and Accesswire block scripted reads. For those releases we used reposts that carry the full company text (StockTitan, Mining Stock Education, NS Energy), and news reports when no repost was available.
- Every number was read from the linked page. Values marked "our arithmetic" are sums, unit conversions (1 ha = 2.471 acres, 1 km² = 247.1 acres, 1 sq mi = 640 acres) or per-acre and per-claim divisions. When the source gives no area, acres are set to claims × 20.66 (one standard BLM lode claim), and the row says so.
- Amounts in C$ or A$, and amounts with no stated currency, stay in the notes. Their USD columns are left blank. We did not convert currencies.

## What is in the table

| Contract type | NV | AZ | Total |
|---|---:|---:|---:|
| option_to_purchase | 10 | 5 | 15 |
| purchase | 6 | 4 | 10 |
| lease (most with an option to buy) | 7 | 0 | 7 |
| earn_in | 2 | 2 | 4 |
| royalty_sale | 4 | 0 | 4 |
| **Total** | **29** | **11** | **40** |

By stage there are 14 grassroots rows, 22 exploration rows and 4 advanced rows (Athena's Excelsior Springs, Augusta's Reward purchase, and the Arthur and Spring Valley royalties). On quality, 23 rows are `high` (an SEC filing or a company release on a wire or the CSE) and 17 are `medium` (a repost or a news report). No row is `low`.

## Summary numbers

All values are US dollars. "Total consideration" is the cash plus any share value the source states in USD. It leaves out work commitments, royalties, milestone payments and share values given in other currencies.

- **Price per acre, grassroots and exploration land deals.** This covers purchases, options and earn-ins with a USD total and a known area (14 deals). The median is **about $280 per acre**. The middle half runs from about $107 to $462 (inclusive quartiles), and the full range is $19 to $4,288. The clean subset drops the Gold Chain amendment (remaining payments only) and keeps one row per project; its 13 rows give a median of about $285 per acre. The 7 grassroots-only deals have a median of about $205 per acre. The extremes are a 27-claim purchase for $10,395 (Loman, NV) and a single claim with an old heap-leach pad for $90,000 (Never Get Left, AZ).
- **Price per claim, same 14 deals.** The median is **about $5,800 per claim**. The middle half runs from about $2,400 to $9,500, and the full range is $385 to $90,000. The clean subset gives a median of about $5,900.
- **Total option payments.** Ten options and earn-ins state a total cash amount in USD. They run from **$90,000 to $1.5 million**, with a median of about **$300,000**, usually paid over 4 to 5 years with small first payments ($10,000 to $55,500). Larger deals add work commitments of $1 million to $4 million, as at Betty East, Fivemile and Pearl String.
- **Lease buy-out prices.** Leases with an option to buy name prices of $750,000 to $2 million (Agai-Pah, Swales, Silverton and Lone Mountain). Yearly payments are typically $20,000 to $30,000.
- **Royalty retained by the seller.** Among land contracts that state one, 2% NSR is the most common (12 rows), then 3% (6 rows), and 1% or 1.5% (6 rows). Most allow half of the royalty to be bought back for roughly $0.5 million to $3 million.
- **Advanced deals for range.** Augusta paid about $46 million for the Reward project in 2022 ($12.5 million cash + $22.1 million cash + 7.8 million shares; about $19,800 per acre). Royalty buyers paid $250 million for a 1% NSR on Arthur (2025) and $168 million for the Spring Valley royalties (2026).

## Normalization for modelling

Added after the [strategy review](https://github.com/amitvijapur/oxhack-2026/pull/24). These columns stop the table being misread as 40 independent, comparable sales:

| Column | Meaning |
|---|---|
| `project_group`, `agreement_id`, `event_type` | Links records about the same land or agreement. AZ-08 (2023 amendment) and AZ-11 (2026 buyout) are one Gold Chain agreement; AZ-04, AZ-06 and AZ-09 share the Gold Basin project; NV-08 and NV-10 are both at Bullfrog. Evaluate a group together, never as separate observations. |
| `interest_fraction` | What share is bought. Earn-ins buy part of a project (NV-06, NV-28, AZ-09); royalty rows buy only a royalty. "1.0 (assumed)" means the source implies the whole interest. |
| `related_party` | NV-14 and NV-16 involve the same executive on both sides. |
| `completion_status`, `outcome_known_from` | Outcomes such as exercise or closing, and the date that outcome was published. A backtest at an earlier date may use the agreement terms (`announce_date`) but not the outcome. |
| `area_source` | `reported` or `estimated_claims_x_20.66`. Estimated areas should not silently become a valuation denominator. |
| `exclude_from_land_value`, `exclude_reason` | Rows that must stay out of land-price statistics: royalty-only, related-party, remaining-commitments-only and share-only deals. |

Cash, shares, work commitments, royalties and milestones are still mixed inside some free-text fields. Splitting them into dated components is the next step before any price model is fitted.

## Limits

- **Share values are mostly missing.** Many deals pay partly or mainly in shares (Table Mountain, Excelsior Springs, Gold Basin 2020, the Barrick Bullfrog claims). Unless the source states a USD value, shares are left out of the totals, so those deals look cheaper than they were.
- **Options are not completed sales.** Option and earn-in totals are what the buyer *would* pay. Some were finished (Eminent, Abitibi, Canex, Sycamore Canyon), one was bought out early (Si2), and others may lapse. The Gold Basin 40-claim option is in doubt after a missed payment. Earn-ins such as Fivemile and Kelly Creek buy part of a project, not all of it.
- **Deal price is not market price.** Two Nevada Canyon rows are related-party deals (Agai-Pah and the Palmetto royalty). Some prices bundle royalties, milestones or old workings. The two Gold Chain rows (AZ-08, AZ-11) cover the same 107 claims, and the 2023 row shows only the remaining payments.
- **Royalty prices are not land prices.** The $/acre on royalty sales (Palmetto, NGE portfolio) prices the royalty only. Keep them out of land-value statistics.
- **Survivorship and publication bias.** Juniors announce deals they want investors to see, and small private claim sales are rarely published. The table over-represents listed companies and good-news projects.
- **Area is often estimated.** Twelve rows use the 20.66-acre assumption. Real claims can be smaller, and some sources count claims and patented ground together.
- **Some fields are thin.** Counties are missing for Pearl String, King Solomon, Gold Jackpot and Como. The Prosper Gold (Mohave) amounts have no stated currency. The Blue Dick agreement lists 11 claims but its exhibit table runs BD1 to BD18. Two rows (AZ-02 Philadelphia and NV-07 Silverton) target gold and silver together.

## Re-checking a row

Open the row's `source_url`. SEC pages can also be fetched with `curl -A "<name> <email>"` (the SEC asks for a contact in the user agent). For the 10-K, S-1 and CB/A rows, search the text for the property name to find the payment schedule.
