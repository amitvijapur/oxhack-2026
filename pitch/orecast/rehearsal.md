# Orecast five-minute rehearsal

Use the current whole-lot deck. Orecast is the selected name; Mineral intelligence over time is proposed descriptor copy. Keep the approved white/charcoal compositions.

## Main sequence

| Slide | Seconds | Cumulative | Speaking cue |
| --- | ---: | --- | --- |
| Orecast | 20 | 0:20 | Introduce an inspectable mineral decision over time. |
| Time and evidence | 30 | 0:50 | Separate the three clocks. Introduce the historical $30,000 payment reference and $30,050 assumed entry. |
| Observed evidence | 30 | 1:20 | Show 67 samples, A33/B34. Evidence does not supply ounces or available rights. |
| Gold forecast and assignment | 60 | 2:20 | Follow the layers downward. Support changes assumed gold first; valuation stays independent of entry cost. |
| Recorded scenario contrast | 55 | 3:15 | Compare the same whole lot. Gold changes slightly, but both scenarios remain SKIP. |
| Time and return | 60 | 4:15 | Reveal −97.65% baseline return and SKIP. Distinguish the 25% resale hurdle from the $1,500 valuation. |
| Demonstration | 45 | 5:00 | Allow up to 20 seconds for approval to blockage. Finish with real contract and liquidity validation. |

Slides 8 and 9 are appendices for questions. Total main sequence: exactly 300 seconds.

## Opening

Orecast investigates how evidence, an assumed gold forecast and the time available to find a buyer affect a mineral decision. It makes the calculation inspectable, including when the right model result is to skip an expensive entry.

## Live path

Run the team app using the repository instructions and open `http://127.0.0.1:3000/swarm`. The checked source revision is `37991ad5de416e5abf8541264c5f4926a2ec91e8`. Rehearse that revision before presenting. Use the saved captures or PDF if the browser differs.

1. Select Area A, 90 days and simulated day 5.
2. Select Mine approval, seed 1. With the $30,050 whole-lot entry, the calculation shows $1,996.47/oz gold, $1,495.59 assignment proceeds, **−$29,344.55 expected cash**, **−97.65% expected option return** and **SKIP**.
3. Select Court blocks mine, seed 1. Gold becomes $2,004.30/oz and assignment $1,505.38, but expected cash is **−$29,339.78**, return **−97.64%**, and the action remains **SKIP**.
4. Show the required-resale diagnostic if convenient. A 25% expected 90-day return requires **$77,022.34 conditional gross assignment proceeds**. This is a hurdle, not a forecast. It is not substituted into the valuation.
5. Restore Mine approval before replaying.

The workflow uses a pinned calculation snapshot, not another page's edited controls. The expanded full calculator in **Decide** has a different synthetic startup/reset example: signal +0.5, 1% gold cap and 50% retention. At the new lot basis it has $2,005 gold, $1,506.25 assignment, **−$29,339.35 expected cash** and approximately **−97.64% return**. Do not present it as the recorded approval comparison.

## Lot pricing and capital

Two selected historical initial payments, Tibbs and Northway, were each US$30,000. Their mean and median are therefore US$30,000. This is not a representative current Tok market price or a quote for the modeled interest. The observations involved the same acquirer, different rights and major additional obligations. Northway also had scholarship and work commitments. Those costs are not silently treated as zero in a real deal; this demo separately assumes a $50 entry fee, $50 exit fee and no additional upfront obligations.

The simulated fund is exactly **$1,502,500**. One lot uses **$30,050**, the 2% per-option limit. Open risk and lifetime cohort commitments are both capped at **$150,250**, or five such lots. Five-position capacity is a constraint, not a claim that five acceptable contracts exist. No reinvestment, exercise, borrowing or trade execution occurs.

## Explaining the skip

The independent baseline valuation keeps 500 assumed recoverable ounces and $2,000/oz gold, with 50% ownership, 2% conversion, 25% geological success and $4,000 buyer consideration. It yields **$1,500 assignment proceeds**, not a fabricated markup on the $30,000 entry reference.

At zero gold growth, expected 30/90/180-day cash is **−$29,760.00 / −$29,342.40 / −$28,980.11**. All horizons skip. The 90-day sale probability is 48.8%, while 51.2% of paths do not sell. A sale leaves −$28,600 cash after costs; no sale leaves −$30,050. Their weighted average is −$29,342.40. Non-annualized return is that cash amount divided by $30,050, or −97.64526%.

An unsold option can remain held, so horizon cash shortfall is not automatically a final realized economic loss. Unsold marks do not fund another position. Horizon plus the 15-day closing buffer must fit inside the 365-day assumed maturity.

## Underwriting hurdle

For constant assignment proceeds across possible sale dates:

`E[cash] = q × (S − exit fee) − upfront capital`

A 25% expected return therefore needs `S = $30,050 × 1.25 / 0.488 + $50 = $77,022.34`. Cash break-even alone needs $61,627.87. Neither amount was observed as a resale price. No assumed willingness to pay is inferred from stakeholder support. With a $1,500 independent assignment valuation, the model rejects the lot.

## Questions and validation

**Has Orecast shown a predictive edge?** No. The retrospective equity pilot is a separate component test. At five sessions, five held-out observations had MAE of 2.5562 percentage points for no change, 3.1291 for gold only and 8.0596 for gold plus event. The fitted event adjustment did not beat baseline. No historical swarm predictions are paired with realized financial outcomes.

**Why does approval lower the result?** The recorded support contrast is negative against the matching sports-placebo reference. The calculation preserves that sign. The placebo is not an untreated control, and failed research checks remain failed.

**Does the 7% cap limit loss?** No. It bounds an assumed gold-price response coefficient. It does not calibrate resale value or cap capital loss.

**Do the samples establish a legal lot or recoverable ounces?** No. A/B are evidence partitions, not legal parcels. Assay concentration does not establish recoverable resources, geological success, assignment permission or an available contract.

Next validation needs a specified assignable interest with full costs, independent buyer/resale evidence, completed and unsold assignments, and genuinely pre-outcome swarm predictions evaluated chronologically against simple baselines.

## Sources and fallback

The two historical payment sources are [Tectonic's 2019 Q2 MD&A](https://www.tectonicmetals.com/_resources/financials/MDA-Q2-2019-FINAL.pdf?v=070606) and [audited 2018 statements](https://www.tectonicmetals.com/_resources/financials/FS-Tectonic-2018YE-AUDITED.pdf?v=090403). [Algorithm facts](algorithm-facts.json) retain model inputs, outputs and source references.

Use the PDF if fonts or the live browser differ. Keep the hypothetical labels and explain the saved numbers rather than debugging during the judged slot.
