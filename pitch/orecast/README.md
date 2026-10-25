# Orecast teammate handoff

Use the approved ten-slide consistent-lot deck. Orecast is the selected name and
**Mineral intelligence over time** is its descriptor. The approved Palantir
compositions, white/charcoal palette and sparse green accents remain in place.

## Start here

- Edit [the PowerPoint](output/orecast-consistent-lot-review.pptx).
- Use [the PDF](output/orecast-consistent-lot-review.pdf) as the appearance reference and [the overview](preview-consistent-lot-review.png) to scan all ten pages.
- Rehearse with [the five-minute guide](rehearsal-consistent-lot-review.md). Seven main slides total 300 seconds; three appendices cover cash, the negative pilot and fees.
- Check [the figures and formulas](algorithm-facts-consistent-lot-review.json) and [portable speaking notes](slide-notes-consistent-lot-review.json) before changing content.
- Follow [the brand guide](../../brand/orecast/BRAND.md) and preserve [image attribution](assets/README.md).

**Publication status.** Amit approved publication of these reviewed artifacts on
25 October 2026. Their filenames and frozen facts, notes, rehearsal and review
report retain the build-time local-review wording. That wording records their
creation context; it is not a current restriction on the approved publication.
The frozen model input is `69a0b5b4d2ca8db16cc46f15ff0b07f954e72ed2`, model
`tok-option-demo-v2`. The checkpoint is now published as [orecast-model-inputs-v1](https://github.com/amitvijapur/oxhack-2026/tree/orecast-model-inputs-v1). Code merged first in [PR #54](https://github.com/amitvijapur/oxhack-2026/pull/54), commit `e180e2a`. The PPTX/PDF and frozen build metadata remain byte-identical to the reviewed package.

To reproduce the frozen model/report after a squash merge, fetch its checkpoint explicitly:

```sh
git fetch origin tag orecast-model-inputs-v1
node research/orecast-contract-pricing/build-consistent-lot-review.mjs
```

Run these commands from the repository root. The report checks all 24 source hashes against the tag commit and current inputs.

## One frozen synthetic interest

The example is one indivisible hypothetical contract with a **$30,000 premium**,
**$50 assumed entry fee** and **$50 assumed exit fee**, giving **$30,050 upfront**.
The initial-payment scale comes from two selected historical payments, Tibbs and
Northway. These involved different rights and substantial additional obligations.
They are not a current Tok average, assignable offer or valuation of this interest.

The original invented reference ratio is scaled once by `s = 30,000 / 650`:
**Q = 23,076.9230769 assumed troy ounces** and **K = $184,615.38 remaining buyer
consideration**. Ownership stays 50%, conversion 2%, geological success 25% and
model gold $2,000/oz, with zero growth and 20% conditional sale hazard per 30 days.
These are arithmetic assumptions, not measured resources or independently
validated unit economics. The scale factor is not multiple tradable contracts.
Quantity and buyer consideration remain fixed across horizons, scenarios and
premium edits. No input was selected from a return target.

## Cash, fees and the separate target

The no-event baseline assignment value is **$69,230.77**. At 90 days, fixed $50
fees give **$3,710.22 expected cash** and **12.35% non-annualized expected return**.
Area A passes the assumed screens and is a conditional model candidate; Area B
fails evidence. At 90 days, **51.2% of paths have no sale**, with **−$30,050 no-sale
and median cash**. An unsold mark is not cash or a measured realized loss.

The same interest with proportional reference fees of **$2,307.69 each** gives
**$350.77 expected cash**, **1.09% return** and **$32,307.69 upfront**. It **fails
the $30,050 per-option risk cap** and is skipped. The higher fixed-fee return
comes from a separate fee assumption, not measured predictive skill. Actual work,
scholarship, royalty, recurring payments and assignment consent remain unverified.

The exact assumed fund is **$1,502,500**, with **$30,050 per option**, **$150,250
open and lifetime commitment caps**, and at most **five positions**. This does not
establish five available contracts.

A **25% expected 90-day return** requires **$77,022.34 constant gross assignment
proceeds at every possible sale date** under the assumed liquidity. It is a
required hurdle, not a forecast or an input used to choose exposure. The baseline
valuation and return do not meet it.

## Demonstration and validation

Rehearse `/swarm`, Area A, 90 days, simulated day 5. Recorded approval gives
**$3,610.97 / 12.02%** and blockage gives **$3,831.36 / 12.75%** expected cash/return
on the same contract and fees. Use the matching saved captures if the running app
differs. The **Decide** calculator's small-response startup preset is a separate
sensitivity case. **Land** and **Crowd** provide context.

Recorded mining support changes assumed gold first, then mineral value, interest
value, assignment and dated cash. The response mapping is uncalibrated. Candidate
is not a trade or quote; simulation research checks remain failed. The historical
equity pilot remains separate and its event adjustment did not beat baseline.
There are no paired historical swarm outcomes establishing incremental option value.

## Editing and archived presentations

Foreground text, diagrams, the horizon chart and appendix tables are native
editable objects. Screenshots remain images. Use regular/light DM Sans, thin
rules, underlined focal numbers and rounded charcoal panels. Green identifies
selected content; it is not proof of profit. DM Sans Light may need mapping to
weight 300. [Font sources](../../brand/orecast/fonts/) use WOFF2, which some desktop
editors cannot install directly. Check wrapping against the PDF. Native PowerPoint
opening and system font rendering have not been verified.

The [earlier nine-slide Orecast PPTX](output/orecast-pitch.pptx),
[PDF](output/orecast-pitch.pdf), [notes](slide-notes.json) and
[rehearsal](rehearsal.md) are **archived cost-only fixtures**. They retain the
500-ounce, $1,500-assignment SKIP example and are not the current defaults.
The [earlier neutral-title PPTX](../oxhack-pitch.pptx) and
[PDF](../oxhack-pitch.pdf) are also archived. All earlier binaries remain unchanged.
