# Historical pilot results

25 October 2026. This is a retrospective selected-sample assessment, not live trading performance or a validated Tok option strategy.

The 12-event ledger was fixed at 07:22:05 UTC before any event returns were inspected. Its SHA-256 is `fcd5cf8dfee08767b9a175597001a17bb9bcb1e4fd4edbe808f44b2a5b9249e0`. It contains nine Northern Dynasty/Pebble and three NOVAGOLD/Donlin events from 2020–2025. Five document effects are favourable, six adverse and one uncertain. Selection and labels were not changed after viewing returns.

Yahoo Finance supplied 1,631 attributed daily adjusted closes for each of NG, NAK, GLD and SPY. All four use USD and New York session dates. The normalized source has no missing quotes. Raw-response hashes, original URLs and acquisition times are retained in `prices.json`; the raw bodies remain outside Git. The connected Financial Datasets service was unavailable because of credits/authentication, so no paid API or new swarm simulation was used.

## Held-out result

Lower mean absolute error is better. Values are percentage points of share return.

| Horizon | Matured train / test | Gold-only drift MAE | Gold + event MAE | No-change MAE | Event error increase vs gold |
| --- | ---: | ---: | ---: | ---: | ---: |
| 5 trading sessions, primary | 7 / 5 | 3.1291 | 8.0596 | 2.5562 | 4.9305 |
| 20 trading sessions, sensitivity | 6 / 5 | 7.5670 | 14.3108 | 5.9474 | 6.7438 |

The simple event adjustment failed to improve the gold-only baseline. No-change performed best on both selected cohorts. This is evidence against this particular fitted adjustment in this pilot; it does not prove that all event information or future swarm predictions are useless.

Direction matches, including exact flat returns, are gold/event/no-change 1/5, 1/5 and 3/5 at five sessions, and 1/5, 0/5 and 2/5 at 20. Three primary NAK windows are unchanged at the vendor's supplied price precision. The raw close and adjusted close agree, but a finer-precision independent check was unavailable: Stooq returned a browser challenge and Nasdaq returned no records for the queried historical window. Do not present these counts as a reliable market-wide accuracy estimate.

The 20-session cohort differs because the later Donlin court event overlaps the preceding same-issuer window and is excluded under the predeclared rule. The chronological split is recomputed for each horizon's eligible cohort, so the two horizons are not identical samples. Dates, train/test IDs and exclusions are in the generated website artifact.

## What was controlled

- Entry is the first common trading session strictly after documented publication, using a hypothetical closing execution. No initial announcement jump is counted as captured profit.
- Gold drift uses 60 log returns from 61 closes ending strictly before entry. Same-day entry quotes and future prices are never predictors.
- All training outcomes mature strictly before the first test entry. Same-date events stay together; same-issuer overlapping windows are excluded mechanically.
- Event adjustment is the earlier training residual mean by pre-coded direction, with fixed prior strength three. There was no tuning or event reselection after results.
- GLD and SPY realized comparisons are descriptive benchmarks, not future information in the forecast. The 50-basis-point cost stress is hypothetical, and favourable-event longs are separate diagnostics.
- Historical swarm lift remains null because the existing fictional simulation conditions have no paired realized market outcomes. Event polarity is not relabelled as swarm sentiment.

## Limits and verified scope

The source search is incomplete. Several adverse or mixed Donlin rulings lacked a verified contemporaneous qualifying source and were excluded, causing source-availability and direction bias. Date-only issuer/government publications sometimes lag decisions and first awareness. These observations may be anticipated, correlated or confounded by other news. Current-vintage adjusted prices may be revised. These limitations are visible in the website, not just this report.

Independent review reproduced all source-normalized prices and the two sets of metrics, spot-checked primary publication dates, and tested future/entry-day price mutations. Evaluator tests cover timing, no look-ahead, overlap, maturity, sample thresholds, missing-price rejection and costs. The website renders actual observations, source links, both horizons, null states and negative findings. The hypothetical option calculator is unchanged.

The next empirical work requires a broader, more consistently sourced event ledger, a separately reserved test period and genuinely pre-outcome swarm predictions. Do not change coefficients until the current pilot result has been recorded, and do not describe equity evidence as Tok assignment returns.

## Verification completed

- `node --test model/tok-option/tests/*.test.mjs research/event-study/evaluate.test.mjs`: 137 passed, zero failed, including 11 new evaluator tests.
- `cd frontend && npm test`: 27 passed, zero failed, including four parser/render tests for the actual evidence component.
- Frontend type checking, scoped lint and the production Webpack build passed. `git diff --check` passed. The local CI test command was extended without changing required check names; hosted CI was not run and `actionlint` was unavailable on PATH.
- Independent review reproduced all normalized price inputs, chronological partitions, forecasts and metrics, and spot-checked three primary publication dates. It found no unresolved blockers after source-selection and precision caveats were included in the website output.
- The local production page displayed both five- and twenty-session results, all twelve event rows, source links and limitations. Desktop at 1440 pixels and mobile at 320 pixels had no page overflow. The mobile production page had no browser console errors.
- The existing option calculator still showed USD7.60 baseline cash. Selecting recorded swarm results showed USD5.45 approval cash and USD1996.47 hypothetical gold, confirming that the historical pilot did not change its economics.

The verified local site is `http://127.0.0.1:5182/`, under Explore, then Decision, then Historical event test. No hosted deployment or Git push was performed.
