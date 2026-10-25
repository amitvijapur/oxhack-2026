import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspectLandSource, historicalGoldTrend } from '../integrations/land.mjs';

const source = JSON.parse(readFileSync(new URL('../data/land-source.json', import.meta.url)));
const copy = (value) => JSON.parse(JSON.stringify(value));
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const coverage = (result, id) => result.coverage.find((item) => item.id === id);

test('pinned land sample keys and coordinates exactly join all 67 original samples', () => {
  const features = ['a', 'b'].flatMap((area) => JSON.parse(readFileSync(new URL(`../../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url))).features);
  assert.equal(source.samples.length, 67);
  assert.equal(new Set(source.samples.map((sample) => sample.sampleKey)).size, 67);
  const keyed = new Map(features.map((feature) => [feature.id, feature]));
  for (const sample of source.samples) {
    const original = keyed.get(sample.sampleKey);
    assert.ok(original, sample.sampleKey);
    assert.equal(sample.sampleId, original.properties.sample_id);
    assert.equal(sample.area, original.properties.area);
    assert.deepEqual(sample.coordinates, original.geometry.coordinates);
  }
});

test('actual unique-sample overlap counts reproduce A33 and B34 without counting record pairs', () => {
  const a = inspectLandSource(source, { area: 'A' });
  const b = inspectLandSource(source, { area: 'B' });
  assert.deepEqual([a.summary.totalSamples, a.summary.activeClaimSamples, a.summary.closedClaimSamples, a.summary.stateLandSamples, a.summary.noCheckedLayerSamples], [33, 2, 12, 29, 4]);
  assert.deepEqual([b.summary.totalSamples, b.summary.activeClaimSamples, b.summary.closedClaimSamples, b.summary.stateLandSamples, b.summary.noCheckedLayerSamples], [34, 20, 1, 28, 6]);
  assert.equal(b.summary.activeClaimOwners.find((owner) => owner.name === 'CONTANGO MINERALS ALASKA, LLC').sampleCount, 17);
  assert.equal(a.summary.activeClaimOwners[0].sampleCount, 2);
  assert.equal(coverage(a, 'land_sample_join').status, 'supplied');
  assert.equal(coverage(b, 'land_sample_join').status, 'supplied');
  assert.equal(a.summary.unknownSamples, 0);
  assert.equal(b.summary.medianNearestActiveClaimMetres, 0);
});

test('duplicate rows and duplicate record pairs cannot inflate sample or owner counts', () => {
  const duplicated = copy(source);
  duplicated.samples.push(copy(duplicated.samples[0]));
  duplicated.samples[0].records.push(copy(duplicated.samples[0].records[0]));
  const result = inspectLandSource(duplicated);
  assert.deepEqual(result.summary, inspectLandSource(source).summary);
  assert.equal(result.sampleMatches.length, 33);
  assert.equal(coverage(result, 'land_sample_join').status, 'supplied');
});

test('conflicting sample records and absent record arrays remain incomplete', () => {
  const conflicted = copy(source);
  const row = conflicted.samples.find((sample) => sample.records.some((record) => record.kind === 'active_claim'));
  const record = row.records.find((item) => item.kind === 'active_claim');
  row.records.push({ ...record, recordedHolder: 'CONFLICTING HOLDER' });
  const result = inspectLandSource(conflicted);
  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('conflicting_sample_record'));
  assert.equal(result.summary.unknownSamples, 1);
  assert.equal(coverage(result, 'land_sample_join').status, 'partial');
  const missing = copy(source);
  delete missing.samples[0].records;
  assert.equal(inspectLandSource(missing).summary.unknownSamples, 1);
  assert.equal(inspectLandSource(missing).summary.noCheckedLayerSamples, 4);
});

test('missing source and missing sample rows never report complete coverage', () => {
  assert.equal(inspectLandSource(null).status, 'missing');
  assert.equal(coverage(inspectLandSource(null), 'land_sample_join').status, 'missing');
  const missing = copy(source);
  missing.samples.shift();
  assert.equal(coverage(inspectLandSource(missing), 'land_sample_join').status, 'partial');
  assert.equal(inspectLandSource(source, { area: 'C' }).status, 'blocked');
});

test('five-year gold context uses complete 2020 and 2025 annual means, excluding partial 2026', () => {
  const trend = historicalGoldTrend(source);
  assert.equal(trend.status, 'ready');
  assert.deepEqual([trend.startYear, trend.endYear, trend.startPriceUsdPerOz, trend.endPriceUsdPerOz], [2020, 2025, 1770.25, 3441.5]);
  close(trend.annualGrowthRate, (3441.5 / 1770.25) ** 0.2 - 1);
  const extremePartial = copy(source);
  extremePartial.context.gold.observations.find((row) => row.year === 2026).annualMeanUsdPerTroyOz = 1e12;
  assert.deepEqual(historicalGoldTrend(extremePartial), trend);
  assert.match(trend.detail, /assumption, not a forecast/);
});

test('missing gold years, duplicate means and unknown source dates cannot produce growth', () => {
  const missing = copy(source);
  missing.context.gold.observations = missing.context.gold.observations.filter((row) => row.year !== 2022);
  assert.equal(historicalGoldTrend(missing).annualGrowthRate, null);
  const duplicate = copy(source);
  duplicate.context.gold.observations.push(copy(duplicate.context.gold.observations[0]));
  assert.equal(historicalGoldTrend(duplicate).status, 'blocked');
  assert.equal(historicalGoldTrend({ context: source.context }).status, 'blocked');
});

test('land context preserves economic gaps and heterogeneous deal limitations', () => {
  const result = inspectLandSource(source);
  for (const id of ['mineral_title', 'commodity_current_quote', 'recoverable_resource', 'available_option', 'sale_probability', 'historical_availability']) assert.equal(coverage(result, id).status, 'missing', id);
  assert.equal(coverage(result, 'land_prices').status, 'partial');
  assert.equal(coverage(result, 'holding_costs').status, 'partial');
  assert.equal(result.dealComparables.length, 10);
  assert.ok(result.dealComparables.every((deal) => deal.verifiedAvailableTokAssignment === false));
  assert.ok(result.dealComparables.some((deal) => deal.limitations.includes('related_party')));
  assert.ok(result.dealComparables.some((deal) => deal.status === 'terminated_option'));
  assert.ok(result.dealComparables.some((deal) => deal.limitations.includes('antimony_not_gold')));
  assert.equal(result.holdingCosts.optionBuyerObligationVerified, false);
  assert.equal(result.holdingCosts.currentApplicabilityVerified, false);
  assert.ok(result.facts.every((fact) => ['string', 'number'].includes(typeof fact.value)));
  assert.equal(result.assignmentValueUsd, undefined);
});

test('source revision, raw hashes and separate snapshot/retrieval dates survive inspection', () => {
  const result = inspectLandSource(source);
  assert.equal(result.provenance.revision, '34eaf1d6e87fedd54c46b04dec093b0cc2b18581');
  assert.equal(result.provenance.sourceSnapshotAt, '2026-10-24');
  assert.equal(result.provenance.historicalAvailabilityVerified, false);
  assert.ok(Number.isFinite(Date.parse(result.provenance.retrievedAt)));
  assert.equal(result.provenance.sources.length, 13);
  assert.ok(result.provenance.sources.every((item) => /^[0-9a-f]{64}$/.test(item.sha256) && item.bytes > 0));
});
