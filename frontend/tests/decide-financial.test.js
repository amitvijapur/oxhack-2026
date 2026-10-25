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
  assert.equal(a.action, 'SKIP');
  assert.equal(a.result.evidence.gate, 'PASS');
  assert.equal(a.controls.entryPremiumUsd, 30000);
  assert.ok(a.expectedReturn < 0);
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
  close(view.expectedReturn, -29339.35 / 30050);
  close(view.baselineReturn, -29342.4 / 30050);
  close(view.deltaReturn, 3.05 / 30050);
  close(view.medianReturn, -1);
  close(view.worstReturn, -1);
  close(view.noSaleReturn, -1);
  close(view.result.mapped.noSaleProbability, .512);
  close(view.result.cashDiagnostics.mapped.negativeCashProbability, 1);
  close(view.result.cashDiagnostics.mapped.breakEven.maximumEntryPremiumUsd, 660.65);
  close(view.result.cashDiagnostics.mapped.breakEven.premiumHeadroomUsd, -29339.35);
  assert.equal(view.result.cashDiagnostics.mapped.breakEven.hazardThresholdStatus, 'unattainable');
  close(view.targetResale.requiredAssignmentProceedsUsd, 77022.33606557379);
  assert.equal(view.targetResale.targetReturnRatio, .25);
  const html = render(view);
  assert.ok(html.includes('Break-even sale probability by day 90: Unattainable'));
  for (const text of ['-97.64%', '-97.65%', '+0.01 pp', '51.2%', '100.0%', '-100.00%', '$660.65', '-$29,339.35', 'Unattainable', '$30,050.00', '$77,022.34', '$1,506.25', '$2,000.00/oz', 'not annualized', 'not necessarily a final realized loss', 'not a measured swarm result']) assert.ok(html.includes(text), text);
});

test('holding period changes return but does not rescue the current whole-contract cash decision', () => {
  const cases = [[30, -29758.75 / 30050, 'SKIP', .8], [90, -29339.35 / 30050, 'SKIP', .512], [180, -28975.4972 / 30050, 'SKIP', .262144]];
  for (const [horizonDays, expected, action, noSale] of cases) {
    const view = runDecideFinancial({ features, horizonDays });
    close(view.expectedReturn, expected);
    close(view.result.mapped.noSaleProbability, noSale);
    assert.equal(view.action, action);
    assert.ok(render(view).includes(`Cash risk by day ${horizonDays}`));
  }
});

test('recorded cases retain their observed signs and the same explicit transfer assumptions', () => {
  const approval = runDecideFinancial({ features, scenarioId: 'mine_approval' });
  const blockage = runDecideFinancial({ features, scenarioId: 'mine_blocked' });
  assert.ok(approval.deltaReturn < 0);
  assert.ok(blockage.deltaReturn > 0);
  for (const view of [approval, blockage]) {
    assert.equal(view.controls.goldResponseCap, .01);
    assert.equal(view.controls.retention, .5);
    assert.equal(view.result.signal.provenance, 'simulated');
    assert.equal(view.result.signal.usagePolicy, 'illustrative_contrast');
    assert.equal(view.result.sourceAudit.swarm.status, 'fail');
    assert.ok(render(view).includes('illustrative contrast, not a measured causal effect'));
  }
});

test('unknown evidence never becomes a buy and missing scenarios never fall back to baseline', () => {
  const unknown = runDecideFinancial({ features: [] });
  assert.equal(unknown.action, 'SKIP');
  assert.equal(unknown.result.evidence.gate, 'UNKNOWN');
  assert.ok(unknown.expectedReturn < 0);
  assert.ok(render(unknown).includes('Skip hypothetical contract'));
  assert.ok(render(unknown).includes('incomplete geological evidence'));
  const missing = runDecideFinancial({ features, scenarioId: 'proposed_tax' });
  assert.equal(missing.action, null);
  assert.equal(missing.result.mapped, null);
  assert.equal(missing.expectedReturn, null);
  assert.equal(missing.deltaReturn, null);
  assert.equal(missing.medianReturn, null);
  assert.equal(missing.noSaleReturn, null);
  assert.ok(missing.baselineReturn < 0);
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
  // Test-only higher resource assumption. Website inputs and the historical premium stay unchanged.
  const controls = { ...runDecideFinancial({ features }).controls, quantity: 20000 };
  const a = runWorkbench({ features, controls });
  const b = runWorkbench({ features, controls: { ...controls, area: 'B' } });
  const unknown = runWorkbench({ features: [], controls });
  for (const result of [a, b, unknown]) assert.ok(result.mapped.expectedNetCashUsd > 0);
  assert.equal(a.mapped.entryAction, 'BUY_CANDIDATE');
  assert.equal(b.mapped.entryAction, 'SKIP');
  assert.equal(unknown.mapped.entryAction, null);
  assert.equal(runDecideFinancial({ features }).controls.quantity, 500);
});
