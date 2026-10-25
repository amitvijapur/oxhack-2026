import { LEGACY_CONTROLS, LEGACY_CAPITAL } from './helpers/legacy-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyBounds, sampleBounds, evidenceFromCounts, evaluateEvidence, growthFromHistory, projectPrice, valueOption, cashOutcomes, evaluateOpportunity, mapSwarm, parseSwarmImport, optimizePortfolio as currentOptimizePortfolio, WEIGHTS, GROUPS } from '../index.mjs';
import { DEFAULT_CONTROLS, createDemoCandidate, runWorkbench } from '../workbench.mjs';
const close = (actual, expected, epsilon = 1e-8) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < epsilon, `${actual} should equal ${expected}`);
const fixture = JSON.parse(readFileSync(new URL('../../../research/tok-option-model/fixtures.json', import.meta.url)));
const sampleFeatures = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const example = JSON.parse(readFileSync(new URL('../example-swarm.json', import.meta.url)));
const candidate = createDemoCandidate(LEGACY_CONTROLS);
const optimizePortfolio = (rows, options = {}) => currentOptimizePortfolio(rows, { ...options, limits: { ...LEGACY_CAPITAL, ...options.limits } });
const evaluate = (overrides = {}) => evaluateOpportunity({ maxRiskPerOptionUsd: LEGACY_CAPITAL.maxRiskPerOptionUsd, candidate, evidenceGate: 'PASS', horizonDays: 90, hazardPer30Days: 0.2, ...overrides });
const cloned = (value) => JSON.parse(JSON.stringify(value));

for (const row of fixture.cashCases) test(`fixed cash oracle: ${row.id}`, () => {
  const result = evaluate({ signal: row.signal });
  close(result.assignmentValueUsd, row.expected.assignmentValueUsd);
  close(result.conditionalSaleProfitUsd, row.expected.conditionalSaleProfitUsd);
  close(result.expectedNetCashUsd, row.expected.expectedNetCashUsd);
  close(result.weightedNoSaleResidualMarkUsd, row.expected.weightedNoSaleResidualMarkUsd);
  assert.equal(result.entryAction, row.expected.entryAction);
  close(result.amountAtRiskUsd, 700);
});
for (const row of fixture.horizonCases) test(`dated horizon oracle: ${row.horizonDays}`, () => {
  const result = evaluate({ horizonDays: row.horizonDays });
  close(result.saleProbability, row.expectedSaleProbability);
  close(result.expectedNetCashUsd, row.expectedNetCashUsd);
  close(result.weightedNoSaleResidualMarkUsd, row.expectedWeightedNoSaleResidualMarkUsd);
  close(result.intervals.reduce((sum, r) => sum + r.weight, 0), result.saleProbability);
});
for (const row of fixture.evidenceCases) test(`evidence uncertainty: ${row.id}`, () => {
  const result = evidenceFromCounts(row);
  assert.equal(result.gate, row.expectedGate);
  close(result.lowerFraction, row.expectedLowerFraction);
  close(result.upperFraction, row.expectedUpperFraction);
});
for (const row of fixture.sampleBoundCases) test(`primary sample boundary: ${row.id}`, () => assert.equal(classifyBounds(row), row.expectedClass));
test('actual evidence adapter matches 67 observed samples and preserves primary censoring', () => {
  assert.equal(sampleFeatures.length, 67);
  const a = evaluateEvidence(sampleFeatures, { area: 'A' });
  const b = evaluateEvidence(sampleFeatures, { area: 'B' });
  assert.deepEqual([a.pass, a.fail, a.unknown, a.total, a.gate], [25, 8, 0, 33, 'PASS']);
  assert.deepEqual([b.pass, b.fail, b.unknown, b.total, b.gate], [16, 18, 0, 34, 'FAIL']);
  const censored = sampleFeatures.find((f) => f.properties.gold_primary_raw === '-2');
  assert.equal(classifyBounds(sampleBounds(censored)), 'PASS');
  assert.equal(sampleBounds(censored).lowerPpm, 1);
  const tamperedRetest = cloned(censored);
  tamperedRetest.properties.gold_retest_value_ppm = 0;
  assert.deepEqual(sampleBounds(tamperedRetest), sampleBounds(censored));
});
test('missing measurements and negative sentinels never become zeros', () => {
  assert.equal(classifyBounds(sampleBounds({ gold_primary_unit: 'ppm', gold_primary_status: 'quantified', gold_primary_value_ppm: -2 })), 'UNKNOWN');
  assert.equal(evaluateEvidence([]).gate, 'UNKNOWN');
  assert.equal(evaluateEvidence([]).lowerFraction, null);
  assert.equal(classifyBounds({ lowerPpm: 2, upperPpm: 1 }), 'UNKNOWN');
});
test('growth is applied before ownership and option strike', () => {
  const c = cloned(candidate); c.materials[0].annualGrowthRate = 0.1;
  close(valueOption(c, 365).assignmentValueUsd, 1750);
  close(valueOption(c, 182.5).assignmentValueUsd, 1622.022120425379);
  close(projectPrice(2000, 0.1, 182.5), 2097.617696340303);
});
test('compatible historical inputs compute actual elapsed time and reject future availability', () => {
  const observations = [{ date: '2021-01-01', availableAt: '2021-01-01', price: 100, material: 'Au', unit: 'troy_oz', currency: 'USD', sourceId: 'test' }, { date: '2026-01-01', availableAt: '2026-01-01', price: 200, material: 'Au', unit: 'troy_oz', currency: 'USD', sourceId: 'test' }];
  // Five calendar years include a leap day. Use a 5.01-year requested window.
  const result = growthFromHistory({ observations, cutoff: '2026-01-01', lookbackYears: 5.01 });
  close(result.annualGrowthRate, 2 ** (365 / 1826) - 1);
  assert.equal(result.elapsedDays, 1826);
  const future = cloned(observations); future[1].availableAt = '2026-01-02';
  assert.equal(growthFromHistory({ observations: future, cutoff: '2026-01-01', lookbackYears: 5.01 }).annualGrowthRate, null);
  const wrongUnits = cloned(observations); wrongUnits[0].unit = 'kg';
  assert.equal(growthFromHistory({ observations: wrongUnits, cutoff: '2026-01-01', lookbackYears: 5.01 }).annualGrowthRate, null);
  const badDate = cloned(observations); badDate[0].date = '2021-02-30';
  assert.equal(growthFromHistory({ observations: badDate, cutoff: '2026-01-01' }).annualGrowthRate, null);
});
test('malformed units, absent growth and resolution assumptions cannot yield prices', () => {
  for (const mutate of [(c) => { c.materials[0].priceUnit = 'USD/kg'; }, (c) => { c.materials[0].annualGrowthRate = null; }, (c) => { c.resolutionBeforeExercise = false; }, (c) => { c.materials[0].derivedFromPpm = true; }, (c) => { c.materials = {}; }, (c) => { c.materials = [null]; }]) {
    const c = cloned(candidate); mutate(c);
    assert.equal(valueOption(c, 90).assignmentValueUsd, null);
  }
});
test('buyer consideration is not an assignor cash outflow and residual is not cash', () => {
  const r = evaluate();
  close(r.expectedNetCashUsd, 7.6);
  close(r.amountAtRiskUsd, 700);
  close(r.unweightedNoSaleResidualMarkUsd, 1500);
  close(r.weightedNoSaleResidualMarkUsd, 768);
});
test('zero and one hazards preserve exact cash branches', () => {
  const zero = evaluate({ hazardPer30Days: 0 });
  close(zero.expectedNetCashUsd, -700); close(zero.saleProbability, 0); close(zero.weightedNoSaleResidualMarkUsd, 1500);
  const one = evaluate({ hazardPer30Days: 1 });
  close(one.expectedNetCashUsd, 750); close(one.saleProbability, 1); close(one.weightedNoSaleResidualMarkUsd, 0);
});
test('missing liquidity, empty numeric fields and nonzero discount are unavailable', () => {
  for (const hazardPer30Days of [null, undefined, '', NaN, Infinity, -0.1, 1.1]) assert.equal(evaluate({ hazardPer30Days }).expectedNetCashUsd, null);
  assert.equal(evaluate({ annualDiscountRate: 0.01 }).expectedNetCashUsd, null);
  const c = { ...candidate, unavoidableAdditionalObligationsUsd: undefined };
  assert.equal(evaluate({ candidate: c }).expectedNetCashUsd, null);
  assert.equal(evaluate({ candidate: c }).amountAtRiskUsd, null);
});
test('below-fee sale policy keeps price but blocks all liquidity and cash; equality is allowed', () => {
  const c = { ...candidate, exitFeeUsd: 1501 };
  const r = evaluate({ candidate: c });
  close(r.assignmentValueUsd, 1500);
  assert.equal(r.expectedNetCashUsd, null); assert.equal(r.saleProbability, null);
  assert.ok(r.reasons.includes('no_viable_sale_under_policy'));
  assert.equal(evaluate({ candidate: { ...candidate, exitFeeUsd: 1500 } }).expectedNetCashUsd, -700);
});
test('expiry equality, risk, evidence and unknown terms behave independently', () => {
  assert.equal(evaluate({ candidate: { ...candidate, remainingMaturityDays: 105 } }).entryAction, 'BUY_CANDIDATE');
  assert.equal(evaluate({ candidate: { ...candidate, remainingMaturityDays: 104 } }).entryAction, 'SKIP');
  assert.equal(evaluate({ candidate: { ...candidate, entryPremiumUsd: 2000 } }).riskGate, 'FAIL');
  assert.equal(evaluate({ evidenceGate: 'FAIL' }).entryAction, 'SKIP');
  assert.equal(evaluate({ evidenceGate: 'UNKNOWN' }).entryAction, null);
  assert.equal(evaluate({ candidate: { ...candidate, assignable: null } }).entryAction, null);
  assert.equal(evaluate({ candidate: { ...candidate, hasLaterMandatoryObligations: true } }).entryAction, null);
});
test('swarm import reproduces partial signal and weights', () => {
  const imported = parseSwarmImport(JSON.stringify(example)); assert.deepEqual(imported.errors, []);
  const result = mapSwarm({ runs: imported.runs, scenarioId: 'mine_approval' });
  close(result.value, 0.203); close(result.adjustment, 0.01421);
  assert.equal(result.groups.length, 5);
  close(result.groups.find((g) => g.group === 'funds').contribution, 0.12);
});
test('swarm missing groups, days or baseline stays pending without reweighting', () => {
  const noGroup = cloned(example); delete noGroup.runs[1].days[0].groups.retail;
  const noDay = cloned(example); noDay.runs[1].days.pop();
  const noBase = cloned(example); noBase.runs.shift();
  for (const runs of [noGroup, noDay, noBase]) { const r = mapSwarm({ runs, scenarioId: 'mine_approval' }); assert.equal(r.status, 'PENDING_SWARM'); assert.equal(r.value, null); }
});
test('equal daily weighting does not weight days by post counts', () => {
  const runs = cloned(example);
  runs.runs[1].days[0].groups.industry = [0, 10];
  runs.runs[1].days[1].groups.industry = [10];
  runs.runs[1].days[2].groups.industry = [0, 0, 0];
  close(mapSwarm({ runs, scenarioId: 'mine_approval' }).groups.find((g) => g.group === 'industry').scenarioMean, 5);
});
test('raw invalid scores are rejected, not clipped', () => {
  const runs = cloned(example); runs.runs[1].days[0].groups.funds = [11];
  assert.ok(parseSwarmImport(JSON.stringify(runs)).errors.length);
  assert.equal(mapSwarm({ runs, scenarioId: 'mine_approval' }).value, null);
  assert.ok(parseSwarmImport('{').errors.length);
  assert.ok(parseSwarmImport('null').errors.length);
  assert.equal(mapSwarm({ runs: example, scenarioId: 'mine_approval', weights: { ...WEIGHTS, funds: 0.5 } }).value, null);
});
test('extreme group deltas are capped at exactly seven percent and exposure applies once', () => {
  const runs = cloned(example);
  for (const day of runs.runs[0].days) for (const group of GROUPS) day.groups[group] = [0];
  for (const day of runs.runs[1].days) for (const group of GROUPS) day.groups[group] = [10];
  close(mapSwarm({ runs, scenarioId: 'mine_approval' }).adjustment, 0.07);
  close(mapSwarm({ runs, scenarioId: 'mine_approval', exposure: 0.5, retention: 0.5 }).adjustment, 0.0175);
  assert.equal(valueOption(candidate, 90, { signal: 1.1 }).assignmentValueUsd, null);
});
const pick = (id, risk, cash, underlyingId = id) => ({ id, underlyingId, amountAtRiskUsd: risk, expectedNetCashUsd: cash, entryAction: 'BUY_CANDIDATE' });
test('exact optimizer beats a greedy choice and respects indivisibility', () => {
  const rows = [pick('large', 1900, 20), pick('b', 1000, 12), pick('c', 1000, 12)];
  const result = optimizePortfolio(rows, { limits: { maxOpenRiskUsd: 2000, maxWholeCohortCommittedUsd: 2000 } });
  assert.deepEqual(result.selectedIds, ['b', 'c']); close(result.totalRiskUsd, 2000); close(result.totalExpectedNetCashUsd, 24);
});
test('portfolio enforces duplicate underlying, maximum count, positive cash and risk', () => {
  const duplicate = optimizePortfolio([pick('a', 700, 5, 'same'), pick('b', 700, 10, 'same')]);
  assert.deepEqual(duplicate.selectedIds, ['b']);
  assert.equal(optimizePortfolio(Array.from({ length: 6 }, (_, i) => pick(String(i), 1000, 1))).selectedIds.length, 5);
  assert.deepEqual(optimizePortfolio([pick('loss', 700, -1), pick('oversize', 2001, 100)]).selectedIds, []);
  assert.ok(optimizePortfolio(Array.from({ length: 21 }, (_, i) => pick(String(i), 10, 1))).reasons.includes('candidate_limit_requires_declared_prefilter'));
});
test('exits do not replenish lifetime commitment or permit underlying reuse', () => {
  assert.deepEqual(optimizePortfolio([pick('a', 700, 10)], { ledger: { openRiskUsd: 0, lifetimeCommittedUsd: 10000, openPositions: 0, usedUnderlyingIds: [] } }).selectedIds, []);
  assert.deepEqual(optimizePortfolio([pick('a', 700, 10, 'old')], { ledger: { openRiskUsd: 0, lifetimeCommittedUsd: 700, openPositions: 0, usedUnderlyingIds: ['old'] } }).selectedIds, []);
  assert.equal(optimizePortfolio([pick('a', 700, 10)], { ledger: { openRiskUsd: null, lifetimeCommittedUsd: null, openPositions: null } }).status, 'INSUFFICIENT_DATA');
});
test('workbench requires explicit demo and never leaks fixture economics into real mode', () => {
  assert.equal(runWorkbench({ features: sampleFeatures }).baseline, null);
  const real = runWorkbench({ features: sampleFeatures, controls: { mode: 'real' } });
  assert.equal(real.baseline, null); assert.equal(real.mapped, null); assert.equal(real.evidence.gate, 'PASS');
});
test('workbench preserves baseline when swarm pending and applies observed B failure', () => {
  const pending = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', scenarioId: 'mine_approval' } });
  close(pending.baseline.expectedNetCashUsd, 7.6); assert.equal(pending.mapped, null); assert.equal(pending.status, 'PENDING_SWARM');
  const b = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', area: 'B' } });
  assert.equal(b.mapped.entryAction, 'SKIP'); assert.deepEqual(b.portfolio.selectedIds, []);
});
test('workbench delta and scenario imports use the same core', () => {
  const r = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', scenarioId: 'mine_approval' }, swarmRuns: example });
  close(r.mapped.expectedNetCashUsd, 24.9362); close(r.delta.expectedNetCashUsd, 17.3362); close(r.delta.assignmentValueUsd, 35.525);
  const r2 = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', scenarioId: 'synthetic', syntheticSignal: -1 } });
  assert.equal(r2.mapped.entryAction, 'SKIP');
  const r3 = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', pGeo: '' } });
  assert.ok(r3.validationErrors.length); assert.equal(r3.baseline, null);
});
test('sports placebo is diagnostic only and cannot enter the portfolio', () => {
  const runs = cloned(example); runs.runs[1].scenarioId = 'sports_placebo';
  const r = runWorkbench({ features: sampleFeatures, controls: { ...LEGACY_CONTROLS, mode: 'demo', scenarioId: 'sports_placebo' }, swarmRuns: runs });
  assert.equal(r.mapped.entryAction, null); assert.deepEqual(r.portfolio.selectedIds, []);
});
test('malformed nullable evidence and history records return unavailable instead of throwing', () => {
  assert.equal(evaluateEvidence([], { rule: null }).gate, 'UNKNOWN');
  assert.equal(growthFromHistory({ cutoff: '2026-01-01', observations: [null, null] }).annualGrowthRate, null);
});
test('unevaluated portfolio is null, calculated empty portfolio is zero', () => {
  assert.equal(runWorkbench({ features: sampleFeatures }).portfolio.totalExpectedNetCashUsd, null);
  assert.equal(optimizePortfolio([]).totalExpectedNetCashUsd, 0);
});
