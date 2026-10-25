import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SYNTHETIC_LOT_PROFILE as PROFILE, CAPITAL, valueOption } from '../index.mjs';
import { DEFAULT_CONTROLS, createDemoCandidate, runWorkbench, compareFeePolicies } from '../workbench.mjs';
import { decisionOutput, decisionSummary } from '../publish.mjs';
import { LEGACY_CONTROLS } from './helpers/legacy-fixture.mjs';

const close = (value, expected) => assert.ok(typeof value === 'number' && Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);
const features = ['a', 'b'].flatMap((a) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${a}/samples.geojson`, import.meta.url))).features);
const run = (controls = {}) => runWorkbench({ features, controls: { mode: 'demo', ...controls } });
const selection = { area: 'A', horizonDays: 90, scenarioId: 'baseline' };

test('the versioned exposure profile scales both economic quantities, not probabilities or ownership', () => {
  close(PROFILE.scaleFactor, 30000 / 650);
  close(PROFILE.quantity, 500 * (30000 / 650));
  close(PROFILE.remainingBuyerConsiderationUsd, 4000 * (30000 / 650));
  assert.deepEqual([PROFILE.ownershipFraction, PROFILE.kappa, PROFILE.pGeo, PROFILE.price], [.5, .02, .25, 2000]);
  assert.ok(Object.isFrozen(PROFILE) && Object.isFrozen(PROFILE.referenceUnit));
  assert.ok(PROFILE.limitations.some((s) => s.includes('not a number of tradable contracts')));
  assert.ok(PROFILE.limitations.some((s) => s.includes('not the valuation of Tibbs or Northway')));
  for (const day of [30, 90, 180]) for (const signal of [-1, 0, 1]) {
    const old = valueOption(createDemoCandidate({ ...LEGACY_CONTROLS, annualGrowthRate: .1 }), day, { signal });
    const scaled = valueOption(createDemoCandidate({ ...DEFAULT_CONTROLS, annualGrowthRate: .1 }), day, { signal });
    close(scaled.assignmentValueUsd, old.assignmentValueUsd * PROFILE.scaleFactor);
    close(scaled.successValueUsd, old.successValueUsd * PROFILE.scaleFactor);
    close(scaled.materialTrace[0].projectedPrice, old.materialTrace[0].projectedPrice);
  }
});

test('changing only entry premium never changes quantity, consideration or model assignment', () => {
  const original = run();
  for (const entryPremiumUsd of [0, 100, 20000, 30001, 100000]) {
    const changed = run({ entryPremiumUsd });
    assert.equal(changed.controls.quantity, original.controls.quantity);
    assert.equal(changed.controls.remainingBuyerConsiderationUsd, original.controls.remainingBuyerConsiderationUsd);
    assert.deepEqual(changed.mapped.materialTrace, original.mapped.materialTrace);
    assert.equal(changed.mapped.assignmentValueUsd, original.mapped.assignmentValueUsd);
    close(changed.mapped.expectedNetCashUsd - original.mapped.expectedNetCashUsd, 30000 - entryPremiumUsd);
    assert.equal(changed.exposureContext.selectionKind, 'default_synthetic_profile');
  }
  const custom = run({ quantity: 1000 });
  assert.equal(custom.exposureContext.selectionKind, 'custom_assumed_exposure');
  assert.equal(custom.exposureContext.selectedInputs.quantity, 1000);
  assert.equal(custom.exposureContext.quantity, PROFILE.quantity);
});

test('fee comparison reuses the same interest, distinguishes returns and preserves the real risk failure', () => {
  const result = run();
  const fees = compareFeePolicies({ controls: result.controls, evidenceGate: result.evidence.gate, signal: 0 });
  assert.equal(fees.status, 'illustrative');
  close(fees.fixedFees.assignmentValueUsd, 69230.76923076925);
  assert.equal(fees.fixedFees.assignmentValueUsd, fees.proportionalFees.assignmentValueUsd);
  assert.deepEqual(fees.fixedFees.materialTrace, fees.proportionalFees.materialTrace);
  close(fees.fixedFees.expectedNetCashUsd, 3710.215384615396);
  close(fees.fixedFees.returnRatio, .12346806604377358);
  close(fees.proportionalFees.entryFeeUsd, 50 * PROFILE.scaleFactor);
  close(fees.proportionalFees.exitFeeUsd, 50 * PROFILE.scaleFactor);
  close(fees.proportionalFees.amountAtRiskUsd, 32307.69230769231);
  close(fees.proportionalFees.expectedNetCashUsd, 350.76923076924504);
  close(fees.proportionalFees.returnRatio, 7.6 / 700);
  assert.equal(fees.fixedFees.entryAction, 'BUY_CANDIDATE');
  assert.equal(fees.proportionalFees.riskGate, 'FAIL');
  assert.equal(fees.proportionalFees.entryAction, 'SKIP');
  assert.ok(fees.proportionalFees.amountAtRiskUsd > CAPITAL.maxRiskPerOptionUsd);
  close(fees.fixedFees.expectedNetCashUsd - fees.proportionalFees.expectedNetCashUsd,
    (PROFILE.scaleFactor - 1) * (50 + result.mapped.saleProbability * 50));
  const lowerPremium = compareFeePolicies({ controls: { ...result.controls, entryPremiumUsd: 10000 } });
  assert.equal(lowerPremium.scaleFactor, fees.scaleFactor);
  assert.equal(lowerPremium.proportionalFees.entryFeeUsd, fees.proportionalFees.entryFeeUsd);
  assert.equal(lowerPremium.fixedFees.assignmentValueUsd, fees.fixedFees.assignmentValueUsd);
});

test('no-sale, site-B and unavailable-mode boundaries apply to both fee policies', () => {
  const zero = compareFeePolicies({ controls: { ...DEFAULT_CONTROLS, mode: 'demo', hazardPer30Days: 0 } });
  for (const value of [zero.fixedFees, zero.proportionalFees]) {
    assert.equal(value.noSaleProbability, 1);
    assert.equal(value.returnRatio, -1);
    assert.equal(value.expectedNetCashUsd, -value.amountAtRiskUsd);
    assert.equal(value.entryAction, 'SKIP');
  }
  const b = run({ area: 'B' });
  assert.equal(b.mapped.evidenceGate, 'FAIL');
  const rejected = compareFeePolicies({ controls: b.controls, evidenceGate: b.evidence.gate });
  for (const value of [rejected.fixedFees, rejected.proportionalFees]) {
    assert.equal(value.entryAction, 'SKIP');
    assert.ok(value.reasons.includes('evidence_gate_failed'));
  }
  for (const mode of ['pending', 'real']) {
    const result = run({ mode });
    assert.equal(result.exposureContext, null);
    const summary = decisionSummary(decisionOutput({ selection, result }));
    assert.equal(summary.exposureContext, null);
    const fees = compareFeePolicies({ controls: { ...DEFAULT_CONTROLS, mode } });
    assert.equal(fees.fixedFees, null);
    assert.equal(fees.proportionalFees, null);
  }
  for (const override of [{ signal: null }, { horizonDays: 45 }, { evidenceGate: 'invented' }]) {
    assert.equal(compareFeePolicies({ controls: { ...DEFAULT_CONTROLS, mode: 'demo' }, ...override }).fixedFees, null);
  }
});

test('publication derives exposure provenance and rejects supplied forged profile metadata', () => {
  const result = run();
  const output = decisionOutput({ selection, result });
  assert.deepEqual(decisionSummary(output).exposureContext, result.exposureContext);
  assert.deepEqual(createDemoCandidate(result.controls).exposureContext, result.exposureContext);
  for (const mutate of [
    (context) => { context.scaleFactor = 1; },
    (context) => { context.selectedInputs.quantity = 500; },
    (context) => { context.provenance = 'observed'; },
  ]) {
    const forged = structuredClone(result); mutate(forged.exposureContext);
    assert.throws(() => decisionOutput({ selection, result: forged }), /exposure context/);
  }
  // Previously published inputs can omit new metadata. It is reconstructed from
  // their explicit controls, without replacing the old interest with defaults.
  const old = run({ ...LEGACY_CONTROLS, mode: 'demo' });
  delete old.exposureContext;
  const legacy = decisionSummary(decisionOutput({ selection, result: old }));
  close(legacy.selected.mapped.expectedNetCashUsd, 7.6);
  assert.equal(legacy.exposureContext.selectionKind, 'custom_assumed_exposure');
  const costOnly = run({ ...LEGACY_CONTROLS, mode: 'demo', entryPremiumUsd: 30000 });
  delete costOnly.exposureContext;
  close(decisionSummary(decisionOutput({ selection, result: costOnly })).selected.mapped.expectedNetCashUsd, -29342.4);
});
