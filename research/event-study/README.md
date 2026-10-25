# Alaska mining event pilot

This is a retrospective component test using real public project announcements and public-equity prices. It is separate from the hypothetical Tok option calculator. No forecast accuracy or trading advantage is assumed in advance.

## Reproduce

Use Node 24 and Python 3.9+ standard library. No new package installation is required.

```sh
# Committed normalized prices preserve the reviewed snapshot.
node research/event-study/evaluate.mjs
node --test research/event-study/evaluate.test.mjs

# Optional vendor refresh. This changes the snapshot and must be reviewed.
python3 research/event-study/fetch-prices.py /tmp/oxhack-real-event-prices
```

Raw vendor responses stay outside Git. `prices.json` stores daily adjusted closes, dates, currency, source URLs, retrieval times and raw-response SHA-256 checksums. Exact company/instrument identities are checked; NG means US-listed NovaGold, not the London-listed National Grid. No missing quote is forward-filled. A cached raw file is reused only if its URL and hash match its manifest.

Read [protocol.md](protocol.md) for the fixed selection, timing, model and cost rules. [events.json](events.json) contains primary-source publication dates and event directions; [source-notes.md](source-notes.md) records coverage and exclusions. The generated website output is `frontend/public/data/event-study.json`.

## Interpretation

The test compares a no-change reference, a simple gold-only drift forecast and that forecast plus a direction-based event adjustment learned from earlier events. Five trading sessions is the primary horizon; 20 is a sensitivity. Predictors use only sessions before entry. The entry is a hypothetical close on the first common trading session strictly after the source publication date. Adjusted prices support total-return comparisons but are not literal execution quotes.

Metrics refer to the chronological holdout from model fitting. This is a small, retrospectively selected, two-issuer pilot, not a prospective or preregistered investment trial. Announcements can overlap other news, firms have other exposures, vendor history can be revised, and the event search is not guaranteed comprehensive. Held-out observations are not necessarily independent. Report counts, losses and negative findings; do not tune thresholds after inspecting them.

An observed stock-minus-gold return is a descriptive comparison, not a forecast, causal estimate or realised hedged strategy. The fixed 50-basis-point cost stress is an assumption. No quoted Tok contract, actual option fill or assignment return is established. A favourable event label is document coding, not a swarm output. Existing simulated conditions have no paired realised outcomes, so swarm incremental lift is unavailable. The historical study never silently changes the hypothetical option model's inputs or coefficients.
