import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = async (name) => JSON.parse(await readFile(new URL(`../public/data/${name}`, import.meta.url), 'utf8'));
const [plots, claims, geochem, west, east] = await Promise.all([
  fixture('showcase/plots.json'), fixture('showcase/claims.geojson'), fixture('showcase/geochem.json'),
  fixture('tok-gold/site-a/samples.geojson'), fixture('tok-gold/site-b/samples.geojson'),
]);
const observed = [...west.features, ...east.features];
const samples = new Map(observed.map((sample) => [sample.properties.sample_id, sample]));

test('the land explorer joins every observed sample once across the 57 map contexts', () => {
  assert.equal(plots.plots.length, 57);
  const assignments = plots.plots.flatMap((plot) => plot.samples);
  assert.equal(assignments.length, 67);
  assert.equal(new Set(assignments).size, 67);
  assert.deepEqual(new Set(assignments), new Set(samples.keys()));
  assert.equal(new Set(plots.plots.map((plot) => plot.label)).size, 57);
  for (const plot of plots.plots) {
    assert.match(plot.label, new RegExp(`^${plot.site}-\\d{2}$`));
    assert.ok(plot.samples.every((id) => samples.get(id).properties.area === plot.site));
  }
});

test('claim outlines remain sourced while illustrative squares stay centred on observations', () => {
  const byClaim = new Map(claims.features.map((claim) => [claim.properties.id, claim]));
  for (const plot of plots.plots) {
    assert.equal(plot.centre.length, 2);
    assert.ok(plot.centre.every(Number.isFinite));
    if (plot.kind === 'claim') {
      assert.deepEqual(plot.geometry, byClaim.get(plot.id).geometry);
      assert.equal(plot.mtrs ?? null, byClaim.get(plot.id).properties.mtrs ?? null);
    } else {
      assert.equal(plot.samples.length, 1);
      const [lon, lat] = samples.get(plot.samples[0]).geometry.coordinates;
      assert.ok(Math.abs(plot.centre[0] - lon) < 0.00001);
      assert.ok(Math.abs(plot.centre[1] - lat) < 0.00001);
      assert.equal(plot.owner, undefined);
    }
  }
});

test('plot sheet metadata retains finite distances and original measured element identities', () => {
  const ids = new Set(geochem.samples.map((sample) => sample.id));
  for (const plot of plots.plots) {
    assert.ok(plot.samples.every((id) => ids.has(id)));
    for (const distance of [plot.km_to_tok, plot.km_to_held_claim, plot.nearest_gold_site.km]) {
      assert.ok(Number.isFinite(distance) && distance >= 0);
    }
    assert.ok(plot.pathfinders.every((element) => Object.hasOwn(geochem.elements, element)));
    assert.ok(Array.isArray(plot.bedrock));
  }
});
