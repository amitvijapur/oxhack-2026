# Decision engine: buy, hold, sell or skip a gold land contract

25 October 2026. Owner: Salman. Code: [`scripts/decision_engine.py`](../../scripts/decision_engine.py) (decision) and [`scripts/claims_forecast.py`](../../scripts/claims_forecast.py) (measured prediction). Standard library only. Design: the combined strategy (PR #24) with the corrections in [the audit response](https://github.com/amitvijapur/oxhack-2026/pull/23).

## How it fits HRT's brief: data → features → measured prediction → decision

| Step | What it does | Where |
|---|---|---|
| Data | Dated claims (NV/AZ lode claims since 1997; Tok state claims), MRDS gold sites, each fetched with a manifest and SHA-256 | `scripts/claims_fetch.py` |
| Features | Point-in-time staking activity per section, neighbour activity, active claims, distance to known gold | `scripts/claims_forecast.py` |
| Measured prediction | Will a previously staked section see new staking next year? Scored on held-out years and townships against baselines | Results pending: the NV/AZ claims download is in progress |
| Decision | Staged land-contract options solved month by month: pay the next stage, sell, hold or lapse | `scripts/decision_engine.py` |

## The decision model

1. **Exact single-date calculator.** It reproduces the review's acceptance fixture: purchase $9,500 expected, option $12,600, SKIP at a $16,000 premium, plus the settlement-delay, budget and missing-input cases.
2. **Buyer arrival, learned over time.** Staking near the land follows a Poisson process with an uncertain rate (Gamma prior). Buyers arrive at `q` times the staking rate. `q` is the one labelled assumption, and the engine reports the value of `q` at which the decision flips. A month with no buyer updates the belief exactly, so belief in a buyer fades as quiet months pass. That's the TIME mechanism.
3. **Real contract structure.** Gold land options are staged. Each payment date is a decision node: pay the next stage, or let the option lapse. When a buyer arrives, the holder can complete the remaining stages and sell, or decline and wait. Backward induction over months gives the exact optimal plan. Each node uses only what is known by then.
4. **Constraints and honesty.** Every result reports:
   - the worst outcome that can actually happen under the plan
   - the peak cash needed before any receipt
   - the break-even values: conversion `q*`, the largest first payment worth making, and the smallest high offer worth entering for
   - a `fragile` flag when the decision sits within 25% of flipping

## Correctness checks

`python3 -m unittest discover -s tests -p 'test_decision_engine.py' -v` runs 13 tests:
- the review fixture and its four boundary cases
- the ledger summing to the NPV
- the monthly tree collapsed to one period giving exactly $12,600, −$400 and SKIP
- the Gamma updates matching hand values (33/49, 5/9, 65/81)
- backward induction equal to an independent brute-force search over 40 random contracts
- higher costs never raising value
- the pinned demo decision

## Tok demo: real terms, assumed exit

Run `python3 scripts/decision_engine.py research/decision-engine/tok-demo.json`. The inputs and every assumption are labelled in [tok-demo.json](tok-demo.json).

- **Contract (real terms):** the White Rock option from the catalogue (NV-04). $10k at signing, then $25k, $40k, $50k and $125k on years 1–4, and a $25k annual advance royalty after exercise. It is applied hypothetically to a 640-acre block in the Tok Site B window.
- **Demand (real data):** Site B's recorded staking, counted as distinct owner-days per year, 2007–2025. The 392 claims of the 2016–17 "wave" were only 5 staking decisions. Counting claims would have overstated demand roughly 80 times.
- **Assumed:** the offers ($450k with probability 0.35, $120k with 0.65), `q` = 0.5, claim rent, and an 8% discount rate.

Result:

| Output | Value |
|---|---|
| Signal | **BUY** the option, by paying the $10k first stage |
| Expected value | +$14,507 |
| Worst reachable outcome | −$11,545 (first payment plus a year of rent) |
| Plan | Hold; **sell** if an offer of at least $272k arrives in month 0, falling to $250k by month 11; **lapse** at month 12 rather than pay the $25k second stage |
| Break-even conversion q* | 0.196: BUY only if roughly 1 in 5 staking events turns into a buyer |
| Largest first payment worth making | $24,507 |
| Smallest high offer worth entering for | $338,198 |

The real staging is what makes this option worth buying. The $10k first stage buys a year's chance at a high offer, and the plan walks away before the larger payments. A single-date purchase of the same land would commit $250k up front.

## Limits

- Offers, `q` and the Alaska rent rate are assumptions. The engine shows how far each can move before the signal flips.
- The Tok demand prior comes from Tok's own records. The NV/AZ forecast's accuracy does not transfer to Alaska automatically; see the forecast results.
- Royalties beyond the advance minimum, and resource milestones, are not valued without a resource scenario.
- Not investment or legal advice. Brokerage routes need the licensing gates in PR #23.
