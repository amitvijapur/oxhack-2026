import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEventStudy } from './evaluate.mjs';

function fixture(indices = Array.from({ length: 10 }, (_, i) => 300 + i * 50)) {
  const dates = [];
  for (let time = Date.parse('2019-01-01'); time <= Date.parse('2023-01-01'); time += 86400000) {
    const date = new Date(time);
    if (![0, 6].includes(date.getUTCDay())) dates.push(date.toISOString().slice(0, 10));
  }
  const prices = { schemaVersion: 1, source: { provider: 'synthetic test fixture', url: 'https://example.test/prices', adjustment: 'adjusted close', adjustmentVerified: true, limitations: ['Invented prices, not evidence.'] }, seriesSources: { NG: { hash: 'synthetic' } }, series: Object.fromEntries(['NG', 'NAK', 'GLD', 'SPY'].map((ticker) => [ticker, dates.map((date, i) => ({ date, close: 100 * Math.exp(i * (ticker === 'NG' ? .001 : ticker === 'NAK' ? -.0004 : ticker === 'GLD' ? .0002 : .0001)) }))])) };
  const ledger = { schemaVersion: 1, frozenAt: '2026-10-25T10:00:00Z', limitations: ['Invented events only.'], events: indices.map((index, i) => ({ id: `event-${i}`, ticker: i % 2 ? 'NAK' : 'NG', publicationDate: dates[index], publicationTimestamp: null, direction: i % 3 - 1, title: `Synthetic event ${i}`, sourceUrl: 'https://example.test/event' })) };
  return { prices, ledger, dates };
}
const run = ({ ledger, prices }) => evaluateEventStudy(ledger, prices);
const close = (actual, expected) => assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const horizon = (result, days = 5) => result.horizons.find((row) => row.days === days);

test('date-only Friday and weekend publications enter the first later common session', () => {
  const f = fixture();
  f.ledger.events = [
    { ...f.ledger.events[0], id: 'friday', publicationDate: '2020-01-03' },
    { ...f.ledger.events[1], id: 'saturday', publicationDate: '2020-01-04' },
  ];
  const result = run(f);
  for (const row of horizon(result).events) assert.equal(row.entryDate, '2020-01-06');
  assert.equal(horizon(result).metrics, null);
  assert.equal(result.sources.eventLedger.frozenAt, f.ledger.frozenAt);
  assert.equal(result.sources.prices, f.prices.source);
});

test('gold baseline uses exactly sixty log returns ending before entry', () => {
  const f = fixture();
  const result = run(f);
  const row = horizon(result).events[0];
  close(row.predictions.goldBaseline, Math.expm1(.0002 * 5));
  const changed = structuredClone(f);
  changed.prices.series.GLD.find((price) => price.date === row.entryDate).close *= 4;
  const after = horizon(run(changed)).events.find((event) => event.id === row.id);
  close(after.predictions.goldBaseline, row.predictions.goldBaseline);
  assert.notEqual(after.observedReturns.gld, row.observedReturns.gld);
});

test('future test outcomes cannot change the first test forecast or training fit', () => {
  const f = fixture();
  const before = horizon(run(f));
  assert.equal(before.trainEventIds.length, 6);
  assert.equal(before.testEventIds.length, 4);
  const firstTest = before.events.find((row) => row.id === before.testEventIds[0]);
  const changed = structuredClone(f);
  for (const ticker of ['NG', 'NAK', 'GLD', 'SPY']) for (const row of changed.prices.series[ticker]) if (row.date > firstTest.entryDate) row.close *= ticker === firstTest.ticker ? 2 : 1.2;
  const after = horizon(run(changed));
  assert.deepEqual(after.fit, before.fit);
  assert.deepEqual(after.events.find((row) => row.id === firstTest.id).predictions, firstTest.predictions);
  assert.notEqual(after.events.find((row) => row.id === firstTest.id).observedReturns.stock, firstTest.observedReturns.stock);
});

test('same-date groups stay together and training outcomes must mature strictly before test entry', () => {
  const f = fixture([300, 350, 400, 450, 500, 550, 550, 650, 700, 750]);
  f.ledger.events[5].ticker = 'NG';
  f.ledger.events[6].ticker = 'NAK';
  const result = horizon(run(f));
  assert.equal(result.trainEventIds.length, 7);
  assert.equal(result.testEventIds.length, 3);
  assert.ok(result.trainEventIds.includes('event-5') && result.trainEventIds.includes('event-6'));
  const immature = fixture([300, 350, 400, 450, 500, 550, 555, 650, 700, 750]);
  immature.ledger.events[5].ticker = 'NG';
  immature.ledger.events[6].ticker = 'NAK';
  const late = horizon(run(immature));
  assert.ok(late.exclusions.find((row) => row.id === 'event-5').reasons.includes('training_outcome_not_mature_before_first_test_entry'));
  assert.ok(!late.trainEventIds.includes('event-5'));
  assert.ok(late.events.find((row) => row.id === 'event-5').observedReturns.stock !== null);
});

test('same-issuer overlaps keep the earlier event independently by horizon', () => {
  const f = fixture([300, 310, 360, 410, 460, 510, 560, 610, 660, 710]);
  f.ledger.events[1].ticker = f.ledger.events[0].ticker;
  const result = run(f);
  assert.ok(horizon(result, 5).eligibleEventIds.includes('event-1'));
  assert.ok(horizon(result, 20).exclusions.find((row) => row.id === 'event-1').reasons.includes('overlap_with_event-0'));
});

test('missing prices are excluded without compressing dates or forward filling', () => {
  for (const ticker of ['NG', 'GLD', 'SPY']) {
    const f = fixture();
    f.prices.series[ticker] = f.prices.series[ticker].filter((row) => row.date !== f.dates[303]);
    const row = horizon(run(f)).events[0];
    assert.ok(row.exclusionReasons.includes('missing_aligned_outcome_prices'));
    assert.equal(row.endDate, f.dates[306]);
    assert.equal(row.observedReturns.stock, null);
  }
});

test('fewer than four matured train or three test events yields null comparison scores', () => {
  for (const count of [0, 3, 6]) {
    const f = fixture(Array.from({ length: count }, (_, i) => 300 + i * 50));
    const result = run(f);
    assert.equal(result.status, 'insufficient_sample');
    assert.equal(horizon(result).metrics, null);
    assert.ok(horizon(result).scoreReasons.length > 0);
  }
  const result = horizon(run(fixture()));
  assert.equal(result.metrics.eventModel.directionHits.denominator, 4);
  close(result.metrics.noChange.maePercentagePoints, result.events.filter((row) => row.partition === 'test').reduce((sum, row) => sum + Math.abs(row.observedReturns.stock) * 100, 0) / 4);
});

test('event residual adjustment shrinks by the fixed three-observation prior and unseen directions get zero', () => {
  const f = fixture();
  f.ledger.events.forEach((row, i) => { row.direction = i < 6 ? 1 : -1; });
  const result = horizon(run(f));
  assert.equal(result.fit['1'].count, 6);
  close(result.fit['1'].shrinkage, 6 / 9);
  close(result.fit['1'].adjustment, result.fit['1'].meanResidual * 6 / 9);
  assert.equal(result.fit['-1'].count, 0);
  assert.equal(result.fit['-1'].adjustment, 0);
  for (const row of result.events.filter((row) => row.partition === 'test')) close(row.predictions.eventModel, row.predictions.goldBaseline);
});

test('economic diagnostic takes only favourable events and marks fixed cost as hypothetical', () => {
  const result = horizon(run(fixture()));
  for (const row of result.events) {
    const policy = row.economicDiagnostic;
    assert.equal(policy.actualTradingPerformance, false);
    if (row.direction === 1) {
      close(policy.returnAfterIllustrativeCost, row.observedReturns.stock - .005);
      close(policy.illustrativeRoundTripCost, .005);
      assert.equal(policy.traded, true);
    } else {
      assert.equal(policy.traded, false);
      assert.equal(policy.grossReturn, 0);
      assert.equal(policy.returnAfterIllustrativeCost, 0);
    }
  }
  assert.equal(run(fixture()).swarmLift.value, null);
});

test('invalid prices, dates, duplicate identities and an unfrozen ledger cannot produce scores', () => {
  const mutations = [
    (f) => { f.prices.series.NG[20].close = Infinity; },
    (f) => { f.prices.series.NG[20].close = 0; },
    (f) => { f.prices.series.GLD[20].date = '2020-02-30'; },
    (f) => { f.prices.series.SPY.push(f.prices.series.SPY.at(-1)); },
    (f) => { f.ledger.events.push(f.ledger.events[0]); },
    (f) => { f.ledger.frozenAt = null; },
    (f) => { f.ledger.events[0].direction = 2; },
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f);
    const result = run(f);
    assert.equal(result.status, 'invalid_input');
    assert.ok(result.errors.length > 0);
    assert.deepEqual(result.horizons, []);
  }
});

test('unadjusted known corporate-action windows are blocked while attributed adjusted data remain available', () => {
  const f = fixture();
  f.prices.source.adjustmentVerified = false;
  f.prices.corporateActions = [{ ticker: 'NG', date: f.dates[303], type: 'split' }];
  const row = horizon(run(f)).events[0];
  assert.ok(row.exclusionReasons.includes('unadjusted_corporate_action_window'));
  assert.equal(row.observedReturns.stock, null);
  f.prices.source.adjustmentVerified = true;
  assert.ok(horizon(run(f)).events[0].observedReturns.stock !== null);
});
