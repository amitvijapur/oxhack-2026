import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runMeta, summaryLine } from '../src/lib/workstreamSummary.js';

const site = (samples, insideActiveClaim) => ({ samples, insideActiveClaim });
const decision = (extra = {}) => ({ kind: 'decision', contractVersion: 'tok-assignment-summary-v1', modelMode: 'demo', horizonDays: 90, selected: { mapped: null }, ...extra });

test('land summary names unknown counts instead of showing zero', () => {
  assert.equal(summaryLine({ kind: 'land', sites: { A: site(33, 2), B: site(34, null) } }), 'A: 2 of 33 samples inside an active claim · B: ? of 34 samples inside an active claim');
});

test('canonical decision summary names demo cash and the horizon', () => {
  assert.equal(summaryLine(decision({ selected: { mapped: { entryAction: 'BUY_CANDIDATE', expectedNetCashUsd: 250 } } })), 'Demo buy candidate · 90 days · expected net cash $250');
});

test('real and incomplete decision summaries keep cash unavailable', () => {
  assert.equal(summaryLine(decision()), 'Scenario pending · 90 days · expected net cash not available');
  assert.equal(summaryLine(decision({ modelMode: 'real', selected: { mapped: { expectedNetCashUsd: 250 } } })), 'Inputs missing · expected net cash not available');
  assert.equal(summaryLine({ kind: 'decision' }), 'Unsupported decision summary');
});

test('zero calculated cash remains distinct from missing cash', () => {
  assert.equal(summaryLine(decision({ selected: { mapped: { entryAction: 'SKIP', expectedNetCashUsd: 0 } } })), 'Skip this contract · 90 days · expected net cash $0');
});

test('run metadata shows mode, date and a dirty-tree marker', () => {
  const meta = runMeta({ mode: 'scenario', publishedAt: Date.UTC(2026, 9, 25), gitCommit: 'abcdef1234', dirty: true });
  assert.equal(meta, 'Scenario · published 25 Oct 2026 · abcdef1*');
});
