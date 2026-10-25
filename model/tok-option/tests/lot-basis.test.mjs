import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAPITAL, LOT_BASIS, SYNTHETIC_LOT_PROFILE, DEMO_ENTRY_COSTS, evaluateOpportunity, optimizePortfolio, cashOutcomes, requiredAssignmentProceeds } from '../index.mjs';
import { DEFAULT_CONTROLS, createDemoCandidate, runWorkbench } from '../workbench.mjs';
import { decisionOutput, decisionSummary } from '../publish.mjs';

const close = (value, expected) => assert.ok(typeof value === 'number' && Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);
const features = ['a', 'b'].flatMap((a) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${a}/samples.geojson`, import.meta.url))).features);
const run = (controls = {}) => runWorkbench({ features, controls: { mode: 'demo', ...controls } });

test('one whole historical payment reference excludes all assumed transaction costs', () => {
  assert.equal(LOT_BASIS.unit, 'whole_contract');
  assert.equal(LOT_BASIS.initialPremiumUsd, 30000);
  assert.equal(LOT_BASIS.referenceCount, 2);
  assert.equal(LOT_BASIS.sources.length, 2);
  assert.ok(LOT_BASIS.sources.every((s) => s.initialPaymentUsd === 30000 && s.url.startsWith('https://')));
  assert.equal(DEFAULT_CONTROLS.entryPremiumUsd, LOT_BASIS.initialPremiumUsd);
  assert.deepEqual(DEMO_ENTRY_COSTS, { entryFeeUsd: 50, exitFeeUsd: 50, unavoidableAdditionalObligationsUsd: 0 });
  assert.ok(LOT_BASIS.limitations.some((s) => s.includes('25,000') && s.includes('400,000')));
  assert.ok(Object.isFrozen(LOT_BASIS) && Object.isFrozen(LOT_BASIS.sources[0]));
});

test('active whole-lot profile freezes matching synthetic exposure and dated outcomes', () => {
  const result = run();
  assert.equal(result.lotContext.economicsProvenance, 'assumed');
  assert.equal(result.lotContext.selectionKind, 'historical_reference_applied_as_assumption');
  close(result.mapped.materialTrace[0].quantity, 500 * (30000 / 650));
  assert.equal(createDemoCandidate(DEFAULT_CONTROLS).materials[0].derivedFromPpm, false);
  assert.equal(createDemoCandidate(DEFAULT_CONTROLS).sourceId, 'orecast-whole-contract-demo-v1');
  const expected = [-16213.846153846149, 3710.215384615396, 20995.445661538484];
  for (const [i, row] of result.horizons.entries()) {
    close(row.mapped.assignmentValueUsd, 69230.76923076925);
    close(row.mapped.amountAtRiskUsd, 30050);
    close(row.mapped.expectedNetCashUsd, expected[i]);
    assert.equal(row.mapped.riskGate, 'PASS');
    assert.equal(row.mapped.entryAction, i === 0 ? 'SKIP' : 'BUY_CANDIDATE');
    assert.deepEqual(row.mapped.reasons, i === 0 ? ['nonpositive_expected_cash'] : []);
  }
  close(result.cashDiagnostics.mapped.negativeCashProbability, 0.512);
  close(result.cashDiagnostics.mapped.medianCashUsd, -30050);
  assert.deepEqual(result.portfolio.selectedIds, ['hypothetical-option-A']);
});

test('risk ratios include entry fees and whole lots, with no replenishment after exit', () => {
  const result = run();
  close(CAPITAL.startingFundUsd, 1502500);
  close(CAPITAL.maxRiskPerOptionUsd / CAPITAL.startingFundUsd, .02);
  close(CAPITAL.maxOpenRiskUsd / CAPITAL.startingFundUsd, .10);
  close(CAPITAL.maxWholeCohortCommittedUsd, 5 * result.mapped.amountAtRiskUsd);
  const tooLarge = run({ entryFeeUsd: 51 });
  assert.equal(tooLarge.mapped.riskGate, 'FAIL');
  assert.ok(tooLarge.mapped.reasons.includes('per_option_risk_exceeded'));
  // Optimizer unit candidates test capacity only; these are not model forecasts.
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), underlyingId: String(i), amountAtRiskUsd: 30050, expectedNetCashUsd: 1, entryAction: 'BUY_CANDIDATE' }));
  const selected = optimizePortfolio(rows);
  assert.equal(selected.selectedIds.length, 5);
  close(selected.totalRiskUsd, 150250);
  assert.deepEqual(optimizePortfolio(rows, { ledger: { openRiskUsd: 0, lifetimeCommittedUsd: 150250 } }).selectedIds, []);
});

test('constant proceeds hurdles reconcile through canonical monthly cash and never replace valuation', () => {
  const result = run();
  for (const row of result.horizons) for (const targetReturnRatio of [0, .2, .25, .3]) {
    const hurdle = requiredAssignmentProceeds(row.mapped, { targetReturnRatio });
    assert.equal(hurdle.status, 'illustrative');
    assert.match(hurdle.assumption, /not a forecast/);
    const cash = cashOutcomes({ horizonDays: row.days, hazardPer30Days: .2, entryPremiumUsd: 30000, entryFeeUsd: 50, additionalUpfrontCostUsd: 0, exitFeeUsd: 50, intervalPrices: Array(row.days / 30).fill(hurdle.requiredAssignmentProceedsUsd) });
    close(cash.expectedNetCashUsd / cash.amountAtRiskUsd, targetReturnRatio);
  }
  close(requiredAssignmentProceeds(result.mapped).requiredAssignmentProceedsUsd, 61627.86885245902);
  close(requiredAssignmentProceeds(result.mapped, { targetReturnRatio: .25 }).requiredAssignmentProceedsUsd, 77022.33606557378);
  close(result.mapped.assignmentValueUsd, 69230.76923076925);
  assert.equal(result.mapped.entryAction, 'BUY_CANDIDATE');
});

test('hurdles validate distributions and remain unavailable for undefined return or impossible sales', () => {
  for (const input of [null, {}, { intervals: {} }, run({ hazardPer30Days: 0 }).mapped, run({ entryPremiumUsd: 0, entryFeeUsd: 0 }).mapped]) {
    const hurdle = requiredAssignmentProceeds(input, { targetReturnRatio: .25 });
    assert.equal(hurdle.status, 'INSUFFICIENT_DATA');
    assert.equal(hurdle.requiredAssignmentProceedsUsd, null);
  }
  const result = run().mapped;
  for (const targetReturnRatio of [-1, null, NaN, Infinity]) assert.equal(requiredAssignmentProceeds(result, { targetReturnRatio }).requiredAssignmentProceedsUsd, null);
  assert.equal(requiredAssignmentProceeds({ ...result, noSaleProbability: 0 }).requiredAssignmentProceedsUsd, null);
  const certain = run({ hazardPer30Days: 1 }).mapped;
  close(requiredAssignmentProceeds(certain, { targetReturnRatio: .25 }).requiredAssignmentProceedsUsd, 37612.5);
  // The hurdle uses the same sale weights even with a non-flat model forecast.
  const growth = run({ annualGrowthRate: .1 }).mapped;
  close(requiredAssignmentProceeds(growth, { targetReturnRatio: .25 }).requiredAssignmentProceedsUsd, 77022.33606557378);
  assert.notEqual(growth.intervals[0].assignmentValueUsd, growth.intervals.at(-1).assignmentValueUsd);
});

test('canonical summaries preserve lot and hurdle meaning, reject forged context and retain real-mode boundary', () => {
  const result = run();
  const selection = { area: 'A', scenarioId: 'baseline', horizonDays: 90 };
  const summary = decisionSummary(decisionOutput({ selection, result }));
  assert.deepEqual(summary.lotContext, result.lotContext);
  close(summary.selected.mapped.amountAtRiskUsd, 30050);
  close(summary.selected.mapped.assignmentHurdles.target25Percent.requiredAssignmentProceedsUsd, 77022.33606557378);
  const forged = structuredClone(result); forged.lotContext.initialPremiumUsd = 650;
  assert.throws(() => decisionOutput({ selection, result: forged }), /lot context/);
  const custom = run({ entryPremiumUsd: 100 });
  assert.equal(custom.lotContext.selectionKind, 'custom_assumed_premium');
  assert.equal(custom.lotContext.initialPremiumUsd, 30000);
  assert.equal(custom.lotContext.selectedInitialPremiumUsd, 100);
  for (const mode of ['pending', 'real']) {
    const unavailable = run({ mode });
    assert.equal(unavailable.lotContext, null);
    assert.equal(decisionSummary(decisionOutput({ selection, result: unavailable })).lotContext, null);
  }
});
