# OxHack Data Brief: The Fed Millisecond

Oct 24, 2026 · @Salman Abdulrazaq Ali Ali

We rebuild real exchange order books from raw Nasdaq and IEX feeds and measure, to the microsecond, how the market absorbed the Fed's rate cut at 14:00:00 on 10 Dec 2025. Bonds moved 1.15 ms after the announcement, close to the speed-of-light limit from Washington.

## Why we already have the goldmine

Stop searching for more data. Every other team will use Yahoo prices, Kaggle CSVs or a news API. We have three things almost nobody at a hackathon touches:

- **Raw exchange feeds.** Nasdaq's order-by-order feed with nanosecond timestamps: every order added, changed, cancelled and traded. This is the same kind of data HRT's systems consume.
- **A Fed rate decision inside the file.** The Fed cut rates at exactly 14:00:00 on 10 Dec 2025. That's a natural experiment at a precisely known instant.
- **Up to four exchanges for the same day**, including IEX, which deliberately delays every order by 350 microseconds (its "speed bump"). A slow exchange next to a fast one is a perfect TIME story.

More data won't make the difference now. A real finding from this data will, and we already have one (below).

## The data

Start with the 10 Dec 2025 Nasdaq file. It contains the Fed decision. Everything is free, with no signup.

| Source | File / link | Size | What it contains |
| --- | --- | --- | --- |
| **Nasdaq TotalView-ITCH 5.0, 10 Dec 2025 (Fed day)** | [S121025-v50.txt.gz](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/) | 11.6 GB | Every order on Nasdaq's exchange, \~12,000 US stocks and ETFs, nanosecond timestamps |
| Nasdaq ITCH, rest of that week | [S120825 to S121225](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/) | 7.9 to 12.6 GB each | Same feed, 8 to 12 Dec 2025, for training and testing on different days |
| IEX DEEP and DEPTH+, 9 Dec 2025 | [IEX hist API](https://iextrading.com/api/1.0/hist?date=20251209) | 8.9 / 8.4 GB | IEX exchange feed; DEPTH+ is order-by-order. Files are .pcap packet captures |
| Four exchanges, 30 Dec 2019 | [Nasdaq](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/), [BX](https://emi.nasdaq.com/ITCH/Nasdaq%20BX%20ITCH/), [PSX](https://emi.nasdaq.com/ITCH/Nasdaq%20PSX%20ITCH/), [IEX](https://iextrading.com/api/1.0/hist?date=20191230) | 4.9 GB total | One day across Nasdaq, BX, PSX and IEX; small enough to develop on |
| FINRA daily short volume | [example: 9 Dec 2025](https://cdn.finra.org/equity/regsho/daily/CNMSshvol20251209.txt) | KB | Daily short-sale volume per stock; background only |
| Fed statement time | [Federal Reserve press release](https://federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm) | n/a | 0.25 point cut, released 2:00 p.m. EST, 10 Dec 2025 |

**Download command** (resumes if wifi drops):

```
curl -C - -O "https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/S121025-v50.txt.gz"
```

**What the Nasdaq file is:** a full-day log of Nasdaq's matching engine. It covers almost every US stock and ETF, not only Nasdaq-listed ones: on 10 Dec it lists 5,245 Nasdaq-listed, 2,900 NYSE-listed and 2,536 NYSE Arca-listed symbols, among others. It only shows orders sent to Nasdaq, not other exchanges or dark pools. The format spec is the "Nasdaq TotalView-ITCH 5.0 specification" PDF on nasdaqtrader.com.

**Commodities:** commodity futures tick data (CME) is paid, but commodity ETFs are in the Nasdaq file at full detail: GLD (gold), SLV (silver), USO (oil), UNG (natural gas), CPER (copper), DBA (agriculture).

## What we found at 14:00:00 on Fed day

Bonds reacted first, 1.15 ms after the announcement; stocks followed about 12 ms later; gold and banks took hundreds of milliseconds. Measured from 428 million raw Nasdaq messages (3am to 14:00:30 ET, 10 Dec 2025) with a quick C program, about 2 minutes including the download.

1. **Calm before.** In the last few milliseconds before 14:00 the whole exchange goes almost silent: 0 to 4 messages per 50 µs, down from about 5 to 10 earlier.
2. **Spike at exactly 14:00:00.000.** 69 messages in the first 50 µs, then 156 in the next 50 µs. That's too fast to be a reaction to the news: Washington DC to Nasdaq's data centre in New Jersey is about 300 km, so light needs at least about 1.0 ms. These look like orders pre-programmed to fire at 14:00:00. This is our interpretation; check the actual messages to confirm.
3. **The real reaction starts just after the speed-of-light limit.**

| Asset | First order activity after 14:00:00 | First trade |
| --- | --- | --- |
| **IEF (7 to 10 yr Treasury bonds)** | **1.148 ms** | 1.48 ms |
| TLT (20+ yr Treasury bonds) | 1.64 ms | 2.90 ms |
| SPY (S&P 500) | 0.75 ms (a cancel, before news could physically arrive) | 13.0 ms |
| QQQ (Nasdaq 100) | 13.0 ms | 13.0 ms |
| AAPL | 16.7 ms | 0.71 s |
| MSFT | 21.5 ms | 0.71 s |
| GLD (gold) | 136 ms | 0.62 s |
| JPM (bank) | 543 ms | 2.04 s |

4. **The move:** over the first 10 seconds gold rose about 16 basis points and silver about 10, while big tech dipped slightly.

**Pitch line:** "The Fed spoke at 14:00:00. The fastest traders' orders reached Nasdaq 1.15 milliseconds later, about as fast as light can travel from Washington. Bonds moved first, stocks followed, gold took over 100 milliseconds. We rebuilt it from 428 million raw messages."

## Facts about the data that change the build

Measured on the 9 Dec 2025 Nasdaq file, from the open to about 10am New York time. Order lifetimes on 10 Dec: only 2.1% of 62.5 million orders ever traded, 18% were cancelled within 1 ms and 43% within 100 ms.

|  | NVDA | AAPL | TSLA | QQQ |
| --- | --- | --- | --- | --- |
| New orders under 100 shares (odd lots) | 79% | 69% | 82% | 35% |
| Executed shares that hit hidden orders | 20% | 34% | 35% | 7% |
| Cancels within 1 ms | 29% | 16% | 14% | 14% |
| Cancels within 10 ms | 44% | 26% | 26% | 37% |

- **Most orders are odd lots.** Standard best bid/ask quotes have traditionally counted only blocks of 100+ shares, so much of the real action is invisible in normal price data. Our order-by-order view sees it.
- **20 to 35% of Nasdaq volume in these stocks trades against orders no one could see.** Hidden liquidity is part of the "how real is the book" story.
- **Design for bursts, not averages.** Median was 23 messages per millisecond; at the 9:30 open it hit 2,150 in one millisecond. Benchmark the engine on the open and on 14:00 Fed day.
- **Stock codes change daily.** Rebuild the code-to-symbol map from each day's directory messages; never hard-code them.
- **Prices are integers** (price × 10,000). Never use floats.
- **No half-cent prices yet** on visible orders in Dec 2025; half-cents appear only in hidden midpoint trades.
- **Almost every order is anonymous**: about 0.1% show the broker's ID.
- **System events** at 3:00 (messages start), 4:00 (pre-market) and 9:30 (regular trading). Drop the opening and closing auction minutes from the model.

## Caveats to say on stage before the judges ask

HRT and Jane Street judges respect teams that name their limits first, so say these ourselves:

- **Every exchange has its own clock.** They're synchronised to GPS, but not perfectly, so differences of tens of microseconds between exchanges may be clock error. Only claim gaps clearly bigger than that.
- **IEX DEEP shows totals per price level, not individual orders.** Only DEPTH+ (available for 2025, not 2019) shows individual orders, so the ghost and survival analysis works best on Nasdaq's feed.
- **2019 data is older.** It's fine for proving the method, but quote 2025 numbers for headline claims.
- **Nasdaq is only part of the market.** For big stocks like NVDA it's roughly 15 to 20% of total volume; other exchanges and off-exchange trading carry the rest. We see Nasdaq's book perfectly, not the whole market.
- **The Fed numbers use Nasdaq's own clock** in New Jersey, and the \~300 km to Washington is a straight-line estimate. So far we've tracked trades and order activity, not the full best bid/ask, and only for this one Fed event.

## Next steps

- [ ] Download `S121025-v50.txt.gz` (11.6 GB) on the laptop with the most free disk
- [ ] Write our own C++ ITCH parser and order-book engine (Citadel's prize is for hand-made work)
- [ ] Rebuild full order books for IEF, TLT, SPY, QQQ, NVDA, GLD, USO, JPM
- [ ] Survival model of order cancellations, then the ghost-adjusted microprice
- [ ] Predict stocks' direction from the bonds' first move (bonds lead stocks by about 12 ms)
- [ ] Benchmark throughput and worst-case latency on the 9:30 open and the 14:00 burst
- [ ] Slow-motion replay UI of 14:00:00 with a speed-of-light marker
- [ ] Ask Jane Street what their challenge is; ask HRT whether this fits theirs

## Sources

- [Federal Reserve press release, 10 Dec 2025](https://federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm)
- [Nasdaq ITCH files](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/)
- [Nasdaq BX ITCH](https://emi.nasdaq.com/ITCH/Nasdaq%20BX%20ITCH/) and [Nasdaq PSX ITCH](https://emi.nasdaq.com/ITCH/Nasdaq%20PSX%20ITCH/)
- [IEX historical data API](https://iextrading.com/api/1.0/hist?date=20251209)
- [FINRA daily short volume](https://cdn.finra.org/equity/regsho/daily/CNMSshvol20251209.txt)
