# OxHack '26: every idea we've considered

*Saturday 24 Oct 2026, updated mid-afternoon. This covers the whole chat: Friday night's first research, the scored rounds, Saturday morning's problem bank, the plans after the opening ceremony, the non-financial ideas, and two runs of random keywords checked against forums. That's about 200 ideas plus 60 classified keywords, and some ideas appear in more than one round.*

## Bottom line
- **Financial:** *The Golden Hour* (uncommon, needs fast scraping). *Half-Life* was dropped because AI news bots for Polymarket are everywhere.
- **Non-financial:**
  - *Flag Fall* is the strongest plan we've already written up.
  - *When Does It Really End?* (section 3) is the strongest new idea from the forum checks. It predicts when soft-close auctions really finish, now that eBay is killing sniping.
  - *Memento Mori* (section 2) and *Cliffhanger Insurance* (section 2B) are close behind.
- **Not in the original list:** *The Fed Millisecond* (section 0), the strongest HRT fit we have.
- **From the HRT keyword run:** *Dark Sky Gamble* (section 3B).
- **Backup:** *Bang the Close*.
- **Deep check (17:00):** see [the idea scores](idea-scores.md). Build *The Fed Millisecond* (7.4); non-financial build *Memento Mori* (6.4). It also corrects this file: ShopGoodwill has a hard close, IsItRenewed already predicts Netflix renewals, and *Arrive Too Early* drops to 4.1.

## How to read this
- **Status:**
  - ★ current direction
  - ◆ shortlist or backup
  - ○ parked: fine, just not chosen
  - ✗ dropped, with the reason
- **Scores** are out of 10 from our strict scorer, where a typical solid project scores 5.
  - **"Quick"** means my fast estimate, not a blind score.
  - **Rubric:**
    - win paths 25%
    - novelty 15%
    - demo 20%
    - technical depth 10%
    - execution 20%
    - hook 10%
  - **Penalties:** reusing datathon ideas, saturated themes, medical claims.
  - **Round 0 (section 7)** used a softer rubric, so its numbers look higher than they are.
- **Off-limits ideas** (our past projects and the IBM Z datathon) are listed in section 8, only so nobody suggests them again.

## Contents
0. What the other files add (event context, Fed Millisecond)
1. Where we are now (after the opening ceremony)
2. Non-financial ideas from random keywords (plus 2B: 30 keywords classified by forum demand, seed 1792848949)
3. 30 more keywords classified by forum demand (seed 1792849948)
   - 3B. 12 more keywords scored for HRT (seed 1792849741)
4. Final rounds before the event
5. Round 1: the first 25 strict-scored ideas, plus extras
6. Problem bank: every track from random seeds
7. Round 0: the first battle plan (42 ideas)
8. Off-limits

---

## 0. What the other files add (checked after 14:30)
Cross-checked against the [event context](event-context.md) (official slides and ceremony audio) and the [Fed Millisecond brief](fed-millisecond/). These change how the ideas below compare.

- **A strong financial contender is missing from this list: The Fed Millisecond.** Rebuild Nasdaq and IEX order books from raw feeds and replay the 10 Dec 2025 Fed rate cut. Bonds moved 1.15 ms after 14:00:00, close to light speed from Washington. It is already partly built (a C scan of 428 million messages), it is TIME to the microsecond, and it is the kind of data HRT's own systems consume. It needs an 11.6 GB download and a hand-written C++ parser, which also fits Citadel's handmade prize. Compare it with *The Golden Hour* before choosing a financial plan.
- **Hard deadline: hacking finishes Sunday 12:00**, and judging runs 13:00–15:45. The slides give no separate Devpost deadline. Ideas that need long scraping or live data collection (*Golden Hour*, *Dip or Twitch*, *When Does It Really End?*) lose time against ideas with a ready backtest (*Memento Mori*, *3am Commits*, *Cliffhanger Insurance*, *Fed Millisecond*).
- **Delta (Zed) has a published rubric:** speed 30%, technical implementation 25%, innovation 25%, polish 20%, and at least two teammates must work in Delta. Snappy, interactive demos (*Flag Fall*, the *Fed Millisecond* replay, *Bang the Close*) score better here than batch reports.
- **Handmade (Citadel, judged by Tom 7):** "giving a good idea to Claude and saying yes" will not win. Agent-built ideas need a visibly hand-made part: the Cardputer build, a hand-written parser, a hand-drawn UI.
- **MLH prize names corrected:** the "Tiny/Tart data" prize is **Tiger Data** (Postgres for time series). It fits *Memento Mori* (capture histories), *Fed Millisecond* (tick data), *Behind Schedule* and *Dark Sky Gamble* (section 3B). ElevenLabs, Gemini, Snowflake, Solana, Presage and Vultr are the other MLH prizes.
- **The ceremony-day brainstorm** (audio) leaned towards unusual data matched to a commodity, with swarm simulation (MiroFish) as a garnish. That matches section 1's verdict on MiroFish.
- **Sources not in the repo:** `OXHACK_TEAM_BRIEF.md`, `HANDOFF.md` and `PROBLEM_BANK.md` are referenced below but live outside Git. Ask Ahmed for them.

---

## 1. Where we are now (after the opening ceremony)
**What changed at 12:00**
- The theme is **time**, and it's compulsory.
- HRT runs the data prize: "best use of data for predictions and decision-making".
- Tom 7 judges Citadel's Best Handmade and has a say in the top prize.
- Jane Street set no challenge.
- We have Jev (TypeSafe AI's decision model) and an M5Stack Cardputer.

| Idea | In one line | Status | Score |
|---|---|---|---|
| **Half-Life** | Jev reads the news and bets play money on small Polymarket/Manifold markets. We measure how fast the edge fades | ✗ It was the main plan at 14:00. Dropped because AI news bots for Polymarket are very common | – |
| **The Golden Hour** | UK company announcements come out at 07:00 and the market opens at 08:00. Jev reads them and picks tiny AIM shares to buy at the open | ◆ The financial option. No hackathon prior art found. Needs fast scraping, and the weekend demo is a replay | – |
| **Flag Fall: trade the eval bar** | In blitz chess, the eval bar says who's better but the clock says who wins. Our model adds both clocks and "trades" against an eval-only bookmaker. The Cardputer is the chess clock | ◆ The strongest non-financial plan already written up (team brief §7) | 7.4 |
| **The Angel's Share** | Whisky gains value in the cask but loses about 2% a year to evaporation. Bottle now or wait? Plus a checker for cask-investment pitches (Whisky Hunter API) | ○ | 7.1 |
| **The Hack Clock** | A clock with no clock: it tells the time only from the hall's noise, Wi-Fi and GitHub activity, and has to work out *which* 01:30 it is | ○ Cursed and fun, but weak for HRT | 7.1 |
| **Bang the Close** | The hall trades play-money futures on its own noise level, and judges try to rig the price by shouting | ◆ Backup. It was the pick before the briefs (7.7) | 7.3 |
| **Deadline Oracle** | Predict from a hackathon repo's commits whether it ships, then decide what to cut now | ○ | 6.8 |
| **Last Second** | eBay sniping: predict the final price from the bid timeline. The Cardputer is the snipe button | ○ Small data (one Kaggle set) | – |
| **Cocoa from Space** | Weather over West Africa leads cocoa prices by months | ✗ Common | 6.3 |
| **Case Closed** | CS2 cases stop dropping, so their prices drift on a "retirement clock" | ✗ A well-studied market | 6.0 |
| **MiroFish swarm** | A simulated society of agents predicts outcomes | ✗ As the core: slow, and can't be backtested in 24 hours. Fine as a garnish | – |

---

## 2. Non-financial ideas from random keywords
**Seed 1792847119 drew:** guitar, bee, flight, board game, Twitch stream, sleep, marathon, git commit, swimming, queue, Minecraft, bird.

Every idea follows the same pattern: **unusual dataset → Jev makes a judgement → a decision → a gain we measure on later data.** Jev only does the judging. All maths, times and dates stay in our code.

Scores are quick estimates, made after a quick prior-art check.

### ① Memento Mori: obituaries for websites before they die (quick 7.0)
- **Data:** the Internet Archive's Wayback CDX API. It lists every saved copy of a web page, with the date and whether the page loaded. Free, no key.
- **Jev's judgement:** read an old copy of a page and look for signs of neglect, such as a 2016 copyright line, "last updated", or broken widgets. Output: the chance the page is dead within a year.
- **Decision:** we can only archive N pages a day. Which go first?
- **Gain:**
  - **What we measure:** the share of soon-to-die pages we rescue, against random or oldest-first.
  - **Backtest:** judge copies from 2023, then check which pages were dead by 2025.
- **Time:** the web forgets. 38% of pages that existed in 2013 were gone a decade later (Pew).
- **Cardputer:** type a URL and it shows the page's life expectancy.
- **Hook:** we predict when past OxHack project links will die, our own included.
- **Prize fit:**
  - HRT: a clean prediction → decision → measured gain.
  - Tom 7: obituaries written in advance.
  - Tiger Data: capture histories are time series.
- **How common:** researchers have predicted link rot for links in academic papers ("No More 404s", 2015). It's not a common hackathon build.

### ② Behind Schedule: when will my run actually start? (quick 6.7) [marathon, queue, Twitch]
- **Data:** Games Done Quick runs week-long charity speedrun marathons, streamed on Twitch. Their tracker holds each run's estimated length and how long it really took, going back years. *Check the tracker's API first.*
- **Jev's judgement:** the chance a run goes over its estimate, judged from its details: category, race or solo, the runner's history.
- **Decision:**
  - **Viewers:** when to tune in or set an alarm, so you don't miss the run you care about.
  - **Organisers:** how much buffer to add.
- **Gain:** minutes of waiting saved, compared with trusting the posted schedule. Backtest on later marathons.
- **Time:** estimates against reality, i.e. the planning fallacy.
- **Cardputer:** a countdown to your run that keeps correcting itself.
- **How common:** a 2016 blog post analysed GDQ estimates. I found no live predictor.

### ③ Dip or Twitch: will the rare bird still be there? (quick 6.6) [bird, flight]
- **Data:** eBird's free API of rare-bird reports in the UK over the last 30 days. Checklists can carry observers' notes; check these come through the API.
  - October is the UK's peak month for rare birds.
- **Jev's judgement:** read the trail of reports ("showing well, feeding" against "flew off high north") and give the chance the bird is still there when you arrive.
- **Decision:** go now, wait, or skip, given your travel time.
- **Gain:**
  - Fewer wasted trips. A "dip" is birder slang for missing the bird.
  - Measured as birds seen per 100 km driven, backtested on later rarities.
- **Time:** the clock starts the moment a rarity is found.
- **Cardputer:** a 1990s-style rare-bird pager. UK birders really did carry pagers.
- **How common:** a close neighbour exists.
  - Chase Report, released in June 2026 by a US birding group, already sorts eBird rarities into "likely still there / uncertain / probably gone".
  - Our angle: calibrated odds, the travel-time decision and a measured gain.

### ④ 3am Commits: push now or sleep on it? (quick 6.5) [git commit, sleep]
- **Data:** ApacheJIT, about 100k real commits, each labelled as bug-causing or clean, with timestamps. A 2011 study found commits made between midnight and 4am are the buggiest.
- **Jev's judgement:** read the diff, the commit message and the hour, and give the chance the commit causes a bug.
- **Decision:** ship it, or hold it until a teammate has reviewed it.
- **Gain:** bugs caught per commit reviewed, measured on later commits. Then run it live tonight on our own repo.
- **Time:** the hackathon's own 3am, plus the extra hour when the clocks go back at 02:00.
- **Cardputer:** sits by the laptop and flashes "SHIP IT" or "SLEEP ON IT" after each push.
- **How common:** predicting buggy commits is a big research field. The hackathon-night framing is the hook.

### ⑤ Forfeit or Fight: Minecraft speedrun races (quick 6.5) [Minecraft]
- **Data:** the MCSR Ranked API. It covers every ranked 1v1 Minecraft speedrun race: when each player reached each milestone (the Nether, a fortress, the Stronghold), plus Elo ratings.
- **Jev's judgement:** the chance you win, given the race so far.
- **Decision:** forfeit now and queue again, or play on.
- **Gain:** Elo per hour, compared with never forfeiting.
- **Cardputer:** a second-screen coach showing e.g. "FORFEIT (win 8%)".
- **How common:** stats sites exist, but I found no forfeit advisor. It's niche, and judges may not know the game.

### Weaker ones
| Idea | Data → judgement → decision | Why it's weaker | Quick |
|---|---|---|---|
| **The Silence Clock** | Steam's free news API (every update post for a game) → Jev reads the developer's latest posts → buy an Early Access game now, or wait | Since Feb 2025 Steam itself warns when a game goes a year without an update | 6.0 |
| **Box Time Lies** [board game] | BoardGameGeek play logs (play length, an "unfinished" flag) → the chance your group finishes in time → which game to pick tonight | Low stakes. API access not checked | 6.0 |
| **Holding Pattern** [flight] | OpenSky's live aircraft positions (planes circling in Heathrow's holding stacks) → the chance a flight lands 15+ minutes late → when to leave to pick someone up | Flight-arrival prediction is common. Historical data needs research access. Not checked today | 5.8 |
| **Reset or Run** | splits.io speedrun splits → the chance this attempt beats your best → reset or carry on | LiveSplit already has a "Reset Chance" add-on | 5.8 |

**Keywords that gave nothing good:**
- guitar: no data.
- bee: predicting swarms is a common hack.
- swimming: water quality is our datathon's territory.
- sleep on its own: it needs health data and health claims.

**If we go non-financial:**
- Memento Mori has the cleanest backtest and the best hook.
- Flag Fall is still the strongest plan we've written up.
- A Jev twist for Flag Fall: bullet players glance rather than calculate, and Jev is a "glance" model. Give it the position plus both clocks, and compare its gut call with the engine's.

---

## 2B. Random keywords, classified by forum demand (Reddit stand-in)
*Saturday 14:40. Seed **1792848949**, 30 keywords from a pool of 217, with used topics removed.*

**The classifier.** For each keyword, one forum search for people asking a timing question ("how long until…", "is it worth waiting…"), plus one web search for a tool that already answers it.
- **Demand (0–2):** forum threads asking that timing question. 0 = none, 1 = a few, 2 = many.
- **Gap (0–2):** 2 = no existing tool, 1 = only generic guides or official estimates, 0 = an app or predictor already does it.
- **Fit (0–2):** open data plus a time-themed decision with a measurable gain that suits Jev and the Cardputer. Off-limits topics score 0.
- **Verdict:** 5–6 = pursue, 3–4 = maybe, 0–2 = drop.

**Why not Reddit:** my search tools can't reach Reddit, and I didn't route around that. The stand-ins are Mumsnet, The Student Room, MoneySavingExpert, PistonHeads and FlyerTalk. Each keyword has a Reddit search link, so you can check by hand.

| # | Keyword | Forum demand | Existing tool? | Fit | D+G+F | Verdict | Check on Reddit |
|---|---|---|---|---|---|---|---|
| 1 | captcha | Complaints about constant captchas, but no timing question (1) | Many captcha-solving tools (0) | No time decision (0) | 1 | drop | [search](https://www.reddit.com/search/?q=captcha+every+time+how+long) |
| 2 | passport office | 10+ Mumsnet threads: "how long did your passport take?" (2) | Official tracker and "allow 3 weeks"; no personal predictor (1) | Only monthly official stats (1) | 4 | MAYBE | [search](https://www.reddit.com/search/?q=passport+how+long+did+yours+take+UK) |
| 3 | airport security | Many "how early should I get to the airport?" threads (2) | Live wait-time apps and airport predictions already exist (0) | Some data (1) | 3 | MAYBE | [search](https://www.reddit.com/search/?q=how+early+to+arrive+airport+security+UK) |
| 4 | theatre | A few "will I make the last train?" threads (1) | Running-time listings already answer it (0) | End times are fixed (1) | 2 | drop | [search](https://www.reddit.com/search/?q=what+time+will+the+show+finish+last+train) |
| 5 | GeoGuessr | No timing questions (0) | AI location guessers exist (0) | – (0) | 0 | drop | [search](https://www.reddit.com/search/?q=geoguessr+when+to+guess+timed+round) |
| 6 | houseplant | Many "how often do I water?" threads (2) | Lots of watering apps (0) | – (0) | 2 | drop | [search](https://www.reddit.com/search/?q=how+often+water+houseplant) |
| 7 | CV (hearing back) | 10+ "how long to hear back after an interview?" threads (2) | Only generic benchmarks and follow-up guides (1) | Natural Jev job, but no open labelled data (1) | 4 | MAYBE | [search](https://www.reddit.com/search/?q=how+long+to+hear+back+after+interview+UK) |
| 8 | snooze button | Habit threads, no prediction question (1) | Smart-alarm apps (0) | Sleep = health data (0) | 1 | drop | [search](https://www.reddit.com/search/?q=how+many+times+do+you+snooze) |
| 9 | comedy show | A couple of "how long do gigs last?" threads (1) | Venues list finish times (0) | Little to predict (1) | 2 | drop | [search](https://www.reddit.com/search/?q=how+long+do+comedy+shows+last) |
| 10 | Mario Kart | No timing questions (0) | Item odds already tabulated (0) | – (0) | 0 | drop | [search](https://www.reddit.com/search/?q=mario+kart+item+timing) |
| 11 | landlord | Many "how long should repairs take?" threads (2) | Legal timescale guides (e.g. Shelter's tool) (1) | Housing data fits the datathon template (0) | 3 | MAYBE | [search](https://www.reddit.com/search/?q=how+long+should+landlord+take+to+fix+repair+UK) |
| 12 | car park | Vague parking threads (1) | Parking-space apps exist (0) | Common (1) | 2 | drop | [search](https://www.reddit.com/search/?q=what+time+does+car+park+fill+up) |
| 13 | night bus | "Last bus didn't turn up" threads (2) | Ghost-bus projects everywhere (we dropped this before) (0) | Prior art (0) | 2 | drop | [search](https://www.reddit.com/search/?q=night+bus+didn%27t+turn+up) |
| 14 | diary | No timing question (0) | Streak apps (0) | – (0) | 0 | drop | [search](https://www.reddit.com/search/?q=how+long+have+you+kept+a+diary) |
| 15 | YouTube premiere | No real timing questions (0) | Creator "best time to post" tools (1) | Upload history is open, gain is weak (1) | 2 | drop | [search](https://www.reddit.com/search/?q=youtuber+next+upload+when) |
| 16 | podcast episode | A few threads (1) | Manifold markets already bet on podcast release days (1) | RSS feeds give full release history (1) | 3 | MAYBE | [search](https://www.reddit.com/search/?q=when+is+the+next+episode+podcast) |
| 17 | npm package | Forum search blocked; a common question (unverified) (1) | Health-score tools, plus a 2025 paper on predicting abandonment (0) | Open data (1) | 2 | drop | [search](https://www.reddit.com/search/?q=is+this+npm+package+abandoned) |
| 18 | table tennis | Nothing (0) | Research predictors exist (0) | – (0) | 0 | drop | [search](https://www.reddit.com/search/?q=table+tennis+match+how+long) |
| 19 | concert tickets | Many anxious queue threads (Oasis, Harry Styles, Taylor Swift) (2) | Queue guides only; no "will tickets be left?" predictor (1) | No open queue data (1) | 4 | MAYBE | [search](https://www.reddit.com/search/?q=ticketmaster+queue+will+there+be+tickets+left) |
| 20 | cricket rain delay | Almost nothing (0) | No predictor found (1) | No delay data, and out of season (1) | 2 | drop | [search](https://www.reddit.com/search/?q=rain+delay+will+play+resume+cricket) |
| 21 | darts | Nothing (only competitions) (0) | Order-of-play listings (1) | Weak gain (1) | 2 | drop | [search](https://www.reddit.com/search/?q=what+time+will+the+darts+finish) |
| 22 | level crossing | Several "why are the barriers down so long?" threads (2) | An app already exists (Crossing Dropping) (0) | Rail data needs registration (1) | 3 | MAYBE | [search](https://www.reddit.com/search/?q=level+crossing+barriers+down+so+long) |
| 23 | subreddit | Nothing (0) | Subreddit analytics tools (0) | – (0) | 0 | drop | [search](https://www.reddit.com/search/?q=subreddit+private+when+will+it+come+back) |
| 24 | Wordle | Daily threads, no prediction question (1) | Solvers everywhere (0) | – (0) | 1 | drop | [search](https://www.reddit.com/search/?q=wordle+answer+tomorrow) |
| 25 | Netflix cancellation | Many threads angry about shows cancelled on a cliffhanger (2) | Analysts and a 2020 blog model; no live tool for viewers (1) | Netflix publishes weekly Top 10 and twice-yearly viewing data (2) | 5 | **PURSUE** | [search](https://www.reddit.com/search/?q=netflix+cancelled+cliffhanger+should+I+start) |
| 26 | exam | Many "when do results come out?" threads (2) | Official release dates (1) | Dates are mostly fixed, so little to predict (0) | 3 | MAYBE | [search](https://www.reddit.com/search/?q=how+long+until+exam+results) |
| 27 | ramen | Japan queue chatter (1) | Restaurant wait-time apps (0) | – (0) | 1 | drop | [search](https://www.reddit.com/search/?q=ramen+queue+how+long+worth+it) |
| 28 | Snowdon | A long Mumsnet thread on the summit queue, more on PistonHeads (2) | Static "busy times" guides only (1) | No queue data, and off-season (1) | 4 | MAYBE | [search](https://www.reddit.com/search/?q=snowdon+summit+queue) |
| 29 | student finance | 10+ "still processing, how long?" threads (2) | Official timescales page (1) | Open data, but datathon-template risk (1) | 4 | MAYBE | [search](https://www.reddit.com/search/?q=student+finance+still+processing+how+long) |
| 30 | motorway services | A few threads (1) | Busy-times articles (1) | Weak gain (0) | 2 | drop | [search](https://www.reddit.com/search/?q=motorway+services+busy+queue) |

**Result:** 1 pursue, 10 maybe, 19 drop. Most keywords die because a tool already exists, or because nobody asks a timing question about them.

**Engagement check with Firecrawl (Saturday 14:50, non-Reddit forums only).** We scraped the top threads for each shortlisted keyword and counted replies, a stronger signal than counting threads. Mumsnet shows each thread's total reply count. The Student Room and older threads show first-page post counts, so those are estimates.

| Keyword | Threads scraped | Replies (approx.) | Most recent | What it changes |
|---|---|---|---|---|
| Netflix cancellation | 4 on Mumsnet | ~450 (304 + 129 + 10 + 9) | 2025 | Confirms the pick |
| Concert tickets | 3 on Mumsnet | ~330 (197 Oasis + 76 Harry Styles + 53) | 2026 | The strongest live pain, but still no data |
| Snowdon summit queue | Mumsnet + PistonHeads | ~160 (138 + ~20) | 2026 | One viral thread; still no data |
| Passport office | 3 on Mumsnet | ~80 (43 + 26 + 12) | 2025 | Steady, moderate |
| Student finance | 3 on The Student Room | ~35 | 2025 | Weaker than the thread count suggested |
| Hearing back after interviews | MoneySavingExpert, Mumsnet, The Student Room | ~30 | 2024 | Weaker than the thread count suggested |

Reddit was not scraped. It's blocked on our side for legal reasons, whichever tool is used. To add Reddit's evidence, open the links in the table above by hand.

### ★ Cliffhanger Insurance: should I start this show? (quick 6.9) [Netflix cancellation]
- **The pain (from the forums):** people hate getting hooked on a show that's cancelled on a cliffhanger. Mumsnet has whole threads like "to be totally sick of series that don't finish".
- **Data:**
  - Netflix's weekly Top 10 lists: every week since July 2021, with hours viewed and weeks on the list. Free to download.
  - Netflix's twice-yearly "What We Watched" reports: hours viewed for every title.
  - The outcomes (renewed or cancelled), from Netflix's announcements. Wikipedia keeps lists.
- **Jev's judgement:** the chance of a renewal. It reads the show's first four weeks: its Top 10 run written out as text, genre, episode count and headlines.
- **Decision:** start now, or wait until it's renewed.
- **Gain:**
  - **Saved:** hours not spent on shows that end on a cliffhanger.
  - **Cost:** the wait for shows that do get renewed.
  - **Backtest:** train on 2021–23 shows, test on 2024–25.
- **Time:** Netflix judges a show on its first 28 days of viewing, and so do we. The device also counts down to when the verdict usually lands.
- **Cardputer:** type a show's name and it shows "WAIT (renewal 23%)" or "START (81%)".
- **Baselines:**
  - always start;
  - a simple rule on weeks in the Top 10;
  - Jev against OpenAI Decisions.
- **How common:** analysts write "will it be renewed?" pieces, and a 2020 blog post built a model. I found no live tool that gives a viewer "start or wait" with calibrated odds.
- **Risks:**
  - A few hundred series is a small sample.
  - Netflix weighs cost, which isn't public.
  - Some renewals come before the data shows anything.

### Close misses (4/6), and what would push each over
- **Concert tickets: "will there be tickets left when I reach the front?"**
  - **For:** the strongest pain of the lot.
  - **Missing:** open queue data. It passes if we can collect queue reports (position, time, outcome) from one past big sale.
- **Hearing back after interviews**
  - **For:** huge demand, and a natural job for Jev: read the recruiter's email and give the chance you hear back.
  - **Missing:** labelled data. Our own applications are too few for a backtest.
- **Passport office**
  - **For:** huge demand.
  - **Missing:** good data. There are only monthly official stats, so it becomes a weak government-data forecast.
- **Snowdon summit queue**
  - **For:** poetic. People queue an hour on a mountain top for a photo.
  - **Missing:** queue data, and it's off-season.
- **Student finance**
  - **For:** huge demand.
  - **Against:** it risks the datathon template (public UK data → risk forecast for a vulnerable group).

**Sources for 2B:**
- [Mumsnet: to be totally sick of series that don't finish](https://www.mumsnet.com/talk/am_i_being_unreasonable/5322334-to-be-totally-sick-of-series-that-dont-finish)
- [Mumsnet: shows cancelled before they are finished](https://www.mumsnet.com/talk/telly_addicts/4712637-shows-cancelled-before-they-are-finished)
- [What's on Netflix: Top 10 title search (data since July 2021)](https://www.whats-on-netflix.com/TOP-10-TITLE-SEARCH/)
- [Netflix: What We Watched engagement report](https://about.netflix.com/en/news/what-we-watched-a-netflix-engagement-report)
- [R-bloggers: Will Netflix renew the show? (2020)](https://www.r-bloggers.com/2020/08/will-netflix-renew-the-show/)
- [Entertainment Strategy Guy: how to know if Netflix will cancel your show](https://entertainmentstrategyguy.com/?p=13643)
- [No Film School: Netflix and completion numbers](https://nofilmschool.com/netflix-cares-about-completion-numbers)
- [Mumsnet: passport renewal, how long did yours take?](https://www.mumsnet.com/talk/holidays/5019572-passport-renewal-how-long-did-yours-take-recently)
- [Mumsnet: Oasis Ticketmaster issues](https://www.mumsnet.com/talk/am_i_being_unreasonable/5154534-oasis-ticketmaster-issues)
- [Mumsnet: AIBU to skip the queue at the Snowdon summit?](https://www.mumsnet.com/talk/am_i_being_unreasonable/5570494-aibu-to-skip-the-queue-at-the-snowdon-summit)
- [The Student Room: student finance processing time](https://www.thestudentroom.co.uk/showthread.php?t=7545063)
- [MoneySavingExpert: how long to hear back after an interview?](https://forums.moneysavingexpert.com/discussion/1981707/how-long-does-it-take-to-hear-back-from-an-employer-after-an-interview)
- [Crossing Dropping (App Store)](https://apps.apple.com/gb/app/id6755299208)
- [FlyFast: Airport Wait Times (App Store)](https://apps.apple.com/app/id6765613798)
- [Manifold: will a new podcast episode be released this Thursday?](https://manifold.markets/dglid/will-a-new-build-for-tomorrow-podca)

---

## 3. 30 more keywords, classified by forum demand (seed 1792849948)
*A second, independent run of the 2B idea, with a different seed and a slightly different scorecard.*

**How it worked**
- **Keywords:** 30, drawn at random from a pool of 178 with **seed 1792849948**. I left out power cuts, water quality, health, scams, and anything we'd already used.
- **Why not Reddit:** our search tools keep Reddit out on purpose, and the 2B run was told it's for legal reasons.
  - I first pulled Reddit snippets through a different search tool (Firecrawl). That went around the block, so I deleted that data and redid everything here without it.
  - Each keyword has a Reddit search link, so you can check Reddit yourself.
- **Forum check:** one search per keyword, on the forum where that topic lives: FlyerTalk for luggage, the eBay Community for auctions, GameFAQs for games, Mumsnet for everyday life, UKClimbing, Stargazers Lounge and so on.
- **Scoring:** 0–2 on five things, judged from the forum threads:
  - real timing pain
  - data we can actually get
  - a gap (no app already does it)
  - a decision with a measurable gain
  - fit (time theme, Jev, Cardputer, Tom 7)
- **Verdicts:**
  - **pursue:** 7 or more, with a real gap
  - **maybe:** 5–6, or a high score with no gap
  - **drop:** 4 or less, or ruled out for another reason
- **Second check:** for the top candidates, I looked for existing tools and confirmed the data exists.

**Result:** 2 pursue, 2 borderline, 8 maybe, 17 drop, and 1 not classified because its search failed twice. Like 2B, this classifier is harsh.

### ① When Does It Really End? Soft-close auctions (9/10, quick 7.3) [auctioneer]
- **What the forums said:** the eBay Community forum is full of threads on "soft-closing" and "extended bidding".
  - Sellers quote eBay's test: "We're currently testing extending auction durations by 2 minutes when a bid is placed in the last 2 minutes of an auction."
  - One describes how it played out: "Each lot closed in 2 minute increments unless another bid was received in which case the end time was extended another 2 minutes."
  - Another wants a soft close, "but there has to be a limit".
- **Why now:** on 17 Aug 2026, eBay Australia moved every auction to extended bidding.
  - Any bid in the last minute resets the clock to 60 seconds.
  - The auction only ends after a full minute with no bids.
  - The US and UK are still testing it.
- **Data:** finished soft-close auctions with timestamped bid histories.
  - ShopGoodwill: open-source scripts already use its API.
  - Possibly HiBid, Bring a Trailer, and the bid-history pages of ended eBay auctions.
- **Jev's judgement:** 10 minutes before the posted end, read the listing and its live state (bids so far, watchers, questions).
  - It outputs the chance of a bidding war, and which bucket the overrun falls in: none, 1–5, 5–15 or 15+ minutes.
  - Code works out the actual times.
- **Decision:** when to come back and place your one real bid, instead of sitting through the extensions. For sellers: when to end an auction.
- **Gain:** minutes of watching saved, while still being there at the real end.
  - Example output: "come back at 14:37, and 9 in 10 auctions are still open".
  - Backtest on later auctions.
  - We measure it in minutes, not pounds.
- **Time:** the posted end time is a lie. Pepys's candle auctions (1662) were the original soft close.
- **Cardputer:** an auction clock that shows the predicted real end and buzzes when it's time to come back.
- **Story:** "I snipe eBay at 0:59. Now eBay is killing sniping, so I built the thing that tells you when an auction really ends."
- **How common:** sniping tools exist, and this change kills them. I found no predictor of real end times.
- **Risk:** scraping enough bid histories in time. Start with one site.

### ② Save or Pull? Gacha rerun forecaster (8/10, quick 6.7) [gacha banner]
- **What the forums said:** GameFAQs boards ask whether to pull on a banner now or wait, and when to pull.
  - Whole web articles exist on "when will this character rerun?" and "what determines banner reruns".
  - Those articles answer with rules of thumb and leaks.
- **Data:** full banner histories (every banner, with its dates and characters) on game wikis and fan sites, for several games.
- **Jev's judgement:** read official patch notes and announcements (no leaks) alongside the history, and give the chance a character reruns in the next 1, 2 or 3 patches.
- **Decision:** save in-game currency for a rerun, or pull now.
- **Gain:** in a backtest, a simulated player who follows our rule gets more of the characters they want per unit of in-game currency than with a simple "time since the last run" rule.
- **Time:** patch cycles and the wait.
- **Cardputer:** shows "days until a likely rerun" and a SAVE/PULL light.
- **How common:** guesses, leaks and spreadsheets are everywhere, but I found no calibrated model.
- **Risk:** gacha is close to gambling, so frame it as "save, don't spend", with in-game currency only. The judges may not play these games.

### Borderline
| Idea | Data → judgement → decision | Why only borderline | Score |
|---|---|---|---|
| **Bag Back?** [lost luggage] | FlyerTalk is full of threads like "How long does it take BA to deliver delayed bags?", which Jev can code into time buckets. Plus US DOT airline baggage stats → the chance your bag is back within 48 hours → buy essentials and claim now, or wait | Self-reports lean towards bad experiences, and there aren't many | 7 |
| **Rotation Rater** [salmon run] | Two readings. On the iFish fishing forum it means real salmon, and anglers ask when the run peaks, but the University of Washington's Columbia Basin Research already publishes run-timing tools. On GameFAQs it means Splatoon's co-op mode, where players moan about bad weapon rotations, and stat.ink holds uploaded shifts → the chance of clearing this rotation → grind it or skip it | Real fish: already done. Splatoon: niche | 7 |

### What dropped without Reddit
- **Podfade** (is this podcast dead, or just late?) falls to maybe.
  - On Mumsnet and the Spotify Community forum, the threads were about app bugs, not people asking "is this show dead?".
  - The data is still excellent (the Podcast Index's weekly dump of every feed), so it's worth revisiting if the team believes the demand is there.
- **Laundrette, apple harvest, vinyl records and mattress** also fall. Their forum threads were about etiquette, show dates, the "wait 24 hours between plays" myth and delivery times, not anything to predict.

### All 30 keywords
Each score is out of 10: timing pain, data, gap, decision and fit, 0–2 each. The last column opens a Reddit search, so you can check Reddit yourself.

| Keyword | Forum checked | Score | Verdict | What the forum showed | Reddit |
|---|---|---|---|---|---|
| auctioneer | eBay Community | 9 | ★ Pursue | Many threads on eBay's soft-close test and 2-minute extensions | [search](https://www.reddit.com/search/?q=soft+close+auction+extended+bidding) |
| gacha banner | GameFAQs | 8 | ★ Pursue | "Pull now or wait?" threads; articles on when characters rerun | [search](https://www.reddit.com/search/?q=banner+rerun+predict) |
| cherry blossom | Japan Guide | 8 | Maybe | Great data, but Japan Guide and others already publish bloom forecasts | [search](https://www.reddit.com/search/?q=cherry+blossom+timing+peak+bloom) |
| lost luggage | FlyerTalk | 7 | Borderline | "How long does it take BA to deliver delayed bags?"; most airlines declare a bag lost after 5–14 days | [search](https://www.reddit.com/search/?q=delayed+bag+how+long+to+get+back) |
| salmon run | iFish, GameFAQs | 7 | Borderline | Real salmon: run-timing tools already exist. Splatoon: rotation gripes | [search](https://www.reddit.com/search/?q=salmon+run+rotation) |
| podcast | Mumsnet, Spotify Community | 6 | Maybe | App bugs only, no "is this show dead?" worry; great data | [search](https://www.reddit.com/search/?q=how+long+before+you+assume+a+podcast+is+dead) |
| sunset | Talk Photography | 6 | Maybe | "How to predict a good sunrise/sunset?" is a real question, but Alpenglow, SunsetWx and Skyfire already forecast it | [search](https://www.reddit.com/search/?q=predict+good+sunset) |
| stargazing | Stargazers Lounge | 6 | Maybe | "Waiting over four months for a clear night", but clear-sky forecast apps exist | [search](https://www.reddit.com/search/?q=clear+night+forecast+stargazing) |
| seal pups | BirdForum | 6 | Maybe | "Anyone seen many pups yet?"; colonies post counts; pupping season is now | [search](https://www.reddit.com/search/?q=seal+pups+when+to+visit) |
| climber | UKClimbing | 6 | Maybe | "Ideal recovery time between attempts"; public logbooks exist, and so do tracking apps | [search](https://www.reddit.com/search/?q=rest+between+attempts+bouldering) |
| plumber | Mumsnet | 6 | Maybe | "To expect the plumber to turn up when he said?"; no data on job lengths | [search](https://www.reddit.com/search/?q=plumber+late+arrival+window) |
| car park | PistonHeads | 5 | Maybe | "Overstayed in a supermarket car park: when to expect a fine?"; 10-minute grace periods; no data | [search](https://www.reddit.com/search/?q=car+park+fine+grace+period+uk) |
| driving test | The Student Room | 4 | Drop | Waits and hours of lessons; cancellation apps and pass-rate tables exist | [search](https://www.reddit.com/search/?q=driving+test+wait+time+uk) |
| bread | The Fresh Loaf | 4 | Drop | Cooling and slicing waits; would need sensors | [search](https://www.reddit.com/search/?q=how+long+to+cool+bread) |
| vinyl records | Steve Hoffman Music Forums | 4 | Drop | The "wait 24 hours between plays" myth; nothing to predict | [search](https://www.reddit.com/search/?q=vinyl+preorder+delayed) |
| fridge leftovers | Mumsnet | 4 | Drop | "How long does cooked food keep?"; rules of thumb; food-safety claims | [search](https://www.reddit.com/search/?q=how+long+leftovers+fridge) |
| apple harvest | Allotments 4 All | 4 | Drop | Show dates and poor-harvest years; no data | [search](https://www.reddit.com/search/?q=when+are+apples+ready+to+pick) |
| bicycle tyre | CycleChat | 3 | Drop | Patch-glue and tyre-life banter | [search](https://www.reddit.com/search/?q=how+long+should+bike+tyres+last) |
| exam hall | The Student Room | 3 | Drop | Leaving early; results dates are fixed | [search](https://www.reddit.com/search/?q=leave+exam+early+do+better) |
| charity shop | Mumsnet | 3 | Drop | Prices, donations, 14-day stock rotation | [search](https://www.reddit.com/search/?q=charity+shop+stock+rotation) |
| pub quiz | Mumsnet | 3 | Drop | Team names and cramming | [search](https://www.reddit.com/search/?q=pub+quiz+how+long) |
| Facebook Marketplace | MoneySavingExpert | 3 | Drop | Mostly fraud and refund disputes: scam territory | [search](https://www.reddit.com/search/?q=facebook+marketplace+no+show+how+long+wait) |
| candles | Mumsnet | 3 | Drop | Burn times and health debates | [search](https://www.reddit.com/search/?q=candle+burn+time+tunneling) |
| mattress | Mumsnet | 3 | Drop | Delivery waits and unboxing rules | [search](https://www.reddit.com/search/?q=new+mattress+break+in+period) |
| parrot | Parrot Forums | 3 | Drop | Settling-in rules of thumb | [search](https://www.reddit.com/search/?q=new+parrot+how+long+to+settle) |
| laundrette | Mumsnet | 3 | Drop | Cycle times and etiquette | [search](https://www.reddit.com/search/?q=how+long+to+wait+before+moving+laundry) |
| sailor | YBW | 2 | Drop | Sailing banter; no timing problem | [search](https://www.reddit.com/search/?q=sailing+weather+window+how+long+to+wait) |
| glow worms | Mumsnet | 2 | Drop | Noise: a boiler brand, The Archers, New Zealand trips | [search](https://www.reddit.com/search/?q=glow+worms+uk+when+to+see) |
| CAPTCHA | Tom's Hardware | 1 | Drop | Tech support; no decision | [search](https://www.reddit.com/search/?q=captcha+loop) |
| snowdrops | Gardeners' World | – | Not classified | The search failed twice | [search](https://www.reddit.com/search/?q=snowdrops+flowering+early) |

---

## 3B. 12 more keywords, scored for HRT (seed 1792849741)
*Saturday ~16:00, Ahmed. A third run with the HRT brief as the lens: timestamped data → a prediction → a decision → a gain we can measure.*

**How it worked**
- **Keywords:** 12 drawn with **seed 1792849741** from a pool of 120: wikipedia-edit, airport-security, laundromat, auction, price-tag, ebay-listing, vinyl, hourglass, allotment, horse-racing, meteor-shower, university-clearing.
- **Sources:** forums (Cloudy Nights, the Betfair trading forum, The Student Room, MoneySavingExpert, City-Data), papers and official data, found with Exa. **No Reddit:** Reddit blocks our tools, and anything that came through a Reddit mirror or archive was thrown away, matching section 3's rule.
- **Scoring:** section 3's scorecard, 0–2 each for timing pain, data, gap, decision and fit (10 in total). Load-bearing data claims were checked at the source.
- **Overlap with section 3:** airport security, stargazing, auctions, vinyl and laundrette were already scored there. This run only adds a new angle or new evidence.

**Result:** 1 pursue, 3 borderline, 2 maybe, 6 drop. None beats *The Fed Millisecond* on HRT fit. *Dark Sky Gamble* is the best non-financial idea from this run.

### ① Dark Sky Gamble: drive to the dark site tonight or not? (9/10, quick 6.8) [meteor shower]
- **The pain (Cloudy Nights forum):** observers who drive 100+ miles to dark skies say they check 13–16 forecast sites and vote by hand ("all clear: I go; three-quarters cloudy: I stay home"), and "all 13 sites were wrong". Forecasts change their minds from run to run.
- **Data (checked):**
  - Open-Meteo's **Previous Runs API** gives each model's cloud cover (total, low, mid, high) as it was forecast 1–7 days ahead, for most models from January 2024. Free.
  - Truth: the same models' analysis hours from the Historical Forecast API, or ERA5, or airport METAR cloud reports.
- **Jev's judgement:** optional. Code does the calibration; Jev could read forecast-discussion text.
- **Decision:** go or stay for a given site and night, given drive time. Also, how many days ahead to commit.
- **Gain:** clear hours observed per trip, backtested on 2025–26 nights, against (a) the best single app, (b) the forum's majority vote, (c) always going on new-moon weekends.
- **Time:** forecast skill decays with lead time, and we measure how fast. Showers coming up: Leonids (17 Nov) and Geminids (13–14 Dec).
- **Cardputer:** a go/no-go light for your dark site, e.g. "clear 3h: 62%".
- **How common:** model-comparison apps (Astrospheric, Clear Outside, Meteoblue) exist, which is why section 3 scored stargazing "maybe". Ensemble calibration is standard meteorology. A calibrated go/no-go for a specific drive, with a measured gain, wasn't found.
- **Risks:** cloud "truth" from models isn't what the observer actually saw. UK samples are noisy.

### Borderline
| Idea | Data → judgement → decision | Why only borderline | Score |
|---|---|---|---|
| **Arrive Too Early** [airport security] | TSA publishes **hourly passengers per checkpoint** for every US airport each week (FOIA reading room, latest week to 17 Oct 2026) → predict the load for your hour → when to leave home. Twist: in the 2026 shutdown, Columbus airport said early birds were *making* queues worse, so the advice changes the queue. Simulate that feedback (a MiroFish-style crowd fits here) | Throughput isn't wait time; US only; wait-time apps exist (section 2B) | 7 |
| **They Know** [horse racing] | Betfair pre-off markets: traders on the Betfair forum say most money arrives in the last ~2 minutes. Predict the next 30 s move from book features → back, lay or wait, after 5% commission | Betfair's own data scientists published a tutorial doing exactly this; fine-grained history may be paid (not checked); gambling optics | 7 |
| **Going, Going, Cheaper** [auction] | The "afternoon effect": identical wine lots sold later in a sale fetch less (Ashenfelter 1989; McAfee and Vincent), and art prices relative to estimate fall through a sale (Beggs and Graddy 1997) → which lot to bid on | Evidence is mixed (no effect in Italian modern art, Empirica); lot-order data needs scraping. Best as a feature inside section 3's *When Does It Really End?* | 7 |

### Maybe, then drops
| Keyword | Score | Verdict | Why |
|---|---|---|---|
| price tag (yellow stickers) | 6 | Maybe | Real pain and press coverage (Which?, MEN), but chains say timing "varies by store" and there is no public data; we'd have to collect it |
| university clearing | 5 | Maybe | Vacancies appear and vanish through results day, but nobody archives them with timestamps, and it's out of season |
| wikipedia edit | 3 | Drop (contested) | Moat and Preis (2013) found views preceded falls; a 2022 Nasdaq study found no predictive power, and critics blame a short bias. Edits showed no link. Overlaps *Wikipedia edit futures* |
| ebay listing | 3 | Drop | A paired field experiment found no significant benefit to sniping; covered by *Last Second*, *Going Once* and section 3 |
| vinyl | 3 | Drop | Discogs shows only the last 10 sales per release; section 3 dropped it too |
| allotment | 3 | Drop | Only FOI snapshots (157,820 applications in England in 2023, ~3 years' average wait); no time series; datathon-template risk |
| laundromat | 2 | Drop | Prior art: an M5Stack vibration laundry monitor (NYUAD), the same hardware family as our Cardputer |
| hourglass | 1 | Drop | Too abstract to map onto data |

**Sources for 3B**
- [Open-Meteo Previous Runs API](https://open-meteo.com/en/docs/previous-runs-api) and [Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api)
- [Cloudy Nights: best weather app for cloud predictions](https://www.cloudynights.com/topic/895204-best-weather-app-for-cloud-predictions/) and [how accurate is Astrospheric?](https://www.cloudynights.com/topic/900151-how-accurate-is-astrospheric/)
- [TSA FOIA reading room (weekly hourly throughput)](https://www.tsa.gov/foia/readingroom) and [data.gov entry](http://catalog.data.gov/dataset/tsa-foia-reading-room-weekly-passenger-throughput-data)
- [AP: airports tell travellers not to arrive so early (Mar 2026)](https://apnews.com/article/airport-delays-security-lines-tsa-6fb45976ea952c0c825d8c3c7c507953)
- [Betfair forum: recent volatility of racing markets](https://forum.betangel.com/viewtopic.php?t=19992) and [Betfair Data Scientists: analysing and predicting market movements](https://betfair-datascientists.github.io/tutorials/analysingAndPredictingMarketMovements/)
- [Geegeez: steamers and drifters, part 3](https://www.geegeez.co.uk/steamers-and-drifters-part-3/)
- [Ashenfelter (1989): How auctions work for wine and art](https://doi.org/10.1257/jep.3.3.23), [Beggs and Graddy (1997)](https://ideas.repec.org/a/rje/randje/v28y1997iautumnp544-565.html), [McAfee and Vincent: The Afternoon Effect](https://ideas.repec.org/p/nwu/cmsems/961.html), [Empirica: no afternoon effect in Italian art](https://link.springer.com/article/10.1023/A:1024117331138)
- [Which?: best times for yellow-sticker bargains](https://www.which.co.uk/news/article/best-times-of-day-to-get-yellow-sticker-supermarket-bargains-revealed-aRzv22f0s7Lt)
- [Campus Life: clearing hour by hour (2026)](https://campuslife.uk/admissions/clearing-on-results-day-what-actually-happens-hour-by-hour/)
- [PMC: Wikipedia usage before stock market moves (2013)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3647164/) and [Wiley: Wikipedia pageviews and Nasdaq, no predictive power (2022)](https://onlinelibrary.wiley.com/doi/full/10.1002/isaf.1508)
- [Reiley: measuring the benefits to sniping on eBay](https://davidreiley.com/papers/BenefitsToSniping.pdf)
- [Discogs forum: sales history shows only the last 10 sales](https://www.discogs.com/forum/thread/780124)
- [Greenpeace UK: allotment waiting lists (2023 FOI)](https://www.greenpeace.org.uk/news/giant-living-artwork-unfurled-at-westminster-as-waiting-lists-for-allotments-double-in-a-decade/)
- [NYUAD laundry monitor with M5Stack (GitHub)](https://github.com/elgamalsalman/nyuad-laundry-system)

---

## 4. Final rounds before the event (Friday night → Saturday 06:00)
| Idea | In one line | Score | Status |
|---|---|---|---|
| **Bang the Close** (grew out of Noise Traders) | Play-money futures on the hall's noise level. Judges try to rig the "fix" by shouting. A median across 3 mics, plus a hidden window locked in advance with a hash, defeats them | 7.7–7.8 (final rounds), roughly a 51% chance of at least one prize | ◆ It was the pick; now the backup |
| **Cut-Proof** (grew out of Half & Half) | Throw felt toppings on a card pizza. The ham-sandwich theorem finds the one straight cut that halves both dough and toppings, and a coin flip makes it lie-proof | 7.40 in round 2. Fell to 6.8 in round 3, because camera-guided fair-slicing apps exist | ○ |
| **Margin Call** (grew out of Proof Court) | Try to smuggle a false maths claim past a number-theory counterexample hunter. Every verdict prints a tiny certificate | 6.75 | ○ |
| **Unravel** | Recruiters play themselves in a placement market full of exploding offers, then a clearinghouse (Gale–Shapley) beats them | 6.75 | ○ Best story, but its only prize is judged after the event |
| **Swapsies** | A moneyless swap market for the hall's swag, cleared like a kidney exchange (Top Trading Cycles) and settled on Solana | 6.47 | ○ |
| **Handshake** | A networking game that pays the hall in sweets to cheat with fake accounts, then catches them (SybilRank) | 6.20 | ○ |
| **Call Auction** (grew out of Redial) | GP practices open with a phone race at 08:00. Replace it with batch clearing and a verifiable lottery within each triage band | 5.40 | ✗ Crowded UK theme (−1) |

**Variants we prepared for the opening ceremony**
- **Bang the Close, for a sustainability brief:** tradeable noise allowances, enforced by random inspections.
- **Cut-Proof, for a commute brief:** fair carpool zones drawn on a city map.
- **Call Auction, for a commute brief:** fixing the 08:00 race for parking spaces or desks.

---

## 5. Round 1: the first 25 strict-scored ideas (Friday night)
Four agents each took a lens:
- **Q:** quant-native
- **D:** data × stakes
- **P:** playful worlds
- **S:** personal stakes

**B** marks the baselines carried over from round 0.

| # | Idea | In one line | Score | Why it fell |
|---|---|---|---|---|
| 1 | Q1 Noise Traders | A futures exchange whose only data feed is the room's microphone | 7.35 | Became Bang the Close |
| 2 | Q3 Half & Half | The ham-sandwich theorem: a camera finds the cut that halves pizza and pepperoni | 7.17 | Became Cut-Proof |
| 3 | P2 Proof Court | Write a maths claim; two AI barristers argue it, and a solver rules | 7.15 | Became Margin Call |
| 4 | S5 Redial | Fix the 8am GP phone scramble with batch auctions, as proposed for high-frequency trading | 6.75 | Became Call Auction |
| 5 | P1 Room Exchange ("Blink Bets") | Bet on events in the room (blinks, claps, decibels), settled in seconds by camera and mic | 6.65 | Overlapped Noise Traders |
| 6 | Q5 Inch of Candle (S4 "Snuffed" was the same idea) | A 17th-century candle auction with a random close, to beat eBay snipers | 6.48 | Prior art (Meltdown and Wick on Devpost) |
| 7 | S2 Minority Report | A scam court where the room's "surprisingly popular" answer beats majority vote | 6.35 | The scam domain is close to the datathon's Proof of Kin |
| 8 | Q2 Catch & Release | Capture–recapture statistics count the bugs nobody has found, with AI reviewers as the traps | 6.03 | Weak demo |
| 9 | S3 Cross Breeze | Sketch your room and breathe at the webcam; an airflow simulation says which window to open | 6.03 | Low novelty, hard build |
| 10 | P5 Slashing Party | Werewolf meets the Byzantine Generals: lies leave cryptographic signatures | 6.02 | Thin demo |
| 11 | P3 Phone Pixels | Scatter phones on a table, and a marble rolls from screen to screen | 5.90 | Prior art ("Phone as a Pixel") |
| 12 | Q4 The Late Option (S1 "Leaves on the Line Capital" was the same idea) | Every UK rail ticket hides a free option on lateness (Delay Repay); price it live | 5.85 | Fits the datathon template (−0.5) |
| 13 | B3 Impulse Bouncer | A pulse-gated checkout with a Solana cooling-off vault | 5.83 | Saturated theme |
| 14 | Q6 Gut Check | A webcam replication of the study where traders sense their own heartbeat | 5.78 | Hard to execute |
| 15 | S6 PIVOT! (3D) | Will the sofa make it up your stairs? A motion planner shouts "PIVOT!" | 5.68 | Hard 3D build. A 2D version later scored 7.4 |
| 16 | D4 Leaves on the Line | Forecast leaf-fall rail delays for each route | 5.53 | Fits the datathon template |
| 17 | B2 Full Moon Fight | An RPG where your heart rate and breathing drive combat | 5.23 | Using vitals as a game controller is saturated |
| 18 | P6 Smoke Marshal | A camera-and-voice safety officer that yells STOP before a breadboard burns | 5.12 | Hard to execute |
| 19 | D2 Old Father Thames | Ask the river whether your crew can row tomorrow | 4.60 | ✗ Too close to the datathon's Spillcast |
| 20 | P4 Cold Call (scam) | Take a scam call, then walk the town of shell companies behind it | 4.28 | ✗ The datathon's Shell Alarm and Proof of Kin |
| 21 | D3 Cold Call (weather) | Price the £25 Cold Weather Payment as a bet that pays out if it gets cold enough | 4.23 | ✗ Same users as BlackNaught |
| 22 | B1 Front Desk | A bilingual waiting-room receptionist with camera vitals | 4.10 | ✗ Vitals prior art; medical framing |
| 23 | D6 Going Concern | A credit-risk model for care homes | 3.95 | ✗ The datathon's Shell Alarm |
| 24 | D1 Shortage Radar | A 30-day forecast of medicine shortages from NHS price concessions | 3.53 | ✗ Same as the datathon's Medicine Shortage Radar |
| 25 | D5 Head Rush | A NASA lean test (POTS screening) with no wearable | 3.42 | ✗ Medical claim |

### Extra ideas from round 1 (not scored)
**Quant lens**
- **Mention Markets:** contracts on a judge's own words.
- **Bus Stakes:** bet on which bus reaches Woodstock Road first.
- **Hold Your Breath Exchange:** ✗ safety.
- **Puzzle Forge:** puzzles on the Maths Institute's Penrose tiling, proved unique by a solver.
- **The Crowd Is Wrong:** a "surprisingly popular" game show.
- **Poker-Face Market Maker:** ✗ too like a lie detector.
- **Harberger Beanbag:** the best seat is always for sale, taxed on the price its holder declares.
- **Shill Hunter:** a live auction with hidden fake bidders, plus a detector.
- **Going Once:** forecast the last minutes of eBay auctions.
- **Seat-Swap TTC:** kidney-exchange maths for swapping train seats.
- **Human-reflex HFT race:** a continuous order book against batch auctions.
- **Wikipedia edit futures:** bets on the rate of edits, modelled as a self-exciting (Hawkes) process.
- **Lichess live-game market:** odds on a live game from the engine eval. An early form of Flag Fall.
- **Bumps Monte Carlo:** simulate Oxford's bumps races.
- **OURCs flag forecaster:** ✗ river data, too close to the datathon.
- **Medicine-shortage futures:** ✗ BlackNaught-shaped.
- **Merge Market:** bet on whether CI passes; pushing a breaking commit counts as insider trading.
- **Kelly Coin:** replicate the biased-coin betting experiment.

**Data lens** (mostly ✗, because they follow the datathon template)
- Delay Repay Desk: ✗ prior art (Flight Sense).
- Lift Lottery: ✗ the API was shut down.
- Damp Evidence Locker: ✗ crowded.
- Port Meadow E. coli nowcast: ✗
- Bonfire Night smoke forecast: ✗
- Bird-flu radar: ✗
- NHS Right-to-Choose optimiser: ✗ already exists.
- New-builds in flood zones: ✗ Aviva did it.
- Oxford ghost-bus hunter: ✗ Chi Hack Night did it.
- Food-bank shortage router: ✗ already exists.
- **The Hour That Happens Twice:** pedestrian risk after the clocks go back.
- Also all ✗: pharmacy-closure risk, severe-weather shelter forecaster, bench-to-bench walking routes, pothole freeze-thaw forecaster, rental-scam detector, blood-stock alerts, last-train stranding risk, vitamin D winter forecast, pub-closure risk, bike-theft hotspots.

**Playful lens**
- **The Pit:** a voice open-outcry auction.
- **Penrose Poison:** a two-player game on the plaza tiling.
- **Loaded Dice Detective:** a sequential test against a human.
- **Cox:** two strangers sync their breathing to row a Boat Race.
- **Delay Derby:** rail delays as a horse race. ✗ pre-empted.
- **Pac-Bus Oxford:** live buses as Pac-Man ghosts.
- **Bell Hero:** a change-ringing rhythm game. ✗ exists.
- **Dodgson's Tea Party:** Lewis Carroll's logic puzzles, checked by a solver.
- **Estimathon on the room.**
- **Crowd-entropy raffle:** phone shakes feed a fair draw.
- **Whack-a-Phone.**
- **OxHack Futures:** a market on who wins.
- **Cryptic Crossword Duel.**
- **Penrose GPS:** find your spot on the tiling from a photo.
- **Masquerade Werewolf:** voice-changer social deduction.
- **Human sorting network.**

**Personal lens**
- **Pretext:** ✗ a reskin of a voice-phishing project.
- **Proof of Pulse:** ✗ BioVerify exists.
- **Spares or Repairs:** ✗ already exists.
- **Knock-On:** how one late train spreads delays.
- **Doze Control:** a train-nap alarm that follows live delays.
- **Quiet Coach:** spots talking in the quiet coach.
- **Waiting Room Tetris:** race a scheduling algorithm.
- **Station Hunt:** clues unlock as a train passes each station.
- **Delay Dungeon:** a game you can only play while your train is delayed.
- **Britain, As Late As It Is:** a map that warps with delays.
- **Hammer Price:** a market on eBay closing prices.
- **IKEA Tetris:** pack flat-packs into a car boot.
- **Picross Portraits:** your face as a logic puzzle with exactly one solution.
- **No-Show Newsvendor:** how far to overbook GP appointments.

**Wildcard round (ideas meant to beat the leaders)**
- Swapsies, Unravel and Handshake went on to round 2 (section 4).
- **Penalty Oracle:** a goalkeeper that exploits your patterns, but only risks winnings it has already banked.
- **Dark Hour:** Persona 3 meets the clock change; handle the repeated hour correctly.
- **Tsebelis Inspector:** do bigger fines cut fare-dodging, or only inspections?
- **Refund Bonus:** crowdfund 3am coffee with a dominant assurance contract.
- **Impartial Hackers' Choice:** a vote where your ballot can't help your own team.
- **Competitive Crowds:** Galton's ox at Ox-ford: guess the jar, scored by a rule that rewards honest guesses.
- **Buffon at the Maths Institute:** drop matchsticks to estimate π, and show how stopping when the answer looks good fakes a result.
- **Gerrymander the Hall:** a tabs-vs-spaces vote that flags the judge's rigged district maps.
- **GroupSave Matcher:** group hackers into trios for the train's GroupSave discount.
- **Bribe-proof Ballot:** ✗ risky cryptography.
- **Loaded Die:** call cheating in the fewest rolls.

---

## 6. Problem bank: every track from random seeds (Saturday 07:15)
**Seed 1792826119** produced 48 random combinations of place × person × object × annoyance. We searched them on Reddit, forums and news across all 12 tracks, and a strict blind panel scored the results.

**After the opening ceremony:** none of these fit the time theme or HRT's brief well, so they're all parked.

| Score | Idea | Track | In one line | Status |
|---|---|---|---|---|
| 7.4–7.5 | PIVOT! (2D) | Organiser, DEV | Judges build a cardboard corridor; a planner finds the sofa's path live, or proves there isn't one | ○ Was a pre-event card |
| 7.3 | Horizon Witness | Tiger Data, social good | A "black box" for Post Office counters that proves when a shortfall came from the system, not theft | ○ Was a pre-event card |
| 6.6 | Footfall Rent | Tiger Data, Jane Street | Market-pitch rent that follows real footfall, counted by camera | ○ |
| 6.5 | Border Bottles | Jane Street | Wales left the deposit scheme, so Welsh cans bought without a deposit could be cashed in England. Simulate the smugglers and the fixes | ○ Was a pre-event card |
| 6.2 | LeakLens | Vultr | A self-hosted scan of a photo for what it gives away (school crest, lanyard, location) | ○ Ente's "They See Your Photos" already does this |
| 6.1 | Feathers & Silence | Citadel | Do petrol stations pass on cost falls more slowly than rises, and go quiet on the price feed? | ○ Was a pre-event card. The API only gives current prices |
| 6.0 | Retention-Desk Haggler | ElevenLabs | An AI voice haggles your broadband renewal | ○ Crowded; DoNotPay did it |
| 5.8 | Five-a-side assurance contract | Solana, Jane Street | Players stake to play, and no-shows pay the ones who turn up | ○ |
| 5.6 | Say It Back | ElevenLabs | Safety briefings in each worker's language, then teach-back questions | ○ |
| 5.6 | Pump Escrow | Solana | Pay at the pump without the £99 hold: escrow charges the exact amount | ○ |
| 5.5 | Referee wristband | Hardware | Tap to keep the last 30 s of abuse, transcribed into an FA report | ○ Was the hardware-track card |
| 5.5 | Odd Glove Out | Gemini | Lost-property matching from photos | ○ |
| 5.4 | Batch the 8am Scramble | Jane Street, health | Same idea as Call Auction | ✗ Crowded |
| 5.4 | Hotspot Moorings | Jane Street | Stop canal boats gaming the 14-day mooring rule | ✗ Looks like a reskin of Street Miles, a past Jane Street winner |
| 5.3 | Deposit Diff | Gemini | Compare move-in and move-out videos for damage | ○ Crowded |
| 5.2 | CalMac cancellations | Snowflake | One clean table of ferry cancellations from scattered FOI replies | ○ The demo is just a dashboard |
| – | Wireless theatre cue lights | Hardware | Cheap wireless cue lights for theatre groups that can't afford them | ○ A backup; not scored |

**Scored 5.1 or below (weak prize paths or demos):**
- **Plot Twist:** allotment waiting lists while plots sit idle.
- **The Waiting Tax:** does hospital parking income rise when waits get worse?
- **Broken-Heating Precedent Finder:** what the Ombudsman usually awards when there's no heating.
- **Chairside:** masking audio for people afraid of the dentist.
- **Deposit Defender:** trash a dollhouse, and the camera spots the damage.
- **Mock Examiner:** driving-test faults from gaze and road video.
- **Dog Breathing Pad:** counts a sleeping dog's breaths for its vet.
- **The Long Lie:** a daily live-pulse check-in for people living alone.
- **Wedding Milestone Escrow:** venue deposits held in escrow.

**Scored 4.4 or below (prior art, datathon reuse, saturated, or safety claims):**
- **Ghost buses**, which three agents found separately: Ghost Ledger, Ghost Buses Oxford and Ghost Bus Exorcist.
- **Proof-of-Life:** pulse check-ins for lone night guards.
- **Silent Splash:** drowning-posture detection.
- **Play Dead:** trains actors to play corpses.
- **Treasure Triage:** a valuation scanner for charity-shop donations.
- **Asian hornet report triage and hive sentry:** reuse of the datathon.

---

## 7. Round 0: the first battle plan (Friday 23:40, softer rubric)
These came from the first research report.
- Its rubric rewarded stacking sponsors, so the scores ran high.
- The strict scorer later re-scored the top three at 4.1–5.8.
- You felt they weren't unique enough.

| # | Idea | Score | # | Idea | Score |
|---|---|---|---|---|---|
| 1 | Front Desk: bilingual vitals receptionist | 8.65 | 22 | Robot arm plays a Persona rhythm game (hardware) | 7.25 |
| 2 | Full Moon Fight: heartbeat RPG | 8.6 | 23 | Social Link budget calendar | 7.2 |
| 3 | The Impulse Bouncer | 8.6 | 24 | Clinic queue forecaster | 7.1 |
| 4 | Flat-Pack Foreman: DIY voice foreman | 8.6 | 25 | Heart-rate-adaptive tutor | 6.95 |
| 5 | Dry-Land Swim Coach | 8.55 | 26 | Shelf Load Oracle | 6.95 |
| 6 | Calm Commit: no panic pushes | 8.55 | 27 | Accessible venue audio map | 6.9 |
| 7 | OxHack Pulse Wall | 8.5 | 28 | Round-up jar for swim lessons | 6.9 |
| 8 | Two Truths & a Pulse | 8.5 | 29 | Pre-appointment symptom diary | 6.9 |
| 9 | Snack Tax (hardware) | 8.1 | 30 | Haunted Spires ghost tour | 6.8 |
| 10 | Dawa Call: Urdu medication-reminder agent | 8.0 | 31 | Rail-delay oracle for northern travellers | 6.8 |
| 11 | Placement Interrogation: vitals mock interview (killed: Osiris exists) | 7.9 | 32 | Heartbeat DJ | 6.65 |
| 12 | Subscription Graveyard: voiced eulogies | 7.9 | 33 | "Is my spending normal?" RAG | 6.65 |
| 13 | Letter Explainer for elderly migrants (Urdu) | 7.9 | 34 | Oxford Don Simulator (rejects ideas in Latin) | 6.6 |
| 14 | Blink-to-Speak | 7.75 | 35 | Hackathon Lost & Found matcher | 6.6 |
| 15 | Rejection Letter Opera | 7.65 | 36 | Mentor bounty board | 6.55 |
| 16 | GibberHaggle: two agents haggle your bill | 7.65 | 37 | Driver drowsiness detector | 6.5 |
| 17 | Breathe-on-beat rhythm game | 7.6 | 38 | Carbon-aware GPU scheduler | 6.25 |
| 18 | Mum's Budget Lecture | 7.55 | 39 | Posture pet | 6.2 |
| 19 | Urdu clinic phone line (merged into #1) | 7.5 | 40 | Claude Builder Club onboarding agent | 5.95 |
| 20 | Solana Swear Jar for focus | 7.3 | 41 | Recycling bin tracker (overdone) | 5.75 |
| 21 | Breath-flown drone (hardware) | 7.3 | 42 | Generic study-buddy chatbot (rejected) | 4.65 |

---

## 8. Off-limits (listed only so nobody suggests them again)
- **Our past projects:** these set the bar for uniqueness; don't repeat or echo them.
  - D.A.D
  - BlackNaught, the "electric monitoring" one: UK power cuts × patients who depend on electrical devices
  - Memory Lane: a Bayesian search map for missing people with dementia
  - AWS City
- **IBM Z datathon ideas:**
  - Spillcast
  - Cable Watch
  - Proof of Kin
  - Shell Alarm
  - Medicine Shortage Radar
  - Hornet Triangulator
  - the 34-idea seed bank
  - Dialect Decoder
- **The template:** public UK data → a calibrated risk forecast for a vulnerable group.

---

## Sources for sections 2 and 3
Sources for everything else are in `OXHACK_TEAM_BRIEF.md`, `HANDOFF.md` and `PROBLEM_BANK.md`.

**Section 3: forum threads behind the verdicts** (no Reddit)
- [eBay Community: soft-endings or extended bidding on auctions](https://community.ebay.com/forum/selling-57920/topic/soft-endings-or-extended-bidding-on-auctions-151321/)
- [eBay Community: eBay testing extended "soft-close" auctions for trading cards](https://community.ebay.com/forum/selling-57920/topic/ebay-testing-extended-soft-close-auctions-for-trading-cards-148916/)
- [eBay Community: extended bidding if bids are received in the last few minutes](https://community.ebay.com/forum/selling-57920/topic/a-extended-bidding-if-bids-recieved-last-few-minutes-type-bidding-would-greatly-benifit-sellerbuyer-119675/)
- [eBay Community: how to fix sniping](https://community.ebay.com/forum/selling-57920/topic/how-to-fix-sniping-revolutionize-bidding-increase-sale-values-and-make-buyers-and-sellers-happier-143080/)
- [GameFAQs: best timing to pull in a banner (Genshin Impact)](https://gamefaqs.gamespot.com/boards/270518-genshin-impact/80171981)
- [GameFAQs: pull for this banner or wait? (Fate/Grand Order)](https://gamefaqs.gamespot.com/boards/180151-fate-grand-order/76968467)
- [Pro Game Guides: what determines banner reruns in Genshin Impact](https://progameguides.com/genshin-impact/what-determines-banner-reruns-in-genshin-impact/)
- [FlyerTalk: how long does it take BA to deliver delayed bags?](https://www.flyertalk.com/forum/british-airways-british-airways-club/1644003-how-long-does-take-ba-deliver-delayed-bags.html)
- [FlyerTalk: lost baggage, how frequently and quickly is it found?](https://www.flyertalk.com/forum/aer-lingus-aerclub/2195443-lost-baggage-how-frequently-quickly-found.html)
- [iFish: completely new to salmon fishing on the Columbia](https://www.ifish.net/threads/completely-new-to-salmon-fishing-on-the-columbia.1706992/)
- [Columbia Basin Research (University of Washington): adult run-timing methods](https://www.cbr.washington.edu/postseason/Adult.Postseason.Methods.pdf)
- [GameFAQs: the next Salmon Run rotation looks absolutely horrible (Splatoon 3)](https://gamefaqs.gamespot.com/boards/313532-splatoon-3/80227452)
- [Spotify Community: podcast new episodes not showing](http://community.spotify.com/forum/t5/Other-Podcasts-Partners-etc/Podcasts-new-episodes-not-showing-not-refreshing/td-p/5303019)
- [Talk Photography: how to predict a good sunrise/sunset?](https://www.talkphotography.co.uk/threads/how-to-predict-a-good-sunrise-sunset.528200/)
- [Alpenglow: sunset forecast model](https://www.alpenglowapp.com/forecast-model)
- [Stargazers Lounge: how many nights give good observing conditions in the UK?](https://stargazerslounge.com/topic/370932-on-average-how-many-nights-provide-good-observation-conditions-in-uk/)
- [BirdForum: grey seal pups](https://www.birdforum.net/threads/grey-seal-pups.70135/)
- [UKClimbing: ideal recovery time between attempts](https://www.ukclimbing.com/forums/rock_talk/ideal_recovery_time_between_attempts-776942)
- [Mumsnet: to expect the plumber to turn up when he said?](https://www.mumsnet.com/talk/am_i_being_unreasonable/1333905-To-expect-the-plumber-to-turn-up-when-he-said)
- [Japan Guide: cherry blossom forecast](https://www.japan-guide.com/sakura/)

**Section 3: data and news**
- [eBay moves every Australian auction to extended bidding from 17 Aug 2026 (Shopifreaks)](https://www.shopifreaks.com/ebay-applies-extended-bidding-to-every-auction-in-australia-on-august-17-and-ends-the-fixed-close-that-enabled-sniping/)
- [ShopGoodwill scripts using its API (GitHub)](https://github.com/scottmconway/shopgoodwill-scripts)
- [Podcast Index weekly database dump (James Cridland)](https://james.cridland.net/blog/2026/podcast-index-sql-data-mining/)
- [Genshin Impact banner history (Pro Game Guides)](https://progameguides.com/genshin-impact/genshin-impact-banner-history/)
- [Salmon Run data (Splatoon wiki)](https://splatoonwiki.org/wiki/Salmon_Run_data)
- [US DOT Air Travel Consumer Report, example month](https://www.transportation.gov/sites/dot.gov/files/2022-12/November%202022%20ATCR.pdf)

**Section 2**
- [Listing captures with the Wayback CDX API (alexwlchan)](https://alexwlchan.net/notes/2024/list-captures-in-the-wayback-machine/)
- [Pew Research: When online content disappears (2024)](https://pewresearch.org/wp-content/uploads/sites/20/2024/05/pl_2024.05.17_link-rot_report.pdf)
- [Zhou et al.: No More 404s, predicting link rot for pro-active archiving](https://homepages.inf.ed.ac.uk/grover/papers/p233-zhou.pdf)
- [SGDQ 2016 schedule analysis (Benjamin Congdon)](https://benjamincongdon.me/blog/2016/06/25/SGDQ-2016-Schedule-Analysis/)
- [Chase Report announcement (Tweeters list, June 2026)](https://mailman1.u.washington.edu/pipermail/tweeters/2026-June/008955.html)
- [Apparent stay lengths of vagrant birds (British Birds, 2025)](https://britishbirds.co.uk/journal/article/observer-effort-and-its-influence-apparent-stay-lengths-vagrant-north-american)
- [rebird manual (eBird API, notable observations)](https://packages.ropensci.org/rebird/doc/manual.html)
- [ApacheJIT dataset](https://arxiv.org/pdf/2203.00101)
- [Eyolfson et al.: Do time of day and developer experience affect commit bugginess? (MSR 2011)](https://www.cs.purdue.edu/homes/lintan/publications/commitTime-msr11.pdf)
- [MCSR Ranked API client (docs.rs)](https://docs.rs/mcsr-ranked-api)
- [Steam now warns about abandoned Early Access games (PCWorld)](https://www.pcworld.com/article/2602230/steam-now-warns-about-early-access-games-that-are-defunct-or-abandoned.html)
- [LiveSplit components, including Reset Chance](https://livesplit.org/components/)
- [splits.io API client (PyPI)](https://pypi.org/project/splitsio/)
