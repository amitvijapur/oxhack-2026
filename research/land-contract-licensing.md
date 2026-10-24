# Land-contract licensing: what the algorithm may recommend

25 October 2026. Owner: Salman. **Not legal advice.** This is desk research from statutes and agency pages, with gaps marked. A mining or securities lawyer in each state should confirm it before any real deal or public pitch of the broker route.

## Short answer

**Licensing affects the algorithm, not just the business.** The economics of a BUY or SELL are the same either way, but some actions are only legal for some users. Trading for your own account is fine in all three states. Brokering for others depends on the state and on what kind of land it is. Selling fractions to passive investors can be a securities offering.

| Route | Alaska (state claims) | Nevada | Arizona |
|---|---|---|---|
| Buy, option, lease or sell for your own account | No licence | No licence | No licence |
| Paid brokerage of **mining claims** for others | Probably exempt ("mineral rights transactions"); scope unconfirmed | Exempt by statute | Assume a licence is needed |
| Paid brokerage of **patented or fee land** for others | Licence likely | Licence needed | Licence needed |
| Assigning a purchase contract ("wholesaling") | Nothing specific found | Nothing specific found for claims | Disclosure rule covers small residential property only |
| Fractions or royalties sold to many passive investors | Securities review | Securities review | Securities review |

## Evidence

**Is a claim real estate?** BLM material treats unpatented claims as real property that can be sold, willed and inherited, citing *Forbes v. Gracey* ([Nevada Minerals / BLM slides](https://minerals.nv.gov/uploadedFiles/mineralsnvgov/content/Programs/Mining/BLM%202019%20Transfers%20of%20Intrest.pdf)). States differ on this for their own purposes: a Montana Attorney General opinion calls claims real estate ([MT](https://courts.mt.gov/external/ag-opinions/19/409.pdf)), and a Washington one calls them personal property ([WA](https://atg.wa.gov/ago-opinions/county-real-estate-sales-tax-unpatented-mining-claims)).

**Acting for yourself.** Broker definitions cover acting "for another and for compensation" ([NRS 645.030](https://nevada.public.law/statutes/nrs_645.030)). Alaska and Arizona exempt owners dealing in their own property ([AS 08.88.900](https://law.onecle.com/alaska/title-08/08.88.900.html); [A.R.S. 32-2121, 2005 text](https://law.justia.com/codes/arizona/2005/title32/02121.html)).

**Nevada.** "Real estate" includes every interest in real property ([NRS 645.020](https://nevada.public.law/statutes/nrs_645.020)). However, the licensing chapter does not apply to "the purchase, sale or locating of mining claims or options thereon or interests therein" ([NRS 645.0445(2)(f)](https://nevada.public.law/statutes/nrs_645.0445)). Patented or fee land is outside that exemption.

**Arizona.** We could not retrieve the current A.R.S. 32-2101/32-2121 text, and found no mining exemption, so we assume a licence is needed for paid brokerage. The wholesaling disclosure law, A.R.S. 44-5101 (2022), covers residential property of fewer than five units. The Arizona Department of Real Estate says wholesalers need no licence unless they represent others for pay ([ADRE](https://azre.gov/node/713); [2022 summary](https://azre.gov/sites/default/files/2022%20Legislative%20Summary.pdf)).

**Alaska.** AS 08.88.900(a)(8) exempts "a person dealing in mineral rights transactions" ([copy](https://law.onecle.com/alaska/title-08/08.88.900.html), which may be dated). The phrase is not defined there, so whether it covers state mining claims is likely but unconfirmed. Licensed brokers may not share fees with exempt people (900(b)).

**Transfer filings.**
- Federal claims: the buyer files a transfer notice with the BLM state office, with a copy of the deed and a fee of $15 per claim. Until it is filed, BLM keeps treating the seller as responsible ([43 CFR 3833.32](https://www.law.cornell.edu/cfr/text/43/3833.32)). Annual maintenance is $200 per lode claim, due by 1 September ([BLM fees](https://www.blm.gov/programs/energy-and-minerals/mining-and-minerals/locatable-minerals/mining-claims/fees)).
- Alaska state claims: the DNR "Transfer of Mineral Interest" quitclaim form records the transfer ([DNR form](https://dnr.alaska.gov/mlw/cdn/pdf/forms/Mining-Quitclaim-Deed-May24.pdf)). We did not verify a deadline or fee.

**Securities.** The 1933 Act's definition of a security names a "fractional undivided interest in oil, gas, or other mineral rights" ([15 USC 77b](https://www.law.cornell.edu/uscode/text/15/77b)). In *SEC v. Joiner* (1943), selling small slices of oil leases to investors was a securities offering, even though the leases were real estate ([LII](https://www.law.cornell.edu/supremecourt/text/320/344)). The SEC has brought mining cases in both target states: a Yuma, Arizona project ([LR-23890](https://www.sec.gov/litigation/litreleases/lr-23890)) and Tonopah, Nevada claims ([LR-22585](https://www.sec.gov/litigation/litreleases/lr-22585)). A whole-claim sale or a lease to one operator is low risk. Many passive investors buying fractions or royalties is high risk.

## What this means for the algorithm

Add these fields to the opportunity record ([input contracts §4](foundation-input-contracts.md#4-contract-opportunity-what-we-are-deciding-on)):

- `jurisdiction`
- `tenure`: `federal_unpatented`, `state_ak`, `patented` or `fee`
- `user_role`: `principal` or `agent`
- `compensation_from_third_party`
- `user_licence_states`
- `contract_assignable`
- `investor_count` and `passive_investors`
- `blm_transfer_filed` and `dnr_transfer_recorded`
- `legal_review_required`

Rules:
1. Principal actions (purchase, option, lease, sell) are evaluated normally.
2. Brokerage actions are offered only when the table above allows them for this jurisdiction and tenure, or the user holds that state's licence. Otherwise they are excluded with the reason shown, for example "SELL (principal only); brokerage blocked in AZ".
3. Unconfirmed cases (Arizona claims, the scope of Alaska's exemption) set `legal_review_required` and produce `manual_review` for brokerage, not a recommendation.
4. Fractional or royalty sales to passive investors are blocked pending securities review.
5. After a modelled purchase, the ledger includes the transfer filing and its fee, and the position isn't treated as settled until the filing is made.

## Still open

- The current text of A.R.S. 32-2101 and 32-2121.
- The definitions in AS 08.88.990.
- Any 2025–26 Nevada wholesaling bill.
- The Alaska DNR transfer deadline and fee.
