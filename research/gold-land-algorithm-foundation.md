# Gold land-contract algorithm: foundation design

24 October 2026. Owner: Salman (decision algorithm). Status: **design for team review; no application code yet.** The input and output formats are in [foundation-input-contracts.md](foundation-input-contracts.md).

> **Revised after an independent review.** For the valuation formula, the decision ledger and the first deliverable, the [combined strategy in PR #24](https://github.com/amitvijapur/oxhack-2026/pull/24) (`research/gold-land-strategy.md`) is the current design. What changed here and why is in [the audit response](foundation-audit-response.md). The sections below are kept as the research record, with corrections marked.

## What it does

The algorithm reads three inputs and returns **BUY, HOLD, SELL or SKIP** for a gold land contract:

- **Swarm prediction:** Muhd's MiroFish runs, described in the [gold swarm plan](gold-swarm-plan.md).
- **Land data:** claims, contract terms and deal prices.
- **Gold data:** prices and the measured gold evidence.

Every signal also names the best contract structure, the expected profit with a range, the risk, and a dollar breakdown of why.

```text
Swarm prediction (Muhd) ──┐
Land and contract data ───┼─► FOUNDATION ─► BUY / HOLD / SELL / SKIP
Gold price and evidence ──┘                 + contract structure, profit range, risk, reasons
```

We don't build or run the swarm. The algorithm consumes its output and must work without it, saying so when it does.

**Land contracts are the product.** Every position is a contract, whether we buy, sell or broker. So the algorithm values contracts and their terms, not only the land under them.

## Design principles

1. **Prediction is separate from decision.** Models predict value distributions, and a fixed rule layer turns them into actions. Any model, including the swarm, can be swapped without touching the rules.
2. **Every number has a range.** No single-point forecasts.
3. **Trust is earned.** Each input's weight comes from how well it predicted held-out outcomes. Unproven inputs are capped.
4. **No look-ahead.** Every row carries `available_at`, and a decision at time *t* sees only rows available by *t*.
5. **Robust beats clever.** A BUY or SELL must hold across several gold-price models. HOLD and SKIP are the defaults, because land is illiquid and costly to trade.
6. **Every signal is explained** in dollars.

We rejected three alternatives as the core:
- **One end-to-end ML model:** too few priced land deals, so it would overfit.
- **An LLM or Jev deciding directly:** its numbers can't be audited.
- **A reinforcement-learning agent:** there's no market simulator and too little history.

## Data we have

| Data | Where | What the algorithm uses it for |
|---|---|---|
| Tok River gold assays: 67 stream-sediment points, Site A 33 and Site B 34 | [gold evidence results](gold-evidence-results.md) (Amit) | Measured gold evidence for the case-study sites |
| Alaska state mining claims at Tok, with owners and start dates, plus 10 priced Alaska gold deals | `research/tok-land/` on branch `arjin/tok-land-data` (Arjin) | Who holds the land, the staking waves, and deal prices and terms |
| NV and AZ claims with location dates (2.4M in the source layer, 1850 to Mar 2025; the forecast uses the **875,406 lode claims located since 1997**), MRDS gold sites, World Bank monthly gold (1960 to Sep 2026) | `research/nv-az-data-sources.md` on branch `arjin/nv-az-claim-data` (Arjin) | Learning how land demand reacts to gold over decades, and backtesting |
| NV and AZ gold land-contract comparables | [gold-contract-comparables](gold-contract-comparables/README.md) | Real contract prices and terms for valuation |
| BLM fees: $274 to stake a new lode claim, then $200 per claim per year | [holding costs](lithium-data/land-pack/06_land_holding_costs.csv) | Carrying cost |

Arjin's Tok data already gives a strong real story:
- **Site B** has 20 of 34 samples inside active claims, mostly Contango's, with 30 claims starting in 2025.
- **Site A** was staked in 2011 and then mostly abandoned.
- On 8 Sep 2026 the 249-claim Delta project next to Site A was sold to Vizsla. Of those claims, 13 overlap the Site A window.

## How the regions combine without weakening the model

The Alaska pack alone can't train or test anything. It's 67 points from one 2016 snapshot, with no outcomes over time. It answers **where** the gold evidence is. The NV and AZ claim history answers **how and when** land demand responds to gold, fees and policy.

We combine them with a **hierarchical (partial-pooling) model**:

- **Shared layer**, learned from NV and AZ. It covers:
  - gold-price elasticity and its lag
  - how demand responds to price and fees
  - the effect of distance to known gold
  - the effect of contract terms
- **Regional layer.** NV, AZ and AK each get their own offsets for tenure (federal or state), claim system and access. A region with little data stays close to the shared layer instead of overfitting.
- **Site evidence.** The Tok gold assays feed the geology score for Sites A and B.
- **Domain check.** When Alaska conditions fall outside what the model has learned, its ranges widen and the result is SKIP, not a confident wrong call.

Two tests prove that pooling helps: leave-one-region-out and time-forward. Both are compared against separate per-region models.

## Layer 1: Gold price scenarios

We don't make one forecast. We generate thousands of gold price paths, monthly or quarterly, from five model families:

| Family | Why |
|---|---|
| Geometric Brownian motion, volatility about 16% a year | Simple, transparent baseline |
| Mean reversion of the real gold price | Erb and Harvey's ["golden dilemma"](https://people.duke.edu/~charvey/Research/Published_Papers/P113_The_golden_dilemma.pdf). Their own forecast failed, so this is one view among five, not the truth |
| Two-state regime switching (calm and stress) | Gold volatility comes in clusters |
| Block bootstrap of real monthly history (World Bank, 1960 onward) | Keeps the real fat tails without assuming a model |
| Swarm-tilted | Muhd's gold direction and size shift the near-term drift (Layer 4) |

Gold's yearly volatility has run around 16–17% ([WGC](https://www.gold.org/goldhub/gold-focus/2025/12/you-asked-we-answered-golds-appeal-fading-rising-vol)).

We do **not** hard-wire the link between gold and real interest rates. That link broke after 2022, when central-bank buying took over. Drivers such as the 10-year real yield ([FRED DFII10](https://fred.stlouisfed.org/series/DFII10)) are reported as context only.

## Layer 2: Land value and its relationship to gold

> **Corrected.** The first version used `max(surface value, mineral option value)`. That floor is withdrawn. An unpatented mining claim conveys mineral-development rights, not surface ownership ([BLM](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims)), so surface value only counts when a contract actually conveys a surface interest. The value is always the value **of the specific interest the contract conveys**: its rights, ownership fraction and dated cash flows.

**Surface value** applies only to patented or fee land where the surface is conveyed. It comes from USDA land values, for example 2025 Mountain-region pasture at $946/acre ([NASS](https://data.nass.usda.gov/Publications/Highlights/2025/2025LandValuesCashRents_FINAL.pdf)), refined by local sales where they exist.

**Mineral option value.** Land over possible gold is an option on the gold price. This is the standard real-options view of mineral property:
- [Brennan and Schwartz 1985](https://discovery.ucl.ac.uk/id/eprint/10107532/)
- Paddock, Siegel and Smith 1988
- [Moel and Tufano 2002](https://ideas.repec.org/a/oup/rfinst/v15y2002i1p35-64.html), who studied 285 gold mines

Value rises with the gold price, gold volatility and time left, and falls with development cost and holding cost.

> **Corrected.** The first version wrote `area × geology score × option factor`. That is not in dollars: the Kilburn method needs a base acquisition cost per area (its worked example is $500/km² × 25 km² × the four ratings), and multiplying by a gold option factor as well counts the gold price twice. Kept forms:
>
> - **Kilburn cross-check (secondary, in dollars):** `base acquisition cost per area × area × the four ratings`, with the base cost taken from staking costs and normalised comparables. It is a labelled cross-check beside comparable estimates, not the primary value.
> - **Development option (later module):** a real option needs a project underneath it: resource ounces, development cost, operating costs and rights duration. Stream-sediment assays supply none of these, so this module stays off until those inputs exist.
> - **First deliverable:** dated contract cash flows under labelled scenarios, as in the combined strategy.

**Geology score.** The Kilburn rating multiplies four factors, each from 0.1 to 10: on-property, off-property, anomaly and geology ([AIMVA](https://smedg.org.au/old_site/AIMVA_Adamson_McIntyre_Sorentino_Aug2014.pdf)). Valuers use it for exploration land with no resource yet. The [CIMVAL 2019 code](https://www.valmin.org/docs/CIMVal-Code-November2019.pdf) says only cost and market approaches apply at this stage. Our inputs for each factor:
- **Anomaly:** Tok gold assays.
- **Off-property:** distance to MRDS gold sites and active claims.
- **Geology:** the geological unit (SGMC) and whether the land is in a mining district.

**How land moves with gold.** Gold miners' shares move about 1 to 2.5 times gold. [Tufano 1998](https://doi.org/10.1111/0022-1082.00042), *Journal of Finance* 53(3), studied 48 North American gold miners from January 1990 to March 1994. It found that "the average mining stock moves 2 percent for each 1 percent change in gold prices", with exposure varying a lot over time and across firms. Exposure is lower when the gold price is high or volatile and when firms hedge, and higher with leverage. Simple discounted-cash-flow models overestimate it because they miss managerial flexibility, which supports valuing land as an option. [Baur 2014](https://research-repository.uwa.edu.au/en/publications/gold-mining-companies-and-the-price-of-gold/) found betas nearer 1 for Australian miners. We start land's sensitivity (beta) at about 1–2 with a lag of 6–18 months, because land reacts slowly. Both numbers are **fitted, not assumed.**

Where enough priced sales exist, a hedonic model separates the effects of geology, access, claim activity, gold price and time:
- **Spatial terms:** spatial regression beats ordinary regression on rural land ([SJAR](https://sjar.revistas.csic.es/index.php/sjar/article/view/14961)).
- **Time index for a thin market:** only 1–2% of land trades each year ([Farmer Mac](https://www.farmermac.com/insights-research/farmland-price-index)).

A gradient-boosted alternative must never value land lower when gold rises, all else equal.

**Uncertainty.** Each value gets a low/middle/high range from rolling conformal prediction, which holds its coverage on small data.

## Layer 3: Demand (when the land is wanted)

New claims follow the gold price. Nevada's Division of Minerals says claim counts are "usually proportional to the price of gold". When the 1993 maintenance fee arrived, Nevada claims fell 43% ([NV fiscal note](https://leg.state.nv.us/Session/82nd2023/FiscalNotes/12545.pdf); read from a search summary because the page blocks scripts, so check it in a browser). We found no peer-reviewed measure of this, so measuring it is our own contribution.

```text
change in claims = a + b × change in gold (lagged) − c × fee change + d × swarm buyer sentiment
```

- **Who builds it:** Arjin's planned model, which predicts claim bursts per 1-square-mile cell over the next 12 months, is this layer. The foundation consumes its output.
- **Rush timing (optional):** a Hawkes process models staking that spreads through space and time.
- **What demand drives:**
  - the chance an end buyer appears before a contract deadline
  - the expected time to sell
  - the price a buyer pays at exit

## Layer 4: Swarm prediction

Muhd's swarm (60 agents across government, land side and buyers) outputs, per run:
- daily cold/warm/hot sentiment per group
- the expected gold direction and size over 5 days
- the most likely policy move and its timing
- the direction of political leaning
- evidence references

It runs 3 seeds per variant, plus shock runs. The full mapping is in [the input contracts](foundation-input-contracts.md#1-swarm-prediction).

**How much to trust it.** LLM crowds can rival human crowds ([Schoenegger et al. 2024](https://arxiv.org/abs/2402.19379)). But they lean optimistic, and all agents share the same base model. MiroFish's own FAQ says its output is not a calibrated forecast. So:

- The swarm feeds four places:
  - a near-term tilt of the gold scenarios
  - the probability of a policy event (a tax rise, a mine approval, a protest)
  - buyer sentiment, which shifts time-to-sale and exit price
  - the gates
- **Corrected:** in the first version the swarm's output was blended into the model's estimate as a Black-Litterman-style view, weighted at up to about 25%. That fusion is off. Same-model reruns aren't independent errors, so their spread isn't calibrated uncertainty, and a five-day output isn't a multi-year land forecast. The swarm now defines **labelled stress scenarios**. Each mapping (event → field → size → onset → duration) is explicit, and results are shown with and without it. Fusion can return later only with matched targets and resolved forecasts.
- **Exclusion rules:**
  - Drop runs that fail the grounding check.
  - Don't use a view with fewer than 3 runs.
  - Never push probabilities toward extremes ("extremizing" only helps when forecasters hold different information).
- **Earning weight later:** 20 resolved predictions is a point at which to review the swarm's accuracy, not an automatic unlock. Calibrated fusion needs matched targets, resolved forecasts and held-out evidence that it adds value.

**Jev** ([TypeSafe System One](https://typesafe.ai/blog/introducing-system-one-models-and-jev)) returns typed answers with probabilities. We use it on the input side only:
- turning free-text swarm interviews into the typed fields above, if they arrive as text
- checking a report is consistent and cites its seed facts
- turning BLM or Federal Register notices into typed policy events

Its calibration claims are the vendor's own, so we recalibrate on our labels. It's early access, so a rules-based fallback is required. Jev never makes the money decision.

## Layer 5: Contracts and the decision

### Contract types

Every contract is valued on the same simulated land-value paths, so they compare on one scale.

| Contract | Our role | How it pays | Time element |
|---|---|---|---|
| Purchase (patented land, or claims by quitclaim deed) | Buyer, then seller | Exit price − price − costs − carry | Holding period |
| Option to purchase | Option holder | max(value at expiry − strike, 0) − premium | Expiry date |
| Assignment (contract it, then assign before closing) | Broker | Assignment fee × chance of finding a buyer in time − earnest money at risk | Closing deadline |
| Brokerage (match buyer and seller) | Broker | Commission × chance the deal closes | Time to match |
| Contract for deed (seller-financed) | Buyer or seller | Instalments, interest, default risk | Payment schedule |
| Option or earn-in with a royalty | Optionor or optionee | Payments + work commitments + royalty × chance of a mine | Option term |

Earn-in options are the most common real gold land contract. Arjin's Alaska table has examples:
- Antofagasta's Tanacross option: US$1m upfront and US$30m of exploration spending. It was terminated in 2024.
- A US Antimony option: US$3m staged over 5.5 years.

**Contract terms are inputs:**
- price or strike
- earnest money or premium
- due-diligence period
- closing or expiry date
- whether it can be assigned
- financing
- royalty
- what it conveys

### Gates (checked first)

Corrected: a known **failed** gate excludes entry, so SKIP stays feasible. An **unknown** gate gives `manual_review` or `insufficient_inputs` with no action, not SKIP. SKIP means the entry was evaluated and rejected.

- **Title:** clear title and chain of title.
- **Mineral rights:** they must be included. In the US the mineral estate can be separate from the surface.
- **Access:** legal access, not landlocked.
- **Claims:** fees paid and no overlapping claims.
- **Restricted land:** not in a federal withdrawal or protected area.
- **Liabilities:** no known abandoned-mine or environmental liabilities.
- **Water rights:** checked where relevant (Nevada).
- **Broker deals:** the contract must be assignable.
- **Domain:** the parcel is inside the model's domain, with enough comparables.
- **Who may do the deal:** licensing and securities rules decide which actions this user can take. Principal trades (buying, optioning or leasing for yourself) need no licence. Brokerage for others does in some states, and selling fractions to passive investors can be a securities offering. Details and fields are in [land-contract licensing](land-contract-licensing.md).

### Decision rules

Each opportunity is valued under every feasible contract structure, and the best is chosen.

| Signal | When |
|---|---|
| **BUY** (enter the contract) | All of these hold: expected profit > the larger of the value of waiting and a hurdle of 0.5 × the profit spread; P(profit) ≥ 60%; average loss in the worst 5% of outcomes (CVaR 95) within the loss limit; true in every gold-price family actually enabled. Corrected: the first version said 4 of 5, but a Tier 1 build with two families can't meet that. The output reports which families were run and the action under each; the thresholds are versioned policy settings, not research constants. Size at ¼–½ Kelly, within a portfolio limit on total gold exposure |
| **SKIP** (don't enter) | A gate fails, any BUY condition fails, the range is too wide, the swarm and the model strongly disagree, or portfolio limits are full |
| **SELL** (sell, assign or exercise and resell) | Selling now beats holding by more than 0.25 × the spread, robustly; or the portfolio risk limit is breached |
| **HOLD** (keep the contract) | Otherwise. Re-checked every quarter and before each fee or rent date |

**Holding value** comes from least-squares Monte Carlo ([Longstaff and Schwartz 2001](https://doi.org/10.1093/rfs/14.1.113)). It's the standard way to price "sell now or wait".

**Buying and selling costs** of about 3–8% each way create a band where doing nothing is best. This is the Davis and Norman (1990) no-trade region, whose boundaries for small costs are derived by [Gerhold, Muhle-Karbe and Schachermayer](https://arxiv.org/abs/1010.0627). So HOLD should be the most common signal.

**Time to sell** is part of every exit. Land can take months to sell, and that is the main hidden cost.

**Every signal shows a dollar breakdown:**
- value
- − price
- − costs
- − carry
- = net cash flow (the ledger; it must sum to the NPV)

Shown beside the ledger, not inside it (corrected: the first version double-counted these):
- waiting value, which is continuation minus act-now and already part of the optimised payoff
- risk measures
- the difference between results with and without each swarm scenario

It also shows the top drivers, how many gold families agreed, and the gate results.

## Worked example (hand-checkable)

> **Withdrawn as evidence.** The $170–205/acre anchor comes from an antimony option and a bundled deal, not a gold-claim price at Tok. The example also assumes the land sells instantly at year end. Keep it only as an illustration of the rules. The verified acceptance case is the combined strategy's fixture (purchase $9,500 expected, option $12,600, SKIP when the premium rises to $16,000).

**Fictional numbers chosen to check the arithmetic, not a real deal.** One gold-price family, no discounting, and a single 1-year horizon. The orders of magnitude originally came from:
- Alaska claim packages sold for about $170–205 per acre (Avidian 2024 and US Antimony 2025, in Arjin's table).
- Alaska rent is $100 per 40 acres a year for older claims. That rate comes from the 2000 statute, and its current CPI-adjusted value is unverified.

**Opportunity:** a 3,200-acre block of state claims near Site B.
- Asking price: $190/acre, so $608,000.
- Our model's middle value: $210/acre.
- Buying and selling costs: 5% each.
- Rent: 3,200 ÷ 40 × $100 = $8,000 a year.
- Land moves 1.5 × gold.

**Gold scenarios over one year:**

| Scenario | P | Gold | Land | Exit after 5% selling cost |
|---|---:|---:|---:|---:|
| Down | 0.25 | −20% | −30% | $446,880 |
| Base | 0.50 | +5% | +7.5% | $686,280 |
| Up | 0.25 | +30% | +45% | $925,680 |

Buying costs $608,000 × 1.05 = $638,400. The loss limit is $150,000. With 3 scenarios, the worst 5% falls entirely in the down scenario, so CVaR 95 equals that scenario's result.

| Structure | Down | Base | Up | Expected | P(profit) | CVaR 95 | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Purchase | −199,520 | 39,880 | 279,280 | 39,880 | 75% | −199,520 | Fails the loss limit |
| 12-month option, 10% premium ($60,800) | −68,800 | −20,920 | 218,480 | 26,960 | 25% | −68,800 | Fails P(profit) |
| **12-month option, 5% premium ($30,400)** | −38,400 | 9,480 | 248,880 | **57,360** | **75%** | **−38,400** | **BUY** |

How each option row is built: max(exit − $638,400, 0) − premium − $8,000 rent. For the 5% option, the profit spread is $112,289, so the hurdle is $56,144. Expected profit of $57,360 clears it. **Signal: BUY via the 5% option.** The option caps the loss while keeping the upside, which an outright purchase can't do.

**One quarter later, HOLD.** Gold rose 20%, so land is at $273/acre.
- **Exercise and resell now:** $273 × 3,200 × 0.95 − $638,400 = **$191,520**.
- **Hold value:** the remaining scenarios are gold −15%, +3% and +20% (P 0.25, 0.5, 0.25). They give exercise values of $4,788, $228,866 and $440,496. Holding is worth **$225,754**.
- Selling now is worth less than holding, so the signal is **HOLD.**

**Then a swarm shock, SELL.** The swarm's "state raises gold tax" runs turn buyers cold, and the probabilities shift to 0.5, 0.4 and 0.1.
- Holding drops to $137,990.
- Selling now beats holding by $53,530, which exceeds the margin of 0.25 × $146,033 = $36,508.
- **Signal: SELL.** Assign the option or exercise and resell.

In the real engine these numbers come from thousands of paths across five families, and the swarm's weight is capped. The example only shows that the rules give the right answers on a case simple enough to check by hand.

## How we prove it works

- **Time-forward replay.** Freeze the clock in the past and replay quarter by quarter, using only data available at each point.
- **Spatial cross-validation** by blocks of 25–50 km or by district ([Roberts et al. 2017](https://www.biometrie.uni-freiburg.de/mitarbeiter/dormann/roberts-et-al-2017-ecography.pdf)). Random splits flatter models on map data.
- **Purged time splits.** Training and test periods never overlap.
- **Metrics:**
  - land-value error and range coverage
  - probability accuracy (Brier score)
  - backtest profit, Sharpe ratio and worst drawdown
  - [deflated Sharpe ratio and the probability of backtest overfitting](https://papers.ssrn.com/abstract=2326253), with a target below 0.2
- **Baselines to beat:**
  - never buy
  - buy-and-hold gold
  - "buy if value > asking price", with no costs or risk
  - nearest to known gold
  - the swarm alone
- **Invariant tests:**
  - a higher gold price never makes BUY less attractive
  - higher costs never make it more attractive
  - no time left means no waiting value
  - a neutral swarm changes nothing
  - a failed gate always gives SKIP
- **Stress tests:**
  - gold −30%
  - a fee rise like 1993's
  - a federal withdrawal
  - a swarm that is wrong
  - time to sell doubled

  For each, we show which signals flip.

The honest limit, corrected: claim-activity prediction against the dated claims proves **activity** forecasting only. It can't establish contract value or profit. Monetary claims need priced outcomes (held-out deals, realised cash flows), and Alaska transfer needs Alaska outcomes. Activity, monetary and decision results are validated and reported separately. No profit is guaranteed.

## Build order for the deadline (Sunday 12:00)

| Tier | Contents |
|---|---|
| 1, must demo | Time-safe data loading; GBM and bootstrap gold paths; land value (surface + geology option); purchase and option contracts; gates; BUY/HOLD/SELL/SKIP with the dollar breakdown; one time-forward backtest against baselines; Tok Site A vs B case study |
| 2 | Hedonic model, Arjin's demand input, swarm fusion, assignment/broker contract, risk limits and sizing, least-squares Monte Carlo |
| 3 | Regime switching, Hawkes rush timing, contract for deed, royalty and earn-in, overfitting statistics, Jev features |

## Open questions

- Is brokering for others legal for us? Commissions may need a real-estate licence, and assignment rules vary by state. **Unverified; check NV, AZ and AK before pitching the broker route.** This is not investment or legal advice.
- Alaska's current claim rent, after its 10-yearly CPI revision, is unverified.
- The BLM Alaska federal claims service was down on 24 Oct 2026. Native corporation land at Tok is not checked yet.
- Does Jev early access exist for the team?
