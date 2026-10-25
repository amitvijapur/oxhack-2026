import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOpportunity, cashOutcomes } from '../index.mjs';
import { createDemoCandidate, DEFAULT_CONTROLS } from '../workbench.mjs';
import { diagnoseCash } from '../diagnostics.mjs';

const close = (actual, expected, tolerance = 1e-8) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < tolerance, `${actual} should equal ${expected}`);
const candidate = createDemoCandidate(DEFAULT_CONTROLS);
const evaluate = (overrides = {}) => evaluateOpportunity({ candidate, evidenceGate: 'PASS', horizonDays: 90, hazardPer30Days: 0.2, ...overrides });
const customCash = (intervalPrices, { hazard = 0.2, premium = 650, entryFee = 50, exitFee = 50, additional = 0 } = {}) => cashOutcomes({
  horizonDays: intervalPrices.length * 30, hazardPer30Days: hazard, entryPremiumUsd: premium,
  entryFeeUsd: entryFee, exitFeeUsd: exitFee, additionalUpfrontCostUsd: additional, intervalPrices,
});

test('cash diagnostics reproduce the independently worked baseline and break-even values', () => {
  const diagnostics = diagnoseCash(evaluate(), { candidate });
  assert.equal(diagnostics.status, 'illustrative');
  close(diagnostics.expectedCashUsd, 7.6);
  close(diagnostics.negativeCashProbability, 0.512);
  close(diagnostics.medianCashUsd, -700);
  close(diagnostics.worstCashUsd, -700);
  close(diagnostics.p05CashUsd, -700);
  close(diagnostics.p95CashUsd, 750);
  close(diagnostics.outcomes.reduce((sum, row) => sum + row.probability, 0), 1);
  assert.deepEqual(diagnostics.outcomes.map((row) => row.day), [30, 60, 90, 90]);
  close(diagnostics.breakEven.maximumEntryPremiumUsd, 657.6);
  close(diagnostics.breakEven.premiumHeadroomUsd, 7.6);
  close(diagnostics.breakEven.minimumSaleProbability, 0.4827586206896552);
  close(diagnostics.breakEven.minimumHazardPer30Days, 0.19727937766316594);
  close(diagnostics.breakEven.minimumConstantAssignmentValueUsd, 1484.4262295081971);
  assert.equal(diagnostics.breakEven.hazardThresholdStatus, 'ready');
  assert.deepEqual(diagnostics.breakEven.reasons, []);
});

test('the break-even premium flips expected cash without counting a residual mark', () => {
  const original = evaluate();
  const threshold = diagnoseCash(original, { candidate }).breakEven.maximumEntryPremiumUsd;
  close(evaluate({ candidate: { ...candidate, entryPremiumUsd: threshold } }).expectedNetCashUsd, 0);
  assert.ok(evaluate({ candidate: { ...candidate, entryPremiumUsd: threshold + 1 } }).expectedNetCashUsd < 0);
  assert.ok(evaluate({ candidate: { ...candidate, entryPremiumUsd: threshold - 1 } }).expectedNetCashUsd > 0);
  const manipulatedMark = { ...original, weightedNoSaleResidualMarkUsd: 9e9, unweightedNoSaleResidualMarkUsd: 9e9 };
  assert.deepEqual(diagnoseCash(manipulatedMark, { candidate }), diagnoseCash(original, { candidate }));
});

test('zero and certain sale hazards remove impossible branches from quantiles and worst cash', () => {
  const zero = diagnoseCash(evaluate({ hazardPer30Days: 0 }), { candidate });
  close(zero.negativeCashProbability, 1);
  close(zero.expectedCashUsd, -700);
  close(zero.worstCashUsd, -700);
  close(zero.p95CashUsd, -700);
  assert.equal(zero.breakEven.minimumConstantAssignmentValueUsd, null);
  close(zero.breakEven.maximumEntryPremiumUsd, -50);
  close(zero.breakEven.minimumHazardPer30Days, 0.19727937766316594);
  const certain = diagnoseCash(evaluate({ hazardPer30Days: 1 }), { candidate });
  close(certain.negativeCashProbability, 0);
  close(certain.worstCashUsd, 750);
  close(certain.medianCashUsd, 750);
  close(certain.expectedCashUsd, 750);
  close(certain.breakEven.minimumConstantAssignmentValueUsd, 750);
});

test('quantiles use the lower discrete CDF at exactly 50 percent', () => {
  const result = evaluate({ horizonDays: 30, hazardPer30Days: 0.5 });
  const diagnostics = diagnoseCash(result, { candidate });
  close(diagnostics.medianCashUsd, -700);
  close(diagnostics.p95CashUsd, 750);
});

test('declining interval proceeds use actual dated receipts for a monotone hazard threshold', () => {
  const result = customCash([1800, 1600, 1400]);
  const diagnostics = diagnoseCash(result, { candidate });
  close(diagnostics.expectedCashUsd, 70.8);
  close(diagnostics.breakEven.maximumEntryPremiumUsd, 720.8);
  const threshold = diagnostics.breakEven.minimumHazardPer30Days;
  assert.ok(threshold > 0 && threshold < 0.2);
  close(customCash([1800, 1600, 1400], { hazard: threshold }).expectedNetCashUsd, 0);
  assert.ok(customCash([1800, 1600, 1400], { hazard: threshold - 0.001 }).expectedNetCashUsd < 0);
  assert.ok(customCash([1800, 1600, 1400], { hazard: threshold + 0.001 }).expectedNetCashUsd > 0);
  close(diagnostics.breakEven.minimumSaleProbability, 1 - (1 - threshold) ** 3);
});

test('rising price paths retain exact distribution but do not imply a monotone minimum hazard', () => {
  const diagnostics = diagnoseCash(customCash([1500, 2000, 5000]), { candidate });
  close(diagnostics.expectedCashUsd, 535.6);
  close(diagnostics.breakEven.maximumEntryPremiumUsd, 1185.6);
  assert.equal(diagnostics.breakEven.minimumHazardPer30Days, null);
  assert.equal(diagnostics.breakEven.minimumSaleProbability, null);
  assert.equal(diagnostics.breakEven.hazardThresholdStatus, 'unsupported');
  assert.ok(diagnostics.breakEven.reasons.includes('minimum_hazard_unsupported_for_increasing_interval_proceeds'));
  close(diagnostics.breakEven.minimumConstantAssignmentValueUsd, 1484.4262295081971);
});

test('unattainable and exact boundary hazard thresholds stay distinct', () => {
  const impossible = diagnoseCash(customCash([600, 600, 600]), { candidate });
  close(impossible.negativeCashProbability, 1);
  assert.equal(impossible.breakEven.minimumHazardPer30Days, null);
  assert.equal(impossible.breakEven.hazardThresholdStatus, 'unattainable');
  const boundary = diagnoseCash(customCash([750, 750, 750]), { candidate });
  close(boundary.breakEven.minimumHazardPer30Days, 1);
  close(boundary.breakEven.minimumSaleProbability, 1);
  close(diagnoseCash(customCash([750, 750, 750], { hazard: 1 }), { candidate }).negativeCashProbability, 0);
});

test('zero commitment has zero break-even hazard and no negative cash probability', () => {
  const result = customCash([1500, 1600, 1700], { premium: 0, entryFee: 0 });
  const diagnostics = diagnoseCash(result, { candidate: { ...candidate, entryPremiumUsd: 0, entryFeeUsd: 0 } });
  close(diagnostics.negativeCashProbability, 0);
  close(diagnostics.breakEven.minimumHazardPer30Days, 0);
  close(diagnostics.breakEven.minimumSaleProbability, 0);
  close(diagnostics.breakEven.minimumConstantAssignmentValueUsd, 50);
});

test('all upfront obligations affect cash and premium headroom exactly once', () => {
  const changed = { ...candidate, unavoidableAdditionalObligationsUsd: 100 };
  const diagnostics = diagnoseCash(evaluate({ candidate: changed }), { candidate: changed });
  close(diagnostics.worstCashUsd, -800);
  close(diagnostics.expectedCashUsd, -92.4);
  close(diagnostics.breakEven.maximumEntryPremiumUsd, 557.6);
  close(diagnostics.breakEven.premiumHeadroomUsd, -92.4);
});

test('missing or mismatched candidate costs hide premium allocation without discarding valid cash', () => {
  for (const c of [undefined, {}, { ...candidate, entryPremiumUsd: 999 }]) {
    const diagnostics = diagnoseCash(evaluate(), { candidate: c });
    assert.equal(diagnostics.status, 'illustrative');
    close(diagnostics.expectedCashUsd, 7.6);
    assert.equal(diagnostics.breakEven.maximumEntryPremiumUsd, null);
    assert.equal(diagnostics.breakEven.premiumHeadroomUsd, null);
  }
});

test('missing, invalid and inconsistent distributions never produce zero-filled diagnostics', () => {
  const original = evaluate();
  const variants = [undefined, null, {}, evaluate({ hazardPer30Days: null }),
    { ...original, expectedNetCashUsd: null }, { ...original, expectedNetCashUsd: 1234 },
    { ...original, noSaleProbability: 0 }, { ...original, intervals: [] },
    { ...original, intervals: [null, ...original.intervals.slice(1)] },
    { ...original, intervals: original.intervals.map((row, i) => i === 1 ? { ...row, weight: -0.1 } : row) },
    { ...original, intervals: original.intervals.map((row, i) => i === 1 ? { ...row, netSaleProceedsUsd: Infinity } : row) },
  ];
  for (const result of variants) {
    const diagnostics = diagnoseCash(result, { candidate });
    assert.equal(diagnostics.status, 'INSUFFICIENT_DATA');
    assert.equal(diagnostics.expectedCashUsd, null);
    assert.equal(diagnostics.negativeCashProbability, null);
    assert.equal(diagnostics.breakEven.minimumHazardPer30Days, null);
  }
  assert.equal(diagnoseCash(original, { hazardPer30Days: 0.5 }).status, 'INSUFFICIENT_DATA');
  assert.equal(diagnoseCash(original, { horizonDays: 180 }).status, 'INSUFFICIENT_DATA');
});

test('diagnostics do not mutate policy decisions or supplied objects', () => {
  const failedGate = evaluate({ evidenceGate: 'FAIL' });
  const before = structuredClone(failedGate);
  assert.equal(diagnoseCash(failedGate, { candidate }).status, 'illustrative');
  assert.equal(failedGate.entryAction, 'SKIP');
  assert.deepEqual(failedGate, before);
});
