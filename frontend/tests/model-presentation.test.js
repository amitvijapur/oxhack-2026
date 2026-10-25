import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_CONTROLS, runWorkbench } from '../../model/tok-option/workbench.mjs';
import { capitalRatio, cashReturn, returnDifference, relativeChange, createConservativeDemo, isConservativeDemo } from '../src/model-presentation.mjs';

const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const run = (controls = {}) => runWorkbench({ features, controls: { ...createConservativeDemo(), ...controls } });
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

function loadJsx(url) {
  const require = createRequire(url);
  const output = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const compiled = { exports: {} };
  const load = (name) => name.endsWith('.css') ? {} : name.endsWith('.jsx') ? loadJsx(new URL(name, url)) : require(name);
  new Function('require', 'module', 'exports', output)(load, compiled, compiled.exports);
  return compiled.exports;
}
const { default: ModelWorkbench } = loadJsx(new URL('../src/ModelWorkbench.jsx', import.meta.url));
const { CashDiagnostics } = loadJsx(new URL('../src/ModelDiagnostics.jsx', import.meta.url));

test('explicit legacy low-cost fixture retains its exact arithmetic', () => {
  const r = run({ entryPremiumUsd: 650, quantity: 500, remainingBuyerConsiderationUsd: 4000 });
  close(r.mapped.goldForecast.adjustment, .0025);
  close(r.mapped.expectedNetCashUsd, 10.65);
  close(r.mapped.amountAtRiskUsd, 700);
  close(cashReturn(r.baseline), 7.6 / 700);
  close(cashReturn(r.mapped), 10.65 / 700);
  close(returnDifference(r.baseline, r.mapped), 3.05 / 700);
  close(relativeChange(r.mapped.assignmentValueUsd, r.baseline.assignmentValueUsd), 6.25 / 1500);
  assert.equal(r.signal.provenance, 'synthetic_sensitivity');
  assert.equal(r.sourceAudit.swarm.status, 'fail');
  assert.equal(DEFAULT_CONTROLS.scenarioId, 'baseline');
  assert.equal(DEFAULT_CONTROLS.goldResponseCap, .07);
});

test('return ratios reject absent, zero, invalid or overflowing denominators and preserve genuine zero', () => {
  for (const risk of [null, undefined, 0, -1, NaN, Infinity, '700']) assert.equal(capitalRatio(7, risk), null);
  for (const value of [null, undefined, NaN, Infinity, '7']) assert.equal(capitalRatio(value, 700), null);
  assert.equal(capitalRatio(Number.MAX_VALUE, Number.MIN_VALUE), null);
  assert.equal(capitalRatio(0, 700), 0);
  assert.equal(cashReturn(null), null);
  assert.equal(relativeChange(10, 0), null);
  assert.equal(returnDifference(null, run().mapped), null);
  const zero = run({ entryPremiumUsd: 0, entryFeeUsd: 0, unavoidableAdditionalObligationsUsd: 0 });
  assert.equal(cashReturn(zero.mapped), null);
});

test('all upfront obligations enter the denominator and negative returns are not clipped', () => {
  const r = run({ entryPremiumUsd: 800, unavoidableAdditionalObligationsUsd: 100, quantity: 500, remainingBuyerConsiderationUsd: 4000 });
  close(r.mapped.amountAtRiskUsd, 950);
  close(cashReturn(r.mapped), -239.35 / 950);
  assert.ok(cashReturn(r.mapped) < 0);
  close(capitalRatio(r.cashDiagnostics.mapped.worstCashUsd, r.mapped.amountAtRiskUsd), -1);
  assert.equal(capitalRatio(r.portfolio.totalExpectedNetCashUsd, r.portfolio.totalRiskUsd), null);
});

test('each horizon uses its own evaluated capital and does not annualize', () => {
  const r = run();
  const expected = [-16156.153846153846 / 30050, 3850.9846153846156 / 30050, 21208.288738461546 / 30050];
  r.horizons.forEach((row, i) => close(cashReturn(row.mapped), expected[i]));
  close(returnDifference({ expectedNetCashUsd: 10, amountAtRiskUsd: 100 }, { expectedNetCashUsd: 30, amountAtRiskUsd: 200 }), .05);
  close(r.mapped.noSaleProbability, .512);
  close(capitalRatio(r.cashDiagnostics.mapped.medianCashUsd, r.mapped.amountAtRiskUsd), -1);
});

test('recorded approval keeps its negative sign and missing scenarios remain unavailable', () => {
  const actual = run({ scenarioId: 'mine_approval', swarmPolicy: 'illustrative_contrast', retention: 1 });
  assert.ok(actual.signal.value < 0);
  assert.ok(returnDifference(actual.baseline, actual.mapped) < 0);
  assert.equal(actual.signal.provenance, 'simulated');
  assert.equal(actual.signal.usagePolicy, 'illustrative_contrast');
  const missing = run({ scenarioId: 'proposed_tax', swarmPolicy: 'illustrative_contrast' });
  assert.equal(missing.mapped, null);
  assert.equal(cashReturn(missing.mapped), null);
});

test('fresh preset states have isolated weights and exact badges disappear after edits', () => {
  const original = createConservativeDemo();
  const reset = createConservativeDemo();
  assert.ok(isConservativeDemo(original));
  for (const [key, value] of [['entryPremiumUsd', 800], ['retention', 1], ['scenarioId', 'mine_approval'], ['horizonDays', 30]]) assert.ok(!isConservativeDemo({ ...original, [key]: value }));
  original.weights.industry = 0;
  assert.ok(!isConservativeDemo(original));
  assert.ok(isConservativeDemo(reset));
  assert.notEqual(reset.weights.industry, 0);
});

test('actual workbench renders percentage headlines, synthetic attribution and explicit downside', () => {
  const html = renderToStaticMarkup(React.createElement(ModelWorkbench, { features }));
  for (const text of ['Small-response synthetic demo', '12.82%', '12.35%', '+0.47 pp', '+0.25%', '51.2%', '−100%', 'premium + entry fee + unavoidable obligations', 'No trading edge is established', 'not verified fair pricing']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('Gold price assumptions in USD/oz'));
  assert.ok(html.includes('value="23076.923076923078"'), 'Quantity control keeps full profile precision');
  assert.ok(html.includes('value="184615.38461538462"'), 'Buyer consideration control keeps full profile precision');
  assert.ok(!html.includes('Gold price change, USD/oz'));
  assert.ok(html.includes('Expected option return by holding period'));
  for (const text of ['$30,000', '$50', '$30,050', 'whole contract', 'not a current Tok quote', '$1,502,500', '$150,250', '25% expected return', 'target hurdle, not a forecast']) assert.ok(html.includes(text), text);
});

test('cash diagnostics render median and worst as percentages while a zero denominator remains unavailable', () => {
  const r = run();
  const render = (evaluations) => renderToStaticMarkup(React.createElement(CashDiagnostics, { diagnostics: r.cashDiagnostics, controls: r.controls, evaluations }));
  const html = render({ baseline: r.baseline, mapped: r.mapped });
  assert.ok(html.includes('Median cash return on upfront capital'));
  assert.ok(html.includes('-100.00%'));
  assert.ok(html.includes('not necessarily a realized investment loss'));
  assert.ok(html.includes('$77,022.34'), 'Canonical 25% assignment hurdle is shown');
  assert.ok(html.includes('$69,519.23'), 'Actual synthetic assignment stays separate');
  const empty = render({ baseline: { amountAtRiskUsd: 0 }, mapped: { amountAtRiskUsd: 0 } });
  assert.ok(empty.includes('Not available'));
  assert.ok(!empty.includes('cash return -100.00%'));
});


test('active preset uses a frozen synthetic larger exposure and a conditional demo decision', () => {
  const r = run();
  assert.equal(DEFAULT_CONTROLS.entryPremiumUsd, 30000);
  assert.equal(r.mapped.amountAtRiskUsd, 30050);
  assert.equal(r.mapped.entryAction, 'BUY_CANDIDATE');
  close(r.mapped.assignmentValueUsd, 69519.23076923077);
  close(r.baseline.assignmentValueUsd, 69230.76923076925);
  close(r.mapped.expectedNetCashUsd, 3850.9846153846156);
  close(cashReturn(r.mapped), 3850.9846153846156 / 30050);
  close(r.controls.quantity, 23076.923076923078);
  assert.equal(r.portfolio.selectedIds.length, 1);
});


test('Site B retains the exact synthetic preset badge on initial and reset assumptions', () => {
  const initial = { ...createConservativeDemo(), area: 'B' };
  assert.ok(isConservativeDemo(initial));
  assert.ok(!isConservativeDemo({ ...initial, entryPremiumUsd: 31000 }));
  const reset = { ...createConservativeDemo(), area: 'B' };
  assert.ok(isConservativeDemo(reset));
  for (const area of ['C', '', null, undefined]) assert.ok(!isConservativeDemo({ ...reset, area }));
  const html = renderToStaticMarkup(React.createElement(ModelWorkbench, { features, initialArea: 'B' }));
  assert.ok(html.includes('Small-response synthetic demo'));
  assert.ok(!html.includes('Custom synthetic sensitivity'));
  assert.match(html, /aria-pressed="true"[^>]*>Use conservative synthetic demo/);
  assert.match(html, /<option value="B" selected="">/);
});


test('editing the premium changes cash and eligibility without rescaling synthetic exposure', () => {
  const before = run();
  const after = run({ entryPremiumUsd: 35000 });
  assert.equal(after.controls.quantity, before.controls.quantity);
  assert.equal(after.controls.remainingBuyerConsiderationUsd, before.controls.remainingBuyerConsiderationUsd);
  close(after.mapped.assignmentValueUsd, before.mapped.assignmentValueUsd);
  close(after.mapped.goldForecast.scenarioPriceUsdPerOz, before.mapped.goldForecast.scenarioPriceUsdPerOz);
  close(after.mapped.expectedNetCashUsd, before.mapped.expectedNetCashUsd - 5000);
  assert.equal(after.mapped.entryAction, 'SKIP');
});
