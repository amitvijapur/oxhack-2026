import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { valueOption, evaluateOpportunity, forecastGoldForMaterials, GOLD_FORECAST_METHOD, VERSION } from '../index.mjs';
import { DEFAULT_CONTROLS, createDemoCandidate, runWorkbench } from '../workbench.mjs';

const candidate = createDemoCandidate(DEFAULT_CONTROLS);
const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const close = (actual, expected, epsilon = 1e-8) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);
const workbench = (controls = {}) => runWorkbench({ features, controls: { mode: 'demo', scenarioId: 'synthetic', syntheticSignal: .203, ...controls } });

test('v2 makes one assumed gold response before material value and the option floor', () => {
  assert.equal(VERSION, 'tok-option-demo-v2');
  const before = structuredClone(candidate);
  const result = valueOption(candidate, 90, { signal: .203 });
  const gold = result.goldForecast;
  close(gold.baselinePriceUsdPerOz, 2000);
  close(gold.scenarioPriceUsdPerOz, 2028.42);
  close(gold.priceDeltaUsdPerOz, 28.42);
  close(gold.adjustment, .01421);
  assert.equal(gold.methodVersion, GOLD_FORECAST_METHOD);
  assert.equal(gold.transferTarget, 'gold_price');
  assert.equal(gold.provenance, 'assumed');
  assert.equal(gold.calibrationStatus, 'uncalibrated');
  assert.match(gold.timingAssumption, /once at every valuation and sale date/);
  close(result.baselineRawMaterialValueUsd, 1000000);
  close(result.rawMaterialValueUsd, 1014210);
  close(result.baselineSuccessValueUsd, 10000);
  close(result.successValueUsd, 10142.1);
  close(result.baselineAssignmentValueUsd, 1500);
  close(result.assignmentValueUsd, 1535.525);
  assert.notEqual(result.assignmentValueUsd, 1500 * (1 + .01421));
  close(result.materialTrace[0].baselineProjectedPrice, 2000);
  close(result.materialTrace[0].projectedPrice, 2028.42);
  assert.deepEqual(candidate, before);
  assert.deepEqual(forecastGoldForMaterials(result.materialTrace, 90, { signal: .203 }), gold);
});

test('positive and negative gold boundaries retain their signs without limiting option return to seven percent', () => {
  const positive = valueOption(candidate, 90, { signal: 1 });
  const negative = valueOption(candidate, 90, { signal: -1 });
  close(positive.goldForecast.scenarioPriceUsdPerOz, 2140);
  close(negative.goldForecast.scenarioPriceUsdPerOz, 1860);
  close(positive.assignmentValueUsd, 1675);
  close(negative.assignmentValueUsd, 1325);
  assert.ok(positive.assignmentValueUsd / positive.baselineAssignmentValueUsd - 1 > .07);
});

test('the nonlinear assignment floor is recomputed rather than multiplying a zero baseline', () => {
  const atStrike = { ...candidate, remainingBuyerConsiderationUsd: 10000 };
  close(valueOption(atStrike, 90).assignmentValueUsd, 0);
  close(valueOption(atStrike, 90, { signal: 1 }).assignmentValueUsd, 175);
  close(valueOption(atStrike, 90, { signal: -1 }).assignmentValueUsd, 0);
  const belowStrike = { ...candidate, remainingBuyerConsiderationUsd: 10200 };
  close(valueOption(belowStrike, 90, { signal: 1 }).assignmentValueUsd, 125);
  close(valueOption(belowStrike, 90, { signal: 1 }).baselineAssignmentValueUsd, 0);
});

test('only Au receives the response in a mixed-material candidate', () => {
  const copper = { material: 'Cu', quantity: 100, unit: 'tonne', price: 10000, priceUnit: 'USD/tonne', currency: 'USD', annualGrowthRate: 0, sourceId: 'hypothetical-mixed-material', provenance: 'assumed', derivedFromPpm: false };
  const mixed = { ...candidate, materials: [...candidate.materials, copper] };
  const result = valueOption(mixed, 90, { signal: 1 });
  close(result.materialTrace[0].projectedPrice, 2140);
  close(result.materialTrace[1].projectedPrice, 10000);
  close(result.materialTrace[1].baselineProjectedPrice, 10000);
  close(result.rawMaterialValueUsd, 2070000);
  close(result.baselineAssignmentValueUsd, 4000);
  close(result.assignmentValueUsd, 4175);
  const noGold = valueOption({ ...candidate, materials: [copper] }, 90, { signal: 1 });
  close(noGold.assignmentValueUsd, 1500);
  assert.equal(noGold.goldForecast.status, 'not_applicable');
  assert.equal(noGold.goldForecast.baselinePriceUsdPerOz, null);
  assert.equal(noGold.goldForecast.scenarioPriceUsdPerOz, null);
  close(noGold.materialTrace[0].projectedPrice, 10000);
});

test('accepted Au mass units normalize a displayed quote while each supplied quantity keeps its unit', () => {
  const kg = { ...candidate.materials[0], quantity: 1, unit: 'kg', priceUnit: 'USD/kg', price: 2000 * 1000 / 31.1034768 };
  const tonne = { ...candidate.materials[0], quantity: .001, unit: 'tonne', priceUnit: 'USD/tonne', price: 2000 * 1000000 / 31.1034768 };
  const result = valueOption({ ...candidate, materials: [candidate.materials[0], kg, tonne] }, 90, { signal: 1 });
  close(result.goldForecast.baselinePriceUsdPerOz, 2000);
  close(result.goldForecast.scenarioPriceUsdPerOz, 2140);
  close(result.materialTrace[1].projectedPrice, kg.price * 1.07);
  close(result.materialTrace[2].projectedPrice, tonne.price * 1.07);
  const twoQuotes = valueOption({ ...candidate, materials: [candidate.materials[0], { ...candidate.materials[0], price: 3000 }] }, 90, { signal: 1 });
  close(twoQuotes.goldForecast.baselinePriceUsdPerOz, 2500);
  close(twoQuotes.goldForecast.scenarioPriceUsdPerOz, 2675);
  assert.equal(twoQuotes.goldForecast.priceBasis, 'quantity_weighted_au_oz');
});

test('zero quantity does not invent resources or hide its separate quote display basis', () => {
  const zero = valueOption({ ...candidate, materials: [{ ...candidate.materials[0], quantity: 0 }] }, 90, { signal: 1 });
  close(zero.rawMaterialValueUsd, 0);
  close(zero.assignmentValueUsd, 0);
  close(zero.goldForecast.baselinePriceUsdPerOz, 2000);
  close(zero.goldForecast.scenarioPriceUsdPerOz, 2140);
  assert.equal(zero.goldForecast.priceBasis, 'equal_quote_mean_zero_quantity');
});

test('baseline growth and a retained relative response apply once at every supported sale date', () => {
  const c = { ...candidate, materials: [{ ...candidate.materials[0], annualGrowthRate: .1 }] };
  const result = evaluateOpportunity({ candidate: c, evidenceGate: 'PASS', horizonDays: 180, signal: .203, exposure: .5, retention: .5, hazardPer30Days: .2 });
  const adjustment = .07 * .203 * .5 * .5;
  assert.equal(result.intervals.length, 6);
  for (const interval of result.intervals) {
    const baselinePrice = 2000 * 1.1 ** (interval.day / 365);
    const scenarioPrice = baselinePrice * (1 + adjustment);
    close(interval.goldForecast.baselinePriceUsdPerOz, baselinePrice);
    close(interval.goldForecast.scenarioPriceUsdPerOz, scenarioPrice);
    close(interval.goldForecast.adjustment, adjustment);
    close(interval.assignmentValueUsd, .25 * Math.max(.5 * .02 * 500 * scenarioPrice - 4000, 0));
    assert.equal(interval.goldForecast.day, interval.day);
  }
  close(result.goldForecast.scenarioPriceUsdPerOz, result.intervals.at(-1).goldForecast.scenarioPriceUsdPerOz);
  close(result.saleProbability, .737856);
  close(result.amountAtRiskUsd, 700);
  close(result.expectedNetCashUsd, result.intervals.reduce((sum, row) => sum + row.weight * row.netSaleProceedsUsd, 0) - 700);
});

test('workbench horizon forecasts and cash use the same upstream price channel', () => {
  const result = workbench();
  close(result.mapped.expectedNetCashUsd, 24.9362);
  close(result.delta.expectedNetCashUsd, 17.3362);
  assert.equal(result.signal.transferTarget, 'gold_price');
  assert.equal(result.signal.transfer.methodVersion, GOLD_FORECAST_METHOD);
  close(result.signal.adjustment, result.mapped.goldForecast.adjustment);
  for (const row of result.horizons) {
    assert.equal(row.baseline.goldForecast.day, row.days);
    assert.equal(row.mapped.goldForecast.day, row.days);
    close(row.baseline.goldForecast.scenarioPriceUsdPerOz, 2000);
    close(row.mapped.goldForecast.scenarioPriceUsdPerOz, 2028.42);
    close(row.mapped.assignmentValueUsd, 1535.525);
  }
});

test('zero signal, cap, exposure or retention restores the baseline without changing liquidity or geology', () => {
  for (const controls of [{ syntheticSignal: 0 }, { goldResponseCap: 0 }, { eventExposure: 0 }, { retention: 0 }]) {
    const result = workbench(controls);
    close(result.mapped.goldForecast.scenarioPriceUsdPerOz, 2000);
    close(result.mapped.goldForecast.priceDeltaUsdPerOz, 0);
    close(result.mapped.assignmentValueUsd, 1500);
    close(result.mapped.expectedNetCashUsd, 7.6);
    close(result.mapped.saleProbability, .488);
    close(result.controls.pGeo, .25);
  }
});

test('invalid gold inputs and non-finite material products cannot yield scenario prices or money', () => {
  for (const options of [{ signal: null }, { signal: Infinity }, { signal: 1.1 }, { cap: null }, { cap: .071 }, { exposure: -1 }, { retention: NaN }]) {
    const result = valueOption(candidate, 90, options);
    assert.equal(result.assignmentValueUsd, null);
    assert.equal(result.goldForecast.status, 'INSUFFICIENT_DATA');
    assert.equal(result.goldForecast.scenarioPriceUsdPerOz, null);
  }
  for (const goldResponseCap of [null, '', Infinity, NaN, -.01, .071]) {
    const result = workbench({ goldResponseCap });
    assert.equal(result.mapped, null);
    assert.ok(result.validationErrors.length > 0);
  }
  const overflow = valueOption({ ...candidate, materials: [{ ...candidate.materials[0], quantity: 1e308, price: 1e308 }] }, 90, { signal: 1 });
  assert.equal(overflow.assignmentValueUsd, null);
  assert.equal(overflow.goldForecast.status, 'INSUFFICIENT_DATA');
  assert.equal(forecastGoldForMaterials(null, 90).scenarioPriceUsdPerOz, null);
});

test('actual replay retains its source failures and missing scenarios cannot invent a gold forecast', () => {
  const approval = workbench({ swarmPolicy: 'illustrative_contrast', scenarioId: 'mine_approval' });
  close(approval.mapped.goldForecast.scenarioPriceUsdPerOz, 1996.474903767377);
  close(approval.mapped.expectedNetCashUsd, 5.449691298100333);
  assert.equal(approval.sourceAudit.swarm.status, 'fail');
  assert.equal(approval.signal.researchReadiness.status, 'fail');
  assert.equal(approval.signal.provenance, 'simulated');
  assert.equal(approval.mapped.goldForecast.provenance, 'assumed');
  assert.equal(approval.signal.knowledgeCutoff, null);
  for (const controls of [{ swarmPolicy: 'strict', scenarioId: 'mine_approval' }, { swarmPolicy: 'illustrative_contrast', scenarioId: 'proposed_tax' }, { mode: 'real' }, { mode: 'pending' }]) {
    assert.equal(workbench(controls).mapped, null);
  }
  assert.equal(workbench({ area: 'B' }).mapped.entryAction, 'SKIP');
});
