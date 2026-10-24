# Contract valuation and agreement evidence

24 October 2026. Human owner: Amit for integration and acceptance; Salman owns the decision algorithm. Bounded research proposal against `research/algorithm.md` at `3a84a2c`, pending reconciliation with Salman's revision. All sources below were accessed on 24 October 2026. No application implementation, market appraisal, legal due diligence or large transaction collection was performed.

## 1. Amend Layer 2: establish what is being valued, in dollars

**Published guidance.** CIMVAL defines valuation as an estimate of monetary value. Its 2019 Code, sections 2.2, 2.8 and 3.3, requires identification of the property interest and explanation of chosen approaches. Table 1 lists market and cost approaches for exploration properties, with income approaches unsuitable at that stage. Table 2 classifies real options under income approaches and geoscience factors as a secondary method. Its market approach includes comparable transactions and option/farm-in terms; its cost approach considers exploration expenditure's contribution to value, rather than automatically equating expenditure with value. It also permits disclosed limitations or assumptions when reliable information is insufficient. [CIMVAL Code, official hosted copy](https://mrmr.cim.org/media/1147/cimval-code-november2019_may2022.pdf), printed pages 7, 9 and 14–17.

**Proposed amendment.** Remove `Area × KilburnScore × OptionFactor(gold price)` as the monetary engine. Acreage times a dimensionless score times USD/oz does not yield USD/property. Tok sediment measurements supply neither recoverable ounces nor a property's development cash flows. Geological evidence can inform an explicitly qualitative assessment; converting it to dollars requires a supported monetary mapping.

Use two distinct modes:

- **Evidence-backed valuation**, only when sufficiently comparable transactions or justified value-contributing exploration costs support a range. Match the property interest, ownership fraction, exploration stage, geography, date and obligations. Explain adjustments and exclusions. Two disclosures below demonstrate field availability, not a fitted market model or a Tok valuation.
- **Scenario contract calculation**, available now: give a clearly assumed USD exit-value range for the exact interest conveyed, and calculate each contract's payoff. Label the result conditional on those assumptions. If real value cannot be supported and no hypothetical scenario is supplied, return insufficient inputs.

For a simple option exercised and immediately resold at expiry, a proposed scenario calculation is:

`NPV_s = -premium - PV(committed pre-exercise costs_s) + DF(T) × max(V_interest,s(T) - strike - exercise/exit costs_s, 0)`.

All terms are USD for the same contractual interest; `DF(T)` is dimensionless and dates use one time basis. A purchase uses its own payment, holding and exit cash flows. Model scheduled continuation payments only on branches where continuation occurs. Exploration spending is a buyer cost, not automatically vendor consideration. Royalty obligations require production/revenue assumptions or remain an explicitly unvalued contingent term. Do not double count fees, royalties or ownership fractions already included in `V_interest`.

This is a proposed finite-scenario payoff calculator. It establishes arithmetic and timing, not observed fair value, calibrated profit probabilities or an economic mineral resource. A Black–Scholes formula is unnecessary for this first calculation.

## 2. Amend the surface floor and rights gates

**Published distinctions.** BLM states that a federal mining claim asserts possession and development/extraction rights to a discovered valuable mineral deposit, without exclusive surface rights. [BLM, Mining Claims](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims).

Alaska DNR's state-claim fact sheet describes rights to locatable minerals, subject to required authorizations. Other materials and surface resources do not automatically belong to the claimant; it specifically restricts timber harvesting and prohibits excluding public access. This guidance concerns its claim system and does not establish the tenure of a Tok sample location. [Alaska DNR, Mineral Locations and the Rights Acquired, July 2021](https://dnr.alaska.gov/mlw/cdn/pdf/factsheets/mining-locations-rights-acquired.pdf).

**Proposed amendment.** Delete the universal pasture-value floor. A surface component is admissible only where the identified agreement actually conveys relevant surface ownership or use rights and there is support for that component's value. Neither a claim nor a sediment point establishes that condition. Avoid a universal `max(surface value, mineral value)` rule; the rights may be different interests rather than interchangeable uses.

Add `tenure_system`, `interest_type`, `interest_fraction`, `surface_rights_conveyed`, `mineral_rights_conveyed`, governing instrument/record ID, evidence date and unresolved status. Preserve unknowns. Real-world recommendations remain unavailable when the necessary rights are unverified; hypothetical rights may be supplied only in a labelled fixture. No Tok title or parcel determination was made in this research.

## 3. Two real agreement examples, not return labels

| Primary issuer disclosure | Observable terms at announcement | What it does not establish |
| --- | --- | --- |
| **Trench, Nevada**, EMX/Ridgeline, 29 May 2025. [Issuer release filed with SEC](https://www.sec.gov/Archives/edgar/data/1285786/000106299325010443/exhibit99-1.htm). | Option to earn 100% over five years: 250,000 Ridgeline shares, USD 650,000 option payments and USD 500,000 exploration expenditure. On earn-in EMX retains 3% NSR; annual advance royalties are USD 50,000 until commercial production. Disclosed contingent milestones include USD 250,000 at initial resource, USD 500,000 at a qualifying economic study and USD 1 million at a positive development decision. Separate royalty buybacks are specified. | No single completed cash sale price or realized investment return. Share count is not a dollar value without an appropriate price/date. Exploration expenditure is not cash paid to EMX. Retained royalties and milestones remain contingent; the release does not supply their expected present values. |
| **Legal Tender, Nevada**, Rush/Silver Range, 16 September 2025. [Rush issuer announcement](https://tnw-a.thenewswire.com/press-releases/1kWVFKn70-rush-gold-corp-options-legal-tender-au-ag-nevada-property.html). | Option to acquire 100%: escalating cash payments totalling USD 200,000 plus 1,000 metres of drilling over four years. Retained 2.5% NSR, reducible to 1% by buyback, and USD 4 per gold/gold-equivalent ounce of delineated Measured and Indicated Resources. | Drilling metres are not dollars without cost evidence. The release does not give the complete payment dates or buyback price. Resource payments cannot be monetized from sediment assays. Announced maximum commitments do not prove payments were completed or imply a USD/acre sale price. |

Both disclosures support contract-structure research. They do not verify the underlying title, economic resources, completion, subsequent amendments or suitability as direct Alaska comparables. Acquisition-option exercise is distinct from investment profitability.

## 4. Amend Layer 5a and validation before expanding collection

**Proposed record.** Store announcement/public-availability date, agreement/effective date, amendment links, currency, ownership fraction, rights/stage, cash schedule, share schedule and valuation basis, work commitments with native units, royalty basis, buyback and milestone conditions, term/expiry and source URL. Distinguish announced, due, paid and contingent; leave undisclosed fields null. Separate vendor consideration, buyer work costs and ongoing encumbrances.

**Proposed acceptance.** Demonstrate one purchase and one option with hand-checked dated cash flows and a consistent USD interest value. Show the same evidence under different exit-value and deadline assumptions, including abandonment. Test dimensional consistency and prevent unexplained conversion of shares, metres or NSR percentages into dollars. Any comparable-derived value must use information public by the decision date.

A collection of two terms announcements cannot validate sale-price error, realized NPV, Sharpe or profit probability. Keep priced transfer/resale outcomes separate from agreement terms and claim activity. Larger comparable collection and outcome evaluation remain a later, separately justified dependency. These amendments support a defensible scenario demonstration while preserving the proposed path to empirical valuation.

## Research method and limits

Three Exa discovery searches covered CIMVAL methodology, Alaska claim rights and issuer gold-option terms. Five selected primary sources were read directly, including the full CIMVAL text and relevant tables. The source disclosures are authoritative evidence of their issuers' announced terms, not independently verified transaction completion. No market statistics, general state-law survey or continuing agreement status was inferred from them.
