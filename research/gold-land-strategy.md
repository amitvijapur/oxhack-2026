# Gold land-contract strategy

24 October 2026. Combined strategy v1 for team review. This incorporates Salman's foundation at `ab660a9` and our scoped research. It is a design and handoff specification, not an implemented or empirically validated trading model.

Salman owns the decision engine; Arjin owns claims, contract records and demand modelling; Muhd owns swarm runs; Amit owns measured evidence, frontend and integration. These scopes follow the existing handoffs. This document proposes their shared interface; it does not change another workstream's files.

## 1. Product and first delivery

**Compare ways to enter, hold and exit a specified gold-related contractual interest as time, costs and information change.** Show the selected feasible action, conditional profit/loss, cash required, deadlines and the assumptions responsible for the result. The TIME mechanism is concrete: information arrives, an option expires, fees fall due, and a buyer may arrive too late.

Keep Salman's separation between evidence, forecasting and deterministic decisions:

```text
Measured assays + claim records + contract terms + gold history
                         ↓
       Provenance, rights and information-time checks
                         ↓
       Contract cash-flow scenarios and permitted actions
                         ↓
        Funding, deadlines, risk and decision policy
                         ↓
      Action + dollar ledger + explanation + limitations

Swarm runs → explicit scenario changes → compare with baseline
```

The first delivery is an auditable scenario calculator alongside the real Tok A/B evidence. It compares purchase, purchase option and SKIP using a verified fixture. A later model adds multiple decision dates and HOLD/SELL. The broader programme retains price scenarios, claim-demand prediction, comparable valuation and optimal stopping, with a separate evidence requirement for each.

Every result declares its mode:

| Mode | What it can say |
| --- | --- |
| `evidence_only` | Display measured evidence, claim overlays, comparable terms and missing inputs. No monetary action. |
| `scenario` | Report an action and cash flows conditional on stated contract, market and rights assumptions. These assumptions stay visible beside the signal. |
| `empirical` | Report an estimate supported by held-out outcomes for the stated target and population. This mode remains unavailable until its validation is recorded. |

Real observations and hypothetical contract economics can appear in the same demo, but the UI must distinguish them. A synthetic contract is not an offer on a Tok sample or evidence that the surrounding land can be acquired.

## 2. Current evidence and what it supports

| Input | Current source | Use now | Boundary |
| --- | --- | --- | --- |
| Tok River assays | [Gold evidence results at `75d9bd1`](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-evidence-results.md), 67 stream-sediment samples, A33/B34 | Real Au measurements, qualifiers, provenance and map context | Sediment ppm does not establish ore grade, recoverable ounces, property value or ownership. Preserve censoring and separate retests. |
| Tok state-claim matches | [Arjin's handoff at `9517fc2`](https://github.com/amitvijapur/oxhack-2026/tree/9517fc23379eea77b567af28c17587b273490b0a/research/tok-land) | Current spatial and recorded-status context | State-only coverage; unknown federal/Native land coverage, tenure and availability remain explicit. |
| NV/AZ claims and price history | Arjin's branch, [acquisition code at `4fce36c`](https://github.com/amitvijapur/oxhack-2026/blob/4fce36c0667365a13dcb585167a78085003b969a/research/nv-az-claims/download_claims.py) | Candidate historical activity features and monthly gold scenarios | The reported 2.4 million dated records are not 2.4 million sales or independent return labels. Audit date semantics, duplicates, coverage and vintages before replay. |
| NV/AZ contract catalogue | [Salman's 40 rows at `ab660a9`](https://github.com/amitvijapur/oxhack-2026/blob/ab660a94c3998e9345793987cd7f3342f93848a1/research/gold-contract-comparables/nv_az_gold_contracts.csv) | Real examples of purchase, option, lease, earn-in and royalty terms | Mixed rights, stages, currencies, consideration and dates. These are not 40 comparable completed sales or investment returns. |
| Alaska deal catalogue | Arjin's pinned Tok handoff, ten rows | Local agreement structure and contextual disclosures | Bundled projects, related parties, other commodities and uncertain completion require row-level qualification. |
| Swarm | [Muhd's plan at `75d9bd1`](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-swarm-plan.md) | Planned five-day stakeholder and shock scenarios | The plan and repeated agent agreement do not establish forecast accuracy. Runs must pass the handoff checks below. |

The pinned Tok output has 76 join rows representing 67 unique samples. Deduplicated active state-claim intersections are 2/33 Site A samples and 20/34 Site B samples. That is a useful contrast in recorded land activity. The 30 Site B claims with a 2025 `NTPSTDT` value are a separate window-level count; the meaning of that date field is unconfirmed. Describe these as recorded dates, not verified new staking. A current status cannot be used as a historical feature before it was known. "Outside matched state claims" does not establish available land.

The September 2026 Delta announcement concerns Delta and Helm Bay together, with shares, warrants and contingent milestones in the handoff. It does not price the 13 Delta claims overlapping Site A's sample window, and an announced sale is not confirmation of closing. Do not derive a Tok price floor from that package or from the Alaska antimony option.

### Prepare comparables without inventing labels

Retain all 40 NV/AZ rows as a source catalogue. Add `property_id`, `agreement_id`, `event_id`, `event_type`, `interest_fraction`, `commodity`, `development_stage`, `related_party`, and `completion_status`. Keep amendments and subsequent outcomes linked to the original agreement. AZ-08 and AZ-11 concern the same Gold Chain claims; group such records in evaluation.

Store cash, shares, exploration work, milestones, royalties and buybacks as separate dated and conditional components. Include original currency and any dated FX/share valuation separately. Work expenditure is an obligation, not vendor cash. An option's remaining possible payments are not the price of a completed acquisition. A royalty purchase prices a royalty interest, not the entire property.

Keep reported area separate from estimated area. A claim-count multiplier is not a surveyed area and must not silently become a valuation denominator. Rows with unknown share values or currency have incomplete consideration. Salman's pooled per-acre median is descriptive of that selection of disclosures, not a calibrated Tok exit-price estimate.

Split chronology within each row. An agreement date cannot make a later filing's account of completion or termination available years earlier. Preserve each fact's first publication time and original source. `source_quality` and `fit_for_this_valuation` are different fields. The existing [contract research](strategy-amendments/contract-valuation-research.md) gives two primary agreement examples and a normalization approach.

## 3. Value the contractual interest in consistent units

First identify the interest conveyed, ownership fraction, tenure, position, currency and enforceable rights. A mineral claim does not imply surface ownership. Remove the universal pasture-value floor. Surface value enters only if the contract conveys a separately supported surface interest, with compatible valuation and no double counting. [BLM claim guidance](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims).

Use one of three explicit economic inputs:

1. **Executable terms and bids**, with conditions, valid-until time, counterparty and settlement assumptions.
2. **Comparable-based estimates**, after normalizing rights, stage, fraction, date, currency, area and consideration. Report missing terms and selection sensitivity. A small filtered set supports a range of analogues before it supports a fitted price model.
3. **Assumed cash-flow scenarios**, clearly labelled and suitable for the first calculator demonstration.

Do not multiply area, a geological rating and a gold-price option factor and call the result property dollars. Geology remains evidence until a supported monetary mapping exists. CIMVAL identifies market/cost approaches for exploration properties and treats geoscience-factor valuation as a secondary method; the citation does not validate the proposed hybrid formula. A development-option model needs an economic underlying project, resource quantity, development costs and rights duration. Those inputs are absent from sediment assays. [CIMVAL code](https://mrmr.cim.org/media/1147/cimval-code-november2019_may2022.pdf); [Damodaran's natural-resource option material](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/opt.html).

For policy `pi` and scenario `s`:

```text
NPV(pi,s) = sum over dates t of D(t) × CF(pi,s,t)
D(t) = (1 + r)^(-days_since_decision(t)/365), r > -1
```

All `CF` amounts refer to the same interest and currency. Receipts are positive and payments negative. Record the rate and convention; keep nominal cash flows and rates consistent. A different documented discount convention is acceptable. Recompute remaining cash flows at later decisions; retain sunk amounts separately for total strategy P&L.

The ledger contains entry consideration, transaction fees, carry, required work, financing, exercise payments, conditional milestones, exit receipts and exit costs. Record payer, recipient, date, condition and whether each item is already included in terminal value. Charge each expense once. A royalty requires its defined revenue base and timing; it is not a standalone upfront cash amount.

Waiting value is the difference between continuation and immediate-action values in the decision model. It is not an extra credit on top of an already optimized payoff. Show a risk measure beside NPV unless the chosen objective explicitly subtracts a defined risk penalty. Likewise, show a swarm change as the difference between two runs, not an extra ledger payment.

## 4. Forecast and scenario modules

### Gold prices

Start with GBM and a block bootstrap if an economic scenario mapping needs price paths. Fit parameters using data available at the cutoff; report source frequency, training interval, assumptions and sensitivity. Do not hard-code a published average volatility as a fitted project parameter. Mean-reverting real-price and regime-switching models remain optional extensions. A real-price model also needs a documented inflation series and conversion back to nominal cash flows.

Gold returns and contract returns have different units and economics. A miners' equity beta does not estimate undeveloped-claim elasticity. Any initial elasticity or 6–18-month lag is an explicit assumption until fitted to the relevant target. Monthly observations cannot resolve a five-day return.

A swarm-adjusted version of a baseline is a scenario variant, not another independent vote for robustness. Record baseline family IDs separately from variants and seeds.

### Claim activity and geographic transfer

Retain Arjin's proposed one-square-mile, twelve-month claim-burst model. Freeze the burst definition, geography, count unit, date semantics, coverage and outcome-resolution rule before fitting. Compare with trailing-count or historical-rate baselines.

Keep Salman's partial-pooling idea as a candidate for **the same activity target** across regions. Compare pooling with separate regional models in forward-time and held-out-region tests. NV/AZ data can test NV/AZ transfer; it cannot establish Alaska performance without suitable Alaska outcomes. Wider model intervals alone do not prove a domain check works.

Claims predict recorded activity. They do not directly identify buyer-arrival probability, time-to-sale or exit price. Those require separate monetary/liquidity outcomes or labelled scenario assumptions. Do not learn contract-term effects from a claims-only table.

### Swarm

Keep Muhd's stakeholder groups, daily cold/warm/hot reports, variants, seeds, policy narratives and shock runs. The first integration uses them to construct **labelled alternative scenarios**. It must work when no swarm run is available.

- Define the exact gold instrument, source, start/end timestamps and return convention. Use `gold_return_fraction`, where `0.05` means +5%, and leave it null if no numerical forecast is supplied.
- Keep region, five-day forecast horizon, contract expiry and settlement dates distinct. Do not silently translate a Nevada run into an Alaska claim result.
- Retain raw posts, evidence references, model/prompt/config versions, extraction method, unsupported claims and missing fields. Grounding checks indicate traceability, not whether the future will occur.
- Aggregate within variant and shock only. Report seed dispersion as stability. Three seeds can be a repeatability requirement, but three agreeing seeds do not establish economic confidence. A one-off shock can still be shown as a stress scenario, with repeatability unmeasured; do not silently discard Muhd's single-run shocks.
- Every monetary effect names an assumption and mapping: event → affected field → magnitude → onset → duration → scenario. For example, an assumed one-day closing delay can make an option infeasible. A predicted withdrawal stays a scenario; only independently verified applicable facts can change the current legal gate.
- A five-day price tilt needs an explicit retention, decay or reversion rule beyond day five. Restarting the same return dynamics from a shifted price preserves the level shift. Without a continuation rule and a gold-to-contract mapping, the longer-horizon dollar effect remains unavailable.

Disable automatic Black–Litterman precision fusion in the first delivery. Same-model reruns are not independent forecast errors, and their spread is not calibrated outcome uncertainty. A 25% cap is a policy choice, not evidence of calibration. Optional 0/10/25% influence experiments must be labelled assumptions and use an explicit mapping. Twenty resolved cases is a review checkpoint at most, not an automatic licence to fit a calibrator or increase weight. Learned fusion requires matched targets/horizons, resolved forecasts, bias/covariance estimates and held-out incremental value. [Fusion and evaluation research](strategy-amendments/evaluation-swarm-research.md).

Typed extraction remains replaceable. Amit's requested OpenAI Decisions API is the preferred integration candidate, subject to verifying its actual interface and availability during implementation. This specification makes no claim about undocumented capabilities and does not silently select Jev. A deterministic parser and explicit missing-field result keep the demo independent of that choice.

## 5. Decision policy, constraints and actions

### Feasibility before ranking

Check title/interest evidence, permitted activity and transfer, access, applicable claim fees, overlap conflicts, restrictions, liabilities and other contract-specific requirements. Each check has a source, time, reviewer/method and `pass`, `fail`, `unknown` or justified `not_applicable`. A map intersection alone cannot pass a legal gate. Scenario mode may use assumed gate values, displayed as assumptions; it must not overwrite the real evidence gate.

A known failed entry constraint excludes entry. Unknown required economics or rights produce `insufficient_inputs` or `manual_review` with `action = null`. SKIP means a defined entry decision was evaluated and rejected. For an existing holding, a failed or unknown condition does not erase obligations or automatically make HOLD or SELL feasible.

Check cash **before receipts**, including already paid premiums when measuring total strategy funding, costs, financing availability and settlement order. Check permitted exercise dates, closing deadline, assignment permission and counterparty/settlement conditions. Positive expected NPV is not proof of affordability or timely execution.

| State | Feasible actions to compare | Display mapping |
| --- | --- | --- |
| `not_owned` | Available acquisition structures and do nothing | BUY with named instrument, or SKIP. Waiting is an additional action only with a model of future availability and terms. |
| `option_held` | Continue before expiry, exercise when permitted, assign if permitted with a supported buyer, or lapse | HOLD, SELL via an actual exit route, or LAPSE. Exercise is recorded separately; it is not automatically a sale. |
| `interest_held` | Sell through a supported exit route or continue with future obligations | SELL or HOLD. Missing continuation/exit economics produce an unavailable result. |

Use detailed `action` internally and a familiar BUY/HOLD/SELL/SKIP label where it accurately describes it. The UI must also support LAPSE, EXERCISE and unavailable results, instead of disguising them as HOLD.

### Objective and uncertainty

Initially maximize expected NPV across feasible policies using declared scenario probabilities and a configured scenario-loss limit. If probabilities are missing, show individual outcomes and break-even comparisons; expectation, quantiles and probability of profit remain null, and no expected-NPV ranking is issued.

All thresholds are versioned policy choices. Salman's 60% profit threshold and spread-based hurdles can later be tested as configurations; they are not research-established constants. Defer Kelly sizing until return distributions, dependence, opportunity repetition and financing have been justified. Start with explicit cash/exposure caps.

Report worst loss within the scenario set, not a guaranteed maximum real-world loss. If CVaR is enabled, define loss as `-NPV`, compute the mean of the worst 5% probability mass with fractional mass at the boundary, and state that convention. Do not label three chosen scenarios a measured 95% market risk bound. Distribution ranges are conditional on their inputs; model error and missing risks remain separate.

For robustness, publish the actual family IDs, number tested, chosen action under each, and sensitivity to mappings/costs. A two-family build cannot pass a four-of-five rule. Agreement between GBM and bootstrap is two scenario checks, not empirical confirmation. Missing families are neither successes nor extra votes.

For later multi-date decisions, compare immediate feasible action with expected continuation conditional on what is known at that node. Use exact enumeration for the small case, then least-squares Monte Carlo if scale requires it. Fit continuation on training paths and evaluate on separate paths. Longstaff–Schwartz supplies a conditional-continuation method; its pricing measure must not be silently substituted for a subjective expected-profit objective. [Original paper](https://www.anderson.ucla.edu/documents/areas/fac/finance/file11.pdf).

## 6. Shared input and output contract

These are the consolidated requirements for adapters. Preserve raw source files; field changes require coordination with the named owner. Implement a versioned schema rather than assuming the old `held` boolean or `size_pct` field has all the required meaning.

| Record | Required content |
| --- | --- |
| Common provenance | `record_id`, `schema_version`, `source_ref`, `source_version`, `event_time`, `first_available_at`, `retrieved_at`, timestamp precision, units, and `observed`/`assumed`/`model_estimated` status. Unknowns are null. Estimates identify their target and validation scope. |
| Forecast | Target, location, horizon, forecast creation/availability time, latest input availability, `train_end`, `label_resolution_cutoff`, model/config version and calibration status. A newly generated forecast does not inherit the earlier availability time of its inputs. |
| Interest and contract | `opportunity_id`, `interest_id`, geometry and tenure, commodity, rights conveyed, fraction, `position_state`, `contract_type`, currency, offer status and valid-until time, detailed consideration, obligations, exercise schedule, expiry, closing deadline, settlement delay, assignment permission, financing and gate evidence. |
| Economics | Dated cash-flow components; explicit `price_kind` such as asking, announced consideration, completed payment or assumed exit; source/assumption for each; carry basis and effective dates; nominal/real basis, discount convention and dated FX where needed. |
| Scenario | `scenario_id`, probability and its provenance or null, information revealed at each time, cash-flow/price paths, exit mechanism, settlement failures/delays, and mapping IDs. Policy inputs omit unrevealed scenario state. |
| Swarm | Run/seed/variant/shock, exact target/source/start/end, region, five-day return fraction or null, policy-event scenarios, daily group sentiment and evidence, model/prompt/config hashes, generation time, extraction/grounding results. No calibrated probability is implied by a confidence field. |
| Policy | Objective, cash budget and credit terms, loss/exposure limits, decision dates, tie rule, action thresholds, enabled model families, mapping versions, scenario set and seed. |

BLM's current page lists $274 to file a new lode claim, including its initial $200 maintenance fee, and $200 annual maintenance thereafter under the applicable schedule. Do not charge the initial maintenance twice. Placer fees depend on acreage; waivers and timing can change obligations. Alaska state rent requires its own current schedule and must not inherit BLM rates or an unverified 2000 statute amount. [BLM fee schedule, checked 24 October 2026](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims/fees).

Output fields:

```text
strategy_version, run_id, decision_time, valuation_mode
opportunity_id, interest_id, position_state, currency
status: ok | insufficient_inputs | manual_review | unsupported_contract
action|null, display_signal|null, instrument|null
feasible_actions[], excluded_actions_with_reasons[], gate_evidence[]
cashflow_ledger_by_scenario, payoff_by_scenario, scenario_payoff_range
expected_npv|null, p_profit|null, profit_quantiles|null
worst_loss_within_scenarios, cvar95_loss|null, peak_funding_required
baseline_result, mapped_scenario_result, npv_delta|null, action_change
model_families_tested[], action_by_family, robustness_status
swarm_used, swarm_role, mapping_ids[], calibration_status
input_refs[], assumption_ids[], missing_inputs[], warnings[]
model_versions, policy_version, seed, reasons
```

Require a reconciled dollar ledger: its discounted total equals the reported NPV. Keep waiting comparisons, risk and scenario deltas outside that sum unless they correspond to actual defined cash flows. Same inputs, versions and seed reproduce the result. Frontend integration is a later adapter task; the current evidence panels remain pending until a real conforming decision record exists.

## 7. First acceptance case

The [machine-readable fixture](strategy-amendments/decision-fixture.json) supplies every term below. All rights, prices, probabilities and settlement conditions are fictional. It is one scenario tree, not a five-family robustness result or a real land offer.

- Purchase on day zero: price $100,000 plus $2,000 entry cost; $500 carry and $2,000 exit cost on day five.
- Alternative option: $3,000 premium on day zero, exercise permitted only on day five at $100,000 plus $2,000 exercise cost; $2,000 exit cost is deducted from proceeds. No option-holder carry is assumed in this fixture.
- On day five, before exercise, a firm executable buyer bid is revealed: $130,000 with assumed probability 0.6, or $90,000 with assumed probability 0.4. Settlement is guaranteed the same day by assumption; closing is due on day five. Bids are hidden at day zero.
- Discount rate is zero. Cash budget is $105,000 with no borrowing. Maximize expected net cash subject to a $5,000 loss limit within these scenarios. Ties select SKIP.

| Choice | High-bid outcome | Low-bid outcome | Expected net cash | Worst scenario loss | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Purchase | $25,500 | -$14,500 | $9,500 | $14,500 | Excluded by loss constraint |
| Option, exercise high / lapse low | $23,000 | -$3,000 | $12,600 | $3,000 | BUY purchase option in scenario mode |
| SKIP | $0 | $0 | $0 | $0 | Feasible alternative |

Option funding before proceeds is `$3,000 + $100,000 + $2,000 = $105,000`. Its expected result is `-$3,000 + 0.6 × ($130,000 - $104,000) = $12,600`. Purchase needs $102,500 before receipts under the fixture's payment ordering.

The option formula uses `max(bid - strike - exercise_cost - exit_cost, 0)` because the executable bid is known before exercise. If a buyer must be found afterward, use conditional sale/closing cash flows; never let the policy see the realized future price. Exercising into illiquid land can lose more than the premium.

Required changes in result:

| Change to fixture | Expected result |
| --- | --- |
| Premium rises to $16,000 | Option expectation is -$400 and constraints fail; SKIP. |
| Settlement takes one extra day, with exercise still permitted only on day five | Closing would miss day five; exclude exercise and select SKIP at entry. |
| Cash budget is $104,000 | Cannot fund option exercise; purchase still breaches the loss limit; SKIP. |
| Remove buyer bids without replacements | `insufficient_inputs`, no action or invented price. |

The later HOLD/SELL demonstration must add explicit intermediate observations, permitted exercise/assignment routes and conditional continuation. A hand-specified future payoff tree is adequate for a labelled demo; it is not a fitted land model. Salman's larger example remains useful motivation, but its dollar anchors, instantaneous resale and single-family BUY need these qualifications before reuse.

## 8. Validation and claims we can make

| Claim | Appropriate evidence | Do not substitute |
| --- | --- | --- |
| Evidence and contracts are correctly represented | Source checks, schema validation, distinct sample counts, source hashes, rights/fraction/consideration review | A plausible narrative or model-generated confidence |
| Calculator respects the contract | Exact fixture enumeration, no future-state access, cash/deadline checks, ledger reconciliation, held-position tests | Profitable hypothetical outputs as proof of market skill |
| Claims model predicts activity | Time-forward resolved claims targets, grouped spatial tests, trailing-count/rate baselines | Claim transfer or staking as a contract return |
| Valuation predicts monetary outcomes | Later comparable transactions or realized cash flows, held-out properties/agreements, dollar error and interval coverage | Announced commitments, unknown exits marked zero, or a model marking its own book |
| Swarm improves forecasts/decisions | Immutable target-matched predictions, later resolution, calibration/proper scores, baseline and ablation comparisons | Seed agreement, grounding, or a modern LLM prompted to pretend it is in the past |

Build features from the source vintage available at the decision. Require training labels to be resolved and available by the training cutoff; remove overlapping outcome windows across splits. Fit preprocessing, feature selection, models and calibration within training data. Keep repeated properties/agreements together, and distinguish interpolation from transfer to a new region. Historical prompting alone does not remove future knowledge from an LLM. [Evaluation research and primary sources](strategy-amendments/evaluation-swarm-research.md).

Do not claim rolling conformal prediction guarantees reliable small-sample, site-specific coverage under arbitrary spatial/temporal shifts. Standard conformal results need assumptions such as exchangeability; adaptive methods target particular long-run coverage properties. State the chosen method and assess held-out coverage for the actual population. [Gibbs and Candès, adaptive conformal inference](https://arxiv.org/abs/2106.00170).

Start with the exact fixture, no-swarm policy and fixed-rule alternatives on identical worlds. Activity and monetary models have separate baselines. A gold investment can be a contextual benchmark only after matching dates, capital and costs; it does not validate a land estimator. Sharpe, deflated Sharpe and overfitting statistics wait for a defensible return series and experiment history.

Test invariants at their proper scope: with fixed cash flows except for a fee, increasing that fee cannot improve that policy's NPV; an identity scenario mapping leaves the result unchanged; unrevealed future information is inaccessible; required funding precedes receipts; and expiry removes continuation only when the contract actually ends. Do not require every BUY/SELL label to move monotonically with gold regardless of state, terms and constraints.

## 9. Delivery sequence and remaining dependencies

| Order | Owner and bounded deliverable | Acceptance |
| --- | --- | --- |
| 1 | Salman: deterministic ledger, purchase/option/SKIP engine and fixture; Amit: agree adapter contract | Exact values and four changes above; unknowns preserved; reproducible output. No external forecast dependency. |
| 2 | Arjin: normalize a small reviewed subset of the real agreements and label historical facts; Amit: retain real Tok evidence and overlay provenance | Rights/fraction, consideration, dates and status traceable. No pooled per-acre target silently imported. |
| 3 | Muhd: one valid baseline and one shock export; Salman: one explicit scenario mapping | Show both outputs and the assumed cause of any action change. Missing swarm leaves baseline usable. |
| 4 | Amit: integrate conforming records into the local evidence UI; Salman: add explicit held-position decision nodes | Evidence, assumptions, dates, funding, conditional action and pending states visible. UI never fabricates a result. |
| 5 | Arjin and Salman: activity baseline, gold-family comparisons, filtered monetary estimates when labels allow | Separate validation reports, actual family counts and stated transfer limits. |
| Later | Salman: LSM at scale, richer earn-ins/royalties, calibrated fusion or sizing | Each extension earns its inputs and tests before being enabled. |

The concrete first defaults are scenario mode, a fictional interest, USD, a five-day single-date option fixture, exact enumeration, no calibrated swarm influence and the policy limits in section 7. They let implementation proceed without pretending a live Tok opportunity exists.

Before enabling a real-opportunity recommendation, the remaining dependencies are an identified offer/held contract, verified relevant rights and terms, current applicable carry/obligations, a supported exit/continuation model, and user-approved capital/risk settings. Brokerage, assignment and royalty structures need their own permissions and payment logic before support. For empirical claims, historical vintages and resolved target-specific outcomes are additionally required.

## Source and review record

The primary design source is [Salman's PR #23](https://github.com/amitvijapur/oxhack-2026/pull/23), pinned to [foundation `ab660a9`](https://github.com/amitvijapur/oxhack-2026/blob/ab660a94c3998e9345793987cd7f3342f93848a1/research/gold-land-algorithm-foundation.md) and its [input contracts](https://github.com/amitvijapur/oxhack-2026/blob/ab660a94c3998e9345793987cd7f3342f93848a1/research/foundation-input-contracts.md). This combined document carries forward its contract product, modular architecture, new data, team handoffs and research roadmap, incorporating the [eight amendments](strategy-amendments/README.md).

See the [reconciliation and verification record](strategy-amendments/reconciliation.md) for what was retained, changed and deferred. The design is combined for team review; GitHub PR #23 has not been merged by this review.
