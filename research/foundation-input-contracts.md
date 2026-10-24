# Foundation algorithm: input and output contracts

24 October 2026. Owner: Salman. These are the formats the [gold land-contract algorithm](gold-land-algorithm-foundation.md) reads and writes. Teammates own the inputs; this file only says what the algorithm needs from them. **Draft for agreement:** field names can change, but each change should be agreed with the owner.

Rules for every input:
- Each record carries `as_of` (when it was made) and `available_at` (when we could have known it). The algorithm ignores anything with `available_at` after the decision time.
- Unknown stays unknown. Use `null`, never `0` or a guess.
- Every record names its source and version (hash, run ID or URL), so any signal can be traced back.
- Records that fail validation are rejected with a reason, not silently fixed.

## 1. Swarm prediction

Owner: Muhd. The source is the per-run JSON record in [the gold swarm plan, section 6](gold-swarm-plan.md#6-outputs-per-run). The algorithm reads that record as it is; this is the shape it expects:

```json
{
  "run_id": "string",
  "variant": "cautious | moderate | free",
  "seed": 0,
  "shock": "none | mine_approval | tax_hike | protest",
  "model_tiers": "string",
  "mirofish_version": "string",
  "place": "tok_river_ak | nevada_district",
  "as_of": "2026-10-25T10:00:00Z",
  "available_at": "2026-10-25T10:00:00Z",
  "horizon_days": 5,
  "daily_sentiment": [
    {"day": 1, "government": "cold|warm|hot", "land_side": "cold|warm|hot", "buyers": "cold|warm|hot"}
  ],
  "gold": {"direction": "up|flat|down", "size_pct": 0.0, "confidence": 0.0},
  "policy": {"move": "string", "type": "tax|permit|contract|withdrawal|none", "direction": "tighten|neutral|loosen", "timing_days": 0, "confidence": 0.0},
  "political_leaning": {"direction": "string"},
  "evidence_refs": ["post or seed-fact IDs"],
  "grounding_ok": true
}
```

How the algorithm uses each part:

| Swarm output | Where it goes in the algorithm |
|---|---|
| `gold` direction and size | Tilts the near-term drift of the gold scenarios. Over a 5-day horizon it hardly moves a multi-year land value, which is intended |
| `policy` move, direction and timing | Probability of a policy event: a tax rise lowers the exit value, a withdrawal triggers the SKIP gate, a mine approval raises demand |
| `buyers` and `land_side` sentiment | Buyer demand. It shifts the chance of finding a buyer before a deadline, the time to sell and the exit price |
| `government` sentiment | Weight on policy-risk scenarios |
| Spread across seeds | The swarm's uncertainty: a wider spread means less weight |

Before any of this is used, runs are aggregated per variant and shock:
- Cold/warm/hot is mapped to −1, 0 and +1.
- Daily values are averaged.
- The across-seed spread is recorded.
- Runs with `grounding_ok = false` are dropped.

A view built from fewer than 3 runs is ignored. While the swarm is unproven its weight is capped at about 25%; see the [foundation, layer 4](gold-land-algorithm-foundation.md#layer-4-swarm-prediction). If the interviews come back as free text, a Jev or rules-based step fills these fields and records which one was used.

## 2. Demand prediction (claim bursts)

Owner: Arjin (`arjin/nv-az-claim-data`). One row per cell per forecast:

| Field | Meaning |
|---|---|
| `cell_id` | A 1-square-mile cell, keyed by PLSS section (MTRS) in NV/AZ or a grid ID in AK |
| `as_of`, `available_at` | Forecast date, and the latest claim record date it used |
| `horizon_months` | 12 by default |
| `p_burst` | Chance of a burst of new claims in the cell within the horizon |
| `expected_new_claims`, `p10`, `p90` | Expected count and its range |
| `model_version`, `train_end` | Which model, and the last date its training data covered |

The algorithm turns this into two things: the chance an end buyer appears before a contract deadline, and the demand term in the exit price. The definition of a "burst" must be fixed before the backtest starts.

## 3. Gold evidence and land matches

Owners: Amit for the gold packs ([evidence contract](gold-evidence-contract.md)), Arjin for the Tok land matches (`research/tok-land/` on `arjin/tok-land-data`).

The algorithm reads these existing files and requires nothing new:
- `samples.csv` and `samples.geojson`: Au ppm with censoring flags. Censored values are never treated as zero.
- `tok_sample_claim_matches.csv`: which claims each sample falls in, plus claim status, owner, start date and distance to the nearest active claim.
- `gold_deal_comparables.csv` (Alaska) and [NV/AZ contract comparables](gold-contract-comparables/README.md): prices and terms.

A point inside a claim is a spatial fact only. It doesn't prove where the gold came from, who owns the minerals, or whether the land is available. The mineral-rights and title gates must still pass.

## 4. Contract opportunity (what we are deciding on)

One record per offer, listing or contract we hold:

| Field | Meaning |
|---|---|
| `opportunity_id`, `as_of`, `source_url` | Identity and evidence |
| `held` | `true` if we already hold this contract (then HOLD or SELL), otherwise `false` (then BUY or SKIP) |
| `contract_type` | `purchase`, `option`, `assignment`, `brokerage`, `contract_for_deed`, `earn_in`, `royalty` or `lease` |
| `region`, `cell_ids`, `geometry_ref` | Location, linked to the demand cells and land records |
| `acres`, `claims_count`, `claim_type`, `tenure` | Size and type; tenure is `federal_blm`, `state_ak`, `patented` or `private` |
| `price_usd`, `premium_usd`, `strike_usd`, `earnest_usd` | Price terms; leave blank if they don't apply |
| `payment_schedule`, `work_commitment_usd`, `nsr_pct` | Option and earn-in terms |
| `due_diligence_days`, `closing_or_expiry_date`, `assignable` | Time terms |
| `carry_usd_per_year` | Fees or rent; for BLM claims, $200 per claim |
| `gate_inputs` | Title, mineral rights included, access, fees paid, overlaps, withdrawal, liabilities, water; each `pass`, `fail` or `unknown` |
| `price_kind` | `sale`, `asking` or `assumption`. An asking price is never treated as a sale price |

A gate marked `unknown` counts as not passed. The result is SKIP until someone checks it.

## 5. Decision record (output for the demo and UI)

One record per opportunity per decision date:

```json
{
  "opportunity_id": "string",
  "decision_time": "ISO-8601",
  "signal": "BUY | HOLD | SELL | SKIP",
  "contract_structure": "e.g. option_12m_5pct",
  "expected_profit_usd": 0, "profit_p10_usd": 0, "profit_p90_usd": 0,
  "p_profit": 0.0, "cvar95_usd": 0,
  "families_agreeing": "4/5",
  "waterfall_usd": {"value": 0, "price": 0, "costs": 0, "carry": 0, "waiting_value": 0, "risk_penalty": 0, "swarm_adjustment": 0},
  "top_drivers": ["string"],
  "gates": {"title": "pass", "mineral_rights": "pass"},
  "swarm": {"used": true, "weight": 0.0, "runs": 0},
  "data_versions": {"gold_prices": "hash", "claims": "hash", "swarm_runs": ["run_id"]},
  "seed": 0,
  "reasons": "plain-English one-liner"
}
```

`swarm.used = false` means the decision came from land and gold data alone. With the same inputs, versions and seed, a decision record must reproduce exactly.
