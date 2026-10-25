# Remaining work

Amit owns integration. The local application, canonical assignment engine,
source adapters, optional publication plumbing and their tests are implemented.
A useful live trade assessment still depends on inputs and validation that code
integration cannot supply.

| Work | Owner / next step | Completion evidence |
| --- | --- | --- |
| Actual assignable Tok contract | Arjin / verify interest, assignment permission, consideration, expiry and unavoidable obligations | Dated source terms and rights review linked to the modeled interest |
| Recoverable material and valuation inputs | Team / obtain a defensible quantity and economic basis | Resource evidence with units, provenance and availability date; sediment assays alone are insufficient |
| Assignment liquidity | Team / collect buyer and resale observations | Calibrated dated sale hazards, fees and proceeds, including no-sale cases |
| Simulation completion and reruns | Muhd / finish missing scenarios and interviews using comparable configurations | Baseline seeds, all required days/groups and recorded input knowledge cutoff |
| Simulation readiness | Muhd and Amit / resolve failed placebo, mirror and grounding checks and provider/configuration confounds | Applicable diagnostics pass with attributable outputs; score changes alone are insufficient |
| Gold-response calibration | Team / replace the adjustable support-to-gold coefficient with a model fitted to dated gold returns | Chronological evaluation against no-change and historical-growth baselines, with untouched test data |
| Predictive validation | Team / define the decision target and horizon and run chronological evaluation against a simple baseline | Available-at-cutoff data, train-only transformations and measured out-of-sample value |
| Optional hosting and storage | Account owners / select deployment, configure intended secrets and public URLs, then verify | Hosted health, browser smoke, ingestion and rollback evidence; no deployment is configured by this integration |
| Submission readiness | Team / confirm event requirements and review repository visibility | Confirmed deadline, demo flow and reviewed public transition if required |

The hypothetical gold forecast is implemented in model v2. Its adjustable
support-to-gold response is not fitted, and it has no demonstrated prediction
skill. It propagates through material and option values into cash without a
second option markup. Model completion does not fill the empirical gaps below.

The current land bundles join sample identities to checked layers and supply
claims, market examples and cost context. They do not establish available
contracts, recoverable resources or assignment liquidity. A historical closed
claim or a sample square with no checked overlap does not establish available
land or mineral rights.

The pinned `f2fe2971` swarm bundle supplies six score sets, with three scenarios
missing and interviews incomplete. The 26/30 judge check does not clear failed
placebo/mirror/grounding diagnostics, configuration confounds or an unknown
knowledge cutoff. Strict monetary scenario runs remain unavailable until
readiness is established. The website's explicit **Use existing swarm results**
option supports a post-only hypothetical comparison of the matching Claude
approval/block/placebo runs, without requiring new paid simulations. That option
does not mark the research checks passed. The missing scenarios and empirical
validation above are later research work, rather than prerequisites for this
bounded hackathon demonstration. The default hypothetical demo also remains
available for arithmetic review.

The active whole-contract demo has a US$30,000 historical initial-payment
reference, US$50 assumed entry fee and US$50 assumed exit fee. With unchanged
US$1,500 assignment proceeds and 48.8% sale probability, its 90-day expectation is
US$-29,342.40, and the model skips it. The US$1,502,500 demo fund preserves the
2% per-option and 10% open/cohort capital ratios including the entry fee.
The US$77,022.34 assignment hurdle for a 25% target return is an independently
labelled requirement, not the forecast. No matched assignment-price evidence
supports that hurdle. The earlier US$7.60 fixture remains historical test data.

Historical research and superseded PRs remain useful provenance. Their old
monthly solver, exercise policy and deployment commands are not supported by the
current canonical architecture. Automated dependency-update PR 35 is outside
this integration scope. Track active ownership and check results in
[tasks/todo.md](../tasks/todo.md).

A bounded real-announcement equity pilot is now implemented and displayed in the website. Its event adjustment worsened held-out error, so it does not satisfy the predictive-edge requirement. Five test events, source-selection bias, two issuers and absent historical swarm labels remain substantial limits. The [pilot report](../research/event-study/RESULTS.md) records the result before any subsequent model changes.
