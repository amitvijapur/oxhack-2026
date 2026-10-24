# Mineral land: gold vs lithium claim cycles (viability probe)

Saturday 24 Oct 2026, ~19:30, Ahmed. Idea under test: use deposit, weather, political and conflict data to predict when to acquire and sell mineral land rights ("land contract arbitrage"), comparing gold and lithium. This note checks the data and runs one probe on real data.

## What the land market actually is

In Quebec, anyone can stake a mining claim online ("map designation") for a small fee. Claims last 3 years, then renew in 2-year terms if the holder pays and files work. Juniors buy or option ground near discoveries for real money. For example, Patriot Battery Metals paid $3M cash plus 1.8M shares for 111 claims next to its Corvette lithium discovery (Feb 2022), and Victory Battery Metals paid $100k plus 3M shares for 280 claims nearby (Feb 2023). So the "arbitrage" is: stake or acquire ground before demand arrives, then option or sell it, and let it lapse when demand goes.

## Data check

| Layer | Dataset | Access | Verdict |
|---|---|---|---|
| Land rights (core) | Quebec GESTIM `TITRES_TITLES_ALL`: every claim ever staked, with issue date, expiry date, renewals, status, map sheet and holder | Free download, updated weekly, 116 MB zip (3.9 GB unzipped, so stream it) | **Works.** 1,475,626 claims |
| Deposits | SIGÉOM showings (Quebec, CC BY 4.0) with substance and discovery year; USGS MRDS (84,406 gold, 566 lithium records, frozen since 2011); USGS lithium deposits | Free | Works |
| Prices | Gold futures (Yahoo, monthly from 2006); lithium has no free long series: GFEX lithium carbonate futures only from 2023, so LIT ETF and Albemarle are proxies | Free | Gold good, lithium weak |
| Politics | Fraser Institute mining survey, yearly Policy Perception Index by jurisdiction (Quebec fell to 22nd in 2025) | Free PDF | Coarse (yearly) |
| Conflict | UCDP GED and monthly Candidate events, dates and coordinates, 1989 to Sep 2026 | Free, CC BY 4.0, no registration | Works. ACLED is not suitable: account needed and its licence restricts ML use |
| Weather | ERA5 / Open-Meteo | Free | Weak as a predictor of deposits. A valid correction for satellite mineral mapping in arid areas (soil moisture shifts spectral indices for weeks after rain, van der Werff et al. 2022), and it sets the field season in Quebec. Not core |

## Probe result

Claims were labelled by holder name: "lithium" if the holder's name contains Lithium, Battery, Spodumene or Pegmatite (43,304 claims); "gold" if it contains Gold, Or or Aurifère (85,297). Monthly staking was compared with the 12-month price change at different lags.

| | Lithium-named claims | Gold-named claims |
|---|---|---|
| Staking follows price with a lag of | **~18 months** (r = +0.43 against LIT; +0.28 against Albemarle) | **0 months** (r = +0.36), fading after |
| Peak | 8,914 claims in Feb 2023; 22,254 in 2023 vs 1,192 in 2024 | Spread out; highest year 2020 (6,729) |
| Dropped at first expiry (never renewed) | 2021 cohort 98%, 2022 100%, 2023 93% | 45–89% across 2014–2023 cohorts |

**Reading:**
- The lithium land rush arrived late. Staking peaked in Feb 2023, after lithium prices had already turned, and almost all boom-era claims were abandoned at their first renewal.
- Gold land moves in step with the gold price and is abandoned less.
- So the lithium land market looks momentum-driven and late, and the gold one looks closer to efficient.

**Upcoming expiries:** 14,349 active lithium-named claims expire between now and the end of 2027, 4,973 of them in Q4 2026 alone. On past cohorts, most will lapse. That is a known, dated wave of ground returning to the open map, and it comes while GFEX lithium carbonate is back near 97,000 CNY/t.

## Caveats

- Holder-name labels are crude: 91% of claims are unlabelled, and companies renamed themselves "Lithium" during the boom, which could exaggerate the lag. A better label is geographic (distance to SIGÉOM lithium or gold showings), which needs the claim geometry. The claim shapes are in the same zip.
- The 18-month peak is at the edge of the tested range, so test wider lags and on the 2016–2018 mini-cycle before claiming it.
- The lithium price is a proxy (equities), not the metal.
- Claim sale and option values only appear in press releases, so measuring the "arbitrage" profit directly is limited. The measurable gain is demand: whether ground we would re-stake gets wanted (staked next to, optioned or bought) later.
- Prior art: Farmonaut (Oct 2026) analysed James Bay active claims with Sentinel-2 imagery, but not the full history, the cycle lag or the expiry wave.

## A buildable version (about 17 hours)

1. **Claim clock:** the gold vs lithium cycle finding above, with geographic labels and a proper lag test.
2. **Lapse model:** predict which active claims will drop at their next expiry (cohort, renewals, holder, price momentum, distance to showings).
3. **Decision:** a ranked re-stake list for the Q4 2026 to 2027 expiry wave, backtested on the 2016–2019 cycle (did lapsed ground near showings get re-staked or optioned in the 2021–2023 boom?).
4. **Optional:** political events (Fraser index, Chile, Mexico and Zimbabwe lithium moves) as a jurisdiction layer, and junior-miner prices (Patriot from 2014 on Yahoo) for a trading signal.

Weather and conflict stay out of the core unless the project extends to arid regions (weather) or African cadastres (conflict).
