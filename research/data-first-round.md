# Data-first round: ideas that start from rare data

Saturday 24 Oct 2026, ~18:30. The keyword rounds in [the ideas list](all-ideas.md) kept producing small consumer decisions, so this round started from the data instead. The bar:

- real stakes (money, safety, infrastructure), not "when should I…?";
- a raw, timestamped, rarely used public dataset, opened for real;
- a finding → a prediction → a decision with a measured gain, backtestable before Sunday 12:00;
- TIME as the mechanism (lead, lag, decay, a legal delay), not a label.

Three researchers took one lens each (physical world, institutions, digital infrastructure). Every finalist's data was pulled, and every probe below ran on real data against a naive baseline. No Reddit was used. Scores use the team rubric (typical solid project = 5); uniqueness is 0–3 as in [the idea scores](idea-scores.md).

## Shortlist

| Idea | Score | Uniqueness | Probe on real data | Verdict |
|---|---|---|---|---|
| **Shortwave Window** | 7.2 | 2 | Beats a fixed schedule easily; beats persistence only slightly | PITCH |
| **The 15-Minute Shadow** | 6.7 | 2 | A real but thin signal after the reveal (t = 2.6) | PITCH |
| Close the Sky? | ~7 (estimate, not scored) | 2 | Not probed; Space-Track access unconfirmed | Candidate |
| Canary Pages | 6.0 | 1 | Lead time on GCP 2025, none on AWS or Cloudflare | MAYBE |
| EDGAR Stopwatch | 6.0 | 1 | Data check only (~300 market-hours events a day) | Add-on to Fed Millisecond |

For comparison, *The Fed Millisecond* scored 7.4.

## 1. Shortwave Window (7.2, PITCH)

**The fact:** trading firms send CME signals to Europe over shortwave radio because it beats fibre. Raft lists Chicago→Frankfurt at under 30 ms against 36 ms for the best fibre. Deutsche Börse measured the DAX future reacting to the S&P future at 26.8 ms over shortwave against 35.8 ms over microwave plus fibre, with a wider peak "from changes in atmospheric conditions". DRW, IMC, Jump, Virtu, Optiver and Tower have asked the FCC for the 2–25 MHz band.

**Data:** [wspr.live](https://wspr.live), 12.9 billion amateur radio beacon reports (WSPR) from 2008 to today. Free, no key; each report has a 2-minute slot, signal-to-noise, transmit power and grid square. A 4-month corridor query took 7 seconds.

**Probe:**
- **Setup:** Chicago-area ↔ Frankfurt-area grid squares, 5 bands from 7 to 21 MHz, 10-minute windows. Trained on Jul–Sep 2026, tested on 1–23 Oct (about 2,000 windows).
- **Calibration, 60 minutes ahead (Brier score, lower is better):**

| Band | Persistence | Model |
|---|---|---|
| 7 MHz | 0.092 | 0.062 |
| 14 MHz | 0.116 | 0.083 |
| 21 MHz | 0.143 | 0.094 |
| 18 MHz | 0.164 | 0.182 (worse, overfit) |

- **Decision, pick one band 10 minutes ahead (share of windows where it was open):**

| Strategy | Hit rate |
|---|---|
| Perfect oracle | 52.7% |
| Model | 41.0% |
| Persistence | 39.7% |
| Best fixed band | 26.6% |
| Hour-of-day average | 24.2% |

- **Caveat:** beacons run at 0.2–5 W and trading links at about 20 kW, so "closed" in this data doesn't mean the real link is down.

**Decisions it supports:** which band to transmit on over the next 10–60 minutes, and the bigger one, which 2–3 frequencies to license (the FCC licenses each frequency separately). The licensing choice can be backtested over years.

**Demo:** a Chicago→Frankfurt great-circle map with the day–night line sweeping across it and live reports lighting each band, e.g. "21 MHz closes in about 25 min → switch to 14". It runs live during judging. Pitch line: "200 mW hobby beacons forecast a 20 kW Wall Street radio link."

**Prior art:** machine learning on WSPR data exists (IONIS-AI, MILCOM 2021), and so do ham dashboards. Nothing found that links WSPR to the trading links.

**First-hour test:** pull 2 years of data (including solar maximum) plus a Chicago↔London corridor, and label "open" by a power-adjusted signal margin. It passes if the model beats persistence by at least 3 points at 30 minutes. If not, pivot to the licensing backtest.

## 2. The 15-Minute Shadow (6.7, PITCH)

**The fact:** under [17 CFR 43.5](https://www.law.cornell.edu/cfr/text/17/43.5), a US swap repository must hide a block trade for exactly 15 minutes after execution, then publish it. The two counterparties know first. How fast does the market price in the reveal?

**Data:** DTCC's public swap trade feed ([dashboard](https://pddata.dtcc.com/ppd/cftcdashboard)). Free, no signup, daily files for the last 366 days. A rates day is a 1.5 MB zip of about 25,600 rows with execution times to the second and a block flag. 160 business days were pulled in about 5 minutes. Inferred publication puts blocks a median 12.9 minutes after execution, consistent with the rule.

**Probe:** USD SOFR swaps, 2–30 years, spot-starting. 52,108 trades, 289 usable blocks. A block's direction is its rate against the median of the 5 trades before it. Rate drift in that direction after the reveal:

| Group | 2 min | 5 min | 10 min | 30 min |
|---|---|---|---|---|
| All blocks | +0.22 bp (t = 2.6) | +0.20 (t = 2.3) | +0.16 (t = 1.7) | −0.06 (none) |
| Non-block trades over $100M (n = 3,590) | +0.05 (t = 0.7) | | | |
| Blocks under 10 years (n = 156) | +0.28 (t = 3.1) | | right 58% at 10 min | |

**Reading:** the reveal carries information that fades within 10–30 minutes. 0.2–0.3 bp is thin as pure profit. The cleaner decision is a market maker's: widen or tilt 2–7 year quotes for about 5 minutes after a block reveal, with the gain being losses avoided to better-informed traders. Clarus (2020) argued swap blocks don't move markets, and this data partly contradicts that, which is a hook.

**Caveats:** n is small; publication is assumed to be execution + 15:00; the drift inside the hidden window is not specific to blocks, so don't claim it.

**Prior art:** Frino et al. (2021) on delayed futures block reports; NY Fed staff report 557 (2012) on dealer hedging after large swaps; blogs and parsers for this data exist. No hackathon or Kaggle build found.

**Demo:** replay a $470M 5-year block: traded at 14:02:11, invisible while a 15:00 countdown runs, then the curve twitches on reveal, and the fade curve plots across all reveals.

**First-hour test:** download all 366 days, confirm the 15-minute timing from intraday slice files (they carry publication timestamps), fit on the first half and test on the second. Gate: 2-minute drift at t ≥ 3 on the second half, or drop it.

## 3. Close the Sky? (~7 estimate, not scored)

**The fact:** on 4 Nov 2022 a 20-tonne Long March 5B rocket stage was predicted to re-enter over southern Europe. Spain and France closed airspace; 645 flights were delayed an average of 29 minutes (about 309 hours in total), some closures came with 6–22 minutes' notice, and Portugal, Italy and Greece under the same path did not close. The debris fell in the Pacific. Space weather alone makes re-entry timing uncertain by ±10–25%, and an object at 8 km/s covers 1,000+ km in a few minutes.

**Build:** from each object's orbit-snapshot history before it fell, predict a calibrated re-entry window, then decide hour by hour whether a given country should close its airspace. The gain is hours of closure avoided at the same risk, against the standard ±20–30% window rule, backtested on past re-entries. The demo replays the Long March 5B night, then a re-entry happening this week.

**First-hour test:** confirm Space-Track access (free account, sign-up speed unverified) and pull one object's orbit history.

Sources: [Scientific Reports 2025](https://www.nature.com/articles/s41598-024-84001-2), [Acta Astronautica](https://www.sciencedirect.com/science/article/pii/S0094576524002807), [SpaceNews](https://spacenews.com/long-march-5b-stage-reenters-over-pacific-ocean-after-forcing-airspace-closures-in-europe/).

## 4. Canary Pages (6.0, MAYBE)

16,119 status-page incidents from 38 public pages (Sep 2024 to Oct 2026). Outage starts cluster far above chance (at least 3 other services within 30 minutes: 1.2% real vs 0.2% random). On 12 Jun 2025 Google Cloud said nothing for 55 minutes while 12 customers' pages reported it, and a simple alarm fired 32 minutes before Google posted. For AWS (20 Oct 2025) and Cloudflare (18 Nov 2025) the alarm gave no lead. Start times can be backdated. Best decision: choose backup vendors that don't secretly fail together. Prior art: StackGen's 2026 analysis of 178k incidents.

## Dropped, with the evidence

| Idea | Why it dropped |
|---|---|
| **Grid frequency → imbalance price** (Ahmed's probe) | 30 days, 1,440 half-hours: frequency in the first 5–30 minutes called the market direction 47–50% of the time (a coin flip), while "same as the previous half-hour" was right 73%. Automatic frequency response hides the imbalance. Spearman with price only +0.07 to +0.11. |
| **All-Clear** (lightning, airport ramps) | Real probe: 44% fewer flashes while open at the same downtime, on one day in Florida. But Stano 2019 and others ran the same analysis. |
| **Rain on the Wire** | Already published (Journal of Finance 2020), and the gain needs paid tick data. |
| **Funding-Delay Tape** | Unique data (3/3), but prices fall before the exchange posts a delay (t = −2.2), and nothing is left to trade after. |
| **Smart Cooldown** | npm cooldowns are already measured and shipped (pnpm, Yarn, Deno); an adaptive rule gave no gain in the probe. |
| **Repo Weather** | The model's error matched a trailing mean (3.73 vs 3.74 bp); the signal is the known calendar. |
| **Mains-hum timestamping (ENF)** | Well known (a Tom Scott explainer, several open-source tools); a weak fit for HRT. |
| Arbitrum Timeboost, DeFi copycat hacks, ENS auctions | Several papers already; no clustering in the data; data needs a keyed archive. |

Probe scripts are in the session scratchpad and can be shared on request.
