Gold land algorithm foundation (Salman): research-backed design

 Context

 Team flow: data providers → swarm (teammates: MiroFish-style multi-agent simulation of how
 society, government, buyers and funds react to changes) → swarm prediction. Our foundation
 algorithm combines that prediction with land data and gold data and outputs
 BUY / HOLD / SELL / SKIP for US gold-prospective land (state TBC, likely NV/AZ). The
 main focus is land contracts. Every position, whether entered or exited, and whether we buy,
 sell or broker, is a land contract. So the engine values contracts and their terms, not just
 land. The user asked
 for a deep, research-backed, exceptional foundation, with no application code in this phase.
 Jev (TypeSafe System One) is to be used where it fits.

 AGENTS.md requires available_at timestamps, chronological evaluation, fitting only on
 training data, and baselines.

 Data inventory (verified on GitHub, 24 Oct 2026)

 ┌───────────────────────────────────────────────┬──────────────┬──────────────────────────────────────────────────────────────────────────┬─────────────────────────────────┐
 │                    Source                     │   Owner /    │                       What it gives the foundation                       │             Limits              │
 │                                               │    where     │                                                                          │                                 │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ Tok River, Alaska gold packs (DGGS RDF        │              │ 67 stream-sediment locations (A = 33, B = 34). Au ppm from fire          │ One snapshot (2016). Sediment   │
 │ 2016-10). Main, PR #20, release               │ Amit         │ assay/ICP-MS, censoring preserved, one 1.1 ppm retest. samples.geojson.  │ points, not deposits. No land   │
 │ gold-evidence-v1                              │              │ land_match_template.csv: all rows not_evaluated, contract fields blank   │ records joined yet              │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ NDOM All States Historic Claims, plus current │              │ 2.4M dated claims in NV and AZ, 1850 to March 2025, with location and    │ Located only to section or      │
 │  NV and AZ claims. Branch                     │ Arjin        │ closed dates, claim type, and location to the section                    │ quarter-section level. No       │
 │ arjin/nv-az-claim-data, not merged            │              │                                                                          │ prices                          │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ USGS MRDS gold sites (NV 7,787; AZ 5,112),    │ Arjin        │ Geology and "off-property" factors (Kilburn)                             │ MRDS frozen since 2011,         │
 │ USMIN mine symbols, mining districts          │              │                                                                          │ duplicates                      │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ World Bank monthly gold price, Jan 1960 to    │ Arjin        │ Gold scenarios, elasticity, lags                                         │ Monthly                         │
 │ Sep 2026 ($4,319/oz in Sep 2026)              │              │                                                                          │                                 │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ Magnetic, radiometric and gravity grids;      │ Arjin        │ Optional geology features                                                │ Some need manual download       │
 │ ASTER alteration; SGMC                        │ (links)      │                                                                          │                                 │
 ├───────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────────────────────────────────┼─────────────────────────────────┤
 │ BLM fees ($274 new claim, $200 per claim per  │ land-pack/06 │ Carry costs                                                              │ Parameter                       │
 │ year)                                         │              │                                                                          │                                 │
 └───────────────────────────────────────────────┴──────────────┴──────────────────────────────────────────────────────────────────────────┴─────────────────────────────────┘

 Two gaps remain:
 1. Geography mismatch. The gold assays are in Alaska, but the dated claims history is
    NV/AZ.
 2. No land-contract prices or terms anywhere yet. Claims activity gives dated demand
    labels, not contract prices.

 Arjin's planned model (claim bursts per 1-square-mile cell over the next 12 months) is exactly
 the foundation's demand layer. The foundation consumes it as an input, as it does the swarm
 prediction.

 Recommended region design. The engine itself is region-agnostic.
 - Calibrate and backtest on NV/AZ, which is data-rich and dated: claims activity as the
   demand label, MRDS for geology, World Bank gold.
 - Run Tok River A/B as the live case study: the real Au assays feed the Kilburn anomaly
   factor, and the Alaska land records are matched through Amit's land-match contract once they
   are pulled.

 Swarm prediction ─► [Jev: report → typed SwarmView] ─┐
 Land data ──────────────────────────────────────────┼─► FOUNDATION ─► BUY/HOLD/SELL/SKIP
 Gold data ──────────────────────────────────────────┘                 + waterfall, drivers, confidence

 Decisions taken (user priority: accuracy and strength of the foundation)

 - Region: both. Calibrate and backtest on NV/AZ, the only place with dated history, which is
   needed for accuracy. Tok River A/B is the live case study on real Au assays.
 - Contract value: real and recent data only. No invented prices in results. Build a
   land-contract comparables table (target 40–100 deals, 2015–2026, gold, NV/AZ/AK) from
   primary disclosures:
   - Junior-miner press releases and filings (Newsfile, GlobeNewswire, SEDAR+, EDGAR) on
     option and earn-in agreements, claim purchases and royalty sales. Fields:
     - date
     - location (district or county)
     - number of claims and acres
     - cash payment schedule, shares, work commitments
     - royalty (NSR %) and buyback
     - stage
     - counterparty
     - source URL

     These are real land contracts with their terms. The existing Cruz deal (about $4k per
     claim, 2025) shows the format.
   - Recorded transfers where accessible: AZ affidavit sales from county recorders, NV county
     assessor sales, BLM transfer-of-interest filings.
   - Current listings (ICMJ, LandWatch, Lands of America), labelled asking price, not sale
     price. Respect site terms.
   - USDA NASS land values as the surface floor.
 - Where accuracy is proven:
   a. Demand prediction against real dated claim activity, NV/AZ walk-forward.
   b. Contract-value model checked against held-out real deals (leave-one-out, MAPE, interval
      coverage).
   c. Decision backtest using both.

   Anything not backed by real data is labelled as an assumption in the output.

 Combining regions without weakening the algorithm: hierarchical pooling

 The Alaska pack alone (67 samples, one 2016 snapshot, no dates, prices or outcomes) can't train
 or validate anything. It answers where the evidence is. NV/AZ dated history answers how
 and when land demand and value respond. The foundation uses a multilevel (partial-pooling)
 model:

 - Global layer, learned from NV/AZ:
   - gold-price elasticity and lags
   - demand response to price and fees
   - the effect of distance to known gold
   - contract-term effects
 - Regional layer: each region (NV, AZ, AK) gets its own random-effect offsets on the
   intercept and the key slopes, covering land tenure (federal vs state), claim system and
   access. A region with little data shrinks toward the global layer instead of overfitting.
 - Site evidence: Tok River Au assays feed the Kilburn anomaly and on-property factors for
   sites A and B directly. This is real measured evidence.
 - Domain guard: a distance-to-training-data check, such as Mahalanobis distance on the
   features. Out-of-domain → wider intervals → SKIP gate. Report region-level uncertainty
   separately.
 - Validation: leave-one-region-out and time-forward tests show the pooled model transfers.
   Compare against models fitted per region, which proves the pooling helps rather than hurts.

 Design principles (why this is strong)

 1. Separate prediction from decision. The models predict value distributions. A
    deterministic decision layer turns them into actions, so any model, including the swarm,
    can be swapped.
 2. Uncertainty everywhere. Every number is a distribution or interval, never a point.
 3. Earned trust. Each input's weight comes from calibration on held-out outcomes. Unproven
    inputs are capped.
 4. Time integrity. Use only rows with available_at ≤ decision time, which structurally
    prevents look-ahead bias.
 5. Robust over clever. A decision must hold across several model families. HOLD and SKIP
    are the defaults, because land is illiquid and costly to trade.
 6. Explainable. Every signal comes with a dollar waterfall and its top drivers.

 Rejected as the core: one end-to-end ML model (sales data too thin, overfits); Jev or an LLM
 deciding directly (not auditable, calibration unproven); an RL agent (no market simulator, too
 little history).

 Layer 1: Gold scenario ensemble

 - Realised gold volatility is about 16–17% a year (WGC). Volatility shocks have a half-life of
   about 1.6 months.
 - Use five scenario families, N ≈ 5,000 paths each, monthly or quarterly steps:
   - (a) GBM with σ ≈ 0.16, as the baseline
   - (b) mean reversion of the log real price (Ornstein–Uhlenbeck); Erb & Harvey 2013, whose
     forecast failed, so this is one family only
   - (c) two-state Hamilton regime switching between calm and stress
   - (d) stationary block bootstrap of real history (Politis & Romano; blocks of about 1–3
     months)
   - (e) a swarm-tilted family (see Layer 4)
 - Don't hard-code a real-yield factor. The inverse link between gold and TIPS yields
   (FRED DFII10) broke after 2022, as central-bank buying took over. Drivers are reported as
   diagnostics, not as structural constraints.
 - Data: World Bank Pink Sheet monthly gold from 1960. LBMA was removed from FRED in 2022 and
   now needs a licence.

 Layer 2: Land value: the land ↔ gold relationship

 Value = max(surface floor, mineral option value) − PV(holding costs)

 - Surface floor S. USDA NASS land values (2025 Mountain region: pasture $946/acre), refined
   by a hedonic model where sales exist.
 - Mineral option value O follows exploration valuation practice (CIMVAL 2019: at the
   exploration stage only the cost and market approaches apply) and real options (Brennan &
   Schwartz 1985; Paddock–Siegel–Smith 1988; Moel & Tufano 2002 on 285 gold mines):
   - O = Area · KilburnScore · OptionFactor(G_real, σ, r, δ, K, T)
   - KilburnScore = on-property × off-property × anomaly × geology ratings, each 0.1–10
     (Kilburn 1990). Built from SGMC lithology, distance to MRDS/USMIN gold occurrences, and
     district membership.
   - OptionFactor has the Black–Scholes call form on the real gold price (DFII10 for r,
     low δ for gold, K = development-cost proxy). Value rises with gold price, volatility and
     time, and falls with cost and carry.
 - Hedonic spatial model for parcels with sales (county recorder or assessor sales, patented
   claims):
   - ln P = ρ·W·ln P + β_g·ln G_real(t−L) + γ′Geo + λ·ln ClaimDensity + θ·Policy + τ_t + ε
   - SAR/SEM beat OLS for rural land. τ_t is a thin-market time index (Francke-style local linear
     trend); only 1–2% of land trades each year, so classic repeat-sales doesn't work.
   - Gold elasticity β_g: prior about 1–2 (gold miners move 1–2.5× gold; Tufano 1998, Baur
     2014). Lag L about 6–18 months, because land reacts slowly. Both are fitted, not assumed.
   - Robustness alternative: gradient boosting with monotonic constraints (value never falls
     when gold rises) and quantile outputs, explained with TreeSHAP.
 - Intervals: rolling or weighted split-conformal prediction (prices aren't exchangeable over
   time).
 - Market-approach check: once a resource exists, compare against $/oz deal comparables
   (about 2017 range: A$13–46 EV/oz for explorers, A$69/oz in M&A). These figures vary over time
   and are refreshed from gold deals.

 Layer 3: Demand and activity (when the land is wanted)

 - Δln Claims_t = a + b·Δln G(t−L) − c·ΔFee_t + d·SwarmDemand_t + e
 - Evidence:
   - Nevada says claim counts are "usually proportional to the price of gold".
   - The 1993 maintenance fee cut Nevada claims by 43%.
   - Claim transfers nearly tripled in 2010 at about $1,800 gold.
   - No peer-reviewed study exists, so this is our own measured contribution.
 - Optional upgrade: a Hawkes process (self-exciting staking spreading in space and time) for
   rush timing.
 - Claim momentum is a leading indicator. It feeds the demand term of the option value and the
   bid at exit.
 - Data: BLM MLRS mining claims, both not-closed and closed (location only to the
   quarter-section), and Nevada Division of Minerals per-section density and fees (refreshed
   quarterly).

 Layer 4: Swarm prediction fusion (Jev used here)

 Scope: we do not build or run the swarm. Teammates own it end to end. Our foundation only
 consumes its prediction through a published input contract. Our side has three jobs:
 1. the input contract
 2. validation and an optional Jev extraction step, used only if their output is a text report
    rather than typed fields
 3. the fusion maths

 The engine must run fully without the swarm, and say so in its output.

 - Evidence on agent forecasters:
   - LLM crowds can match human crowds (Schoenegger 2024), but they have an acquiescence or
     upward bias and share one base model, so their information overlaps.
   - MiroFish (AGPL-3.0, built on OASIS) outputs a natural-language report, not
     probabilities. Its accuracy is unpublished and results vary from run to run.
 - Jev's role:
   - Turn each swarm report into a typed SwarmView, using Choice and Score questions with
     probabilities.
   - Act as a guardrail: is the report consistent, and does it cite the seed facts?
   - Turn news and BLM/Federal Register notices into typed policy events.
   - Recalibrate its probabilities with Platt scaling on our own labels.
   - Keep a rules-based fallback in case early access is unavailable.
 - Input contract, to share with the swarm team now:
 SwarmView { region_id, horizon_months, as_of, scenario_id, seed_hash, llm_model, n_runs K,
             p_up, p_flat, p_down, expected_change_pct (median of runs), run_std_pct,
             drivers{policy, buyer_demand, fund_flows, gold_sentiment} ∈ {-1,0,+1} + prob,
             consistency_ok, evidence_count }
 - Fusion (Black–Litterman view):
   - Quant prior: μ_q, σ_q from Layers 2–3, combined with equal weights (the forecast
     combination puzzle: estimated weights add noise).
   - Swarm view: q = ln(1+expected_change) − bias.
   - View uncertainty: Ω = run_std²/K + κ·σ_q², with κ = 3 while unproven. That caps the swarm
     weight at about 25%.
   - Posterior: μ = w·μ_q + (1−w)·q, with w = σ_q⁻²/(σ_q⁻² + Ω⁻¹).
   - Drop the view if consistency_ok = false or K < 3. Never extremize.
   - With ≥ 20 resolved cases, recalibrate with Platt scaling and Brier decomposition, then let
     κ fall.

 Layer 5a: Land contract layer (the core product)

 Layers 1–4 give the distribution of the underlying land value. This layer values each
 contract written on that land. Each contract type is a payoff on the same simulated value
 paths, so all types are compared on one scale.

 ┌───────────────────────────────────────────────────────┬────────────────┬───────────────────────────────────────────────────────────────────────────┬──────────────────────┐
 │                       Contract                        │    Our role    │                           Payoff / value driver                           │     TIME element     │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Purchase agreement (fee simple or patented claims;    │ Buyer, then    │ V_exit − price − closing costs − carry                                    │ Closing date,        │
 │ BLM claim purchase by quitclaim)                      │ seller         │                                                                           │ holding period       │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Option to purchase                                    │ Buyer of the   │ Premium paid for the right to buy at strike K before expiry T. This is    │ Expiry T             │
 │                                                       │ option         │ literally a real option: max(V_T − K, 0) − premium                        │                      │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Assignment / wholesale (put land under contract,      │ Broker         │ Assignment fee − earnest money at risk, × P(an end buyer is found before  │ Closing deadline     │
 │ assign before closing)                                │                │ closing)                                                                  │                      │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Broker / matchmaking (no position)                    │ Broker         │ Commission × P(deal closes); no land risk                                 │ Time to match        │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Land contract / contract for deed (seller-financed    │ Buyer or       │ Instalment cash flows, interest rate, default risk; title passes at the   │ Instalment schedule  │
 │ instalments)                                          │ seller         │ end                                                                       │                      │
 ├───────────────────────────────────────────────────────┼────────────────┼───────────────────────────────────────────────────────────────────────────┼──────────────────────┤
 │ Mineral lease / royalty or option-to-earn-in          │ Lessor or      │ Lease payments + royalty × P(development)                                 │ Lease term, work     │
 │                                                       │ assignor       │                                                                           │ commitments          │
 └───────────────────────────────────────────────────────┴────────────────┴───────────────────────────────────────────────────────────────────────────┴──────────────────────┘

 Contract terms are first-class inputs:
 - price or strike
 - earnest money or premium
 - due-diligence period (a free option to walk away)
 - closing or expiry date
 - whether the contract can be assigned
 - financing terms
 - contingencies
 - what is conveyed

 Critical US check: is the mineral estate split from the surface? A contract may convey only
 the surface. Check it with the BLM split-estate rules and the deed. If the mineral rights are
 unclear → SKIP.

 Broker economics answer "can we find a buyer before the deadline?". That probability comes
 from the demand layer (Layer 3) plus the swarm's buyer and fund sentiment. It is a natural TIME
 story: a contract is worth something only if it is placed before it expires.

 Layer 5: Decision engine (BUY / HOLD / SELL / SKIP)

 The actions apply to contracts:
 - BUY = enter a contract as the buyer or option holder, or take a contract to assign
   (broker).
 - SELL = sell, assign or exercise-and-resell a contract we hold.
 - HOLD = keep a contract in force (pay carry or instalments, wait).
 - SKIP = don't enter.

 For each opportunity the engine values every contract structure that is feasible and picks
 the best one. For example: "BUY via a 12-month option, not an outright purchase, because the
 option caps the downside and the value is in its volatility."

 Method. Treat each parcel as an American option. Owning it is an option to sell, with carry
 as a negative dividend; not owning it is an option to buy. Solve with least-squares Monte
 Carlo (Longstaff–Schwartz 2001), using quarterly steps over 3–5 years and a basis on gold
 price, model value and time left.

 Costs.
 - Buy and sell costs c_b and c_s, about 3–8% each.
 - Carry for BLM claims: $200 per claim per year (staking a new claim costs about $274).
 - Fees are reviewed every 5 years, so they are kept as parameters.

 Round-trip costs create a wide no-trade band (Davis–Norman 1990), so HOLD should be the most
 common action. Each exit route is valued, and the best route is used for the bid.

 Rules. "Robust" means the condition holds in at least 4 of the 5 scenario families.

 - BUY (not owned): all of these must hold:
   - E[NPV_buy] > max(value of waiting, hurdle h = 0.5·σ_NPV)
   - P(NPV > 0) ≥ 0.60
   - CVaR₉₅ ≥ −L_max (Rockafellar–Uryasev)
   - the decision is robust across scenario families
   - the parcel is inside the model's domain

   Size the position at ¼–½ Kelly, under a portfolio cap on gold beta (Σ w·β_gold ≤ cap) and a
   portfolio CVaR limit.
 - SKIP (not owned): if any of these hold:
   - any BUY condition fails
   - the parcel is outside the model's domain, or has fewer than N comparable sales
   - the title is unclear or the geology score is low
   - the interval is wider than W_max
   - the swarm and the model disagree in sign while the swarm weight > 0.5
   - the portfolio caps are full
 - SELL (owned): if either holds:
   - Bid·(1−c_s) − C_hold > 0.25·σ, and this is robust
   - the portfolio CVaR limit is breached; then sell the parcel with the highest marginal CVaR
     first
 - HOLD (owned): otherwise. Re-evaluate every quarter and at each BLM renewal (1 September).

 Explanation of every signal:
 - a dollar waterfall: model value − price − costs − PV(carry) + waiting/option value − CVaR
   penalty ± swarm adjustment
 - top SHAP drivers
 - how many scenario families agreed
 - thresholds plotted against the gold price

 Layer 6: Validation (the HRT and TIME proof)

 - Walk-forward. Freeze the clock in the past and replay quarterly, using only data known
   at each point.
 - Cross-validation. Purged and embargoed CV over time (López de Prado). Spatial block CV
   over districts or a 25–50 km grid (Roberts et al. 2017).
 - Metrics:
   - land model: MAPE and interval coverage
   - probabilities: Brier score and reliability
   - strategy: backtest NPV, Sharpe ratio, maximum drawdown, Deflated Sharpe Ratio and
     Probability of Backtest Overfitting (target < 0.2)
 - Baselines: never buy; buy-and-hold GLD; naive "model value > asking price" with no costs
   or options; nearest-to-known-gold; the swarm alone.

 Gaps closed: what makes it strongest (in priority order)

 1. Tiered scope for the deadline (Sunday 12:00 cutoff). Without this the design is too big.
    - Tier 1 (must demo):
      - data/time integrity
      - GBM + block-bootstrap gold scenarios
      - land value (surface floor + Kilburn option value)
      - two contract types: purchase and option
      - BUY/HOLD/SELL/SKIP rules with the waterfall
      - one frozen-clock backtest against baselines
    - Tier 2:
      - the hedonic spatial model
      - the demand/claims model
      - swarm fusion
      - the assignment/broker contract
      - CVaR and Kelly sizing
      - LSM optimal stopping
    - Tier 3:
      - regime switching
      - a Hawkes rush model
      - the contract for deed and the lease/royalty contract
      - DSR/PBO statistics
      - Jev features
 2. Ground truth / labels. Define what a "good contract" was historically, or nothing can be
    validated. Label: realised value change of land under contract within horizon H, measured from
    recorded resales (repeat transfers), claim transfers, or later staking or option activity
    nearby. Each label carries its available_at.
 3. Hard-constraint gates (due diligence → automatic SKIP). These are checked before any
    valuation:
    - clear title and chain of title
    - mineral estate not split from the surface, or mineral rights included
    - legal access (not landlocked)
    - unpatented claims: maintenance fees paid, no overlapping claims
    - federal withdrawals and protected or sage-grouse areas
    - abandoned-mine and environmental liabilities
    - water rights (Nevada)
    - contract assignable (needed for broker deals)

    Gates are deterministic and auditable, and show up in the explanation.
 4. Legal and licensing check for the broker route. Earning commissions for brokering others'
    land may require a real-estate licence. Wholesaling/assignment rules vary by state, and BLM
    claim transfers have filing requirements. Verify for NV/AZ before pitching the broker route
    [unverified; check]. Add a "not investment or legal advice" disclaimer.
 5. Liquidity and time-to-close. Land takes months to sell. Model a time-to-buyer
    distribution (from days-on-market and transfer frequency) and apply it to every exit, not
    only broker deals. Selling slowly is the main hidden cost, and it is a core TIME element.
 6. Cold start without data. Until Amit's data arrives, run the engine on a clearly labelled
    synthetic fixture whose parameters come from published figures (gold volatility, BLM fees,
    NASS values, Kilburn example). It is never presented as real results. Real data replaces it
    through the same input contracts.
 7. Stress tests and sensitivity.
    - A tornado chart of the decision against each input.
    - Named stresses: gold −30%, a fee increase (like the 1993 −43% shock), a federal withdrawal,
      the swarm wrong-signed, and a 2× longer time-to-sale.
    - Show which signals flip.
 8. Invariant (metamorphic) tests. These guard the engine's correctness:
    - a higher gold price never lowers the value of a BUY
    - higher costs never raise it
    - zero time left removes the waiting value
    - an uninformative swarm leaves the decision unchanged
    - a failed gate always gives SKIP
 9. Decision-record output contract for the UI and demo teammates:
    - action and contract structure
    - expected value and its interval
    - P(profit) and CVaR
    - the waterfall
    - top drivers
    - gate results
    - swarm weight used
    - input versions and seeds

    This makes every run reproducible.
 10. Judging alignment.
     - HRT: clean data, measured prediction, decision.
     - TIME: expiries, closing deadlines, lags, time-to-sale.
     - Citadel: the hand-built contract-valuation and decision engine.

 Data to request (priority order; the land data is the critical gap)

 1. Dated land sale prices: county recorder or assessor sales (AZ affidavits per county; NV
    per county: Elko, Eureka, Lander, Nye), and patented claim sales. Listing sites (ICMJ,
    LandWatch) give asking prices only, so label them as such.
 2. BLM MLRS mining claims, both not-closed and closed (for history), and the Nevada Division
    of Minerals open data.
 3. Gold: World Bank Pink Sheet monthly. Rates: FRED DFII10 (check the dollar series
    ID).
 4. Geology: USGS MRDS / USMIN gold occurrences, SGMC (DOI 10.5066/F7WH2N65).
 5. Gold deal comparables: 20–50 deals from press releases, with date, $, ounces and stage.
 6. Surface floor: USDA NASS Land Values.
 7. Land contract data (central):
    - Recorded transfers: deeds, quitclaims, memoranda of option or lease, from county recorders.
    - BLM claim transfer-of-interest filings.
    - Listings with their terms (price, owner financing, option or lease offered).
    - Any broker or assignment fee comparables.
    - Contract-term distributions: typical earnest money, option premiums, closing periods.

 Open questions for the user: target state(s); Jev early-access availability; when Amit's land
 data lands in the repo (re-check it then).

 Execution once approved (docs only, no code)

 1. git fetch, then git switch -c salman/gold-algorithm-foundation origin/main. The current
    checkout is the stale research/lodestar-land-buy, with a clean tree.
 2. Write research/gold-land-algorithm-foundation.md with this design in the repo's
    plain-English research style, with source links and [unverified] flags kept. Write
    research/swarm-view-contract.md with the SwarmView contract for the swarm team. Add a task
    entry to tasks/todo.md (owner: Salman).
    2b. Research and save research/gold-contract-comparables/contracts.csv plus a README: real
    gold land-contract deals (options, earn-ins, claim purchases, royalties) from primary press
    releases and filings, one source URL per row, and a quality flag. Same format and rules as
    lithium-data/land-pack/05_deal_comparables.csv. Every row is spot-checked against its
    source.
    2c. Write the input contracts for the teammates' outputs the foundation consumes: Arjin's
    claim-burst prediction per cell, Amit's gold packs and land-match rows, and the swarm
    prediction.
 3. Add a hand-checkable worked example, one parcel: inputs → value → waterfall → BUY, then
    a later quarter → SELL. Verify the arithmetic.
 4. Check: git diff --check, and that local Markdown links resolve.
 5. Push the branch, then gh pr create, using the repo PR template. Add no Claude
    attribution (the user's rule). Merge only through the PR after CI passes.

 Verification

 - CI Repository checks and Secret scan pass on the PR.
 - The worked example's numbers check by hand. Every cited figure links to its source or is
   flagged [unverified].
 - When gold and land data arrives, update the data table with real paths and the status of each
   check.
