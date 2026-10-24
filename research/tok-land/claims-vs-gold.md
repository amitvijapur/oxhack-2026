# Does the gold price drive Alaska claim staking?

24 October 2026. Owner: Arjin. A timing check for the buy/sell decision. If claim staking followed the gold price, the price alone could tell us when to buy land.

**Answer: only weakly.** Across all 120,211 Alaska state mining claims, staking rises with the gold price in some years and ignores it in others. The gold price alone is not a reliable buy/sell signal. Local events, such as discoveries, deals and new companies arriving, probably matter too. That fits the team's plan to feed events into the swarm, but this check does not prove what caused each wave.

## Result

The change in claims opened per year against the change in the average gold price, for the full years 1991–2025 (n = 35):

| Gold price change measured | Correlation with claim change |
|---|---:|
| Same year | 0.19 |
| One year earlier | −0.02 |
| Two years earlier | −0.17 |

The levels of claims and gold price (both logged, 1990–2025, n = 36) correlate at 0.45. Both series trend over decades, though, so this figure overstates any link.

| Year | Gold, US$/oz | Gold change | Claims opened | Claims change |
|---|---:|---:|---:|---:|
| 2010 | 1,225 | +26% | 7,738 | +129% |
| 2011 | 1,569 | +28% | 7,378 | −5% |
| 2017 | 1,258 | +1% | 5,222 | +110% |
| 2020 | 1,770 | +27% | 4,489 | +6% |
| 2024 | 2,388 | +23% | 1,989 | −11% |
| 2025 | 3,442 | +44% | 3,113 | +57% |

In 2017 claims doubled while gold was flat. The Tok Site B staking wave (2016–17, see [README](README.md)) falls in the same years. The full table is in [alaska_claims_vs_gold.csv](alaska_claims_vs_gold.csv).

## Limits

- **The date field is unconfirmed.** Claims are dated by DNR's undocumented `NTPSTDT` field. 132 of 120,211 claims have no date or a date before 1970, and they are left out.
- **2026 is a partial year.** Claims run only to 24 October and gold only to September, so 2026 is excluded from the correlations.
- **The closed-claims layer may not be complete for older decades.** That is not verified.
- **Small sample, no causation.** These are 35 yearly points with no controls. Treat the result as a hint, not a measured predictive effect.
- **Nominal prices.** Gold is the World Bank Pink Sheet monthly price in US$ per troy ounce, averaged per calendar year, not adjusted for inflation.

## Reproduce

```sh
python3 research/tok-land/claims_vs_gold.py
```

The script uses only the standard library and takes about 3–4 minutes, because it sends one count request per year per layer. It downloads the Pink Sheet to `data/raw/tok-land/`, which Git ignores.

Sources: [Alaska DNR State Mining Claims](https://arcgis.dnr.alaska.gov/arcgis/rest/services/OpenData/NaturalResource_StateMiningClaim/FeatureServer) and the [World Bank Commodity Price Data (Pink Sheet)](https://www.worldbank.org/en/research/commodity-markets).
