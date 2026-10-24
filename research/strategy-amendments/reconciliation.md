# Reconciliation with Salman's revised strategy

24 October 2026. Owner: Amit for acceptance and integration. Result: [combined gold land-contract strategy](../gold-land-strategy.md). This is local document synthesis, not an application build or a GitHub merge.

## Sources reviewed

| Source | Pinned revision | What changed |
| --- | --- | --- |
| Salman original strategy | `3a84a2ce77644521229bd1f4d61fea03c7ee1635` | Original 487-line algorithm proposal on `strategy-algorithm`. |
| Salman revised foundation and input contracts | `ab660a94c3998e9345793987cd7f3342f93848a1` | [PR #23](https://github.com/amitvijapur/oxhack-2026/pull/23), branch `salman/gold-algorithm-foundation`, pushed 24 October at 21:25:46 London time. New 324-line foundation, 125-line handoff and 40-row NV/AZ catalogue. |
| Arjin Tok land handoff | `9517fc23379eea77b567af28c17587b273490b0a` | State-claim joins, summary, ten Alaska agreement rows and reproducible acquisition script. |
| Arjin NV/AZ acquisition reference | `4fce36c0667365a13dcb585167a78085003b969a` | Claims acquisition code; full raw history was not downloaded or validated by this review. |
| Muhd swarm plan and shared main | `75d9bd12fc53977f7e8d97213cb2f9032d52f46d` | Five-day stakeholder plan and teammate responsibilities. |
| Our scoped research | [Amendments A1–A8](README.md) | Rights/valuation research, evaluation/fusion research, decision contract and exact synthetic fixture. |

The revised branch starts from main rather than descending from the original strategy commit. Therefore the review compared document content as well as Git diffs. Discovery verified the downloaded contents against Git blob hashes; the [source manifest](reconciliation-sources.json) records stable paths, revisions and hashes. PR #23 was open with `Repository checks` and `Secret scan` passing at discovery. Those checks do not establish the model's validity. Source content was read through the GitHub CLI because the connected GitHub tool returned 404 for this private repository.

## Three-way comparison

| Amendment | What Salman's revision adds | Remaining issue | Combined decision |
| --- | --- | --- | --- |
| A1, interest and rights | Tenure, claim type, held/not-held distinction, explicit gates and acknowledgement that point-in-claim is only spatial | Universal surface floor persists; fraction and detailed interest are missing; unknown gates always become SKIP | Keep gates and tenure. Add explicit interest/fraction/position states; remove universal floor; use unavailable/manual review for unknowns. |
| A2, monetary valuation | More research references, hedonic/partial-pooling roadmap and real comparables | Area × geology × gold-option factor remains undefined in property dollars; miners' equity beta is treated as land guidance | Use executable terms, normalized monetary estimates or explicit cash-flow scenarios. Retain economic development options as a later module with required inputs. |
| A3, contract terms | Major improvement: 40 NV/AZ disclosures, type/schedule/work/royalty fields, explicit catalogue caveats | Totals still mix incomplete consideration, fractions, remaining commitments and outcomes learned later | Retain the catalogue and its limitations. Normalize component terms and dates; add linked property/agreement/event identities before fitting. |
| A4, decision core | Worked purchase/option/HOLD/SELL example, expiry/closing concepts and dollar explanations | Extra waiting-value line, no full funding/event ordering, instant resale assumption, boolean holdings and blanket gates | Use a single dated ledger, permitted actions, information at each node and pre-receipt funding. Show comparison/risk effects separately. Use the fully specified acceptance fixture. |
| A5, target and clocks | Explicit five-day gold output, per-day sentiment and location in the handoff | Five-day drift tilt can persist in price levels; units and mappings to buyer arrival, policy probability and land dollars remain unspecified | Freeze exact target and fractional units. Require explicit economic response and persistence mapping; retain no-swarm baseline. |
| A6, swarm confidence | Acknowledges same-model dependence, grounding checks, reruns and provisional cap | Still calls seed spread plus model variance a precision-fusion basis; 20 resolutions unlock more weight too mechanically | First use is scenario comparison. Repeatability and calibrated accuracy remain separate; learned fusion requires relevant held-out evidence. |
| A7, validation | Forward/spatial tests, region-domain checks, `available_at`, explicit scarcity of prices | Claims are still offered as strongest proof of the wider monetary model; forecast availability definition and retrospective terms leak; conformal coverage overclaimed | Separate activity, monetary, solver and swarm validation. Track fact-level vintages and resolved labels; qualify transfer and interval coverage. |
| A8, delivery and output | Concrete teammate schema, tiered build and richer examples | Tier 1 needs an unsupported monetary conversion and backtest; two enabled families cannot meet 4/5 rule; all outputs require numbers | First deliver exact calculator and nullable typed output, then source adapters/scenario mapping/UI. Count actual families. Preserve advanced roadmap without blocking the first demo. |

All eight amendments are incorporated into the combined draft. This means resolved **in the design**, not implemented or empirically proved. Salman materially improved the data and interfaces; the synthesis keeps those improvements instead of repeating the original claim that contract examples are absent.

## Bounded audits of the new evidence

### NV/AZ catalogue

An independent read-only audit counted 40 rows and 25 columns: Nevada 29, Arizona 11; 15 options, ten purchases, seven leases, four earn-ins and four royalty sales. Twenty-five rows have a total-consideration estimate and 21 have a per-acre figure. Twelve areas use the claim-count × 20.66 assumption. The README's 14-row selected subset reproduces a median $279.55/acre and $5,777.50/claim. Correct arithmetic does not make the selection a homogeneous property-price sample.

Material row findings:

- AZ-08 and AZ-11, CSV lines 38 and 41, refer to the same 107 Gold Chain claims. The [issuer's 2023 amendment](https://westpointgold.com/gold79-announces-amendment-of-a-gold-chain-property-option-agreement-reducing-near-term-cash-payments/) describes $415,000 cash plus $192,000 shares in remaining commitments. The [2026 issuer announcement](https://westpointgold.com/west-point-gold-gold-chain-project-arizona/) describes $960,000 accelerating payments and removing royalty/bonus obligations. They are not a clean resale-return pair. Exact independent property/event counts require further normalization.
- NV-18 is a royalty transaction spanning four district-scale positions, confirmed by the [SEC-filed issuer release](https://www.sec.gov/Archives/edgar/data/1285786/000106299322019134/exhibit99-1.htm). Royalty consideration cannot label full-property value.
- NV-25's $900,000 cash excludes 950,000 unvalued shares and $1 million work. NV-28's $345,500 cash sits beside $2.7 million work and staged 51%/65%/79% interests. NV-26 excludes contingent milestones. These are incomplete or different economic interests, not interchangeable whole-property prices.
- NV-03 is dated March 2020 but includes a 2025 exercise. AZ-03 includes 2024 completion from a 2026 filing against a 2020 announcement date. A backtest cannot expose those later facts at the original agreement date.
- Completion/exercise notes in five rows do not include the subsequent exit receipts and complete costs needed for investment-return labels. Source-quality labels and a filled USD column do not change this.

This is a count/schema audit plus three primary-source spot checks, not verification of every disclosure, current title or all underlying economics. The catalogue is useful immediately for selecting real terms examples; empirical monetary validation still needs suitable outcomes.

### Tok matches and Alaska agreements

A separate read-only audit reconciled the CSV with its summary: 76 join rows represent 67 distinct samples. Deduplicated active-claim intersections are A 2/33 and B 20/34. Two A samples and one B sample intersect both active and closed records, so those categories are not disjoint. There are one and 13 distinct active claims containing A and B samples, respectively. Counting rows as samples would inflate coverage.

The recorded owner strings and October 2026 status snapshot are contextual evidence. `NTPSTDT` semantics remain unconfirmed, and federal/Native/state land-status coverage is incomplete. The Delta package's 249 claims, 80 claims in the query box and 13 overlapping A's sample window refer to different extents. Closing was expected in Q4 2026 in the handoff; it was not shown as complete. Consideration spans Delta and Helm Bay, including shares, warrants and contingent milestones.

The Alaska $170–205/acre examples cannot anchor a gold-claim price at Tok. One is an antimony option with staged payments and work; another bundles assets and consideration whose filing was not reread by the contributor. Other rows include related-party transfers, advanced/producing assets, an equity acquisition and a terminated option. The combined draft retains the evidence with these limitations and drops the implied empirical $190/acre anchor.

These checks reconcile the contributor's files. They do not independently establish title, source-date semantics, currently available land or an executable contract.

## Decisions that remain assumptions or later research

- The first calculator uses the existing fictional USD fixture, declared scenario probabilities and risk settings. A real offer/holding and supported exit economics remain prerequisites for a real monetary result.
- Partial pooling, filtered comparable estimation, conformal intervals, LSM, richer contracts and calibrated swarm fusion remain candidate modules with specific data and validation dependencies.
- A one-off shock run may be displayed as an explicit stress scenario even if it lacks three reruns. It cannot claim measured repeatability. Muhd's shock schedule should not be silently discarded by a blanket three-run rule.
- OpenAI Decisions API capability verification belongs to implementation. A parser fallback remains available; the strategy does not invent an API contract or substitute Jev for Amit's preference.
- Actual fees are keyed to tenure and effective date. The current [BLM schedule](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims/fees) was checked, including initial maintenance within $274 and placer differences. Alaska state rates remain a separate unresolved input.

## Verification

- **Independent design review: PASS.** A separate reviewer read the new foundation/input contracts, combined strategy and fixture. It confirmed preservation of the substantive new work and resolution of A1–A8 within the design. The review caught an inverted information-invariant sentence; it now correctly forbids access to unrevealed future information. The correction was independently rechecked.
- **Exact arithmetic: PASS.** Parent calculations with rational probabilities and independent reviewer calculations reproduced purchase outcomes $25,500/-$14,500, expectation $9,500, funding $102,500; option outcomes $23,000/-$3,000, expectation $12,600, funding $105,000. The premium, deadline and budget cases reconcile. Added an explicit purchase payment-order sentence to the existing JSON fixture; no numerical values changed. Missing-bid abstention remains a specified behavior, not executed application code.
- **Links and files: PASS.** Twenty-five local Markdown link targets resolve. The first pass found a remote-main-only evidence document linked locally; it now links to the pinned GitHub source. JSON parsing, all 12 source SHA-256/Git blob hashes, authored Markdown whitespace and scoped `git diff --check` passed. No broad application test run was needed for this document-only change.
- **Latest revision recheck: unchanged.** At 20:38:59 UTC on 24 October, PR #23 remained open on `ab660a94c3998e9345793987cd7f3342f93848a1`, with `merged_at = null`. No subsequent Salman revision was omitted at that check.
- **Limits.** No solver, forecast, demand model, empirical return backtest, live rights review or swarm execution was implemented by this task. The new catalogue received a schema/count audit and three source spot checks, not a complete source audit. The combined strategy is ready for team review and implementation planning; it is not evidence of profit or validated Alaska transfer.
