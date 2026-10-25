import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assetPath, boundsFor, formatAssay, formatNumber, getVisibleFeatures, loadEvidence, validateEvidence } from '../src/evidence.js';

const readFixture = async (path) => JSON.parse(await readFile(new URL(`../public/${path}`, import.meta.url), 'utf8'));
const config = await readFixture('data/gold-frontend-data.json');
const collections = {
  A: await readFixture('data/tok-gold/site-a/samples.geojson'),
  B: await readFixture('data/tok-gold/site-b/samples.geojson'),
};
const features = [...collections.A.features, ...collections.B.features];
const qualified = features.find((feature) => feature.properties.sample_id === '16MBW012');

test('the handoff retains all 67 samples, with distinct A33 and B34 identities', () => {
  assert.equal(validateEvidence(config, collections), true);
  assert.equal(getVisibleFeatures(features).length, 67);
  assert.equal(getVisibleFeatures(features, 'A').length, 33);
  assert.equal(getVisibleFeatures(features, 'B').length, 34);
  assert.equal(new Set(features.map((feature) => feature.id)).size, 67);
});

test('a qualified primary remains >1 ppm while its separate retest remains 1.1 ppm', () => {
  assert.deepEqual(qualified.geometry.coordinates, [-143.388173, 63.163121]);
  assert.equal(formatAssay(qualified.properties, 'gold_primary'), '>1 ppm');
  assert.equal(formatAssay(qualified.properties, 'gold_retest'), '1.1 ppm');
  assert.equal(qualified.properties.gold_primary_value_ppm, null);
  assert.equal(qualified.properties.gold_primary_raw, '-2');
});

test('not-analyzed and missing results never become measured zeros', () => {
  const properties = collections.A.features[0].properties;
  assert.equal(properties.gold_retest_raw, '');
  assert.equal(formatAssay(properties, 'gold_retest'), 'Not analyzed');
  assert.equal(formatAssay({ gold_primary_status: 'quantified', gold_primary_unit: 'ppm', gold_primary_value_ppm: null }, 'gold_primary'), 'Not available');
  assert.equal(formatNumber(null), 'Not available');
  assert.equal(formatNumber(''), 'Not available');
  assert.equal(formatNumber(NaN), 'Not available');
  assert.equal(formatNumber(0), '0');
  assert.notEqual(formatNumber(0.00000001), '0');
});

test('below-detection values display the bound and never use a retest fallback', () => {
  const properties = { ...qualified.properties, gold_primary_status: 'below_detection', gold_primary_bound_ppm: 0.001 };
  assert.equal(formatAssay(properties, 'gold_primary'), '<0.001 ppm');
  assert.equal(formatAssay(properties, 'gold_retest'), '1.1 ppm');
  assert.equal(formatAssay({ ...properties, gold_primary_bound_ppm: null }, 'gold_primary'), 'Not available');
});

test('bounds use southwest/northeast longitude-latitude order', () => {
  assert.deepEqual(boundsFor(config), [[-144.019833, 63.027626], [-143.096187, 63.245385]]);
  assert.deepEqual(boundsFor(config, 'A'), [[-144.019833, 63.027626], [-143.800271, 63.245385]]);
  assert.throws(() => boundsFor(config, 'C'), /Unknown comparison area/);
});

test('browser asset paths are explicit and support a deployment subpath', () => {
  assert.equal(assetPath('research/gold-frontend-data.json'), '/data/gold-frontend-data.json');
  assert.equal(assetPath(config.areas[1].geojson_path, '/demo/'), '/demo/data/tok-gold/site-b/samples.geojson');
  for (const path of ['../../secret', 'https://example.com/data.json', '/research/gold-frontend-data.json']) {
    assert.throws(() => assetPath(path), /Unsupported evidence asset/);
  }
  for (const base of ['//example.com/', '/a/../', '/%2e%2e/', 'https://example.com/']) {
    assert.throws(() => assetPath('research/gold-frontend-data.json', base), /absolute app path/);
  }
});

test('reversed, string or out-of-area coordinates are rejected', () => {
  for (const coordinates of [[63.245059, -143.800913], ['-143.800913', 63.245059], [-142, 63.245059]]) {
    const modified = structuredClone(collections);
    modified.A.features[0].geometry.coordinates = coordinates;
    assert.throws(() => validateEvidence(config, modified), /longitude\/latitude/);
  }
});

test('identity, area, assay qualifications and summary mismatches cannot silently pass', () => {
  const changes = [
    (data) => { data.A.features[1].id = data.A.features[0].id; },
    (data) => { data.A.features[0].properties.area = 'B'; },
    (data) => { data.B.features.find((feature) => feature.properties.sample_id === '16MBW012').properties.gold_primary_value_ppm = 1.1; },
    (data) => { data.A.features.pop(); },
  ];
  for (const change of changes) {
    const modified = structuredClone(collections);
    change(modified);
    assert.throws(() => validateEvidence(config, modified), /Invalid evidence/);
  }
  const wrongSummary = structuredClone(config);
  wrongSummary.areas[1].measurements.gold_primary.quantified_only.denominator = 34;
  assert.throws(() => validateEvidence(wrongSummary, collections), /denominator/);
});

test('loader fetches public URLs and returns validated collections', async (context) => {
  const urls = [];
  context.mock.method(globalThis, 'fetch', async (url) => {
    urls.push(url);
    const response = url.endsWith('gold-frontend-data.json') ? config
      : url.includes('site-a') ? collections.A : collections.B;
    return { ok: true, json: async () => response };
  });
  const evidence = await loadEvidence('/preview/');
  assert.equal(evidence.features.length, 67);
  assert.equal(evidence.collections.A.features.length, 33);
  assert.deepEqual(urls, ['/preview/data/gold-frontend-data.json', '/preview/data/tok-gold/site-a/samples.geojson', '/preview/data/tok-gold/site-b/samples.geojson']);
});

test('loader reports missing assets and malformed JSON instead of a partial map', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 404 }));
  await assert.rejects(loadEvidence(), /Could not load evidence \(404\)/);
  globalThis.fetch.mock.mockImplementation(async () => ({ ok: true, json: async () => { throw new SyntaxError('broken'); } }));
  await assert.rejects(loadEvidence(), /not valid JSON/);
});
