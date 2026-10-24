# Proposed contract and decision specification

24 October 2026. Draft for Amit and Salman to reconcile with the next strategy revision. This is a mathematical and interface proposal, not an implemented solver or an agreed replacement for Salman's design.

## 1. Preserve the architecture and define its object

Retain the path from measured evidence through scenarios to a deterministic decision and explanation. Make the object of each decision an identified contractual interest, with a currency, ownership fraction, position state and dated cash flows. Gold price, sediment concentration, claim activity and contract value remain different variables with different units.

Every input carries its value, unit, source/version, availability time, and status as observed, assumed or model-estimated. A model estimate also identifies its target, calibration status and validation population. Unknown required values remain null.

Support these proposal modes:

| Mode | Inputs | Output meaning |
| --- | --- | --- |
| Evidence only | Measurements and provenance; required contract economics unknown | Evidence display and missing-input list; no monetary recommendation |
| Scenario calculation | Exact contract terms or labelled hypothetical terms; explicit future cash-flow scenarios | Conditional payoffs and decisions under the stated assumptions |
| Empirical estimate, later | Supported valuation mapping and appropriately held-out priced outcomes | Estimate with its measured validation scope; no automatic claim of Alaska transfer |

The current Tok packs support measured context. They do not provide the economic terms needed to move from the first mode to either of the others. A hypothetical contract may use Tok as narrative context without claiming a legal parcel or a match to any sample.

## 2. Replace the monetary formula with dated cash flows

For policy `pi` in scenario `s`, define:

`NPV(pi,s) = sum_t D(t) * cashflow(pi,s,t)`

All cash flows are USD for the same interest, positive for receipts and negative for payments. For a stated nominal annual discount rate `r > -1`, a possible convention is `D(t) = (1+r)^(-days(t)/365)`. Record the convention; do not mix nominal cash flows with an unexplained real rate. The fixture below uses zero discounting to make hand checking simple.

Separate entry consideration, transaction costs, carrying costs, contractual work obligations, and exit receipts/costs. Commitments occur only on branches where the contract makes them payable. A royalty is an obligation with a defined base, not automatically an upfront dollar cost. State whether terminal value already includes it. Count each cost once.

The initial objective can be expected NPV under **declared scenario probabilities**, subject to available cash, deadlines, permissions and a stated loss constraint. If scenario probabilities are absent, report scenario payoffs and break-even conditions instead of inventing an expectation. A probability supplied for a fixture is not a calibrated market probability.

Do not add an extra waiting/option-value bonus to a payoff that already optimises later exercise. A later, multi-date model should compare immediate action with conditional continuation at each state. The original [Longstaff and Schwartz paper](https://www.anderson.ucla.edu/documents/areas/fac/finance/file11.pdf) estimates that continuation conditional on information available at exercise; it does not justify deciding with unrevealed future outcomes. Its pricing setting also should not be silently equated to a subjective expected-NPV decision model.

Natural-resource option models require an economic underlying asset and development assumptions. [Damodaran's original teaching material](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/opt.html) identifies resource quantity, project cash flows, development costs, rights duration and delay among the inputs. A sediment concentration and area do not fill those roles. Keep the development-option model as a future component, conditional on suitable inputs; see the [valuation research](contract-valuation-research.md).

## 3. State, feasibility and information

- `not_owned`: compare available acquisition contracts with SKIP. Waiting needs a stated future opportunity process; it does not guarantee today's price or availability.
- `option_held`: compare exercise, continuation where permitted, and lapse. A previously paid premium is sunk for the later exercise decision but remains included in total strategy results.
- `interest_held`: compare supported sale routes with continuation. HOLD needs a future-value/cost model, and SELL needs an executable or explicitly assumed exit mechanism.

Each action must satisfy the contract's exercise and closing dates, available funding and known constraints. Check the highest cash needed before receipts, not just positive eventual NPV. Unknown permissions or economic inputs return `insufficient_inputs` or `manual_review`, not an invented safe price or a blanket investment recommendation. A known failed entry constraint can exclude BUY and leave SKIP feasible. Existing holdings and obligations need their own handling.

The policy observes only fields whose availability time is no later than the decision. Historical-model training also requires labels resolved by the training cutoff. Scenario simulators may store hidden states, but the policy never receives them before the defined observation event.

For an option exercisable on one specified date, with a firm bid known before exercise and guaranteed within the explicit fixture, the net payoff is:

`-premium + D(T) * max(bid(T) - strike - exercise_cost - exit_cost, 0)`.

That maximum is valid because the bid is available at the exercise decision. If the bid arrives later, is uncertain, or depends on finding a buyer, replace it with conditional future cash flows and closing outcomes. The option's premium is not the entire downside after exercise into an uncertain, illiquid asset. Actual options with early exercise require the permitted earlier decisions; the single-date fixture must not be presented as a complete American-option solver.

## 4. A concrete, entirely hypothetical acceptance case

Machine-readable assumptions and expected outputs are in [decision-fixture.json](decision-fixture.json). These are newly authored calculation inputs, not fitted values, sampled real contracts or a MiroFish run. No sediment measurement is converted into a price or probability.

Assume one fictional interest can be bought today for USD 100,000 plus USD 2,000 acquisition costs. Owning it through day five costs USD 500. Alternatively, a USD 3,000 premium buys an option exercisable only on day five for USD 100,000 plus USD 2,000 exercise costs. Both exits cost USD 2,000.

On day five, before exercise, the investor observes a firm buyer bid of USD 130,000 with assumed probability 0.6 or USD 90,000 with assumed probability 0.4. The bids are hidden on day zero. Assume same-day guaranteed settlement, sufficient funding and hypothetical valid rights. These assumptions deliberately isolate the calculator; they are not an assertion about land-market liquidity. Use a USD 105,000 cash budget and a USD 5,000 maximum loss **within the declared scenario set**.

| Choice | Higher-bid outcome | Lower-bid outcome | Expected net cash flow | Worst loss within this scenario set |
| --- | ---: | ---: | ---: | ---: |
| Purchase now | 25,500 | -14,500 | 9,500 | 14,500 |
| Buy option; exercise only when worthwhile | 23,000 | -3,000 | 12,600 | 3,000 |
| Skip | 0 | 0 | 0 | 0 |

The proposed policy selects the option. The purchase breaches the specified loss constraint. The option needs USD 105,000 before exit proceeds on its exercise branch; positive expected value alone would not make it affordable. This result proves only a conditional calculation.

Hand checks:

- Purchase: `0.6*(130000-2000-500) + 0.4*(90000-2000-500) - 102000 = 9500`.
- Option: `-3000 + 0.6*max(130000-104000,0) + 0.4*max(90000-104000,0) = 12600`.
- A USD 16,000 premium produces expected option NPV of `-400`; with the same constraints the selected action becomes SKIP.
- A one-day settlement delay makes the single permitted day-five exercise miss its day-five closing deadline. The option is infeasible, and the purchase still fails the loss constraint, so the result is SKIP.
- A USD 104,000 funding budget excludes the option's exercise branch; the result is again SKIP under the same purchase constraint.
- Removing the assumed buyer bids without replacements produces `insufficient_inputs`, with no action or fabricated valuation.

The loss limit is a user-defined scenario constraint, not a proven maximum loss in the real world. Counterparty failure, title issues and unmodelled scenarios can change it. Future verification should add adverse closing cases instead of treating a guaranteed bid as observed market behaviour.

## 5. Swarm integration and output

Use the [proposed five-day schema](evaluation-swarm-research.md#3-proposed-five-day-interface). Keep `forecast_target`, `forecast_horizon`, `decision_time` and contractual expiry/settlement dates distinct. Different horizons can coexist only through an explicit transition or scenario mapping.

A scenario event may alter a named assumption, such as a closing delay. Store the originating run/event, mapping definition, affected fields and approval/version. A proposed policy is not enacted law. A five-day gold-return view needs a separately justified gold-to-contract mapping before it changes contract dollars; there is no default annualisation or automatic long-term persistence.

For the initial proposal, the swarm contributes stress scenarios and descriptions. It supplies neither measured valuation probabilities nor calibrated precision weights. Compare with and without each assumed effect on the same contracts and worlds. Preserve a functioning calculation without swarm output.

The decision record should include:

```text
run_id, baseline_strategy_commit, proposal_version, valuation_mode
interest_id, position_state, as_of, decision_time, forecast_horizon
input_refs, assumption_ids, model_and_prompt_versions, scenario_ids
status, action|null, instrument|null, excluded_actions_with_reasons
cashflow_schedule_by_scenario, expected_npv_usd|null
scenario_payoff_range_usd, worst_loss_within_scenarios_usd
required_cash_before_receipts_usd, feasibility_results
swarm_effects_applied[], explanation, validation_scope
```

No generic confidence score should collapse data fidelity, model calibration and scenario sensitivity into one number. The frontend can show which outputs are observed, assumed or empirically evaluated.

## 6. Acceptance before extending the model

Check the fixture, time/funding failures, unknown inputs, single charging of costs and permitted information. A separate implementation review should then check the produced cash-flow ledger, branch policy and actual output schema. Compare policies on identical scenarios; show benefits and failures across varied assumptions.

The later empirical work needs its own targets and data: claim activity against future filings; contract prices/returns against priced outcomes; transfer against outcomes in the intended region. Keep those milestones independent of successful fixture arithmetic. Statistical evidence for calibrated swarm fusion, richer contract types and multi-year stopping is a later requirement, as detailed in the companion research note.
