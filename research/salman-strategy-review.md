# Review of Salman's gold-land strategy

24 October 2026. Owner: Amit for direction and acceptance. Scope: read-only review of the pushed strategy and its integration with the existing evidence and swarm plans. No application implementation, external messages, publication or merge.

## Sources and status

- [Salman's strategy](https://github.com/amitvijapur/oxhack-2026/blob/3a84a2ce77644521229bd1f4d61fea03c7ee1635/research/algorithm.md), branch `strategy-algorithm`, commit `3a84a2ce77644521229bd1f4d61fea03c7ee1635`, authored by RcodeAi / iloveclouduk. One added 487-line document, no application code or tests, and no PR at discovery.
- [Muhd's swarm plan](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-swarm-plan.md), pinned to the main commit checked during review.
- [Current gold evidence](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-evidence-results.md) and [evidence contract](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-evidence-contract.md): Tok River stream-sediment measurements, A33/B34, with no evaluated land matches or contract prices.

## What Salman proposes

The product becomes a land-contract decision system. Gold scenarios, geology, claim demand and swarm views feed a valuation layer, which compares contract structures and returns BUY, HOLD, SELL or SKIP with an explanation. TIME appears through expiry, waiting, holding costs and time to find a buyer. NV/AZ supplies the proposed historical calibration; Tok River supplies the live evidence case study.

The useful architectural choices are separation of forecasts from a deterministic decision engine, operation without the swarm, explicit provenance, uncertainty, abstention and baseline comparisons. The document also correctly acknowledges the missing contract prices and geography mismatch. These are design requirements and proposed methods, rather than completed models or measured results.

## Material findings

### 1. Define a monetary valuation before using NPV or profit probabilities

Strategy lines 160–173 propose `Area × KilburnScore × OptionFactor`, with the option factor taking a Black–Scholes call form on gold price. As written, area times a dimensionless geological score times dollars per ounce does not yield dollars per property. A calibrated monetary base per area, or another justified economic mapping, is missing. Stream-sediment assays do not supply recoverable gold quantity, extraction costs or property cash flows.

The surface floor also needs to depend on the rights actually conveyed. A generic pasture-land value cannot automatically floor the value of an unpatented mineral claim. BLM distinguishes a mining claim's mineral-development rights from exclusive surface rights. See [BLM's claim definition](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims).

The cited CIMVAL code reinforces the need to select an approach appropriate to the property stage: Table 1 lists market and cost approaches for exploration properties; Table 2 classifies real options under income approaches and geoscience factors as secondary. The citation does not establish the proposed hybrid formula. See [CIMVAL 2019, PDF pages 18–19](https://mrmr.cim.org/media/1135/cimval-code-november2019.pdf#page=19).

### 2. Keep activity prediction and contract-return validation separate

Lines 383–386 allow realised value change to be measured using priced resales, claim transfers or nearby staking/option activity. Priced comparable transactions can support a value target. Transfers without prices and nearby staking measure different events. A successful claim-burst forecast cannot establish contract profitability, dollar NPV or realised strategy returns.

Separate the targets and their evaluation. Historical claim activity may be evaluated as an activity forecast. Contract returns require actual cash-flow/price outcomes and ownership histories, including costs and unavailable observations. The proposed 40–100-deal comparable collection is still a dependency, and will need comparable rights, stages and contract terms. Pooling NV/AZ does not itself demonstrate transfer to Alaska without relevant held-out outcomes there.

### 3. Freeze one swarm-to-solver target and time horizon

| Interface | Current proposal |
| --- | --- |
| Muhd's output | Five-day expected gold-price movement, daily stakeholder sentiment and policy/political scenarios |
| Salman's input, lines 229–242 | Monthly probabilistic views, an expected percentage change and run dispersion |
| Salman's decision model, lines 302–305 | Quarterly steps over three to five years |

Specify the forecasted variable, units, as-of time, horizon, evidence references and mapping into each scenario. A five-day gold-price opinion is not already a multi-year land-value forecast. Repeated swarm runs measure variation among generated outputs; they do not alone calibrate real-world probability or justify long-term persistence.

For the demo, reviewed low/base/high scenario assumptions can pass through the adapter explicitly. Typed extraction validates structure; it does not establish truth or calibration.

### 4. Make Tier 1 executable with the inputs available

Lines 363–369 still require monetary property valuation, purchase and option contracts, and a frozen-clock backtest. Contract prices, terms and outcomes remain requested data. Deferring advanced estimators does not remove those dependencies. The tier also needs self-contained rules: its two proposed scenario families cannot satisfy the earlier four-of-five robustness rule without an explicit simplified policy.

The smallest reviewable build should establish one region, one time horizon and one contract instrument first. Use real A/B evidence as context and explicit assumed contract terms and terminal-value scenarios where market evidence is unavailable. Calculate the payoff, time/cost constraints and explanation, then show how changing the deadline or adverse assumptions changes the action. Score simulated policy outcomes as scenario results. Add empirical contract-return claims only when priced outcomes support them.

## Suggested first handoff

Salman supplies a small input/output contract and a hand-calculated example before implementing the model stack. Muhd maps his outputs into the same target and horizon. The display consumes a saved decision with its action, scenario IDs, value units, costs, timing, gate status and reasons. Unknown real rights remain unknown; any hypothetical rights fixture is labelled separately.

The first acceptance check is an explained decision that reproduces the hand calculation, handles insufficient information, and changes correctly under a deadline/cost scenario. A full historical valuation backtest is a separate milestone with its own data requirements.

## Verification and limits

An independent reviewer separately confirmed the valuation-unit gap, activity-versus-return target mismatch, incompatible horizons and unresolved Tier 1 dependencies. Discovery verified the exact branch/commit and downloaded file Git blob hashes. Official BLM and CIMVAL sources were checked for the rights and valuation-stage distinctions above. The document's full bibliography and every market statistic were not audited. No implementation exists in this push to execute, so no runtime or predictive-performance claim is made.
