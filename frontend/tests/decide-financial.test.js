import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { geologicalScreenLabel, runDecideFinancial } from '../src/decide-financial.mjs';

const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const componentUrl = new URL('../src/components/explorer/tabs/FinancialDecision.jsx', import.meta.url);
const compiled = { exports: {} };
const code = ts.transpileModule(readFileSync(componentUrl, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
new Function('require', 'module', 'exports', code)(createRequire(componentUrl), compiled, compiled.exports);
const { FinancialDecisionResult, default: FinancialDecision } = compiled.exports;
const render = (view, area = 'A') => renderToStaticMarkup(React.createElement(FinancialDecisionResult, { view, area }));

test('Decide separates geological outcomes from the canonical financial action', () => {
  assert.equal(geologicalScreenLabel('PASS'), 'Screen passed');
  assert.equal(geologicalScreenLabel('FAIL'), 'Screen failed');
  assert.equal(geologicalScreenLabel('UNKNOWN'), 'Screen incomplete');
  const a = runDecideFinancial({ features });
  assert.equal(a.action, 'BUY_CANDIDATE');
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
  close(view.expectedReturn, 10.65 / 700);
  close(view.baselineReturn, 7.6 / 700);
  close(view.deltaReturn, 3.05 / 700);
  close(view.medianReturn, -1);
  close(view.worstReturn, -1);
  close(view.noSaleReturn, -1);
  close(view.result.mapped.noSaleProbability, .512);
  close(view.result.cashDiagnostics.mapped.negativeCashProbability, .512);
  close(view.result.cashDiagnostics.mapped.breakEven.maximumEntryPremiumUsd, 660.65);
  close(view.result.cashDiagnostics.mapped.breakEven.premiumHeadroomUsd, 10.65);
  const html = render(view);
  for (const text of ['1.52%', '1.09%', '+0.44 pp', '51.2%', '-100.00%', '$660.65', '$10.65', '19.62%', '$700.00', '$2,000.00/oz', 'not annualized', 'not necessarily a final realized loss', 'not a measured swarm result']) assert.ok(html.includes(text), text);
});

test('holding period changes both return and canonical entry decision', () => {
  const cases = [[30, -408.75 / 700, 'SKIP', .8], [90, 10.65 / 700, 'BUY_CANDIDATE', .512], [180, 374.5028 / 700, 'BUY_CANDIDATE', .262144]];
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

test('unknown evidence with positive cash never becomes a buy, and missing scenarios never fall back to baseline', () => {
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
