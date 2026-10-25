import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runMeta, summaryLine } from '../src/lib/workstreamSummary.js';

const site = (samples, insideActiveClaim) => ({ samples, insideActiveClaim, insideClosedClaim: null, medianMToActiveClaim: null });

test('land summary names unknown counts instead of showing zero', () => {
  const line = summaryLine({ kind: 'land', sites: { A: site(33, 2), B: site(34, null) } });
  assert.equal(line, 'A: 2 of 33 samples inside an active claim · B: ? of 34 samples inside an active claim');
});

test('decision summary keeps the review status and a missing value visible', () => {
  const section = { label: 'decision', action: 'BUY', status: 'manual_review', valueUsd: 8218.9 };
  assert.equal(summaryLine({ kind: 'decision', sections: [section] }), 'BUY (manual review) · value $8,219');
  const nv = { label: '21 0310N 0330E 001', action: 'SKIP', status: null, valueUsd: null };
  assert.equal(summaryLine({ kind: 'decision', sections: [nv, nv] }), '21 0310N 0330E 001: SKIP · value not available · +1 more');
});

test('run metadata shows mode, date and a dirty-tree marker', () => {
  const meta = runMeta({ mode: 'scenario', publishedAt: Date.UTC(2026, 9, 25), gitCommit: 'abcdef1234', dirty: true });
  assert.equal(meta, 'Scenario · published 25 Oct 2026 · abcdef1*');
});

const tok = {
  label: 'decision', action: 'BUY', signal: 'BUY', status: 'manual_review', valueUsd: 8218.9, worstOutcomeUsd: -75289,
  pLoss: 0.8700375, fragile: ['the acceleration assumption alone flips the sign of the value'], conditionalOn: [], swarmUsed: false,
  checks: [
    { name: 'counterparty', status: 'pass', evidence: '20 of 34 Site B samples sit inside active state claims' },
    { name: 'land_status', status: 'unknown', evidence: 'State land status codes are not explained by DNR' },
    { name: 'mineral_rights_conveyed', status: 'unknown', evidence: null },
  ],
  plan: [
    { fromMonth: 0, toMonth: 11, action: 'HOLD', paymentUsd: null, sellIfOfferAtLeastUsd: 277661.5 },
    { fromMonth: 12, toMonth: 12, action: 'LAPSE', paymentUsd: 25000, sellIfOfferAtLeastUsd: null },
  ],
};

test('decision view leads with the action, review status and what to check', async () => {
  const { decisionView } = await import('../src/lib/workstreamSummary.js');
  const view = decisionView({ kind: 'decision', sections: [tok] });
  assert.equal(view.action, 'BUY');
  assert.equal(view.statusLabel, 'Needs review');
  assert.equal(view.valueLine, 'Expected value +$8,219 · 87% chance of losing money');
  assert.deepEqual(view.checks.map((c) => c.label), ['Land status', 'Mineral rights']);
  assert.deepEqual(view.planLines, [
    'Months 0–11: hold; sell if offered $277,662 or more',
    'Month 12: let it lapse rather than pay the next $25,000',
  ]);
  assert.equal(view.moreSections, 0);
});

test('decision view names missing values and extra sections', async () => {
  const { decisionView, planLine } = await import('../src/lib/workstreamSummary.js');
  const nv = { ...tok, label: '21 0310N 0330E 001', status: null, valueUsd: null, pLoss: null, checks: [], plan: [] };
  const view = decisionView({ kind: 'decision', sections: [nv, nv] });
  assert.equal(view.statusLabel, null);
  assert.equal(view.needsReview, false);
  assert.equal(view.valueLine, 'Expected value not available');
  assert.equal(view.moreSections, 1);
  assert.equal(planLine({ fromMonth: 3, toMonth: 3, action: 'PAY_STAGE', paymentUsd: 5000, sellIfOfferAtLeastUsd: null }), 'Month 3: pay the next $5,000 stage');
  assert.equal(planLine({ fromMonth: 0, toMonth: 2, action: 'HOLD', paymentUsd: null, sellIfOfferAtLeastUsd: null }), 'Months 0–2: hold the option');
});
