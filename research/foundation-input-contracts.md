# Foundation algorithm: input and output contracts

24 October 2026. Owner: Salman. These are the formats the [gold land-contract algorithm](gold-land-algorithm-foundation.md) reads and writes. Teammates own the inputs; this file only says what the algorithm needs from them. **Draft for agreement:** field names can change, but each change should be agreed with the owner.

Rules for every input:
- Each record carries `as_of` (when it was made) and `available_at` (when we could have known it). The algorithm ignores anything with `available_at` after the decision time.
- Unknown stays unknown. Use `null`, never `0` or a guess.
- Every record names its source and version (hash, run ID or URL), so any signal can be traced back.
- Records that fail validation are rejected with a reason, not silently fixed.

## 1. Swarm prediction

Owner: Muhd, with Ahmed's [revised society plan](https://github.com/amitvijapur/oxhack-2026/blob/71f25ea/research/gold-swarm-plan.md) (branch `ahmed/gold-society-plan`, revision 2): one 61-agent Tok society, five simulated days, and seven scenarios.

| # | Day-3 news | Use in the algorithm |
|---|---|---|
| 0 | None (baseline; 3 seeds) | No-swarm comparison and the chance band |
| 1 | State approves the new mine | Candidate demand-up scenario |
| 2 | Alaska proposes a higher gold-mining tax | Candidate exit-value-down scenario |
| 3 | Local protest over water and land | Candidate delay or closing-risk scenario |
| 4 | Placebo (school sports) | Control only; must change nothing |
| 5 | Court blocks the mine | Mirror of 1 |
| 6 | Gold falls back to $4,000 | Mirror of the day-1 breakout |

The algorithm reads the per-run JSON record from the plan's section 6, and the results table built from it:

```json
{
  "run_id": "string",
  "scenario": 0,
  "seed": 1,
  "tiers": "string", "mirofish_commit": "string", "patch_hash": "string",
  "place": "tok_river_ak",
  "as_of": "ISO-8601", "available_at": "ISO-8601",
  "horizon_days": 5,
  "daily": [
    {"day": 1, "group": "government | industry | community | funds | retail", "support_0_10": 0.0, "heat_posts": 0}
  ],
  "calls": {
    "price": {"direction": "up | flat | down", "size_fraction": null},
    "policy": {"move": "string", "timing_days": null},
    "leaning": {"direction": "for | against | split"}
  },
  "checks": {"placebo": "pass | fail", "mirrors": "pass | fail", "stability": "pass | fail", "grounding": "pass | fail"}
}
```

`size_fraction` uses `0.05` for +5%, and stays `null` if no number was given. Gold `price.direction` and size describe five days only.

**How the algorithm uses it (first version):**

1. **Checks gate the swarm.** Use a scenario only when the placebo check passes, and the mirrors check passes for a mirrored pair. If either fails, show the run as narrative context with `swarm_used = false` in decisions.
2. **Effects, not levels.** Use each scenario's effect per group: mean support over days 3–5 minus the seed-1 baseline, compared with the three-baseline chance band. Effects inside the chance band are treated as no effect.
3. **Explicit mapping to economics.** Each effect that drives a decision has a versioned mapping: event → affected field → magnitude → onset → duration. For example, "tax rise, funds below the band → exit price −X% from day 3, held to contract expiry" or "protest → closing delayed N days". The magnitudes are labelled assumptions, not swarm outputs.
4. **Show both results.** Report the decision without the swarm and with each mapped scenario, and say whether the action changes. No probability blending in the first version.
5. **No persistence by default.** A five-day gold move does not continue past day five unless a mapping states retention, decay or reversion.

If the interview answers arrive as free text, an extraction step fills `calls`. It uses Jev, OpenAI Decisions or rules, and records which one ran; see [Jev extraction](jev-extraction-and-images.md).

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
| `gate_inputs` | Title, mineral rights included, access, fees paid, overlaps, withdrawal, liabilities, water; each `pass`, `fail`, `unknown` or `not_applicable`, with source, date and method |
| `jurisdiction`, `user_role`, `compensation_from_third_party`, `user_licence_states` | Who is acting and how. `user_role` is `principal` or `agent`; an agent paid by a third party triggers the licensing check in [land-contract licensing](land-contract-licensing.md) |
| `investor_count`, `passive_investors` | Selling fractions or royalties to many passive investors needs a securities review |
| `blm_transfer_filed`, `dnr_transfer_recorded`, `legal_review_required` | Transfer filings (BLM 43 CFR 3833.32; Alaska DNR quitclaim) and a flag for open legal questions |
| `price_kind` | `sale`, `asking` or `assumption`. An asking price is never treated as a sale price |

A known `fail` excludes entry, so SKIP remains feasible. A required gate marked `unknown` produces `manual_review` with no action, never a silent SKIP or BUY. Brokerage actions are only offered when the licensing fields allow them; otherwise the output says, for example, "SELL (principal only); brokerage blocked in AZ".

## 5. Decision record (output for the demo and UI)

One record per opportunity per decision date:

```json
{
  "opportunity_id": "string",
  "decision_time": "ISO-8601",
  "status": "ok | insufficient_inputs | manual_review | unsupported_contract",
  "valuation_mode": "evidence_only | scenario | empirical",
  "signal": "BUY | HOLD | SELL | SKIP | LAPSE | EXERCISE | null",
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

`signal` is `null` whenever `status` is not `ok`. The combined strategy's output fields (ledger by scenario, peak funding, excluded actions with reasons, families tested) are the fuller target; this record is the minimum. `swarm.used = false` means the decision came from land and gold data alone. With the same inputs, versions and seed, a decision record must reproduce exactly.
