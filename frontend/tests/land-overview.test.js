import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { visiblePlot, nextVisiblePlot } from '../src/land-overview.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`../public/data/showcase/${name}.json`, import.meta.url)));
const plots = fixture('plots');
const geochem = fixture('geochem');
const market = fixture('market');
function load(relative, overrides = {}) {
  const url = new URL(relative, import.meta.url);
  const loaded = { exports: {} };
  const localRequire = createRequire(url);
  const compiled = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', compiled)((name) => overrides[name] ?? localRequire(name), loaded, loaded.exports);
  return loaded.exports;
}
const showcase = load('../src/lib/showcase.ts');
const overrides = { '@/lib/showcase': showcase };
const { LandTab, orderPlots } = load('../src/components/explorer/tabs/LandTab.tsx', overrides);
const { PlotSheet } = load('../src/components/explorer/PlotSheet.tsx', overrides);
const noop = () => {};
const render = (rows, selected = rows[0], filter = 'all') => renderToStaticMarkup(React.createElement(LandTab, {
  plots, geochem, rows, selected, filter, sort: 'gold', hoverId: null,
  onSort: noop, onFilter: noop, onHover: noop, onPick: noop,
}, selected ? React.createElement(PlotSheet, { plot: selected, index: rows.indexOf(selected), total: rows.length, geochem, market, onPrev: noop, onNext: noop, onZoom: noop, onBelow: noop, onDecide: noop }) : null));

test('all 57 unique plot identities remain in the overview after selection', () => {
  const original = plots.plots.map((p) => p.id);
  const rows = orderPlots(plots.plots, geochem, 'gold');
  assert.equal(rows[0].label, 'B-19');
  assert.equal(rows[1].label, 'B-17');
  assert.deepEqual(plots.plots.map((p) => p.id), original, 'sorting must not mutate the source order');
  const html = render(rows, rows[1]);
  assert.equal((html.match(/class="plot-tile"/g) ?? []).length, 57);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  const cleared = render(rows, null);
  assert.equal((cleared.match(/aria-pressed="true"/g) ?? []).length, 0);
  assert.equal((cleared.match(/class="plot-tile"/g) ?? []).length, 57);
  for (const label of ['B-19: &gt;1 ppm', 'Plot B-17', 'Held mining claim', 'Gold in sediment', 'To Tok', 'Test this plot in Decide', 'View on map', 'DNR record', 'not option resale evidence']) assert.ok(html.includes(label), label);
});

test('filter and both directions use the same visible order, including wrap and no selection', () => {
  const rows = orderPlots(plots.plots, geochem, 'gold', 'held');
  assert.ok(rows.length > 0 && rows.length < 57);
  assert.ok(rows.every((p) => showcase.plotStatus(p) === 'held'));
  assert.equal(nextVisiblePlot(rows, null, -1), rows.at(-1));
  assert.equal(nextVisiblePlot(rows, null, 1), rows[0]);
  assert.equal(nextVisiblePlot(rows, `plot:${rows[0].id}`, -1), rows.at(-1));
  assert.equal(nextVisiblePlot(rows, `plot:${rows.at(-1).id}`, 1), rows[0]);
  const excluded = plots.plots.find((p) => showcase.plotStatus(p) !== 'held');
  assert.equal(visiblePlot(rows, `plot:${excluded.id}`), rows[0]);
  assert.equal(visiblePlot(rows, `plot:${rows[1].id}`), rows[1]);
});

test('distance sort, empty filter recovery and a one-plot set are explicit', () => {
  const nearby = orderPlots(plots.plots, geochem, 'tok');
  assert.ok(nearby.every((p, i) => i === 0 || p.km_to_tok >= nearby[i - 1].km_to_tok));
  const empty = orderPlots(plots.plots.filter((p) => p.kind === 'open'), geochem, 'gold', 'held');
  assert.deepEqual(empty, []);
  assert.equal(visiblePlot(empty, null), null);
  assert.equal(nextVisiblePlot(empty, null, 1), null);
  const html = render(empty, null, 'held');
  assert.ok(html.includes('No held claims in this set.'));
  assert.ok(html.includes('Show all sampled areas'));
  const one = [nearby[0]];
  assert.equal(nextVisiblePlot(one, `plot:${one[0].id}`, -1), one[0]);
  assert.equal((render(one).match(/disabled=""/g) ?? []).length, 2);
});

test('unmatched sample context never implies available rights or a legal parcel', () => {
  const rows = orderPlots(plots.plots, geochem, 'gold');
  const unmatched = rows.find((p) => p.kind === 'open');
  const html = render(rows, unmatched);
  assert.ok(html.includes('Illustrative square'));
  assert.ok(html.includes('not a legal parcel or evidence of available mineral rights'));
  assert.ok(html.includes('not recoverable ounces or a land valuation'));
  assert.ok(!html.includes('DNR record'));
});
