import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapIllustrativeContrast, ILLUSTRATIVE_CONTRAST_METHOD } from '../illustrative.mjs';
import { DEFAULT_CONTROLS, inspectIntegratedSources, runWorkbench } from '../workbench.mjs';

const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const example = JSON.parse(readFileSync(new URL('../example-swarm.json', import.meta.url)));
const source = inspectIntegratedSources().swarm;
const controls = { mode: 'demo', swarmPolicy: 'illustrative_contrast', scenarioId: 'mine_approval' };
const run = (overrides = {}, swarmRuns = null) => runWorkbench({ features, controls: { ...controls, ...overrides }, swarmRuns });
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const event = (document) => document.diagnosticRuns.runs.find((r) => r.runId === '05_mine_approved_s1');
const reference = (document) => document.diagnosticRuns.runs.find((r) => r.runId === '04_placebo_s1');

test('explicit post-only demo uses actual approval scores and preserves failed research readiness', () => {
  const before = structuredClone(source);
  const signal = mapIllustrativeContrast({ source, scenarioId: 'mine_approval' });
  close(signal.value, -0.02517925880444948);
  close(signal.adjustment, -0.0017625481163114638);
  assert.equal(signal.provenance, 'simulated');
  assert.equal(signal.usagePolicy, 'illustrative_contrast');
  assert.equal(signal.methodVersion, ILLUSTRATIVE_CONTRAST_METHOD);
  assert.equal(signal.comparisonMethod, 'matched_configuration_placebo_contrast');
  assert.equal(signal.referenceRunId, '04_placebo_s1');
  assert.equal(signal.scenarioRunId, '05_mine_approved_s1');
  assert.equal(signal.revision, 'f2fe2971d9f041a819f7b7ff4a78e10f840884f5');
  assert.equal(signal.knowledgeCutoff, null);
  assert.equal(signal.demoEligible, true);
  assert.equal(signal.researchReadiness.status, 'fail');
  assert.equal(signal.researchReadiness.scenarioReadiness.status, 'fail');
  assert.deepEqual(signal.researchReadiness.diagnostics, source.diagnostics);
  assert.deepEqual(signal.originalSourceChecks, source.diagnosticRuns.sourceChecks);
  assert.equal(signal.pairwiseConfiguration.status, 'match');
  assert.deepEqual(source, before);
  const result = run();
  assert.equal(result.status, 'illustrative');
  close(result.baseline.expectedNetCashUsd, 7.6);
  close(result.mapped.expectedNetCashUsd, 6.309814778860073);
  close(result.mapped.assignmentValueUsd, 1497.3561778255328);
  assert.equal(result.sourceAudit.swarm.status, 'fail');
  assert.equal(result.swarmDiagnostics.status, 'fail');
  assert.equal(result.provenance.signal, 'simulated');
  assert.ok(result.assumptions.includes(signal.limitations[0]));
});

test('block sign is retained and group means keep actual counts rather than counting aggregate cells', () => {
  const result = run({ scenarioId: 'mine_blocked' });
  close(result.signal.value, 0.030734331593609505);
  close(result.mapped.expectedNetCashUsd, 9.174827150856572);
  close(result.mapped.assignmentValueUsd, 1503.2271048173288);
  const funds = result.signal.groups.find((r) => r.group === 'funds');
  assert.ok(funds.delta > 0);
  assert.deepEqual(funds.baselineCounts, [40, 28, 23]);
  assert.deepEqual(funds.scenarioCounts, [34, 24, 16]);
  close(funds.referenceMean, funds.baselineMean);
  close(funds.delta, (funds.scenarioMean - funds.referenceMean) / 10);
  close(funds.contribution, funds.weight * funds.delta);
  assert.equal(funds.referenceDailyMeans.length, 3);
});

test('zero and half transfer change only the existing assignment sensitivity', () => {
  const full = run();
  for (const input of [{ retention: 0 }, { eventExposure: 0 }]) {
    const zero = run(input);
    close(zero.signal.value, full.signal.value);
    close(zero.signal.adjustment, 0);
    close(zero.mapped.expectedNetCashUsd, 7.6);
    close(zero.mapped.assignmentValueUsd, 1500);
  }
  for (const input of [{ retention: .5 }, { eventExposure: .5 }]) {
    const half = run(input);
    close(half.delta.expectedNetCashUsd, full.delta.expectedNetCashUsd / 2);
    close(half.signal.adjustment, full.signal.adjustment / 2);
    close(half.mapped.saleProbability, full.mapped.saleProbability);
    close(half.mapped.noSaleProbability, full.mapped.noSaleProbability);
    close(half.mapped.amountAtRiskUsd, 700);
    close(half.controls.pGeo, full.controls.pGeo);
  }
});

test('default strict behavior and all pending/real money boundaries remain unchanged', () => {
  assert.equal(DEFAULT_CONTROLS.swarmPolicy, 'strict');
  const strict = run({ swarmPolicy: 'strict' });
  assert.equal(strict.signal.value, null);
  assert.equal(strict.mapped, null);
  close(strict.baseline.expectedNetCashUsd, 7.6);
  for (const mode of ['pending', 'real']) {
    const result = run({ mode });
    assert.equal(result.baseline, null);
    assert.equal(result.mapped, null);
    assert.equal(result.portfolio.totalRiskUsd, null);
    assert.equal(result.portfolio.totalExpectedNetCashUsd, null);
    assert.equal(result.delta.expectedNetCashUsd, null);
  }
  assert.ok(run({ swarmPolicy: 'unknown' }).validationErrors.length > 0);
  assert.equal(run({ swarmPolicy: 'unknown' }).mapped, null);
});

test('missing conditions never receive a replay and baseline remains a zero-transfer comparison', () => {
  for (const scenarioId of ['proposed_tax', 'protest', 'gold_reversal', 'sports_placebo']) {
    const result = run({ scenarioId });
    assert.equal(result.signal.value, null);
    assert.equal(result.mapped, null);
    assert.ok(result.signal.reasons.includes('illustrative_contrast_scenario_unavailable'));
  }
  const baseline = run({ scenarioId: 'baseline' });
  close(baseline.signal.value, 0);
  close(baseline.mapped.expectedNetCashUsd, 7.6);
});

test('manual imports cannot become the pinned replay and explicit synthetic behavior stays separate', () => {
  for (const document of [example, source.diagnosticRuns]) {
    const imported = run({}, document);
    assert.equal(imported.mapped, null);
    assert.ok(imported.signal.reasons.includes('illustrative_contrast_requires_bundled_source'));
  }
  const syntheticImport = run({ swarmPolicy: 'strict' }, example);
  close(syntheticImport.mapped.expectedNetCashUsd, 18.00172);
  assert.equal(syntheticImport.signal.provenance, 'synthetic');
  assert.equal(syntheticImport.signal.usagePolicy, undefined);
  const scalar = run({ scenarioId: 'synthetic', syntheticSignal: .203 });
  close(scalar.mapped.expectedNetCashUsd, 18.00172);
  assert.equal(scalar.signal.provenance, 'synthetic_sensitivity');
  assert.equal(scalar.signal.usagePolicy, undefined);
});

test('replay preserves evidence, expiry, risk and positive-cash entry gates', () => {
  const cases = [
    [{ area: 'B' }, 'evidence_gate_failed'],
    [{ remainingMaturityDays: 90 }, 'expiry_window_failed'],
    [{ entryPremiumUsd: 2050 }, 'per_option_risk_exceeded'],
    [{ entryPremiumUsd: 800 }, 'nonpositive_expected_cash'],
  ];
  for (const [input, reason] of cases) {
    const result = run(input);
    assert.equal(result.mapped.entryAction, 'SKIP');
    assert.ok(result.mapped.reasons.includes(reason));
    assert.deepEqual(result.portfolio.selectedIds, []);
  }
  const normal = run();
  close(normal.mapped.noSaleProbability, .512);
  close(normal.cashDiagnostics.mapped.outcomes.find((o) => o.kind === 'no_sale').netCashUsd, -700);
  close(normal.mapped.weightedNoSaleResidualMarkUsd, .512 * normal.mapped.assignmentValueUsd);
});

test('missing or malformed scores, days, groups and attested counts cannot be imputed', () => {
  const mutations = [
    (d) => { event(d).days = event(d).days.filter((r) => r.day !== 5); },
    (d) => { delete event(d).days.find((r) => r.day === 3).groups.funds; },
    (d) => { event(d).days.find((r) => r.day === 3).groups.funds = [null]; },
    (d) => { event(d).days.find((r) => r.day === 3).groups.funds = [Infinity]; },
    (d) => { event(d).days.find((r) => r.day === 3).groups.funds = [10.1]; },
    (d) => { event(d).days.find((r) => r.day === 3).groups.unknown = [5]; },
    (d) => { event(d).days.find((r) => r.day === 3).groups.funds = [5, 6]; },
    (d) => { event(d).sourcePostCounts[3].funds = 0; },
    (d) => { delete event(d).sourcePostCounts[3].funds; },
  ];
  for (const mutate of mutations) {
    const document = structuredClone(source); mutate(document);
    const result = mapIllustrativeContrast({ source: document, scenarioId: 'mine_approval' });
    assert.equal(result.value, null);
    assert.equal(result.adjustment, null);
    assert.equal(result.demoEligible, false);
  }
});

test('all required pairwise settings must be known, finite and exactly matched', () => {
  const mutations = [
    (d) => { event(d).configuration.tier1Model = 'different-model'; },
    (d) => { event(d).configuration.memoryTokenLimit = null; },
    (d) => { event(d).configuration.llmSemaphore = Infinity; },
    (d) => { event(d).configuration.minutesPerRound = 0; },
    (d) => { event(d).configuration.patchSha256 = 'unknown'; },
    (d) => { event(d).configuration.tiers['1'] = NaN; },
    (d) => { event(d).configuration.provider = 'unknown'; },
    (d) => { delete reference(d).configuration.maxCommentsPerPost; },
    (d) => { event(d).configuration = null; },
  ];
  for (const mutate of mutations) {
    const document = structuredClone(source); mutate(document);
    const result = mapIllustrativeContrast({ source: document, scenarioId: 'mine_approval' });
    assert.equal(result.value, null);
    assert.ok(result.reasons.includes('illustrative_configuration_not_matched'));
    assert.notEqual(result.pairwiseConfiguration.status, 'match');
  }
});

test('pairwise comparison does not silently require matching OpenAI baselines or repair their failures', () => {
  const document = structuredClone(source);
  for (const baseline of document.diagnosticRuns.runs.filter((r) => r.scenarioId === 'baseline')) baseline.configuration = null;
  const result = mapIllustrativeContrast({ source: document, scenarioId: 'mine_approval' });
  close(result.value, -0.02517925880444948);
  assert.equal(result.pairwiseConfiguration.status, 'match');
  assert.equal(result.researchReadiness.diagnostics.find((d) => d.id === 'config_comparability').status, 'fail');
});

test('source identity and explicit unknown cutoff are retained without inventing provenance', () => {
  const mutations = [
    (d) => { d.diagnosticRuns.provenance = 'synthetic'; },
    (d) => { d.diagnosticRuns.sourceId = 'different'; },
    (d) => { d.provenance.revision = null; },
    (d) => { d.provenance.knowledgeCutoff = 'not a date'; },
    (d) => { delete d.provenance.knowledgeCutoff; delete d.diagnosticRuns.knowledgeCutoff; },
    (d) => { event(d).seed = 2; },
    (d) => { d.diagnosticRuns.runs.push(structuredClone(event(d))); },
  ];
  for (const mutate of mutations) {
    const document = structuredClone(source); mutate(document);
    assert.equal(mapIllustrativeContrast({ source: document, scenarioId: 'mine_approval' }).value, null);
  }
  assert.equal(mapIllustrativeContrast({ source: null, scenarioId: 'mine_approval' }).value, null);
  assert.equal(mapIllustrativeContrast({ source, scenarioId: 'mine_approval' }).knowledgeCutoff, null);
});

test('invalid weights and transfer controls remain unavailable instead of receiving defaults', () => {
  for (const weights of [null, {}, { ...DEFAULT_CONTROLS.weights, funds: null }, { ...DEFAULT_CONTROLS.weights, funds: .1 }, { ...DEFAULT_CONTROLS.weights, extra: 0 }]) {
    assert.equal(mapIllustrativeContrast({ source, scenarioId: 'mine_approval', weights }).value, null);
  }
  for (const values of [{ exposure: NaN }, { exposure: 2 }, { retention: null }, { cap: .08 }]) {
    assert.equal(mapIllustrativeContrast({ source, scenarioId: 'mine_approval', ...values }).value, null);
  }
  const changedWeights = { government: 0, industry: 0, community: 0, funds: 1, retail: 0 };
  const result = mapIllustrativeContrast({ source, scenarioId: 'mine_blocked', weights: changedWeights });
  close(result.value, (result.groups.find((g) => g.group === 'funds').scenarioMean - result.groups.find((g) => g.group === 'funds').baselineMean) / 10);
});
