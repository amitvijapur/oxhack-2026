import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_CONTROLS, inspectIntegratedSources, parseSwarmImport, runWorkbench } from '../workbench.mjs';
const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const example = JSON.parse(readFileSync(new URL('../example-swarm.json', import.meta.url)));
const run = (controls = {}, swarmRuns = null) => runWorkbench({ features, controls: { ...DEFAULT_CONTROLS, mode: 'demo', ...controls }, swarmRuns });
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('pinned branch evidence is visible before selecting demo assumptions', () => {
  const a = run({ mode: 'pending' });
  assert.equal(a.sourceAudit.land.summary.activeClaimSamples, 2);
  assert.equal(a.sourceAudit.land.summary.totalSamples, 33);
  assert.equal(inspectIntegratedSources('B').land.summary.activeClaimSamples, 20);
  assert.equal(a.sourceAudit.swarm.runs, null);
  assert.equal(a.sourceAudit.swarm.status, 'fail');
  assert.equal(a.sourceAudit.swarm.diagnosticRuns.runs.length, 6);
  assert.equal(a.sourceAudit.swarm.rawReport.runs.length, 9);
  assert.equal(a.sourceAudit.swarm.diagnostics.find((d) => d.id === 'judge').status, 'pass');
  assert.equal(a.baseline, null);
  assert.equal(a.cashDiagnostics.mapped, null);
});
test('whole-contract default preserves valuation while exposing negative cash and median', () => {
  const r = run();
  close(r.mapped.expectedNetCashUsd, -29342.4);
  close(r.cashDiagnostics.mapped.negativeCashProbability, 1);
  close(r.cashDiagnostics.mapped.medianCashUsd, -30050);
  close(r.cashDiagnostics.mapped.breakEven.premiumHeadroomUsd, -29342.4);
});
test('failed and confounded source report cannot fill a news scenario with zero or a synthetic score', () => {
  const r = run({ scenarioId: 'mine_approval' });
  assert.equal(r.status, 'PENDING_SWARM');
  assert.equal(r.signal.value, null);
  assert.equal(r.mapped, null);
  assert.equal(r.delta.expectedNetCashUsd, null);
  assert.equal(r.portfolio.totalRiskUsd, null);
  close(r.baseline.expectedNetCashUsd, -29342.4);
  for (const id of ['config_comparability', 'interview_coverage', 'grounding', 'placebo']) assert.equal(r.sourceAudit.swarm.diagnostics.find((d) => d.id === id).status, 'fail');
});
test('land context never populates real option economics', () => {
  const r = run({ mode: 'real', quantity: 1e9, hazardPer30Days: 1 });
  assert.equal(r.status, 'INSUFFICIENT_DATA');
  assert.equal(r.mapped, null);
  assert.equal(r.baseline, null);
  assert.equal(r.portfolio.totalRiskUsd, null);
  assert.equal(r.sourceAudit.land.goldTrend.status, 'ready');
});
test('complete simulated scores with missing diagnostics cannot move money', () => {
  const document = structuredClone(example); document.provenance = 'simulated';
  const r = run({ scenarioId: 'mine_approval' }, document);
  assert.ok(r.signal.groups.length > 0);
  assert.equal(r.signal.value, null);
  assert.equal(r.mapped, null);
  assert.ok(r.signal.reasons.includes('swarm_diagnostics_incomplete'));
});
test('synthetic fixture remains available only as an explicit illustrative comparison', () => {
  const r = run({ scenarioId: 'mine_approval' }, example);
  close(r.mapped.expectedNetCashUsd, -29325.0638);
  assert.equal(r.swarmDiagnostics.status, 'synthetic');
  assert.ok(r.swarmDiagnostics.diagnostics.every((d) => d.status !== 'pass'));
  assert.equal(run({ mode: 'real', scenarioId: 'mine_approval' }, example).signal.value, null);
});
test('historical gold CAGR changes only the explicitly selected demo growth', () => {
  const rate = (3441.5 / 1770.25) ** (1 / 5) - 1;
  close(inspectIntegratedSources().land.goldTrend.annualGrowthRate, rate);
  const r = run({ annualGrowthRate: rate });
  const assignment = (day) => 0.25 * (10000 * (1 + rate) ** (day / 365) - 4000);
  close(r.mapped.assignmentValueUsd, assignment(90));
  close(r.mapped.expectedNetCashUsd, [30, 60, 90].reduce((sum, day, i) => sum + 0.2 * 0.8 ** i * (assignment(day) - 50), 0) - 30050);
  assert.equal(r.cashDiagnostics.mapped.breakEven.minimumHazardPer30Days, null);
  assert.equal(r.cashDiagnostics.mapped.breakEven.hazardThresholdStatus, 'unsupported');
  assert.equal(run({ area: 'B', annualGrowthRate: rate }).mapped.entryAction, 'SKIP');
  close(run().mapped.expectedNetCashUsd, -29342.4);
});
test('upstream report imports require explicit metadata rather than inferred source dates', () => {
  const report = { runs: [{ folder: '01_baseline_s1', scenario: 'baseline', seed: 1, status: 'judged', daily: {} }] };
  assert.ok(parseSwarmImport(JSON.stringify({ report, metadata: {} })).errors.length > 0);
  const metadata = { sourceId: 'test-report', knowledgeCutoff: '2026-10-24T00:00:00Z', eventDefinition: 'Hypothetical gold breakout, no day-three news in baseline.' };
  const parsed = parseSwarmImport(JSON.stringify({ report, metadata }));
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.runs.provenance, 'simulated');
  assert.equal(run({ scenarioId: 'mine_approval' }, parsed.runs).mapped, null);
});
test('malformed diagnostic imports are rejected and direct callers remain safely pending', () => {
  for (const sourceChecks of [{ placebo: { parts: {} } }, { stability: { status: 'pass', parts: [null] } }]) {
    const document = { ...structuredClone(example), provenance: 'simulated', sourceChecks };
    const parsed = parseSwarmImport(JSON.stringify(document));
    assert.equal(parsed.runs, null);
    assert.ok(parsed.errors.length > 0);
    const result = run({ scenarioId: 'mine_approval' }, document);
    assert.equal(result.mapped, null);
    assert.equal(result.signal.value, null);
  }
});
