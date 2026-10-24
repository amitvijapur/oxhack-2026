"""Multi-venue BTC/USD order-book recorder (Kraken L2, Bitstamp L3, Coinbase L2).
Run:  pip install websockets  &&  python recorder.py
Writes data/<venue>-<date>.jsonl, one line per message: {"rx_ns": local receive time ns, "msg": raw}
Auto-reconnects. Leave it running all hackathon on a laptop with stable wifi.
"""
import asyncio, json, os, time, datetime, websockets

FEEDS = {
    "kraken":   ("wss://ws.kraken.com/v2",
                 {"method": "subscribe", "params": {"channel": "book", "symbol": ["BTC/USD"], "depth": 100}}),
    "bitstamp": ("wss://ws.bitstamp.net",
                 {"event": "bts:subscribe", "data": {"channel": "live_orders_btcusd"}}),
    "bitstamp_trades": ("wss://ws.bitstamp.net",
                 {"event": "bts:subscribe", "data": {"channel": "live_trades_btcusd"}}),
    "coinbase": ("wss://advanced-trade-ws.coinbase.com",
                 {"type": "subscribe", "product_ids": ["BTC-USD"], "channel": "level2"}),
    "coinbase_trades": ("wss://advanced-trade-ws.coinbase.com",
                 {"type": "subscribe", "product_ids": ["BTC-USD"], "channel": "market_trades"}),
}
os.makedirs("data", exist_ok=True)
counts = {k: 0 for k in FEEDS}

async def run(name, url, sub):
    while True:
        try:
            async with websockets.connect(url, max_size=None, ping_interval=20) as ws:
                await ws.send(json.dumps(sub))
                day = datetime.date.today().isoformat()
                with open(f"data/{name}-{day}.jsonl", "a", buffering=1 << 16) as f:
                    async for m in ws:
                        f.write('{"rx_ns":%d,"msg":%s}\n' % (time.time_ns(), m))
                        counts[name] += 1
        except Exception as e:
            print(f"[{name}] reconnecting after {e!r}")
            await asyncio.sleep(1)

async def stats():
    while True:
        await asyncio.sleep(10)
        print(time.strftime("%H:%M:%S"), counts)

async def main():
    await asyncio.gather(stats(), *[run(n, u, s) for n, (u, s) in FEEDS.items()])

asyncio.run(main())
