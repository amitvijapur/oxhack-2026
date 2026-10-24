# OxHack '26: every idea we've considered

*Saturday 24 Oct 2026, 14:30. This covers the whole chat: Friday night's first research, the scored rounds, Saturday morning's problem bank, the plans after the opening ceremony, and the new non-financial ideas. That's about 200 ideas, and some appear in more than one round.*

## Bottom line
- **Financial:** *The Golden Hour* (uncommon, needs fast scraping). *Half-Life* was dropped because AI news bots for Polymarket are everywhere.
- **Non-financial:**
  - *Flag Fall* is the strongest plan we've already written up.
  - *Memento Mori* is the best of today's new ideas (section 2).
- **Backup:** *Bang the Close*.

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
  - **Round 0 (section 6)** used a softer rubric, so its numbers look higher than they are.
- **Off-limits ideas** (our past projects and the IBM Z datathon) are listed in section 7, only so nobody suggests them again.

## Contents
0. What the other files add
1. Where we are now (after the opening ceremony)
2. New: non-financial ideas from random keywords
3. Final rounds before the event
4. Round 1: the first 25 strict-scored ideas, plus extras
5. Problem bank: every track from random seeds
6. Round 0: the first battle plan (42 ideas)
7. Off-limits

---

## 0. What the other files add (checked after 14:30)
Cross-checked against the [event context](event-context.md) (official slides and ceremony audio) and the [Fed Millisecond brief](fed-millisecond/). These change how the ideas below compare.

- **A new financial contender is missing from this list: The Fed Millisecond.** Rebuild Nasdaq and IEX order books from raw feeds and replay the 10 Dec 2025 Fed rate cut. Bonds moved 1.15 ms after 14:00:00, close to light speed from Washington. It is already partly built (a C scan of 428 million messages), it is TIME to the microsecond, and it is the HRT data that HRT's own systems consume. It needs an 11.6 GB download and a hand-written C++ parser, which also fits Citadel's handmade prize. Compare it with *The Golden Hour* before choosing a financial plan.
- **Hard deadline: hacking finishes Sunday 12:00**, and judging runs 13:00–15:45. The slides give no separate Devpost deadline. Ideas that need long scraping or live data collection (*Golden Hour*, *Dip or Twitch*) lose time against ideas with a ready backtest (*Memento Mori*, *3am Commits*, *Fed Millisecond*).
- **Delta (Zed) has a published rubric:** speed 30%, technical implementation 25%, innovation 25%, polish 20%, and at least two teammates must work in Delta. Snappy, interactive demos (*Flag Fall*, *Fed Millisecond* replay, *Bang the Close*) score better here than batch reports.
- **Handmade (Citadel, judged by Tom 7):** "giving a good idea to Claude and saying yes" will not win. Agent-built ideas need a visibly hand-made part: the Cardputer build, a hand-written parser, a hand-drawn UI.
- **MLH prize names corrected:** the "Tiny/Tart data" prize is **Tiger Data** (Postgres for time series). It fits *Memento Mori* (capture histories), *Fed Millisecond* (tick data) and *Behind Schedule*. ElevenLabs, Gemini, Snowflake, Solana, Presage and Vultr are the other MLH prizes.
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

## 2. New: non-financial ideas from random keywords
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

## 3. Final rounds before the event (Friday night → Saturday 06:00)
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

## 4. Round 1: the first 25 strict-scored ideas (Friday night)
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
- Swapsies, Unravel and Handshake went on to round 2 (section 3).
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

## 5. Problem bank: every track from random seeds (Saturday 07:15)
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

## 6. Round 0: the first battle plan (Friday 23:40, softer rubric)
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

## 7. Off-limits (listed only so nobody suggests them again)
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

## Sources for the new ideas (section 2)
Sources for everything else are in `OXHACK_TEAM_BRIEF.md`, `HANDOFF.md` and `PROBLEM_BANK.md`.
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
