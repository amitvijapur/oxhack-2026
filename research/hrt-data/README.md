# HRT data

Saturday 24 Oct 2026, added by Salman. Everything related to the HRT challenge is in this folder. For the general list of sources, see the [data sources catalogue](../data-sources-unverified.md). For lithium land data, see [`../lithium-data/`](../lithium-data/README.md).

> ## ⚠️ Recommended: double-check before you use anything here
>
> Sizes, timings, counts and "✅ Downloaded and analysed" statuses come from AI-assisted research on another machine. **None of the large raw files are in this repo.** Re-download from the source, re-run the scripts, and fill in **Checked by agent** before quoting a number.

## Challenge framing

These points are quoted or summarised from [event-context.md](../event-context.md):

- **Theme: TIME.** It's mandatory for every project. The main judge, Tom 7, looks for "the essence of the hack, the poetry in it".
- **HRT (platinum): best use of data for predictions and decision-making.**
  - It's open-ended and doesn't have to involve financial markets.
  - HRT named these skills: Python or C++, statistics, ML, and clean, well-extracted data.
  - A demo with clean data handling and a *measured* prediction suits them.
- **Citadel: best handmade project.**
  - "Giving a good idea to Claude and saying yes" won't win. Visible human effort in code, UI or pitch will.
  - A hand-written C++ ITCH parser and order-book engine is the natural handmade piece here.

## `fed-millisecond/`: the Fed Millisecond work (moved here from `research/fed-millisecond/`)

The idea: rebuild Nasdaq and IEX order books from raw feeds and measure, to the microsecond, how the market absorbed the Fed's rate cut at 14:00:00 ET on 10 Dec 2025. The brief claims bonds moved about 1.15 ms after the announcement. Re-check this.

| File | What it is |
|---|---|
| [`OxHack Data Brief The Fed Millisecond.md`](fed-millisecond/OxHack%20Data%20Brief%20The%20Fed%20Millisecond.md) | The full brief: data, findings so far, plan |
| [`fed_moment.c`](fed-millisecond/fed_moment.c) | Streams Nasdaq ITCH 5.0 and measures the reaction around 14:00:00. A scratch reference only; write our own engine for the handmade prize. |
| [`fed_moment_results.txt`](fed-millisecond/fed_moment_results.txt) | Output from one run (428.7M messages, per-symbol first-event and first-trade µs) |
| [`data_facts.py`](fed-millisecond/data_facts.py) | Quick exploratory stats from the ITCH stream |
| [`order_lifetimes.py`](fed-millisecond/order_lifetimes.py) | How long orders live before cancel or execute |
| [`recorder.py`](fed-millisecond/recorder.py), [`crypto_recorder.py`](fed-millisecond/crypto_recorder.py) | Live BTC/USD order-book recorders (Kraken, Bitstamp, Coinbase) |

## HRT-relevant data sources

"Reported" is what the original research claimed. "Loads today?" is our own quick request on 24 Oct 2026.

| Dataset name (link) | What it's said to give | Reported | Loads today? | Checked by agent |
|---|---|---|---|---|
| [Nasdaq TotalView-ITCH 5.0 sample files](https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/) | Full order feed with ns timestamps. 10 Dec 2025 is `S121025-v50.txt.gz` (~11.6 GB). | ✅ Downloaded and analysed | 200 | ❓ |
| [Nasdaq EMI data server](https://emi.nasdaq.com/) | Options, Plus feeds, BX, PSX | ✅ Listed | 200 | ❓ |
| [IEX HIST (example: 9 Dec 2025)](https://iextrading.com/api/1.0/hist?date=20251209) | IEX DEEP / DEPTH+ pcap files (350 µs speed bump) | ✅ | 200 | ❓ |
| [Federal Reserve FOMC statement, 10 Dec 2025](https://federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm) | Decision text and release time (14:00 ET) | ✅ | 206 | ❓ |
| [FCC ULS microwave licences (`l_micro.zip`)](https://data.fcc.gov/download/pub/uls/complete/l_micro.zip) | Microwave tower licences (low-latency HFT routes) | ✅ Downloaded and analysed | 206 | ❓ |
| [SEC EDGAR daily form index (example: 10 Dec 2025)](https://www.sec.gov/Archives/edgar/daily-index/2025/QTR4/form.20251210.idx) | Daily list of filings | ✅ | 403 (SEC needs a `User-Agent` with contact info) | ❓ |
| [FINRA Reg SHO daily short-sale volume](https://cdn.finra.org/equity/regsho/daily/CNMSshvol20251209.txt) | Daily short volume by symbol | ✅ | 200 | ❓ |
| [US Treasury Fiscal Data: auctions query](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query) | Treasury auction results | ✅ | 200 | ❓ |
| [Binance public data: BTCUSDT spot trades (10 Dec 2025)](https://data.binance.vision/data/spot/daily/trades/BTCUSDT/BTCUSDT-trades-2025-12-10.zip) | Tick-level crypto trades on Fed day | ✅ | 206 | ❓ |
| [CFTC Public Reporting: Commitments of Traders](https://publicreporting.cftc.gov/resource/6dca-aqww.json) | Weekly futures positions | ✅ | 200 | ❓ |
| [HRT Beat: How HRT Thinks About Data](https://www.hudsonrivertrading.com/hrtbeat/how-hrt-thinks-about-data/) | How HRT itself frames data work (context, not data) | ✅ | 403 to scripts | ❓ |

## Possible HRT fit outside markets

HRT says the challenge "doesn't have to involve financial markets". These are time-stamped datasets that could support a prediction and a decision:

| Dataset | Prediction + decision angle |
|---|---|
| [Lithium land and claims data](../lithium-data/README.md) (WA tenements, Quebec, BLM claims) | Predict when and where land drops or gets staked, then decide whether to buy or stake |
| [NESO System Frequency Data](https://www.neso.energy/data-portal/system-frequency-data) | Per-second UK grid frequency: predict deviations and decide on a response |
| [Carbon Intensity API (GB)](https://api.carbonintensity.org.uk/intensity) | Forecast vs actual: decide when to run flexible load |
| [GDELT 2.0 event feed](http://data.gdeltproject.org/gdeltv2/lastupdate.txt) | News events every 15 minutes, which could serve as a signal for any of the above |
