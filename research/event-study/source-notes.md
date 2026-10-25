# Primary-source event ledger

Frozen at 2026-10-25T07:22:05Z before the source researcher accessed any stock prices or returns.
SHA-256 of events.json: `fcd5cf8dfee08767b9a175597001a17bb9bcb1e4fd4edbe808f44b2a5b9249e0`.

Human owner: Amit. Source-research scope: events.json and this note. No model tuning, paid swarm calls, price requests, returns inspection or commits were performed by this researcher.

## Scope and selection

The protocol fixes NG / Donlin Gold and NAK / Pebble for 2020-01-01 through 2025-12-31. This bounded search found 12 sufficiently documented events: 3 NG and 9 NAK, coded 5 favourable, 6 adverse and 1 uncertain. There are 12 direct announcement URLs and 18 unique source URLs including corroboration. The sample is not a census. It covers two issuers and several stages of the same permitting disputes.

Issuer annual news archives, EPA Bristol Bay materials, U.S. Army and USACE releases, SEC copies of issuer releases, the Alaska Department of Law, and Federal Permitting Council pages were searched. Queries combined project names with permit, appeal, ruling, proposed determination, final determination, and the relevant year. Search results were followed to primary pages. Some later annual/quarterly reports were used only to identify candidate dates, not as standalone event announcements. No price or performance query was used.

Inclusion concerns document effect on advancement, not predicted stock return. An accepted administrative appeal is different from a lawsuit merely filed. A formal agency coordination designation is a weaker procedural event than a permit grant. A completed EIS is coded uncertain because the issuing agency explicitly separates it from permitting. The regulatory proposal, recommendation and final determination are distinct decisions, not three independent projects.

## Timing

publicationDate is the directly verified public primary-source announcement date used for conservative evaluation. eventDate is the earlier action date where established, otherwise the date of the reported agency announcement. None of the sources yielded a verified intraday timestamp suitable for this ledger, so every publicationTimestamp is null and precision is date. Do not assume midnight, premarket, or same-day execution.

This is documented availability, not proof of first dissemination. The issuer releases on 2020-02-06, 2021-02-25, 2022-12-02 and 2023-04-26, and the state release on 2025-11-18, describe earlier actions. Those delays are preserved. For the EPA final action, January 30 is the issuance date on the EPA summary; January 31 is the public announcement date corroborated by the same-day issuer archive. For FAST-41, the current dashboard records an October 24 posting, but the agency explicitly announced coverage on October 27. The historic contents of the October 24 page were not reconstructed. The later explicit announcement is used and earlier awareness is flagged.

All retrieved pages were inspected on 2026-10-25. verifiedAt is the ledger-finalization timestamp for this retrieval session, not a historical timestamp. Current agency pages sometimes include later updates. Only the specifically cited historical facts, dates and contemporaneous announcement text inform event codes; current progress indicators and later project outcomes do not.

## Frozen events

| Public date | Ticker | Code | Source and decision |
| --- | --- | ---: | --- |
| 2020-02-06 | NG | +1 | [Donlin receives state pipeline and transportation authorizations](https://www.sec.gov/Archives/edgar/data/1173420/000117184320000757/exh_991.htm) |
| 2020-07-24 | NAK | +0 | [USACE publishes final Pebble environmental impact statement](https://www.pod.usace.army.mil/Media/News-Releases/Article/2303902/corps-releases-pebble-final-environmental-impact-statement/) |
| 2020-08-24 | NAK | -1 | [Army finds proposed Pebble project cannot receive a permit](https://www.army.mil/article/238426/army_finds_pebble_mine_project_cannot_be_permitted_as_proposed) |
| 2020-11-25 | NAK | -1 | [USACE denies Pebble permit application](https://northerndynastyminerals.com/news/news-releases/2020/northern-dynasty-reacts-to-negative-federal-record-of-decision-on-alaskas-pebble-project/) |
| 2021-02-25 | NAK | +1 | [USACE accepts administrative appeal of Pebble denial](https://northerndynastyminerals.com/news/news-releases/2021/northern-dynasty-us-army-corps-of-engineers-accepts-pebble-partnership-request-for-appeal/) |
| 2022-05-25 | NAK | -1 | [EPA proposes restrictions on Pebble-related discharges](https://www.epa.gov/newsreleases/epa-proposes-protect-bristol-bays-salmon-fishery-subsistence-fishing-alaska-natives) |
| 2022-12-02 | NAK | -1 | [EPA regional recommendation advances Pebble discharge restrictions](https://northerndynastyminerals.com/news/news-releases/2022/northern-dynasty-pebble-vehemently-pushes-back-against-epas-unprecedented-preemptive-veto-action/) |
| 2023-01-31 | NAK | -1 | [EPA finalizes Pebble discharge prohibitions and restrictions](https://www.epa.gov/newsreleases/biden-harris-administration-announces-action-help-protect-bristol-bay-salmon-fisheries) |
| 2023-04-26 | NAK | +1 | [USACE remands Pebble denial for reconsideration](https://northerndynastyminerals.com/news/news-releases/2023/northern-dynasty-u.s-army-corps-sends-pebble-permit-application-back-to-alaska-office-for-more-work/) |
| 2024-04-16 | NAK | -1 | [USACE declines Pebble remand work while EPA restriction stands](https://northerndynastyminerals.com/news/news-releases/2024/northern-dynasty-usace-updates-the-pebble-permitting-process-in-light-of-the-epa-veto/) |
| 2025-10-27 | NG | +1 | [Donlin receives FAST-41 federal permitting coordination coverage](https://www.permitting.gov/newsroom/press-releases/donlin-gold-project-gains-permitting-councils-fast-41-coverage) |
| 2025-11-18 | NG | +1 | [Alaska Supreme Court upholds Donlin state water and pipeline permits](https://law.alaska.gov/press/releases/2025/111825-Donlin.html) |

Per-entry rationales, concise paraphrased evidence, source publishers, action-date notes and corroborating links are in events.json. No article text is reproduced. The codes were fixed without observed price outcomes.

## Exclusions and duplicate handling

- Financing, royalty deals, annual meetings, ownership changes, drilling results, resource estimates, economic studies and ordinary financial reports were excluded by category. The 2020 Donlin standalone permit release is retained even though SEC hosts its copy; ordinary earnings announcements are not.
- Pebble appeal preparation in December 2020 and the appeal filed in January 2021 are excluded. The February 2021 agency decision accepting the appeal is retained.
- EPA September 9, 2021 intent to seek a court remand is excluded as a request rather than an actual ruling. The EPA timeline reports an October 29, 2021 court ruling; a contemporaneous primary public announcement date for that ruling was not established in this bounded pass, so it is not backdated into the ledger.
- EPA January 2022 notification of intent, comment extensions, and subsequent USACE deadline extensions were not treated as new material project determinations. The May proposal, December recommendation and January final action are retained separately.
- July 29, 2020 issuer commentary repeats the July 24 final EIS. August 28 and August 31, 2020 issuer explanations repeat the August 24 mitigation finding. May 1, 2023 issuer discussion repeats the April remand. These are not additional events.
- The February 6, 2020 Donlin release bundles January 2 transportation and January 17 pipeline actions. They remain one public announcement and one observation, not two invented earlier publication dates.
- A June 28, 2021 Donlin release discusses a challenge filed that day while recapping an earlier May 27 administrative decision. It is excluded as a lawsuit announcement and stale recap.
- Donlin court and administrative decisions dated April 12, July 3, August 18 and September 1, 2023; September 30 and December 23, 2024; and May 6 and June 10, 2025 appeared in later issuer reports or current permitting summaries. They were not backdated from those reports. Contemporaneous eligible primary publication was not sufficiently verified in this fast pass. The June 2025 court remedy was also discussed by an advocacy group, but the required primary court record and public availability were not established here.
- Alaska Supreme Court publication dated November 14, 2025 may precede the November 18 government release. The source establishes the decision date, but this ledger does not invent an original court-publication timestamp.

Relevant discovery sources for these exclusions include [EPA timeline](https://www.epa.gov/bristolbay/bristol-bay-404c-timeline), [Northern Dynasty 2020 archive](https://northerndynastyminerals.com/news/news-releases/2020/), [2022 archive](https://northerndynastyminerals.com/news/news-releases/2022/), [2023 archive](https://northerndynastyminerals.com/news/news-releases/2023/), [Donlin June 2021 issuer release](https://www.sec.gov/Archives/edgar/data/1173420/000117184321004575/exh_991.htm), and [NOVAGOLD current permitting summary](https://novagold.com/donlin-gold/permitting/).

## Limitations affecting interpretation

- Source coverage is incomplete and publication availability is uneven. In particular, omitted Donlin adverse/mixed court decisions and retained favourable announcements can create source-availability and direction bias. A measured result cannot be advertised as a representative hit rate.
- All events are already historical when researched. Labels use contemporaneous documents and avoid price inspection, but this is retrospective coding, not a prospective registered signal.
- Two projects share macro and regional factors. Their repeated legal milestones are not independent draws. Mechanical overlap exclusion does not remove all dependence.
- Source language can be partisan. Northern Dynasty, NOVAGOLD and state officials have interests in project development; EPA and litigants have their own perspectives. Labels describe legal/procedural consequences and do not adopt value judgments from those sources.
- The search fixes ticker/project eligibility rather than stock performance, but the geographic universe is narrow and survives into the present. Selection and survivorship limits remain.
- The EIS and FAST-41 events are procedural milestones, not permit approvals. A sensitivity analysis excluding procedural categories would be reasonable in a future preregistered study, but must not be introduced after seeing this test result to improve performance.
- This ledger tests a historical liquid-equity event component. It contains no historical swarm predictions, Tok option quotes, land sale outcomes, or evidence of a calibrated gold/land conversion.

## Verification performed

Validated JSON parsing, 12 unique IDs, chronological order, allowed tickers and codes, dates within the fixed window, and action dates no later than publication dates. All source entries include publication date, precision, title, category, rationale, URL, publisher, evidence and verification timestamp. No statistical result is asserted by this source file.
