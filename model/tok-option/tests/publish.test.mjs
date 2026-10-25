import { LEGACY_CONTROLS } from './helpers/legacy-fixture.mjs';
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
  assert.equal(summary.modelVersion, 'tok-option-demo-v2');
  assert.deepEqual(summary.horizons.map((row) => row.days), [30, 90, 180]);
  assert.ok(Math.abs(summary.selected.mapped.expectedNetCashUsd + 29342.4) < 1e-8);
  assert.ok(Math.abs(summary.selected.mapped.negativeCashProbability - 1) < 1e-12);
  assert.equal(summary.selected.mapped.entryAction, 'SKIP');
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
  assert.ok(swarm.selected.baseline.expectedNetCashUsd < 0);
  assert.equal(decisionSummary(outputFor({ area: 'B' })).selected.mapped.entryAction, 'SKIP');
  const controls = { ...DEFAULT_CONTROLS, mode: 'demo' };
  const unknown = decisionSummary(decisionOutput({ selection: { area: 'A', horizonDays: 90, scenarioId: 'baseline' }, result: runWorkbench({ controls }) }));
  assert.equal(unknown.readiness.evidenceGate, 'UNKNOWN');
  assert.equal(unknown.selected.mapped.entryAction, 'SKIP');
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

test('actual contrast publication attributes the method while retaining failed research readiness', () => {
  for (const [scenarioId, runId] of [['mine_approval', '05_mine_approved_s1'], ['mine_blocked', '06_court_blocks_mine_s1']]) {
    const output = outputFor({ scenarioId, swarmPolicy: 'illustrative_contrast' });
    const summary = decisionSummary(output);
    const context = summary.signalContext;
    assert.equal(output.result.signal.status, 'ready');
    assert.equal(summary.readiness.swarmStatus, 'fail');
    assert.equal(summary.provenance.signal, 'simulated');
    assert.equal(context.usagePolicy, 'illustrative_contrast');
    assert.equal(context.calculationStatus, 'ready');
    assert.equal(context.methodVersion, 'matched-placebo-post-contrast-v1');
    assert.equal(context.referenceRunId, '04_placebo_s1');
    assert.equal(context.scenarioRunId, runId);
    assert.equal(context.sourceId, 'ahmed-gold-society-f2fe2971');
    assert.equal(context.revision, 'f2fe2971d9f041a819f7b7ff4a78e10f840884f5');
    assert.equal(context.knowledgeCutoff, null);
    assert.equal(context.demoEligible, true);
    assert.equal(context.pairwiseConfigurationStatus, 'match');
    assert.deepEqual(context.scoreWindow, [3, 4, 5]);
    assert.equal(context.scoreMetric, 'mining_support');
    assert.equal(context.scoreAggregation, 'equal_daily_means');
    assert.equal(context.researchReadiness.status, 'fail');
    assert.ok(context.researchReadiness.diagnostics.some((row) => row.id === 'interview_coverage' && row.status === 'fail'));
    assert.ok(context.sourceChecks.some((row) => row.name === 'grounding' && row.status === 'fail'));
    assert.deepEqual(context.researchReadiness.scenarioReadiness, output.result.signal.researchReadiness.scenarioReadiness);
    assert.equal(decisionRunMode(summary), 'scenario');
    assert.ok(summary.assumptions.some((line) => line.includes('does not identify a causal news effect')));
    assert.equal(JSON.parse(JSON.stringify(output)).result.signal.groups[0].referenceMean, output.result.signal.groups[0].referenceMean);
  }
});

test('contrast publication cannot hide source failures or claim another policy, run or revision', () => {
  const contrast = () => JSON.parse(JSON.stringify(outputFor({ scenarioId: 'mine_approval', swarmPolicy: 'illustrative_contrast' })));
  const policy = contrast(); policy.result.controls.swarmPolicy = 'strict';
  assert.throws(() => decisionSummary(policy), /explicit demo controls and policy/);
  const missingPolicy = contrast(); delete missingPolicy.result.signal.usagePolicy;
  assert.throws(() => decisionSummary(missingPolicy), /explicit signal usage policy/);
  const reference = contrast(); reference.result.signal.referenceRunId = '01_baseline_s1';
  assert.throws(() => decisionSummary(reference), /reference and scenario run attribution/);
  const revision = contrast(); revision.result.signal.revision = 'a'.repeat(40);
  assert.throws(() => decisionSummary(revision), /revision does not match/);
  const cutoff = contrast(); cutoff.result.signal.knowledgeCutoff = '2026-10-25T00:00:00Z';
  assert.throws(() => decisionSummary(cutoff), /knowledgeCutoff does not match/);
  const readiness = contrast(); readiness.result.signal.researchReadiness.status = 'pass';
  assert.throws(() => decisionSummary(readiness), /preserve the original source status/);
  const diagnostics = contrast(); diagnostics.result.signal.researchReadiness.diagnostics[0].status = 'pass';
  assert.throws(() => decisionSummary(diagnostics), /preserve the original source checks/);
  const eligibility = contrast(); eligibility.result.signal.demoEligible = false;
  assert.throws(() => decisionSummary(eligibility), /eligible matched configuration/);
  assert.equal(decisionSummary(outputFor({ scenarioId: 'mine_approval' })).signalContext, undefined);
});

test('blocked contrast requests keep pending and real economics unavailable', () => {
  for (const controls of [{ mode: 'pending', scenarioId: 'mine_approval' }, { mode: 'real', scenarioId: 'mine_approval' }, { mode: 'demo', scenarioId: 'proposed_tax' }]) {
    const summary = decisionSummary(outputFor({ ...controls, swarmPolicy: 'illustrative_contrast' }));
    assert.equal(summary.selected.mapped, null);
    assert.equal(summary.signalContext, undefined);
    if (controls.mode !== 'demo') assert.equal(summary.selected.baseline, null);
  }
});

test('gold forecast projection preserves horizon prices, assumed method and original source failures', () => {
  const output = outputFor({ scenarioId: 'mine_approval', swarmPolicy: 'illustrative_contrast', goldResponseCap: 0.035 });
  const summary = decisionSummary(output);
  assert.equal(summary.readiness.swarmStatus, 'fail');
  for (const row of summary.horizons) {
    const forecast = row.mapped.goldForecast;
    assert.equal(forecast.methodVersion, 'assumed-gold-response-v1');
    assert.equal(forecast.transferTarget, 'gold_price');
    assert.equal(forecast.calibrationStatus, 'uncalibrated');
    assert.equal(forecast.provenance, 'assumed');
    assert.equal(forecast.cap, 0.035);
    assert.equal(forecast.day, row.days);
    assert.equal(forecast.baselinePriceUsdPerOz, 2000);
    assert.ok(forecast.scenarioPriceUsdPerOz < forecast.baselinePriceUsdPerOz);
    assert.equal(forecast.signal, output.result.signal.value);
    assert.equal(row.baseline.goldForecast.scenarioPriceUsdPerOz, 2000);
  }
  assert.deepEqual(summary.selected.mapped.goldForecast, summary.horizons[1].mapped.goldForecast);
});

test('publication rejects altered gold prices, methods, transfer targets and mismatched controls', () => {
  const fresh = () => JSON.parse(JSON.stringify(outputFor({ scenarioId: 'synthetic', syntheticSignal: 0.5 })));
  const mutateMapped = (output, fn) => {
    fn(output.result.horizons[1].mapped);
    output.result.mapped = output.result.horizons[1].mapped;
  };
  const price = fresh(); mutateMapped(price, (row) => { row.goldForecast.scenarioPriceUsdPerOz += 100; });
  assert.throws(() => decisionSummary(price), /gold forecast.*canonical material trace/);
  const trace = fresh(); mutateMapped(trace, (row) => { row.materialTrace[0].projectedPrice += 100; });
  assert.throws(() => decisionSummary(trace), /material trace does not match the canonical controls/);
  const method = fresh(); mutateMapped(method, (row) => { row.goldForecast.calibrationStatus = 'validated'; });
  assert.throws(() => decisionSummary(method), /method, target and assumed provenance/);
  const target = fresh(); target.result.signal.transferTarget = 'assignment_value';
  assert.throws(() => decisionSummary(target), /signal adjustment.*gold forecast/);
  const cap = fresh(); cap.result.controls.goldResponseCap = 0.01;
  assert.throws(() => decisionSummary(cap), /calculation does not match the canonical controls/);
  const old = fresh(); old.modelVersion = 'tok-option-demo-v1';
  assert.throws(() => decisionSummary(old), /unsupported contract or model version/);
});

test('non-finite forecast arithmetic exports an unavailable result without invented cash', () => {
  const summary = decisionSummary(outputFor({ quantity: Number.MAX_VALUE }));
  assert.equal(summary.selected.mapped.goldForecast.status, 'INSUFFICIENT_DATA');
  assert.equal(summary.selected.mapped.goldForecast.scenarioPriceUsdPerOz, null);
  assert.equal(summary.selected.mapped.assignmentValueUsd, null);
  assert.equal(summary.selected.mapped.expectedNetCashUsd, null);
  assert.equal(summary.selected.mapped.entryAction, null);
});

test('v1 direct option markup cannot be relabelled as a v2 gold-first result', () => {
  const output = outputFor({ ...LEGACY_CONTROLS, mode: 'demo', scenarioId: 'synthetic', syntheticSignal: 0.203 });
  for (const row of output.result.horizons) {
    const value = row.mapped;
    const oldAssignment = value.baselineAssignmentValueUsd * (1 + output.result.signal.adjustment);
    value.assignmentValueUsd = oldAssignment;
    for (const interval of value.intervals) {
      interval.assignmentValueUsd = oldAssignment;
      interval.netSaleProceedsUsd = oldAssignment - output.result.controls.exitFeeUsd;
    }
    value.expectedNetCashUsd = value.intervals.reduce((sum, interval) => sum + interval.weight * interval.netSaleProceedsUsd, 0) - value.amountAtRiskUsd;
    value.conditionalSaleProfitUsd = oldAssignment - output.result.controls.exitFeeUsd - value.amountAtRiskUsd;
    value.unweightedNoSaleResidualMarkUsd = oldAssignment;
    value.weightedNoSaleResidualMarkUsd = value.noSaleProbability * oldAssignment;
  }
  // Forecast and material traces still correctly show gold at $2,028.42. The
  // old assignment/cash formula is internally consistent, but is the wrong model.
  assert.ok(Math.abs(output.result.mapped.goldForecast.scenarioPriceUsdPerOz - 2028.42) < 1e-9);
  assert.ok(Math.abs(output.result.mapped.expectedNetCashUsd - 18.00172) < 1e-9);
  assert.throws(() => decisionSummary(output), /assignmentValueUsd does not match canonical gold-first economics/);
});

test('publication checks earlier sale prices and forecasts, not only the final horizon', () => {
  const price = outputFor({ scenarioId: 'synthetic', syntheticSignal: 0.5, annualGrowthRate: 0.1 });
  const value = price.result.horizons[1].mapped;
  value.intervals[0].assignmentValueUsd += 10;
  value.intervals[0].netSaleProceedsUsd += 10;
  value.expectedNetCashUsd += value.intervals[0].weight * 10;
  assert.throws(() => decisionSummary(price), /canonical gold-first economics/);
  const forecast = outputFor({ scenarioId: 'synthetic', syntheticSignal: -0.5 });
  forecast.result.horizons[1].mapped.intervals[0].goldForecast.scenarioPriceUsdPerOz += 10;
  assert.throws(() => decisionSummary(forecast), /sale intervals do not match canonical gold-first economics/);
});

test('canonical growth, negative signals, floor and unavailable sale cash still publish', () => {
  for (const controls of [
    { scenarioId: 'synthetic', syntheticSignal: 0.8, annualGrowthRate: 0.1 },
    { scenarioId: 'synthetic', syntheticSignal: -0.8, annualGrowthRate: -0.1 },
    { scenarioId: 'synthetic', syntheticSignal: 0.8, goldResponseCap: 0 },
    { remainingBuyerConsiderationUsd: 100000, exitFeeUsd: 0 },
    { remainingBuyerConsiderationUsd: 100000 },
  ]) {
    const output = outputFor(controls);
    const summary = decisionSummary(output);
    assert.equal(summary.selected.mapped.assignmentValueUsd, output.result.mapped.assignmentValueUsd);
    assert.equal(summary.selected.mapped.expectedNetCashUsd, output.result.mapped.expectedNetCashUsd);
  }
});
