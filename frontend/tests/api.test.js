import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handle } from '../src/server/router.js';
import { requireServerEnv } from '../src/server/env.js';
import { routes } from '../src/server/routes.js';

const call = (path, method = 'GET') => handle(new Request(`https://example.test${path}`, { method }));

test('health reports the deployment without exposing secrets', async () => {
  const response = await call('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(Object.keys(await response.json()).sort(), ['commit', 'environment', 'ok']);
});

test('routes resolve with or without a trailing slash', async () => {
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/api/health/')).status, 200);
});

test('unknown paths are 404 and wrong methods are 405', async () => {
  assert.equal((await call('/api/nope')).status, 404);
  const response = await call('/api/health', 'POST');
  assert.equal(response.status, 405);
  assert.deepEqual((await response.json()).allowed, ['GET']);
});

test('missing server secrets become a 503 response, not a crash', async () => {
  routes['GET /needs-secret'] = () => requireServerEnv('OXHACK_TEST_UNSET_SECRET');
  try {
    const response = await call('/api/needs-secret');
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /OXHACK_TEST_UNSET_SECRET is not configured/);
  } finally {
    delete routes['GET /needs-secret'];
  }
});

test('gold price is cached, and served stale when the upstream fails', async () => {
  const { goldPrice, resetGoldCache, GOLD_URL } = await import('../src/server/gold.js');
  resetGoldCache();
  const calls = [];
  const ok = async (url) => { calls.push(url); return new Response(JSON.stringify({ price: 4000.5, updatedAt: '2026-10-25T00:00:00Z' })); };
  const fail = async () => { throw new Error('down'); };

  assert.equal((await goldPrice(fail, 0)).status, 503);
  const first = await (await goldPrice(ok, 1_000)).json();
  assert.deepEqual([first.usd_per_oz, first.stale, calls], [4000.5, false, [GOLD_URL]]);
  await goldPrice(ok, 20_000);
  assert.equal(calls.length, 1, 'a second call within 30 s uses the cache');
  const stale = await (await goldPrice(fail, 60_000)).json();
  assert.deepEqual([stale.usd_per_oz, stale.stale], [4000.5, true]);
  resetGoldCache();
});
