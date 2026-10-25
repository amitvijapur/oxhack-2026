import assert from 'node:assert/strict';
import { test } from 'node:test';
import api from '../api/index.js';
import { requireServerEnv } from '../server/env.js';
import { routes } from '../server/routes.js';

const call = (path, method = 'GET') => api.fetch(new Request(`https://example.test${path}`, { method }));

test('health reports the deployment without exposing secrets', async () => {
  const response = await call('/api?path=health');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(Object.keys(await response.json()).sort(), ['commit', 'environment', 'ok']);
});

test('routes resolve with or without the rewrite query', async () => {
  assert.equal((await call('/api/health')).status, 200);
  assert.equal((await call('/api?path=health/')).status, 200);
});

test('unknown paths are 404 and wrong methods are 405', async () => {
  assert.equal((await call('/api?path=nope')).status, 404);
  const response = await call('/api?path=health', 'POST');
  assert.equal(response.status, 405);
  assert.deepEqual((await response.json()).allowed, ['GET']);
});

test('missing server secrets become a 503 response, not a crash', async () => {
  routes['GET /needs-secret'] = () => requireServerEnv('OXHACK_TEST_UNSET_SECRET');
  try {
    const response = await call('/api?path=needs-secret');
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /OXHACK_TEST_UNSET_SECRET is not configured/);
  } finally {
    delete routes['GET /needs-secret'];
  }
});
