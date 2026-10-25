# Orecast contract pricing and margin workup

Checked 25 October 2026. Human owner: Amit. The research informed the provisional
US$30,000 initial-payment scale in the active whole-contract demo. It does not
establish an available contract quote or claimed return. Fees, obligations and
valuation remain separate inputs.

## Decision

The existing evidence does not establish an average current Tok price for a
short-term assignable mineral option. The local ten-deal collection mixes leases,
option exercise, earn-ins, outright acquisitions, equity and contingent payments.
Five regional primary-source examples are classified in
[regional-comparables.csv](regional-comparables.csv), with source details in
[regional-sources.md](regional-sources.md). The audit of existing data is in
[local-audit.md](local-audit.md).

Two original historical signing/initial lease payments are explicitly US$30,000:

| Observation | Verified component | Material remaining costs and limits |
| --- | --- | --- |
| Tibbs, June 2017 | US$30,000 initial payment | US$50,000 annual option payments, US$1m exploration commitment, royalty and contingent production terms. A long-term lease/option rather than an observed short-term resale. |
| Northway, June 2018 | US$30,000 initial lease payment | Separate US$25,000 scholarship paid in 2018, US$400,000 first-year exploration obligation, later annual/work payments and royalties. Subsequently amended and terminated. |

The mean and median of these **two selected historical signing payments** are
US$30,000. This is a reference for initial-payment scale only. It is not a current
Tok market average, full contract cost, available offer, inflation-adjusted price,
or measured assignment value. Both observations involve the same acquiring company
and different rights/obligations, so they are not independent representative draws.

Primary evidence: [Tectonic 2019 Q2 MD&A, printed pp4–5](https://www.tectonicmetals.com/_resources/financials/MDA-Q2-2019-FINAL.pdf?v=070606)
and [audited 2018 statements, printed pp17–19](https://www.tectonicmetals.com/_resources/financials/FS-Tectonic-2018YE-AUDITED.pdf?v=090403).
The latter also describes Seventymile's separate US$30,000 initial payment, with
similar Doyon work/scholarship obligations, but that more distant Eagle-district
property is outside this selected two-observation signing comparison. No market
population or comprehensive regional census is claimed.

## Other dollar amounts cannot be averaged into that price

- Tok Option Block: US$50,000 was the exercised acquisition price in June 2021
  for roughly 13,000 acres within a related-party JV structure. It was not the
  price paid to buy an unexercised option for later assignment. See the
  [Contango FY2021 10-K](https://www.sec.gov/Archives/edgar/data/1502377/000143774921021206/conta20210630b_10k.htm).
- Tanacross: US$1m was aggregate staged cash, not a US$1m upfront premium. The
  separate US$4m exercise/success payment and US$30m exploration spending must
  remain separate. The 2022 agreement was terminated in March 2024. The platform's derived note now corrects the upstream snapshot's erroneous
  upfront label and retains the prior value and primary-source correction provenance.
  The snapshot's original source hashes continue to identify its upstream inputs. See the [original issuer announcement](https://www.kenorlandminerals.com/news/kenorland-minerals-options-the-tanacross-project-to-antofagasta/).
- LMS: US$350,000 was a completed outright property acquisition, with retained
  royalties, rather than a signing premium or a short-term option assignment.
- Tetlin advance royalties, DNR claim fees and statewide surface-land sales are
  different cost/rights categories. They are excluded from an option-premium mean.
- A nearby Chicken/Fortymile marketplace ask bundled claims and buildings; another
  ask bundled equipment and was unavailable. These do not establish transaction
  prices for Orecast's unexercised-option interest.

## Building a margin from an entry reference

Entry price alone does not establish resale value or profit. Use a matched
legal interest, verified assignment permission, all holding/payment obligations,
an independently supported assignment value and a dated sale policy.

For a flat assignment-value comparison with no sale proceeds on the unsold branch, define:

```text
U = entry premium + entry costs + unavoidable upfront obligations
q = probability of sale by the horizon
S = proceeds conditional on a completed assignment
F = sale/exit cost
E[cash] = q * (S - F) - U
expected return = E[cash] / U
required S for target return r = U * (1 + r) / q + F
maximum U for target return r = q * (S - F) / (1 + r)
```

The full engine values each possible sale date separately; this compact equation
applies only when the conditional assignment value stays constant across dates.
Sale-only gross margin and expected return are different quantities.

### Conditional hurdle at a US$30,000 signing-payment scale

This is a mathematical sensitivity, not the economics of Tibbs or Northway.
It retains the old illustrative US$50 entry fee and US$50 exit fee, assumes no
additional costs, and uses the uncalibrated 20% conditional sale hazard per 30
days. At 90 days q is 48.8%, with 51.2% no sale and US$30,050 upfront capital.
The no-sale cash branch is therefore -US$30,050; any unsold mark remains separate.

| Required expected 90-day return | Required conditional assignment proceeds |
| --- | ---: |
| 0%, cash break-even | US$61,627.87 |
| 20% | US$73,943.44 |
| 25% | US$77,022.34 |
| 30% | US$80,101.23 |

No such resale prices were observed in this research. Real fees, work commitments,
scholarships, recurring payments and assignment/release provisions could materially
change the result. The historical initial payment cannot substitute for total
capital at risk. Amit subsequently selected a US$1,502,500 demo fund, US$30,050 per-option cap
and US$150,250 open/cohort caps to preserve the original 2%/10% ratios including
the entry fee. This capital policy does not validate the contract economics.

All four hurdle cases were run through the existing `cashOutcomes` implementation
and reconciled to their target returns. Increasing the dollar scale alone does
not increase a return percentage when all cash components scale proportionally.

## Recommended next input

Use US$30k only as a labelled historical signing-payment scale reference while
collecting quotes for a specified small regional option/lease interest. A/B sample
partitions are not legal parcels. A real bid ceiling requires a matched assignment
value and the complete costs for that same interest. Until those are supplied,
keep an observed market-average price and measured margin unavailable rather than
replacing the existing fixture with a fabricated profitable contract.
