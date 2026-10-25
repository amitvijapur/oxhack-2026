import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { runWorkbench } from '../../model/tok-option/workbench.mjs';
import { geologicalScreenLabel, runDecideFinancial } from '../src/decide-financial.mjs';

const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const componentUrl = new URL('../src/components/explorer/tabs/FinancialDecision.jsx', import.meta.url);
function loadJsx(url) {
  const require = createRequire(url);
  const compiled = { exports: {} };
  const code = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const load = (name) => name.endsWith('.css') ? {} : name.endsWith('.jsx') ? loadJsx(new URL(name, url)) : require(name);
  new Function('require', 'module', 'exports', code)(load, compiled, compiled.exports);
  return compiled.exports;
}
const { FinancialDecisionResult, default: FinancialDecision } = loadJsx(componentUrl);
const render = (view, area = 'A') => renderToStaticMarkup(React.createElement(FinancialDecisionResult, { view, area }));

test('Decide separates geological outcomes from the canonical financial action', () => {
  assert.equal(geologicalScreenLabel('PASS'), 'Screen passed');
  assert.equal(geologicalScreenLabel('FAIL'), 'Screen failed');
  assert.equal(geologicalScreenLabel('UNKNOWN'), 'Screen incomplete');
  const a = runDecideFinancial({ features });
  assert.equal(a.action, 'BUY_CANDIDATE');
  assert.equal(a.result.evidence.gate, 'PASS');
  assert.equal(a.controls.entryPremiumUsd, 30000);
  assert.ok(a.expectedReturn > 0);
  const b = runDecideFinancial({ features, area: 'B' });
  assert.equal(b.action, 'SKIP');
  close(b.expectedReturn, a.expectedReturn);
  const html = render(b, 'B');
  assert.ok(html.includes('Skip hypothetical contract'));
  assert.ok(html.includes('Positive hypothetical cash math cannot override that gate'));
  assert.ok(!html.includes('Demo buy candidate'));
});

test('90-day panel reproduces known expected cash, denominator, risks and break-even thresholds', () => {
  const view = runDecideFinancial({ features });
  close(view.expectedReturn, 3850.9846153846156 / 30050);
  close(view.baselineReturn, 3710.215384615396 / 30050);
  close(view.deltaReturn, 140.76923076921957 / 30050);
  close(view.medianReturn, -1);
  close(view.worstReturn, -1);
  close(view.noSaleReturn, -1);
  close(view.result.mapped.noSaleProbability, .512);
  close(view.result.cashDiagnostics.mapped.negativeCashProbability, .512);
  close(view.result.cashDiagnostics.mapped.breakEven.maximumEntryPremiumUsd, 33850.984615384616);
  close(view.result.cashDiagnostics.mapped.breakEven.premiumHeadroomUsd, 3850.9846153846156);
  assert.equal(view.result.cashDiagnostics.mapped.breakEven.hazardThresholdStatus, 'ready');
  close(view.targetResale.requiredAssignmentProceedsUsd, 77022.33606557379);
  assert.equal(view.targetResale.targetReturnRatio, .25);
  const html = render(view);
  assert.ok(html.includes('Break-even sale probability by day 90: 43.26%'));
  close(view.noSaleCashUsd, -30050);
  close(view.feeComparison.fixedFees.returnRatio, view.expectedReturn);
  close(view.feeComparison.proportionalFees.returnRatio, .015214285714285585);
  close(view.baselineFeeComparison.fixedFees.returnRatio, view.baselineReturn);
  close(view.baselineFeeComparison.proportionalFees.returnRatio, .0108571428571433);
  assert.equal(view.feeComparison.proportionalFees.riskGate, 'FAIL');
  assert.equal(view.feeComparison.proportionalFees.entryAction, 'SKIP');
  for (const text of ['12.82%', '12.35%', '+0.47 pp', '51.2%', '-100.00%', '$33,850.98', '$3,850.98', '$30,050.00', '$77,022.34', '$69,519.23', '$2,000.00/oz', 'not annualized', 'not necessarily a final realized loss', 'not a measured swarm result', '23,076.9', '$184,615.38', '1.09%', '1.52%', 'FAIL', 'not a predicted edge', '-$30,050.00 cash if unsold by day 90']) assert.ok(html.includes(text), text);
});

test('holding period changes the synthetic return and canonical entry decision', () => {
  const cases = [[30, -16156.153846153846 / 30050, 'SKIP', .8], [90, 3850.9846153846156 / 30050, 'BUY_CANDIDATE', .512], [180, 21208.288738461546 / 30050, 'BUY_CANDIDATE', .262144]];
  for (const [horizonDays, expected, action, noSale] of cases) {
    const view = runDecideFinancial({ features, horizonDays });
    close(view.expectedReturn, expected);
    close(view.feeComparison.fixedFees.returnRatio, expected);
    assert.equal(view.feeComparison.proportionalFees.riskGate, 'FAIL');
    close(view.result.mapped.noSaleProbability, noSale);
    assert.equal(view.action, action);
    assert.ok(render(view).includes(`Cash risk by day ${horizonDays}`));
  }
});

test('recorded cases retain their observed signs and the same explicit transfer assumptions', () => {
  const approval = runDecideFinancial({ features, scenarioId: 'mine_approval' });
  const blockage = runDecideFinancial({ features, scenarioId: 'mine_blocked' });
  close(approval.result.mapped.expectedNetCashUsd, 3703.126454828911);
  close(approval.result.mapped.assignmentValueUsd, 69216.24273530513);
  close(blockage.result.mapped.expectedNetCashUsd, 3718.8682810486644);
  assert.ok(approval.deltaReturn < 0);
  assert.ok(blockage.deltaReturn > 0);
  for (const view of [approval, blockage]) {
    assert.equal(view.controls.goldResponseCap, .01);
    assert.equal(view.controls.retention, .5);
    assert.equal(view.result.signal.provenance, 'simulated');
    assert.equal(view.result.signal.usagePolicy, 'illustrative_contrast');
    assert.equal(view.result.sourceAudit.swarm.status, 'fail');
    close(view.feeComparison.fixedFees.returnRatio, view.expectedReturn);
    assert.equal(view.feeComparison.proportionalFees.entryAction, 'SKIP');
    assert.ok(render(view).includes('illustrative contrast, not a measured causal effect'));
  }
});

test('unknown evidence never becomes a buy and missing scenarios never fall back to baseline', () => {
  const unknown = runDecideFinancial({ features: [] });
  assert.equal(unknown.action, null);
  assert.equal(unknown.result.evidence.gate, 'UNKNOWN');
  assert.ok(unknown.expectedReturn > 0);
  assert.ok(render(unknown).includes('No financial decision'));
  assert.ok(render(unknown).includes('incomplete geological evidence'));
  const missing = runDecideFinancial({ features, scenarioId: 'proposed_tax' });
  assert.equal(missing.action, null);
  assert.equal(missing.result.mapped, null);
  assert.equal(missing.expectedReturn, null);
  assert.equal(missing.deltaReturn, null);
  assert.equal(missing.medianReturn, null);
  assert.equal(missing.noSaleReturn, null);
  assert.equal(missing.noSaleCashUsd, null);
  assert.equal(missing.feeComparison.fixedFees, null);
  assert.equal(missing.feeComparison.proportionalFees, null);
  assert.ok(missing.baselineReturn > 0);
  const html = render(missing);
  assert.ok(html.includes('No financial decision'));
  assert.ok(html.includes('Not available'));
  assert.ok(!html.includes('Demo buy candidate'));
  assert.ok(!html.includes('-100.00%'));
});

test('default visible financial section exposes labeled controls and source assumptions', () => {
  const html = renderToStaticMarkup(React.createElement(FinancialDecision, { features, area: 'A' }));
  for (const text of ['Hypothetical economics', 'Financial decision and cash risk', 'Holding period', 'Financial scenario', '90 days', 'Small-response synthetic demo', 'Financial assumptions and signal source', 'same assumed rate']) assert.ok(html.includes(text), text);
});


test('explicit positive-cash test case still respects failed and unknown evidence gates', () => {
  // Positive synthetic cash cannot override failed or incomplete geological evidence.
  const controls = runDecideFinancial({ features }).controls;
  const a = runWorkbench({ features, controls });
  const b = runWorkbench({ features, controls: { ...controls, area: 'B' } });
  const unknown = runWorkbench({ features: [], controls });
  for (const result of [a, b, unknown]) assert.ok(result.mapped.expectedNetCashUsd > 0);
  assert.equal(a.mapped.entryAction, 'BUY_CANDIDATE');
  assert.equal(b.mapped.entryAction, 'SKIP');
  assert.equal(unknown.mapped.entryAction, null);
  close(runDecideFinancial({ features }).controls.quantity, 23076.923076923078);
});
