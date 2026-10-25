import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Exercise the actual TSX parser/view with the installed compiler and React.
// CSS modules affect layout only; no test renderer or browser dependency is needed.
const componentUrl = new URL('../src/components/explorer/tabs/EventStudy.tsx', import.meta.url);
const require = createRequire(componentUrl);
const source = await readFile(componentUrl, 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const compiledModule = { exports: {} };
const load = (name) => name.endsWith('.module.css') ? {} : require(name);
new Function('require', 'module', 'exports', compiled)(load, compiledModule, compiledModule.exports);
const { parseEventStudy, EventStudyResults } = compiledModule.exports;
const saved = JSON.parse(await readFile(new URL('../public/data/event-study.json', import.meta.url), 'utf8'));
const render = (data, days = 5) => renderToStaticMarkup(React.createElement(EventStudyResults, { study: parseEventStudy(data), days, onDaysChange() {} }));

test('the saved historical artifact renders both horizons with their exact holdout metrics', () => {
  const study = parseEventStudy(saved);
  for (const horizon of study.horizons) {
    const html = render(saved, horizon.days);
    assert.ok(html.includes(`${horizon.trainEventIds.length} events`));
    assert.ok(html.includes(`${horizon.testEventIds.length} events`));
    if (horizon.metrics) {
      for (const metric of Object.values(horizon.metrics)) {
        assert.ok(html.includes(`${metric.maePercentagePoints.toFixed(2)} pp`));
        assert.ok(html.includes(`${metric.directionHits.numerator}/${metric.directionHits.denominator}`));
      }
    }
    for (const event of horizon.events) assert.ok(html.includes(event.sourceUrl.replaceAll('&', '&amp;')));
  }
});

test('losses and a worse event forecast retain negative signs while missing observations stay unavailable', () => {
  const data = structuredClone(saved);
  const horizon = data.horizons[0];
  horizon.eventVersusGoldMaeReductionPercentagePoints = -3;
  horizon.events[0].observedReturns.stock = -.25;
  horizon.events[0].observedReturns.stockMinusGld = null;
  horizon.events[0].predictions.goldBaseline = null;
  horizon.events[0].predictions.eventModel = 0;
  const html = render(data);
  assert.ok(html.includes('-3.00 pp'));
  assert.ok(html.includes('(higher error)'));
  assert.ok(html.includes('-25.00%'));
  assert.ok(html.includes('Unavailable'));
  assert.ok(html.includes('0.00%'));
  assert.ok(html.includes('50 bps (0.50%)'));
});

test('insufficient samples suppress aggregate scores and preserve individual observations', () => {
  const data = structuredClone(saved);
  const horizon = data.horizons[0];
  horizon.status = 'insufficient_sample';
  horizon.metrics = null;
  horizon.eventVersusGoldMaeReductionPercentagePoints = null;
  horizon.scoreReasons = ['fewer_than_three_test_events'];
  const html = render(data);
  assert.ok(html.includes('Insufficient sample'));
  assert.ok(html.includes('fewer than three test events'));
  assert.ok(!html.includes('Event-model MAE improvement'));
  assert.ok(!html.includes('Direction matches, including flat'));
  assert.ok(html.includes(horizon.events[0].sourceUrl));
});

test('the parser rejects incompatible units, coerced directions and invalid directional counts', () => {
  const mutate = (change) => { const data = structuredClone(saved); change(data); assert.throws(() => parseEventStudy(data), /unsupported or incomplete/); };
  mutate((data) => { data.units.returns = 'percent'; });
  mutate((data) => { data.horizons[0].events[0].direction = null; });
  mutate((data) => { data.horizons[0].metrics.eventModel.directionHits.numerator = 999; });
  mutate((data) => { data.sources.seriesSources.NG = null; });
  mutate((data) => { data.horizons[0].events[0].observedReturns.stock = '0'; });
});
