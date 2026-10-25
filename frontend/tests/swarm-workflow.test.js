import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorkflowData, getReplayFrame } from '../src/lib/swarm-workflow.mjs';
import { normalizeSwarmReport } from '../../model/tok-option/integrations/swarm.mjs';
import { mapSwarm } from '../../model/tok-option/swarm.mjs';

const source = JSON.parse(readFileSync(new URL('../../model/tok-option/data/swarm-source.json', import.meta.url), 'utf8'));
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} should equal ${expected}`);

test('the actual source becomes six scored replays and three unavailable runs without changing it', () => {
  const before = JSON.stringify(source);
  const data = buildWorkflowData(source);
  assert.deepEqual(data.counts, {
    plannedRuns: 9, availableRuns: 6, scoreRows: 3499, numericRows: 3121,
    nullRows: 378, agents: 60, groups: 5, newsWires: 1,
    interviewsExpected: 288, interviewsParsed: 130,
  });
  assert.equal(data.source.commit, 'f2fe2971d9f041a819f7b7ff4a78e10f840884f5');
  assert.equal(data.source.knowledgeCutoff, null);
  assert.equal(data.replayGrain, 'daily_group_mean');
  assert.equal(data.monetaryReady, false);
  assert.equal(JSON.stringify(source), before);
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
});

test('numeric heat counts reconcile exactly while missing runs stay unknown', () => {
  const data = buildWorkflowData(source);
  for (const run of data.runs.filter((r) => r.available)) {
    assert.equal(run.days.length, 5);
    assert.equal(run.days.reduce((sum, day) => sum + day.count, 0), run.numericRows);
    assert.equal(run.numericRows + run.nullRows, run.totalRows);
  }
  assert.deepEqual(data.runs.filter((r) => !r.available).map((r) => r.id), ['07_tax_rise_s1', '08_protest_s1', '09_gold_back_to_4000_s1']);
  for (const run of data.runs.filter((r) => !r.available)) {
    assert.deepEqual(run.days, []);
    assert.equal(run.numericRows, null);
    assert.equal(run.totalRows, null);
    assert.equal(run.comparison.signal, null);
    assert.equal(getReplayFrame(data, run.id, 5).cumulativeCount, null);
  }
});

test('cast counts, weights, and source group names remain separate quantities', () => {
  const data = buildWorkflowData(source);
  assert.deepEqual(data.groups.map((g) => [g.id, g.sourceId, g.agents, g.weight]), [
    ['government', 'government', 10, 0.1], ['industry', 'land_industry', 13, 0.4],
    ['community', 'land_community', 7, 0.07], ['funds', 'funds', 24, 0.4], ['retail', 'retail', 6, 0.03],
  ]);
  near(data.groups.reduce((sum, g) => sum + g.weight, 0), 1);
  assert.notEqual(data.groups[1].agents / data.counts.agents, data.groups[1].weight);
});

test('a measured zero is retained, whereas missing and off-topic means never become zero', () => {
  const changed = structuredClone(source);
  const row = changed.report.runs[0];
  row.daily.government[3] = { support: 0, heat: 4 };
  delete row.daily.government[4];
  row.daily.government[5] = { support: null, heat: 0 };
  const data = buildWorkflowData(changed);
  const run = data.runs[0];
  assert.deepEqual(run.days[2].groups[0], { id: 'government', mean: 0, count: 4 });
  assert.deepEqual(run.days[3].groups[0], { id: 'government', mean: null, count: null });
  assert.deepEqual(run.days[4].groups[0], { id: 'government', mean: null, count: 0 });
  assert.equal(run.days[3].count, null);
  assert.equal(run.comparison.groups[0].delta, null);
  assert.equal(run.comparison.signal, null);
});

test('comparison gives days equal weight and agrees with canonical descriptive mapping', () => {
  const fixture = structuredClone(source);
  fixture.sourceId = 'synthetic-unit-test-fixture';
  fixture.knowledgeCutoff = '2026-01-01T00:00:00Z';
  const baseline = structuredClone(fixture.report.runs[0]);
  const scenario = structuredClone(fixture.report.runs[4]);
  for (const [row, means, counts] of [
    [baseline, [4, 4, 2, 4, 6], [1, 1, 100, 1, 1]],
    [scenario, [4, 4, 5, 7, 9], [1, 1, 1, 100, 1]],
  ]) {
    for (const group of Object.keys(row.daily)) for (let day = 1; day <= 5; day++) {
      row.daily[group][day] = { support: means[day - 1], heat: counts[day - 1] };
    }
    row.scoreRows = { total: 520, numeric: 520, offTopicOrNull: 0 };
  }
  fixture.report.runs = [baseline, scenario];
  const data = buildWorkflowData(fixture);
  const comparison = data.runs.find((r) => r.id === scenario.folder).comparison;
  assert.equal(comparison.baselineRunId, baseline.folder);
  for (const group of comparison.groups) {
    assert.equal(group.baselineMean, 4);
    assert.equal(group.scenarioMean, 7);
    near(group.delta, 0.3);
  }
  near(comparison.signal, 0.3);
  // A valid fixture cutoff lets the canonical pure mapper check arithmetic only.
  // Its failed source diagnostics still prevent the display from authorizing money.
  const normalized = normalizeSwarmReport(fixture.report, fixture);
  const canonical = mapSwarm({ runs: normalized.runs, scenarioId: 'mine_approval' });
  near(comparison.signal, canonical.value);
  assert.equal(data.monetaryReady, false);
});

test('same-seed baselines are paired explicitly and never substituted from another seed', () => {
  const data = buildWorkflowData(source);
  assert.equal(data.runs[4].comparison.baselineRunId, '01_baseline_s1');
  assert.equal(data.runs[1].comparison.baselineRunId, '02_baseline_s2');
  near(data.runs[1].comparison.signal, 0);
  const changed = structuredClone(source);
  changed.report.runs = changed.report.runs.filter((r) => r.folder !== '01_baseline_s1');
  const missing = buildWorkflowData(changed).runs[4].comparison;
  assert.equal(missing.baselineRunId, null);
  assert.equal(missing.signal, null);
});

test('replay exposes only elapsed daily summaries and no future comparison', () => {
  const data = buildWorkflowData(source);
  const run = data.runs[4];
  const start = getReplayFrame(data, run.id, 0);
  assert.equal(start.cumulativeCount, 0);
  assert.deepEqual(start.days, []);
  assert.equal(start.comparison, null);
  const mid = getReplayFrame(data, run.id, 2);
  assert.deepEqual(mid.days.map((d) => d.day), [1, 2]);
  assert.equal(mid.comparison, null);
  assert.equal(mid.cumulativeCount, run.days[0].count + run.days[1].count);
  assert.equal(mid.groups[0].mean, run.days[1].groups[0].mean);
  const end = getReplayFrame(data, run.id, 99);
  assert.equal(end.day, 5);
  assert.equal(end.complete, true);
  assert.equal(end.cumulativeCount, run.numericRows);
  assert.equal(end.comparison.signal, run.comparison.signal);
  const unknown = getReplayFrame(data, 'does-not-exist', 2);
  assert.equal(unknown.run, null);
  assert.equal(unknown.cumulativeCount, null);
});

test('canonical failed and unknown readiness survives the display adapter', () => {
  const data = buildWorkflowData(source);
  const status = (id) => data.checks.find((check) => check.id === id)?.status;
  assert.equal(status('judge'), 'pass');
  assert.equal(status('knowledge_cutoff'), 'unknown');
  assert.equal(status('config_comparability'), 'fail');
  assert.equal(status('placebo'), 'fail');
  assert.equal(status('grounding'), 'fail');
  assert.equal(status('mirror_mine_approval'), 'fail');
  assert.equal(data.runs.find((run) => run.scenario === 'mine_approval').readiness.status, 'fail');
  assert.equal(data.monetaryReady, false);
});
