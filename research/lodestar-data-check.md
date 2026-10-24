# LODESTAR data check: is the land-rush idea viable?

Saturday 24 Oct 2026, ~19:45, Ahmed. This checks the extended idea (mineral and weather data, political and conflict layers, a fast decision model and a trading algorithm) against real data. It builds on [LODESTAR](lodestar.md) and [the land-buy plan](lodestar-land-buy.md).

## Verdict

**Viable, if narrowed.** The land-rush core has excellent data, and it solves LODESTAR's claim-date blocker. Three of the add-ons don't hold up:

| Part | Verdict | Why |
|---|---|---|
| Claim rush → land decision | ✅ Build | Quebec publishes every claim ever registered, with dates, status and holder |
| Meteorological model | ❌ Drop as a predictor | Weather only masks or reveals surface signals; ML prospectivity is crowded prior art |
| Political and conflict layers | ⚠️ Shrink | Irrelevant inside one stable jurisdiction; use Quebec's land-restriction layers instead |
| Trading algorithm on the discoverer's stock | ❌ Probe failed | Staking near Corvette does not lead Patriot's share price |

## 1. Claim dates: use Quebec, not Nevada

Nevada's dates sit behind a bot check at reports.blm.gov, and the best free alternative (USGS DS-290) only has yearly counts per section up to 2010. Quebec has none of these problems.

- **Source:** [GESTIM digital data](https://diffusion.mern.gouv.qc.ca/public/GESTIM/telechargements/Province_shape/), free, updated every Monday (latest 19 Oct 2026).
- **`TITRES_TITLES_ALL`** (116 MB zip, 3.9 GB unzipped): every title ever registered, split at 50°N. The north layer alone has 795,386 titles. Fields include issue date (`TIT_DAT_EM`), expiry date (`TIT_DAT_EX`), status (active or expired), renewals, required work, and holder (`DET_NOM`).
- **`TERRAIN OUVERT_AVAILABLE LAND_ALL`** (160 MB): land that is open to claim today. This is the "spot the gap" input.
- **`TITRES_EMIS_60J`:** claims issued in the last 60 days, for the live demo.
- **Restrictions layer (`CONTRAINTES_RESTRICTIONS`):** protected areas, private land and other constraints. This is a concrete stand-in for the political layer.
- **Western Australia** is a good second region: current titles carry the pegging **date and time** and holder names, under CC BY 4.0 ([DMIRS-003](https://catalogue.data.wa.gov.au/dataset/mining-tenements-dmirs-003)). Expired titles need a free SLIP login ([DMIRS-026](https://catalogue.data.wa.gov.au/dataset/tenements-dead-dmirs-026/resource/f3fa35d5-8dca-4bf0-84d8-d96c0c830afa)).

**The rush is clearly visible.** Claims issued in a James Bay box (49–55.5°N, 79.5–71°W) by year:

| 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|
| 13,030 | 11,246 | 32,146 | **52,718** | 6,330 | 6,710 |

Within 100 km of Patriot Battery Metals' Corvette lithium discovery: 615 in 2021, 7,551 in 2022, 8,893 in 2023, then 3,014 in 2024. The biggest stakers within 50 km since 2022 are Kenorland (1,819), Targa (1,590), Azimut (757) and Midland (210). Azimut and Midland are listed prospect generators.

**TIME framing:** freeze the clock at 31 Dec 2021, before the rush, and predict where 2022–23 staking went. Then use today's open-land layer for the "stake now" list. The rush-and-bust shape adds a second clock: Quebec claims expire after two years without work, so the 2022–23 wave is lapsing now, and today's open land includes ground that was hot two years ago.

## 2. Trading algorithm: the probe failed

**Test:** weekly new claims within 50 km of Corvette against weekly log returns of Patriot (PMET.TO, 522 weeks, from Yahoo), at lags of −8 to +8 weeks.

**Result:** every correlation was between −0.08 and +0.10. Staking does not lead the discoverer's stock. If anything, price rises come slightly before staking (k = −2: +0.10), which suggests staking reacts to the price, not the other way round. Staking was active in only 39 of 522 weeks.

**What's left untested:**
- **Nearology:** do the companies that stake near a discovery spike and then underperform? Ferguson and Crockett (2003) found competitor explorers rose on press coverage after the 1996 Gawler Craton gold discovery, and the most-covered underperformed a year later ([doi](https://doi.org/10.1016/s0927-538x(02)00096-3)). A UTS study found junior miners' prices fall for an extended period after exploration announcements ([paper](https://www.uts.edu.au/globalassets/sites/default/files/wp7.pdf)). Stockhead calls nearology mostly "rubbish" ([article](https://stockhead.com.au/resources/is-nearology-a-load-of-rubbish-recent-history-says-yes/)).
- **How to test it:** a "fade the nearology spike" rule, using the holder names in the claim data mapped to tickers (e.g. AZM.V, MD.V). Treat it as a one-hour test, not the core.

## 3. Meteorological model: drop it as a predictor

Weather changes surface signals (spectral signatures, vegetation, runoff), so at best it's a correction layer for remote sensing, not a predictor of deposits. ML prospectivity mapping is crowded: OZ Minerals' A$1M Explorer Challenge (2019) ran exactly this with Geoscience Australia data, and a public list collects hundreds of open projects ([GitHub](https://github.com/RichardScottOZ/mineral-exploration-machine-learning)). Quebec claims are designated on a map online, so weather doesn't even affect staking. If the team wants it, use it only for field-season access (winter drilling on frozen ground) or a cloud mask.

## 4. Political and conflict layers: shrink them

- **Conflict:** UCDP GED is a free bulk download (CC BY 4.0; the API needs a token that takes 3–5 days). ACLED needs a myACLED account. Neither matters inside Quebec, Nevada or Western Australia.
- **Politics:** the Fraser Institute's annual Policy Perception Index ranks 68 jurisdictions (Nevada 1st in 2025) ([2025 report](https://www.fraserinstitute.org/sites/default/files/2026-02/annual-survey-of-mining-companies-2025.pdf)). It's one number per jurisdiction per year, so it only helps when comparing jurisdictions.
- **Better inside Quebec:** the GESTIM restrictions layer (protected areas, private land and other constraints) answers "can this land actually be claimed and worked?" with real polygons.

## Suggested scope for the remaining hours

1. **Prior:** lithium favourability from known occurrences and geology (Quebec's SIGEOM, or the USGS MRDS for comparison).
2. **Rush model:** given a discovery and the open land, predict where staking goes next. Backtest it frozen at end-2021 against 2022–23.
3. **Decision:** rank open cells to stake now, at expected value net of claim costs. The exit signal is staking velocity peaking.
4. **Optional:** a one-hour nearology test on prospect-generator stocks.

Probe scripts: `rush_probe.py` and `grid_probe.py` in the session scratchpad; they can be shared on request.
