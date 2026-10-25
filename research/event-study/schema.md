# Evaluator contract

`evaluate.mjs` exports the pure `evaluateEventStudy(ledger, prices)` function.
Importing it never opens files. The CLI reads inputs only when executed directly.

```sh
node --test research/event-study/evaluate.test.mjs
node research/event-study/evaluate.mjs [events.json] [prices.json] [output.json]
```

Default output is `frontend/public/data/event-study.json`. Freeze the sourced
event ledger before evaluating actual returns. Synthetic tests do not read the
real ledger or prices.

Inputs use `schemaVersion: 1`. The ledger requires `frozenAt` and `events`.
Each event requires unique `id`, `ticker` (`NG` or `NAK`), `publicationDate`
(`YYYY-MM-DD`, 2020 through 2025), `direction` (`-1`, `0`, `1`), `title` and
an HTTPS `sourceUrl`. `publicationTimestamp` is a nullable verified timestamp.
Additional event/source metadata is retained. Publication calendar date controls
entry even if the underlying decision date differs.

Prices require an attributed `source` object and `series` for NG, NAK, GLD and
SPY. Each series contains unique ascending `{date, close}` records, with finite
positive closes. Optional `seriesSources` metadata is retained without alteration.
`source.adjustmentVerified: true` (or `source.adjustment.verified: true`) identifies
verified adjusted data. Optional `corporateActions: [{ticker, date, type}]` blocks
known affected windows when adjustment is unverified. Unverified adjustment is
disclosed, never inferred from the absence of a listed corporate action.

All return fields are fractions, so `0.01` means 1%. MAE is explicitly in
percentage points. Source fingerprints hash normalized JSON input objects.

The output has `schemaVersion`, `studyId`, `status`, `errors`, `units`, `method`,
`sources`, `inputFingerprints`, `limitations`, `swarmLift` and `horizons`.
Status is `invalid_input`, `insufficient_sample` or `evaluated_selected_sample`.
Invalid inputs have no horizon results. `swarmLift.value` is always null because
no historical outcome pairs exist for the fictional swarm conditions.

Each horizon (5 primary, 20 sensitivity) contains exact `trainEventIds`,
`testEventIds`, `trainingCandidateIds`, `eligibleEventIds`, split/maturity dates,
`fit`, `exclusions`, `events`, `metrics` and score-unavailability reasons.
The boundary publication date is included wholly in training. Same-issuer
windows sharing even an endpoint are conservatively treated as overlapping;
the earlier eligible entry survives. Training outcomes must finish strictly
before the first test entry. These rules apply independently per horizon.

Entry is the first common session strictly after publication date. The session
calendar is the union of supplied US-session dates; missing stock/GLD/SPY data
invalidates a window rather than shortening it or forward-filling. The gold
predictor uses 60 log returns from 61 common closes ending strictly before entry.
It never uses the entry-day close or subsequent benchmark outcomes as a feature.

Event model adjustment per direction is the mean matured-training residual
times `n/(n+3)`, with an unseen direction contributing zero. Training row forecasts
are labelled `in_sample_training_fit`; only `held_out` test rows enter scores.
At least four matured train and three test events are required. Otherwise
`metrics` and `eventVersusGoldMaeReductionPercentagePoints` are null.

Numeric `metrics` has `goldBaseline`, `eventModel` and `noChange`, each with
`maePercentagePoints`, `sampleSize` and `directionHits` containing numerator,
denominator and rate. Direction hits compare the exact signs of forecasts and
observed returns, including zero. No-change predicts zero and is not silently
treated as an up forecast.

Event rows preserve source fields and add `entryDate`, `endDate`, `partition`,
`exclusionReasons`, `observedReturns`, `predictions` and `economicDiagnostic`.
Observed return keys are `stock`, `gld`, `spy`, `stockMinusGld`, `stockMinusSpy`.
Prediction keys are `noChange`, `goldBaseline`, `eventModel`, `eventAdjustment`
and `scope`. Missing values stay null. Valid observations excluded from fitting
by overlap or maturity remain visible with their exclusions.

The economic diagnostic is long only for favourable events, otherwise cash.
Its 0.005 round-trip cost is a fixed hypothetical stress, labelled separately
from observed prices. Adjusted-close execution is hypothetical. No portfolio
capital aggregation, short policy, actual trading-performance claim, option
return, or calibrated liquidity estimate is produced.
