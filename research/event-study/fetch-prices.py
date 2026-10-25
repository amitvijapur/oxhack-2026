#!/usr/bin/env python3
"""Fetch attributed daily adjusted-close data; no credentials or paid API calls.

Usage: python3 research/event-study/fetch-prices.py [raw-output-directory]
Current-vintage vendor history, not an archived point-in-time price database.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo
import hashlib
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/oxhack-real-event-prices')
TICKERS = ('NG', 'NAK', 'GLD', 'SPY')
START = int(datetime(2019, 9, 1, tzinfo=timezone.utc).timestamp())
END = int(datetime(2026, 3, 1, tzinfo=timezone.utc).timestamp())
RAW.mkdir(parents=True, exist_ok=True)


def fetch(ticker):
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?period1={START}&period2={END}&interval=1d&events=div%2Csplits&includeAdjustedClose=true'
    cached = RAW / f'{ticker}.raw.json'
    manifest = RAW / f'{ticker}.metadata.json'
    if cached.exists() and manifest.exists():
        raw = cached.read_bytes()
        metadata = json.loads(manifest.read_text())
        assert metadata['url'] == url and metadata['sha256'] == hashlib.sha256(raw).hexdigest(), 'Cached source does not match its provenance'
    else:
        raw = urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read()
        metadata = {'ticker': ticker, 'url': url, 'retrievedAt': datetime.now(timezone.utc).isoformat(), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
        cached.write_bytes(raw)
        manifest.write_text(json.dumps(metadata, indent=2) + '\n')
    payload = json.loads(raw)
    assert payload['chart']['error'] is None
    result = payload['chart']['result'][0]
    assert result['meta']['symbol'] == ticker and result['meta']['currency'] == 'USD'
    assert result['meta']['exchangeTimezoneName'] == 'America/New_York'
    assert result['meta']['instrumentType'] == ('ETF' if ticker in ('GLD', 'SPY') else 'EQUITY')
    timestamps = result['timestamp']
    adjusted = result['indicators']['adjclose'][0]['adjclose']
    assert len(timestamps) == len(adjusted)
    rows = []
    missing = []
    for timestamp, close in zip(timestamps, adjusted):
        date = datetime.fromtimestamp(timestamp, ZoneInfo('America/New_York')).date().isoformat()
        if not isinstance(close, (int, float)) or not math.isfinite(close) or close <= 0:
            missing.append(date)
            continue
        rows.append({'date': date, 'close': close})
    assert rows and len({r['date'] for r in rows}) == len(rows)
    assert rows == sorted(rows, key=lambda r: r['date'])
    metadata.update({'provider': 'Yahoo Finance', 'name': result['meta'].get('longName'), 'exchange': result['meta']['exchangeName'], 'instrumentType': result['meta']['instrumentType'], 'historyUrl': f'https://finance.yahoo.com/quote/{ticker}/history/', 'currency': 'USD', 'exchangeTimezoneName': 'America/New_York', 'adjustment': 'split_and_dividend_adjusted_close', 'field': 'indicators.adjclose[0].adjclose', 'rows': len(rows), 'firstDate': rows[0]['date'], 'lastDate': rows[-1]['date'], 'missingPriceDates': missing, 'corporateActionTypes': list(result.get('events', {}))})
    return ticker, rows, metadata


with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(fetch, TICKERS))
output = {
    'schemaVersion': 1,
    'source': {'provider': 'Yahoo Finance', 'url': 'https://finance.yahoo.com/', 'retrievedAt': max(m['retrievedAt'] for _, _, m in results), 'adjustment': 'split_and_dividend_adjusted_close', 'adjustmentDocumentation': 'https://in.help.yahoo.com/kb/adjusted-close-sln28256.html', 'adjustmentVerified': True, 'adjustmentVerificationBasis': 'Vendor adjusted-close field is present in all four snapshots; its dividend/split meaning is verified against Yahoo Help. This is not an independent exchange-price audit.', 'limitations': ['Current-vintage vendor history may contain later corrections; no archived as-of vintage is claimed.', 'GLD is a traded gold ETF proxy, not spot gold or a Tok mineral-interest price.', 'Adjusted closes are total-return comparison inputs, not literal executable fill quotes.', 'No missing price is forward-filled. The hypothetical closing-entry policy assumes access to a closing execution.', 'Penny-stock prices may have limited vendor precision. Some NAK evaluation windows are flat at the supplied precision; those zeros are not independently verified at finer precision.']},
    'seriesSources': {t: m for t, _, m in results},
    'series': {t: rows for t, rows, _ in results},
}
target = ROOT / 'research/event-study/prices.json'
target.write_text(json.dumps(output, separators=(',', ':')) + '\n')
print(json.dumps({'output': str(target.relative_to(ROOT)), 'rows': {t: len(rows) for t, rows, _ in results}, 'missing': {t: len(m['missingPriceDates']) for t, _, m in results}, 'bytes': target.stat().st_size}))
