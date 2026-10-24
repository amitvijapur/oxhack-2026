# Proposed amendments to the gold-land strategy

24 October 2026. Owner: Amit for integration and acceptance. **Research proposal, now incorporated into the [combined strategy](../gold-land-strategy.md) after review of Salman's revision `ab660a9`.** The original proposals below remain as the research record. They are not an implemented model or evidence of team agreement. See the [reconciliation](reconciliation.md) for the comparison and verification.

Baseline: [Salman's `research/algorithm.md` at `3a84a2c`](https://github.com/amitvijapur/oxhack-2026/blob/3a84a2ce77644521229bd1f4d61fea03c7ee1635/research/algorithm.md). Swarm reference: [Muhd's plan at `75d9bd1`](https://github.com/amitvijapur/oxhack-2026/blob/75d9bd12fc53977f7e8d97213cb2f9032d52f46d/research/gold-swarm-plan.md). The previous [strategy review](../salman-strategy-review.md) identifies the gaps this research addresses.

## Recommendation

Keep the contract focus, modular forecasting/decision architecture, explicit timing, abstention and explanations. Make the first mathematical core a rights-aware cash-flow decision model. Attach empirical valuation and swarm calibration only when their inputs and validation justify them. This preserves the broader research direction while making each result's meaning precise.

Our scoped research covered three questions: what gives a contract a supportable monetary value; which outcomes can validate its predictions; and how a five-day swarm scenario can affect a decision without becoming an unsupported long-term forecast. The outputs are concrete amendments, a proposed interface and an exact calculation fixture.

## Proposed amendments

| ID | Baseline location | Proposed change | Reason and evidence |
| --- | --- | --- | --- |
| A1 | Context, Layer 2 and Layer 5a | Identify the interest, rights, ownership fraction, contract terms, position state and currency before valuing it. Remove the universal surface-land floor. | A mineral claim and surface ownership are distinct. Tok sample points do not establish either. [Rights research](contract-valuation-research.md#2-amend-the-surface-floor-and-rights-gates). |
| A2 | Layer 2, lines 158–187 | Replace the current area/geology/gold-option formula with a supported monetary valuation input, or explicitly assumed contract cash-flow scenarios. Keep geological scores as evidence until their monetary mapping is justified. | The existing units do not yield property dollars. Exploration-stage approaches and actual agreement terms support a clearer foundation. [Valuation research](contract-valuation-research.md#1-amend-layer-2-establish-what-is-being-valued-in-dollars). |
| A3 | Layer 5a, lines 244–287 | Represent cash, shares, work commitments, royalties and milestones separately, with dates and conditions. Never flatten total announced commitments into a completed sale price. | Two primary 2025 Nevada disclosures demonstrate observable option terms and the missing outcome data. [Agreement examples](contract-valuation-research.md#3-two-real-agreement-examples-not-return-labels). |
| A4 | Layer 5, lines 289–344 | Use dated cash flows, explicit feasible actions and conditional continuation. Charge each cost once; check funding before receipts; distinguish missing inputs from a computed SKIP. | Removes undefined monetary quantities, potential double counting and hindsight exercise. A finite fixture is enough to verify the first core. [Proposed specification](proposed-decision-contract.md). |
| A5 | Layer 4, lines 228–242 | Freeze the forecast subject, region, units and five-day clock. Store contract expiry and settlement separately. Require an explicit mapping from swarm events to assumed economic effects. | Muhd's gold/policy outputs are not already land returns. Different horizons need a transition model, not silent annualisation. [Interface proposal](evaluation-swarm-research.md#3-proposed-five-day-interface). |
| A6 | Layer 4 fusion | Initially use the swarm as a source of labelled stress scenarios. Disable claims of calibrated precision fusion. Report rerun variation as stability; do not use `run_std²/K` as the uncertainty of a median forecast or assume shared errors vanish. | Gaussian blending requires matched targets and justified error assumptions. A 25% cap is an assumed influence limit, not calibration evidence. [Fusion research](evaluation-swarm-research.md#2-replace-automatic-precision-fusion-with-an-explicit-experiment). |
| A7 | Layer 6 and labels, lines 346–386 | Evaluate claims activity, monetary outcomes and hypothetical decisions separately. Require source vintages, resolved training labels and region-appropriate tests. | Unpriced activity cannot establish profit; repeatable scenarios cannot establish forecasting skill. NV/AZ validation does not establish Alaska transfer. [Evaluation proposal](evaluation-swarm-research.md#1-evaluate-three-different-claims-separately). |
| A8 | Tier 1 and output contract | Make the first milestone a verified contract fixture, then connect reviewed scenario inputs and display. Keep price/return backtests dependent on the required data. Define robustness against the families actually enabled. | Two scenario families cannot meet the existing four-of-five rule. The first demo can establish arithmetic, information discipline, constraints and explained action changes. |

The recommendation is to incorporate A1–A8 into a joint draft after comparing Salman's research update. Exact region, real contract selection and human assignments remain team decisions. This proposal does not force the application stack or change the separate frontend build.

## Concrete acceptance case

[The proposed decision specification](proposed-decision-contract.md) and [JSON fixture](decision-fixture.json) compare an outright purchase, a single-date purchase option and skipping. All terms, buyer bids, probabilities and rights are explicitly hypothetical. The 67 Tok measurements remain real context and are not converted into price assumptions.

Under the fixture's assumptions, purchase has expected net cash flow of USD 9,500 and worst scenario loss of USD 14,500. The option has expected net cash flow of USD 12,600 and worst scenario loss of USD 3,000. With the declared USD 5,000 scenario-loss limit and sufficient funding, the option is selected. A higher premium, missed closing date or inadequate funding changes the decision; missing valuation inputs produce an unavailable result.

The example assumes a firm buyer bid is known before the option's only permitted exercise and settlement is guaranteed. It deliberately does not model typical land liquidity. Removing that assumption requires a conditional future-cash-flow model; it must not be replaced with the realized future price. Numerical success proves the calculation, not market accuracy.

## What the research adds

- A feasible monetary starting point with explicit units, cash-flow timing and rights.
- Two actual gold-option disclosures that show how to record contract terms without inventing sale prices.
- A usable five-day swarm schema and a controlled route for scenario shocks.
- Separate acceptance criteria for data correctness, scenario calculations and empirical forecasts.
- A source-pinned amendment list that can be checked against Salman's own corrections.

Detailed evidence is in [contract valuation research](contract-valuation-research.md) and [evaluation/swarm research](evaluation-swarm-research.md). The proposal's equations, fixture probabilities and decision thresholds are our authored assumptions or mathematical deductions, not parameters established by those sources.

## Reconciliation completed against Salman's updated version

1. Pin its commit and read the full revised strategy, including changed assumptions and supporting sources.
2. Compare old baseline, his revision and A1–A8. Mark each item as already resolved, compatible addition, genuine disagreement or deferred research. Preserve improvements from his new work.
3. Reconcile the object being valued, units, forecast target/horizon, cash-flow equations, data availability and permitted claims first. Resolve methodological disagreements against primary evidence and a worked example.
4. Produce one updated strategy document, a shared input/output contract and a short list of remaining empirical dependencies. Keep hypothetical fixtures distinct from measured results.
5. Independently check the combined mathematics and interfaces, then report the final changes. Git publication or a remote merge is a separate action; this reconciliation means combining the findings into a document.

| Item | Status against `3a84a2c` | Status against revision `ab660a9` |
| --- | --- | --- |
| A1–A4, rights and monetary decision core | Proposed changes prepared | Incorporated; preserves new catalogue and replaces unsupported valuation/cash-flow rules. |
| A5–A6, swarm target and confidence | Proposed changes prepared | Incorporated; keeps five-day handoff and uses explicit scenario mappings. |
| A7, evaluation targets and time/geography | Proposed changes prepared | Incorporated; adds fact-level catalogue chronology and separate validation targets. |
| A8, initial delivery and output | Proposed changes prepared | Incorporated; exact fixture first, nullable output and actual family counts. |

The [combined strategy](../gold-land-strategy.md) is the current consolidated design draft. The checklist above describes the process used. No ongoing monitor was created, and Salman's branch has not been modified or merged by this review.

## Verification

Research notes use primary guidance, papers and issuer disclosures, with their limits identified. Parent arithmetic independently reproduced the fixture's two expected values and scenario losses using exact rational probabilities. A separate final review and fixture checks are recorded in [verification.md](verification.md).
