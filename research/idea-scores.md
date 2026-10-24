# Idea scores: deep check of the shortlist

Saturday 24 Oct 2026, ~17:00. Three independent scorers each took five shortlisted ideas from [the ideas list](all-ideas.md). For every idea they opened the actual dataset (live API calls where possible), searched Kaggle, GitHub, Devpost and papers for prior use, and scored it on the team rubric. No Reddit or Reddit mirrors were used.

- **Score:** out of 10, where a typical solid project is 5. Rubric: win paths 25%, novelty 15%, demo 20%, technical depth 10%, execution in the time left 20%, hook 10%.
- **Dataset uniqueness (0–3):** 3 = no prior use of this data for this purpose; 2 = a few papers or blogs, no hackathon builds; 1 = several projects or tutorials; 0 = a common hackathon or Kaggle dataset.
- **Caveat:** each group had a different scorer, so compare within a group more confidently than across groups.

## Bottom line

- **Build: The Fed Millisecond (7.4).** Best score, best hook, data already in hand. Its weakness is that one Fed event is a measurement, not a prediction. Spend the night on a backtested prediction (for example, "the bond move in the first 2 ms predicts SPY's direction over the next second"), tested on other scheduled releases in the same week's files. Don't spend it on a nicer parser.
- **Non-financial build: Memento Mori (6.4).** It has the cleanest prediction → decision → measured gain, and the scorer reached its data live.
- **Backups:** Flag Fall (6.9, but now crowded), Bang the Close (6.6, Delta and Handmade only), Dark Sky Gamble (6.2), Dip or Twitch (6.1, only after a 1-hour data spike), When Does It Really End? (6.0, data source must change).
- **Most unique data:** no external dataset scored 3. Bang the Close scores 3 only because the hall generates its data live. Among real datasets, Fed Millisecond, Memento Mori, Dark Sky Gamble, When Does It Really End?, Dip or Twitch and Behind Schedule all score 2: researched, but never built at a hackathon. Of those, **The Fed Millisecond pairs unique data with the highest score.**

## Full ranking

| # | Idea | Score | Dataset uniqueness | Data by Sun 12:00 | Verdict |
|---|---|---|---|---|---|
| 1 | The Fed Millisecond | 7.4 | 2 | yes (already scanned) | **BUILD** |
| 2 | Flag Fall | 6.9 | 1 | yes | BACKUP |
| 3 | Bang the Close | 6.6 | 3 (self-generated) | yes | BACKUP (Delta, Handmade) |
| 4 | Memento Mori | 6.4 | 2 | yes | **BUILD** (non-financial) |
| 5 | Dark Sky Gamble | 6.2 | 2 | yes | BACKUP |
| 6 | Dip or Twitch | 6.1 | 2 | partly | BUILD only if a 1-hour spike works |
| 7 | When Does It Really End? | 6.0 | 2 | partly | BACKUP |
| 8 | 3am Commits | 5.6 | 1 | partly | BACKUP |
| 9 | Behind Schedule | 5.4 | 2 | partly | BACKUP, weak |
| 10 | The Golden Hour | 5.4 | 2 | partly | DROP |
| 11 | Cliffhanger Insurance | 5.1 | 0–1 | partly | DROP |
| 12 | They Know | 4.8 | 0 | partly (paid) | DROP |
| 13 | Save or Pull? | 4.3 | 1 | yes, but tiny | DROP |
| 14 | Arrive Too Early | 4.1 | 1 | partly | DROP |
| 15 | Bag Back? | 3.4 | 2 | no | DROP |

## Corrections to the ideas list

- **When Does It Really End?:** ShopGoodwill auctions have a **hard close**, so they can't be the data source. Bring a Trailer works instead: every late bid adds 2 minutes, and its listing pages carry bid timestamps and the end time. Bid lists may be truncated.
- **Cliffhanger Insurance:** the "no live tool" claim is wrong. IsItRenewed already gives live renewal odds from Netflix Top 10 data.
- **Flag Fall:** novelty fell. ChessMimic (arXiv, 2026) and Allie 2.0 already predict results from position plus clocks. The only fresh angle is trading against an eval-only bookmaker.
- **Arrive Too Early:** "when to leave for the airport" is a saturated Devpost theme, a 2026 paper already models hourly TSA throughput, and the TSA files are PDFs of about 1,000 pages a week.

## Per idea: data, uniqueness, kill risks

### Group A

**The Fed Millisecond: 7.4, BUILD.** Sub-scores: win 7, novelty 7, demo 8, depth 9, execution 6, hook 9.
- **Data:** the Nasdaq ITCH directory is live; the Fed-day file `S121025-v50.txt.gz` is 11.56 GB, with neighbouring days 7.9–8.8 GB. No signup, nanosecond timestamps. The Fed statement confirms 14:00 EST and the 0.25-point cut.
- **Uniqueness 2:** ITCH parsers are common on GitHub, and Nanex told the speed-of-light Fed story in 2013. No hackathon build or analysis of the Dec 2025 event was found.
- **Kill risks:** n = 1 is not a prediction; the hand-written C++ order book can eat the night; differences of about 1 ms are near clock error.

**Flag Fall: 6.9, BACKUP.** Sub-scores: win 7, novelty 4, demo 8, depth 6, execution 8, hook 7.
- **Data:** Lichess open database (CC0) with eval and clock; a ready Hugging Face set of 5M games. Obtainable within an hour.
- **Uniqueness 1:** ChessMimic (2026), Allie 2.0, a 2026 Lichess blog on eval vs clock in blitz, a 2021 Devpost evaluator, an Aalto thesis.
- **Kill risks:** judges who know ChessMimic; the clock edge may only matter in the last 10–30 seconds.

**Bang the Close: 6.6, BACKUP.** Sub-scores: win 5, novelty 7, demo 8, depth 5, execution 7, hook 8.
- **Data:** generated live by the hall's microphones.
- **Prior art:** noise monitors are a common hackathon build (HushMap, decibell, Silent Signal); hackathon prediction markets exist (LiveStakes). No manipulation-resistant noise futures market was found.
- **Kill risks:** weak HRT fit; judging-room acoustics; reads as a party game.

**The Golden Hour: 5.4, DROP.** Free RNS headlines exist (Investegate), but no free source of AIM opening prices was found, and thin AIM auctions make "buy at the open" fictional.

**They Know: 4.8, DROP.** Betfair's own data scientists published the same analysis ("Do they know?"). The free tier is 1-minute odds with no volume; 1-second data costs £69 a month.

### Group B

**Memento Mori: 6.4, BUILD.** Sub-scores: win 6, novelty 5, demo 7, depth 6, execution 7, hook 7.
- **Data:** Wayback CDX API called live; free, no key, timestamps to the second. Limited to about 24–30 requests a minute (an hour's IP block if ignored), so about 1,400 URLs an hour. "Dead now" labels come from a live HEAD check.
- **Uniqueness 2:** "No More 404s" (AUC 0.72) and the Internet Archive's TrendMachine. Two Devpost projects list "predict which links will die" as unbuilt future work.
- **Kill risks:** leakage (CDX records 404 captures, so cut features off at 2023); soft 404s and parked domains look alive; rate limits.

**Dark Sky Gamble: 6.2, BACKUP.** Sub-scores: win 6, novelty 4, demo 6, depth 7, execution 8, hook 6.
- **Data:** a live call for Oxford, 17 Nov 2025, 05:00 (UKMO): the 3-day-ahead forecast said 98% cloud, the 1-day said 0%, the analysis said 3%. A ready demo moment. Coverage varies by model (some early-2024 values are null).
- **Uniqueness 2:** Open-Meteo pitches the API for skill-vs-lead-time work, and a 2026 paper already makes a go/no-go cloud call for satellite tasking from Open-Meteo data. No astronomy drive-or-stay build was found.
- **Kill risks:** model "truth" isn't what an observer saw (METAR fixes this but adds work); reads as standard forecast post-processing.

**When Does It Really End?: 6.0, BACKUP.** Sub-scores: win 6, novelty 7, demo 6, depth 6, execution 4, hook 8.
- **Data:** see the corrections above. Bring a Trailer works, and a scraper exists. eBay Australia moved to extended bidding on 17 Aug 2026, but its data needs scraping.
- **Uniqueness 2:** a Toronto paper on soft-close extensions, AAAI 2024 on penny-auction durations, a Hypercars analysis of BaT bid timing. No real-end-time predictor was found.
- **Kill risks:** scraping and anti-bot measures; the story is about eBay but the data is classic cars.

**Cliffhanger Insurance: 5.1, DROP.** IsItRenewed and What's on Netflix already predict renewals, and the strongest predictor (completion rate) isn't public. The direct Top 10 downloads also return 403 to scripts.

**Save or Pull?: 4.3, DROP.** Only 161 rerun intervals; bannerhistory.app already publishes rerun-rate charts; gambling optics.

### Group C

**Dip or Twitch: 6.1, BUILD only after a spike.** Sub-scores: win 6, novelty 6, demo 7, depth 6, execution 5, hook 7.
- **Data:** the eBird API needs a free key (no key returns 403). Observer comments are not in the standard output and may not be reachable. Bulk EBD access needs approval, so it won't arrive in time.
- **Uniqueness 2:** Laney et al. 2021 modelled birder turnout for 273 US rarities, but not "still there?". The Chase Report claim in the ideas list could not be verified.
- **Spike (1 hour):** get a key, pull 30 days of GB notable sightings, and check that comments come back. If not, switch.

**3am Commits: 5.6, BACKUP.** ApacheJIT's `author_date` is a UTC epoch with no timezone, so the local hour (the whole hook) means re-mining 14 repositories' git logs. Eyolfson et al. (2011) already found midnight–4am commits buggier, and another study found 20:00 worst.

**Behind Schedule: 5.4, BACKUP, weak.** The GDQ tracker API works with no key, but only SGDQ2026 has original estimates filled in (149 runs, 18 over estimate). No marathon runs during judging.

**Arrive Too Early: 4.1, DROP.** See the corrections above.

**Bag Back?: 3.4, DROP.** No public per-bag recovery-time data; SITA publishes only global totals.

## Key sources the scorers opened

- [Nasdaq ITCH files](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/) · [Nanex on Fed-speed trading (2013)](http://www.nanex.net/aqck2/4434.html)
- [Lichess database](https://database.lichess.org/) · [Aalto thesis on the fair frontier](https://sal.aalto.fi/files/opinnot/kurssit/mat-2.kandi/esittelyt/ellissaavalainen-esittely.pdf)
- [Betfair historic data tiers](https://betfair-datascientists.github.io/modelling/dataSources/) · [Betfair: Do they know?](https://betfair-datascientists.github.io/tutorials/analysingAndPredictingMarketMovements/)
- [Wayback library rate-limit note](https://wayback.readthedocs.io/en/latest/release-history.html) · [No More 404s](https://doi.org/10.1145/2756406.2756940) · [TrendMachine](https://doi.org/10.1109/jcdl57899.2023.00023)
- [Open-Meteo Previous Runs API](https://open-meteo.com/en/docs/previous-runs-api) · [Go/No-Go cloud forecasting paper (2026)](https://eartharxiv.org/repository/view/13992/)
- [ShopGoodwill hard close](https://bidpulse.app/blog/how-shopgoodwill-works-complete-guide) · [How Bring a Trailer works](https://bringatrailer.com/how-bat-works/) · [eBay AU extended bidding](https://community.ebay.com.au/forum/news-updates-44/topic/introducing-extended-bidding-helping-auctions-reach-their-full-potential-8571/)
- [IsItRenewed: how it works](https://isitrenewed.com/how-it-works) · [bannerhistory.app rerun rate](https://bannerhistory.app/en/genshin-rerun-rate)
- [eBird API docs](https://documenter.getpostman.com/view/664302/S1ENwy59) · [Laney et al. 2021 (PeerJ)](https://peerj.com/articles/10713/)
- [ApacheJIT (arXiv)](https://arxiv.org/html/2203.00101) · [Eyolfson et al. (MSR 2011)](https://cs.purdue.edu/homes/lintan/publications/commitTime-msr11.pdf)
- [TSA FOIA reading room](https://www.tsa.gov/foia/readingroom) · [TFT on ATL throughput (2026)](https://arxiv.org/html/2608.02950) · [Devpost: Will I Make My Flight](https://devpost.com/software/will-i-make-my-flight)
- [SITA Baggage Insights 2025](https://puntacana-bavaro.com/wp-content/uploads/2025/06/2025-SITA-Baggage-Insights-Report.pdf)
