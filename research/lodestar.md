# LODESTAR: predicting the next mining land rush

**The question:** if we froze time in 2016, could we have predicted where Nevada's lithium rush would go, and which land to claim first?

Builds on the mining idea in [mining-drill-next.md](mining-drill-next.md).

## How it works (3 steps)

1. **Predict (history):** using only data from before 2016, a swarm of simulated prospectors moves across Nevada. They're pulled by geology, metal prices and each other, and the swarm predicts where claims will appear next.
2. **Prove (2016–2023):** compare the prediction with where people actually staked lithium claims.
3. **Decide (today):** run the same model on today's data and output the top 20 open land blocks to claim now, before the crowd.

## Why it wins

| Judge | What they get |
|---|---|
| HRT: data | 4.4 million real US mining-claim records + geology + 66 years of metal prices |
| HRT: prediction | Where the rush goes next, tested on real history |
| HRT: decision | The ranked list of land to claim now |
| Theme: TIME | Freeze the clock in the past, replay history, be early |
| Citadel: hand-made | We write the swarm simulation and the data pipeline ourselves |

## The demo (3 minutes)

1. "In 2016, nobody knew where the lithium rush would go."
2. Two maps side by side: our 2016 prediction versus what really happened. "X% of the real claims landed where we predicted."
3. Today's map: "Here's where the rush goes next, and the 20 blocks to claim now."
4. Limits, stated honestly: claims aren't mines; Nevada only; values are estimates.

## Data

| Source | Contents | Status |
|---|---|---|
| Mining claims | US government register (594,679 active, 3.8 million closed) | Checked |
| Known mineral sites | USGS database | Checked |
| Metal prices | World Bank, 1960–2026 | Checked |
| Geology | USGS maps | To download |

## Team plan

| Hours from now | Person A | Person B |
|---|---|---|
| 0–1 | Get claim dates working (the gate) | Download geology and mineral sites |
| 1–6 | Nevada grid + data cleaning | Simple baseline prediction |
| 6–12 | Swarm simulation (hand-written) | 2016 backtest + scoring |
| 12–17 | Today's "claim now" list | Maps and demo UI |
| 17–20 | Freeze, rehearse, backup video | Freeze, rehearse, backup video |

## The one rule

If claim dates can't be recovered within 1 hour, switch to [The Fed Millisecond](fed-millisecond), whose data and findings are already checked.

**Next move:** the 1-hour claim-date check.
