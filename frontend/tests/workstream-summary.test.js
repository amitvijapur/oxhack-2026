import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runMeta, summaryLine } from '../src/workstreamSummary.js';

const site = (samples, insideActiveClaim) => ({ samples, insideActiveClaim, insideClosedClaim: null, medianMToActiveClaim: null });

test('land summary names unknown counts instead of showing zero', () => {
  const line = summaryLine({ kind: 'land', sites: { A: site(33, 2), B: site(34, null) } });
  assert.equal(line, 'A: 2 of 33 samples inside an active claim · B: ? of 34 samples inside an active claim');
});

test('decision summary keeps the review status and a missing value visible', () => {
  const section = { label: 'decision', action: 'BUY', status: 'manual_review', valueUsd: 8218.9 };
  assert.equal(summaryLine({ kind: 'decision', sections: [section] }), 'decision: BUY (manual review) · value $8,219');
  const nv = { label: '21 0310N 0330E 001', action: 'SKIP', status: null, valueUsd: null };
  assert.equal(summaryLine({ kind: 'decision', sections: [nv, nv] }), '21 0310N 0330E 001: SKIP · value not available · +1 more');
});

test('run metadata shows mode, date and a dirty-tree marker', () => {
  const meta = runMeta({ mode: 'scenario', publishedAt: Date.UTC(2026, 9, 25), gitCommit: 'abcdef1234', dirty: true });
  assert.equal(meta, 'Scenario · published 25 Oct 2026 · abcdef1*');
});
