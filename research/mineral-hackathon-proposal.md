# LODESTAR Lite: when is better information worth waiting for?

24 October 2026. Owner: Amit. **Discussion proposal, not an approved build or a validated mineral-discovery model.** This deliberately simplifies the earlier exploration and land-buy plans for the hackathon. Publish it now for team discussion; further geological verification is not a prerequisite to discussing this simulation scope.

> Update: Amit has since selected the existing US soil dataset and a four-person split with two site-evidence owners, one prompt owner and one algorithm owner. MiroFish runs locally on Amit’s laptop. Read [the current US soil build plan](us-soil-build-plan.md) for review; its data scope and ownership supersede the MRDS/Nevada proposal below.

## Recommendation

Build a two-site exploration decision simulator anchored to one US mineral-occurrence dataset. It shows how an algorithm chooses between investigating now, paying for information and waiting, or walking away before a deadline.

**Pitch:** “Two sites, one investigation budget and three days. Is it better to act on the evidence we have, or spend time buying a better answer?”

Use real recorded mineral evidence for the map and context. Make uncertain mineralisation, survey results, costs and rewards explicit scenario assumptions. The contribution is an implemented, explainable decision algorithm, with performance measured inside the stated simulation. It does not need to prove discovery of an unknown deposit during the hackathon.

## One source, one area, two illustrative sites

Proposed source: [USGS Mineral Resources Data System, MRDS](https://mrdata.usgs.gov/mrds/), already identified in the team's [data probe](land-claims-probe.md). Start with gold in one small Nevada study window and two illustrative equal-area cells, A and B. Select exact coordinates after inspecting the single source, not by guessing which parcels are legally available.

Use only record ID, coordinates, commodity, description and source reference where present. Display nearby records and a simple distance/count summary for each cell. This is recorded-occurrence context, not a mineral probability. Duplicate or incomplete records must be visible or removed with a documented rule. An empty cell means no record in the selected extract, not barren or undrilled ground.

The [MRDS service description](https://www.arcgis.com/home/item.html?id=f04832b0de92420290c6638e2da26415&sublayer=0) says systematic updates ceased in 2011. It is suitable as a static historical reference, not a live feed of new mineral discoveries. The team's notes report access, but this planning turn did not download or validate a new US extract; the direct USGS landing page returned HTTP 403 through the research tool. Treat import as a small implementation task, not an accomplished result.

**Do not add a land-contract source to the core.** The [BLM describes mining claims as asserted mineral-development rights](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims). They are not mineral assays or sale-price observations. A claims-only project is possible, but its target would be claim activity. Keeping the mineral idea means using mineral occurrences for context and making land availability/value hypothetical. No claim that A or B is purchasable or unclaimed is needed.

Muhd's newer [LODESTAR data check](lodestar-data-check.md) and [gold/lithium probe](land-claims-probe.md) describe a Quebec claims route. Preserve that as a separate option. Its reported experiments have not been reproduced here, and this US proposal does not depend on them.

## What is real, assumed and computed

| Component | Status in this MVP |
|---|---|
| Mineral records and geographic context | Real, with source and snapshot date |
| A/B study-cell boundaries | Illustrative, not legal parcels |
| Counts/distances to recorded occurrences | Calculated evidence summaries; not calibrated prospectivity |
| Initial chance of a useful investigation outcome | User-visible scenario assumption; no trained geological probability claimed |
| Survey accuracy, delay, investigation cost and payoff | Hypothetical inputs in simulation credits/days |
| Posterior chance after a noisy survey result | Bayesian calculation conditional on those assumptions |
| Best next action and expected utility | Computed by the decision engine |
| Real mineral discovery or investment return | Not demonstrated by this MVP |

Keep the initial probabilities separate from the evidence summaries in version one. Do not quietly convert “near a known deposit” into “70% chance of gold.” Any later mapping from evidence to a prior must be labelled an adjustable, uncalibrated hypothesis.

## The algorithm we build

Two sites, at most one survey, and at most one final investigation. Start with independent assumed site outcomes and a risk-neutral objective. No trained ML model, multi-agent framework or additional dataset is required.

1. Evaluate investigating A or B now: `p(success) × reward - investigation_cost`, provided the budget and remaining time allow completion.
2. Evaluate surveying A or B first. Enumerate positive and negative survey results using the assumed sensitivity and specificity. Update only that site's probability with Bayes' rule.
3. In each survey branch, subtract the survey's money and time, then choose the best feasible action: investigate A, investigate B or skip. Weight those branch values by their probabilities and subtract the survey cost once.
4. Compare every feasible first action with skipping, whose value is zero. Return the best action, its expected utility and its decisive assumptions.

The survey is noisy and never exposes the simulated truth directly. If it arrives too late to complete an investigation, its branch cannot earn the reward. That is the operational connection to TIME.

### Hand-checkable example, entirely hypothetical

Assume A has probability 0.35 and B 0.25. A successful investigation returns 100 credits; either investigation costs 30 and takes one day. A survey costs 5, takes two days, and has 80% sensitivity and 80% specificity. Available budget is at least 35 credits. Only one investigation may be completed.

- Investigate A now: expected value 5 credits. B now: -5 credits. Skip: 0.
- Survey A: probability of a positive result is 0.41. After a positive, A's probability is about 0.683; after a negative it is about 0.119. Investigate A after a positive and skip after a negative. Expected value is 10.7 credits after survey cost.
- Survey B: the same calculation, with A as the fallback after a negative, gives 7.75 credits.
- With three days remaining, survey A is best. With only one day remaining, A now is best. Lower both initial probabilities enough and skipping becomes best.

These numbers are a calculation fixture for the implementation, not fitted probabilities or a commercial valuation. They give the team a working mathematical core before adding presentation.

## Three-minute demo

1. **Land:** show the two illustrative cells and their real recorded-mineral context.
2. **Prediction:** show assumed initial probabilities, noisy survey outcomes and posterior updates. Keep a persistent “Scenario simulation” label.
3. **Algorithm:** animate the small decision tree and explain why buying information is initially worthwhile.
4. **Output:** shorten the deadline. The recommendation changes from survey-first to investigate-now or skip. Reveal a simulated outcome and compare policies across many seeded runs.

These four views fit the team's existing land/prediction/algorithm/output layout. The novelty we pitch is the decision experience and transparent treatment of time and uncertainty. We should not claim that Bayesian value-of-information methods themselves are new.

## Verify the implementation, without another research project

Check the example above by hand, probability limits, uninformative surveys, zero remaining time and insufficient budget. Compare the policy with “investigate the highest-prior site now,” “always survey first when feasible” and “skip,” using the same budget, horizon and simulated worlds. Report mean utility, investigation/survey costs and deadline misses across seeded runs, with variation across several assumed conditions. Show cases where surveying helps and where it does not.

Simulated outcomes must come from a separate hidden-state generator, with survey observations drawn conditionally on that state. The policy sees only its permitted observations. Prefer exact decision-tree values as the correctness reference; simulation illustrates outcomes. Agreement with a simulator built from our assumptions verifies implementation, not real mineral forecasting skill.

## Four-person scope and schedule

The source and schedule below originated in the earlier proposal. Follow [the current US soil build plan](us-soil-build-plan.md) for the agreed dataset direction and current sequence. Named responsibilities are:

| Owner | Bounded responsibility | Deliverable |
|---|---|---|
| Amit | Site A evidence and local MiroFish execution/integration | Site A pack and saved swarm run |
| Arjin | Site B evidence, then the A/B display | Site B pack and comparison view |
| Muhd | Agent prompts, information packaging and output schema | Versioned prompt bundle |
| Salman | Decision algorithm and swarm-output adapter | Verified solver and structured decision |

The following eight-hour schedule is retained as the earlier proposal; use the current plan's sequence for planning work.

| Time after agreement | Work |
|---|---|
| 0–0.5 h | Agree this scope, choose familiar stack and freeze input/output fields |
| 0.5–2 h | Import the small source extract and choose A/B; implement the worked example; build interface with clearly labelled fixtures |
| 2–4 h | Complete finite decision tree, budget/time constraints, Bayesian branches and seeded scenarios |
| 4–6 h | Integrate the real context and solver; compare fixed policies and check boundary cases |
| 6–8 h | Rehearse, simplify explanations, verify provenance labels and prepare a backup recording |

If source import stalls after 20 minutes, use an attributable extract the team already has. If none exists, explicitly use a synthetic fixture for the algorithm prototype and leave the real-data dependency unresolved; do not silently invent records or start adding services. A synthetic-only prototype has weaker alignment with HRT's data criterion.

Agree only three small data contracts before parallel work: site evidence with provenance; scenario assumptions with units; and decision output with action, expected utility, remaining time and branch explanation. Stack selection follows team agreement. Runtime is tiny; a Rust rewrite is unnecessary unless the team already prefers Rust.

## Cut line and team decision

Core excludes geophysics, geology-layer joins, weather, politics, live claims, real land pricing and a historical financial backtest. A swarm is optional presentation only: a few agents may represent explicitly different assumptions and disagree about the action. Their agreement must not become evidence of minerals. Build the exact solver first.

The HRT fit is real-data context plus a prediction-and-decision mechanism whose measured results are clearly simulated. This is less empirical than a verified real-world forecast, which is the deliberate tradeoff. The Citadel-style craft is the team's own understandable solver, interaction and execution. No sponsor eligibility or score is guaranteed.

**Proposed team decision:** accept a one-source, two-site simulator now, then build the algorithm and pitch. Preserve empirical mineral discovery or real claim-market forecasting as a later project rather than a dependency of this demo. Previous WA targeting failures remain valid results, but they do not block implementing this explicitly hypothetical scope.
