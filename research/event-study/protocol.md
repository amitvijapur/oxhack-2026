# Alaska project event pilot protocol

Frozen before inspecting outcome returns, 25 October 2026. Human owner: Amit.

## Selection

Universe: US-listed NOVAGOLD (NG, Donlin Gold) and Northern Dynasty (NAK, Pebble). Gold-bearing Alaska projects are selected for geographical and mineral relevance, not observed share performance. Window: 2020-01-01 through 2025-12-31. This six-calendar-year pilot is a bounded event sample, not the requested future five-year rolling forecast. Include identifiable dated primary agency, court or issuer announcements of material permitting decisions, formal regulatory proposals/final actions, and court/administrative rulings on those decisions. Exclude exploration/drilling, earnings, financing, ownership deals, general lobbying, lawsuits merely filed, duplicate coverage, and opinion. Record all qualifying events located under these fixed rules, including adverse and favourable actions. State that source search may be incomplete; do not claim a comprehensive universe. No selection using returns.

Code each event favourable (+1), adverse (-1), or mixed/uncertain (0) using the document's effect on project advancement, before prices are examined. Keep event direction separate from observed share return and swarm sentiment. Record exact publication timestamp and timezone when verified; otherwise preserve date-only uncertainty.

## Timing and prediction

Use the first common US trading session strictly after the publication calendar date as the decision/entry close. This conservative date-only rule avoids assuming intraday availability or a fill at a pre-announcement price. Evaluate 5- and 20-trading-session close-to-close returns after that entry. Five sessions is primary; 20 is sensitivity. The initial announcement reaction is deliberately outside the strategy return. Compare benchmark GLD (gold ETF, explicitly not spot gold) and SPY (broad equity market). Use split/dividend-adjusted close if verified; otherwise disclose raw-close limitations and block affected corporate-action windows. Require complete aligned dates; never forward-fill missing prices.

Chronological split: first 60% of eligible events train, remaining 40% test; keep same-date events together. Fit only on matured training outcomes strictly before the first test entry. Overlapping same-issuer outcome windows are excluded mechanically, retaining the earlier event for each horizon. At least four matured training events and three test events are needed for a numeric model-comparison score; otherwise show insufficient sample and individual observations without an accuracy claim. No random split of posts or events, no tuning on test outcomes.

Gold-only forecast baseline: use the trailing 60 common-session GLD log returns ending on the session strictly before entry (61 prior closes) to estimate a drift projection over the horizon (a deliberately simple baseline). The entry-day closing quote is never a predictor, so the predictor is available before the assumed entry-close execution. No-change forecast is an additional reference. Event model: same forecast plus the training mean of (stock return minus gold-baseline forecast) per pre-coded event direction, shrinking with a fixed prior strength of three observations toward zero. Unseen direction gets zero adjustment. Parameters fixed here before outcomes. This is a modest event component, not a fitted swarm model. Mean absolute error and direction counts are primary descriptive metrics; report numerator/denominator, not just percentages. Small selected sample, repeated issuers and correlated events prohibit a broad predictive-accuracy claim.

## Economic diagnostic

Show observed stock minus GLD and stock minus SPY returns over the same executable window as descriptive benchmark comparisons, not model forecasts or a replicated risk-neutral hedge. A long-only event policy takes favourable events and holds cash otherwise; no short-sale assumption. Report raw returns and a fixed illustrative 0.50% round-trip cost stress, clearly not measured execution costs. Do not report this as Tok option profit, actual trading performance, Sharpe significance, or a calibrated illiquidity estimate. Portfolio aggregation may be omitted if overlapping capital cannot be represented faithfully.

## Swarm boundary

There are zero observed historical outcomes paired with existing fictional swarm conditions. Swarm incremental lift remains unavailable; do not fabricate retrospective swarm scores or substitute event polarity for them. The option calculator remains hypothetical. The pilot validates, or fails to validate, only a liquid-equity event component. Actual option quotes, recoverable resources, assignment outcomes and future pre-outcome swarm predictions remain separate requirements.

Pre-outcome timing clarification: the 60-return lookback ends before entry, avoiding same-close signal/execution timing leakage. Added before any event returns were examined.
