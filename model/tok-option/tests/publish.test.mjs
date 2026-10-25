import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_CONTROLS, runWorkbench } from '../workbench.mjs';
import { decisionOutput, decisionSummary, decisionRunMode } from '../publish.mjs';

const features = ['A', 'B'].flatMap((area) => Array.from({ length: 12 }, (_, index) => ({ properties: {
  area, sample_id: `${area}-${index}`, source_id: 'test-assays', gold_primary_unit: 'ppm',
  gold_primary_status: 'quantified', gold_primary_value_ppm: area === 'A' ? 0.02 : 0.001,
} })));
const outputFor = (overrides = {}) => {
  const controls = { ...DEFAULT_CONTROLS, mode: 'demo', ...overrides };
  return decisionOutput({ selection: { area: controls.area, horizonDays: controls.horizonDays, scenarioId: controls.scenarioId }, result: runWorkbench({ features, controls }) });
};
const savedOutput = () => JSON.parse(readFileSync(new URL('../../../tests/fixtures/publish/assignment-demo.json', import.meta.url), 'utf8'));

test('projection preserves canonical oracle, day horizons and cash diagnostic meaning', () => {
  const summary = decisionSummary(outputFor());
  assert.equal(summary.modelVersion, 'tok-option-demo-v1');
  assert.deepEqual(summary.horizons.map((row) => row.days), [30, 90, 180]);
  assert.ok(Math.abs(summary.selected.mapped.expectedNetCashUsd - 7.6) < 1e-8);
  assert.ok(Math.abs(summary.selected.mapped.negativeCashProbability - 0.512) < 1e-12);
  assert.equal(summary.selected.mapped.entryAction, 'BUY_CANDIDATE');
  assert.equal(summary.provenance.economics, 'assumed');
  assert.equal(decisionRunMode(summary), 'scenario');
  assert.equal('pLoss' in summary.selected.mapped, false);
});

test('pending and real modes contain no money or assumed sale probability', () => {
  for (const mode of ['pending', 'real']) {
    const summary = decisionSummary(outputFor({ mode }));
    assert.deepEqual(summary.selected, { baseline: null, mapped: null });
    assert.equal(summary.readiness.economicsStatus, 'missing');
    assert.equal(summary.provenance.economics, null);
    assert.equal(decisionRunMode(summary), 'evidence_only');
  }
});

test('missing swarm preserves the baseline, failed evidence preserves SKIP, unknown evidence prevents BUY', () => {
  const swarm = decisionSummary(outputFor({ scenarioId: 'mine_approval' }));
  assert.equal(swarm.status, 'PENDING_SWARM');
  assert.equal(swarm.selected.mapped, null);
  assert.ok(swarm.selected.baseline.expectedNetCashUsd > 0);
  assert.equal(decisionSummary(outputFor({ area: 'B' })).selected.mapped.entryAction, 'SKIP');
  const controls = { ...DEFAULT_CONTROLS, mode: 'demo' };
  const unknown = decisionSummary(decisionOutput({ selection: { area: 'A', horizonDays: 90, scenarioId: 'baseline' }, result: runWorkbench({ controls }) }));
  assert.equal(unknown.readiness.evidenceGate, 'UNKNOWN');
  assert.equal(unknown.selected.mapped.entryAction, null);
});

test('selection metadata, model version and quote gates cannot be silently replaced', () => {
  assert.throws(() => decisionSummary({ action: 'BUY', value_usd: 8218 }), /unsupported contract/);
  const missing = outputFor({ mode: 'pending' });
  delete missing.selection;
  assert.throws(() => decisionSummary(missing), /explicit area/);
  const horizon = outputFor(); horizon.selection.horizonDays = 12;
  assert.throws(() => decisionSummary(horizon), /30\/90\/180/);
  const version = outputFor(); version.result.version = 'different-engine';
  assert.throws(() => decisionSummary(version), /unsupported workbench/);
  const gates = outputFor(); gates.result.horizons[1].mapped.evidenceGate = 'UNKNOWN'; gates.result.mapped = gates.result.horizons[1].mapped;
  assert.throws(() => decisionSummary(gates), /evidence gate|passing canonical gates/);
});

test('saved output cannot contradict the workbench evidence gate in any horizon', () => {
  for (const gate of ['FAIL', 'UNKNOWN']) {
    const output = savedOutput();
    output.result.evidence.gate = gate;
    assert.throws(() => decisionSummary(output), /outcome evidence gate.*workbench/);
  }
  const output = savedOutput();
  output.result.horizons[0].baseline.evidenceGate = 'UNKNOWN';
  assert.throws(() => decisionSummary(output), /outcome evidence gate.*workbench/);
});

test('saved finite cash must agree with the canonical distribution diagnostic', () => {
  const output = savedOutput();
  output.result.horizons[1].mapped.expectedNetCashUsd = 100000;
  output.result.mapped.expectedNetCashUsd = 100000;
  assert.throws(() => decisionSummary(output), /canonical cash diagnostic/);
  const incomplete = savedOutput();
  incomplete.result.horizons[1].mapped.intervals = [];
  incomplete.result.mapped.intervals = [];
  assert.throws(() => decisionSummary(incomplete), /canonical cash diagnostic/);
});

test('unknown monetary fields remain null and non-finite money is rejected', () => {
  const output = outputFor();
  output.result.mapped.entryAction = null;
  output.result.mapped.status = 'INSUFFICIENT_DATA';
  output.result.mapped.expectedNetCashUsd = null;
  output.result.mapped.saleProbability = null;
  output.result.mapped.intervals = [];
  const mapped = decisionSummary(output).selected.mapped;
  assert.equal(mapped.expectedNetCashUsd, null);
  assert.equal(mapped.negativeCashProbability, null);
  assert.equal(mapped.entryAction, null);
  output.result.mapped.assignmentValueUsd = Infinity;
  assert.throws(() => decisionSummary(output), /finite or null/);
});
