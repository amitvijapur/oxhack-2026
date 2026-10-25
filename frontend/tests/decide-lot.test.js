import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const src = new URL('../src/', import.meta.url);
const cache = new Map();
function loadComponent(url) {
  const key = url.href;
  if (cache.has(key)) return cache.get(key).exports;
  const require = createRequire(url);
  const compiled = { exports: {} };
  cache.set(key, compiled);
  const load = (name) => {
    if (name.endsWith('.css')) return {};
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    let target = name.startsWith('@/') ? new URL(name.slice(2), src) : new URL(name, url);
    if (!existsSync(target)) {
      const base = target.href;
      for (const extension of ['.tsx', '.ts', '.jsx', '.js', '.mjs']) {
        const option = new URL(base + extension);
        if (existsSync(option)) { target = option; break; }
      }
    }
    return /\.(tsx?|jsx)$/.test(target.pathname) ? loadComponent(target) : require(fileURLToPath(target));
  };
  const output = ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', output)(load, compiled, compiled.exports);
  return compiled.exports;
}
const { DecideTab } = loadComponent(new URL('components/explorer/tabs/DecideTab.tsx', src));
const features = ['a', 'b'].flatMap(area => JSON.parse(readFileSync(new URL(`../public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
const plots = JSON.parse(readFileSync(new URL('../public/data/showcase/plots.json', import.meta.url)));
const geochem = JSON.parse(readFileSync(new URL('../public/data/showcase/geochem.json', import.meta.url)));
const render = (site) => renderToStaticMarkup(React.createElement(DecideTab, { features, plots, geochem, site, onSite() {}, plot: null, gold: { usd_per_oz: 9999, source: 'test spot', stale: false } }));

test('Decide keeps evidence eligibility distinct from whole-contract economic rejection', () => {
  const a = render('A');
  const b = render('B');
  for (const html of [a, b]) {
    for (const text of ['SKIP', 'hypothetical lot', '$30,000', '$50', '$30,050.00', '-97.65%', '-$29,342.40', '$1,500.00', '$2,000', '$9,999', 'Live spot is separate', 'Not a current quote', 'Detailed hypothetical model', 'event model did not beat baseline']) assert.ok(html.includes(text), text);
    assert.ok(!html.includes('BUY candidate'));
  }
  assert.ok(a.includes('Evidence passes'));
  assert.ok(a.includes('25 of 33'));
  assert.ok(b.includes('Evidence fails'));
  assert.ok(b.includes('16 of 34'));
  assert.ok(!a.includes('id="option-model"'), 'Detailed synthetic controls remain collapsed on entry');
});
