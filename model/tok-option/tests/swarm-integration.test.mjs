import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeSwarmReport, inspectSwarmSource, inspectNormalizedSwarmDiagnostics, SOURCE_GROUPS } from '../integrations/swarm.mjs';
import { mapSwarm } from '../swarm.mjs';

const source = JSON.parse(readFileSync(new URL('../data/swarm-source.json', import.meta.url), 'utf8'));
const metadata = { sourceId: 'invented-report-test-only', knowledgeCutoff: '2026-10-24T00:00:00Z', eventDefinition: 'Invented test data. Common day-one hypothetical gold breakout.', judgeCheck: { status: 'pass', scope: 'Invented passing fixture only.' } };
const testConfiguration = { provider: 'invented', modelName: 'fixture', tier1Model: 'fixture', tier2Model: 'fixture', tier3Model: 'fixture', mirofishCommit: 'fixture', patchSha256: 'fixture', minutesPerRound: 120, tiers: { 1: 6, 2: 18, 3: 37 }, memoryTokenLimit: '100000', maxCommentsPerPost: '10', llmSemaphore: '10' };
const testInterviews = { expected: 48, returnedSlots: 48, nonemptyResponses: 48, parsedAnswers: 48 };
const directions = {
  baseline: {}, placebo: {}, mine_approved: { funds: 2, government: 1, land_community: -1 },
  tax_rise: { funds: -1, land_industry: -1 }, protest: { land_community: -1, government: -1, funds: -1 },
  court_blocks_mine: { funds: -2 }, gold_back_to_4000: { funds: -2, retail: -2 },
};
function makeReport() {
  const runs = [];
  for (const [scenario, moves] of Object.entries(directions)) {
    for (const seed of scenario === 'baseline' ? [1, 2, 3] : [1]) {
      const daily = {};
      for (const group of Object.keys(SOURCE_GROUPS)) daily[group] = Object.fromEntries([1, 2, 3, 4, 5].map((day) => [day, { support: 5 + (day >= 3 ? (moves[group] ?? 0) + (scenario === 'baseline' ? (seed - 1) * .1 : 0) : 0), heat: 7 }]));
      runs.push({ folder: `test-${scenario}-${seed}`, scenario, seed, status: 'judged', outcome: 'ok', unmapped_posts: 0, daily, configuration: structuredClone(testConfiguration), interviewCoverage: { ...testInterviews } });
    }
  }
  return { generated: '2026-10-25T00:00:00Z', runs, checks: { stability: { status: 'pass', parts: [{ part: 'invented', status: 'pass' }] }, grounding: { status: 'pass', parts: [{ part: 'invented', status: 'pass' }] } } };
}

test('pinned report retains six real scored runs and explicit failed readiness without a cutoff', () => {
  const result = inspectSwarmSource(source, 'mine_approval');
  assert.equal(source.commit, 'f2fe2971d9f041a819f7b7ff4a78e10f840884f5');
  assert.equal(result.status, 'fail');
  assert.equal(result.runs, null);
  assert.equal(result.rawReport, source.report);
  assert.equal(result.diagnosticRuns.runs.length, 6);
  assert.equal(result.diagnosticRuns.knowledgeCutoff, null);
  assert.ok(result.errors.some((error) => error.includes('knowledgeCutoff')));
  assert.equal(result.coverage.find((d) => d.id === 'full_runs').status, 'fail');
  for (const id of ['placebo', 'grounding', 'config_comparability', 'interview_coverage', 'mirror_mine_approval']) assert.equal(result.diagnostics.find((d) => d.id === id).status, 'fail', id);
  assert.equal(result.diagnostics.find((d) => d.id === 'baseline_spread').status, 'pass');
  assert.equal(result.diagnostics.find((d) => d.id === 'knowledge_cutoff').status, 'unknown');
  assert.equal(result.diagnostics.find((d) => d.id === 'judge').status, 'pass');
  assert.equal(source.judgeCheck.withinTolerance, 26);
  assert.equal(source.judgeCheck.judgeModel, 'glm-5.3-flash');
  assert.equal(source.inventory.totalScoredRows, 3499);
  assert.equal(source.inventory.numericScoredRows, 3121);
  assert.equal(source.inventory.offTopicOrNullScoredRows, 378);
  assert.equal(source.inventory.completedScoredScenarioRuns, 6);
  assert.deepEqual(source.inventory.missingRunFolders, ['07_tax_rise_s1', '08_protest_s1', '09_gold_back_to_4000_s1']);
  assert.deepEqual(source.report.runs.filter((r) => r.status === 'judged').map((r) => r.interviewCoverage.nonemptyResponses), [24, 48, 48, 0, 0, 10]);
  assert.equal(result.diagnosticRuns.runs.find((r) => r.scenarioId === 'mine_approval').sourcePostCounts[3].funds, source.report.runs.find((r) => r.scenario === 'mine_approved').daily.funds[3].heat);
  assert.ok(source.sourceFiles.every((f) => /^[a-f0-9]{64}$/.test(f.sha256) && f.url.includes(source.commit)));
  assert.equal(source.sourceFiles.find((f) => f.path === 'swarm/records/results/results.json').sha256, 'c1c88445c8ffda6a4d4f9d8ff93f1c254162ce22030203c3421fd9ed166f2f63');
  for (const group of result.baselineSpread) assert.ok(Math.abs(group.band - source.report.chance_band[Object.keys(SOURCE_GROUPS).find((name) => SOURCE_GROUPS[name] === group.group)]) < 1e-12);
});

test('explicit historical pilot fixture retains its pending behavior', () => {
  const pilotFixture = { sourceId: 'historical-pilot-fixture', report: null, knowledgeCutoff: null, judgeCheck: { status: 'pass', withinTolerance: 27, sampleSize: 30, minimumRequired: 24, tolerancePoints: 2 }, pilot: { isScoredScenarioRun: false, totalScoredRows: 296, onTopicPosts: 277, days: [1] } };
  const result = inspectSwarmSource(pilotFixture, 'mine_approval');
  assert.equal(result.status, 'PENDING_SWARM');
  assert.equal(result.runs, null);
  assert.equal(result.diagnostics.find((d) => d.id === 'judge').status, 'pass');
  assert.equal(result.diagnostics.find((d) => d.id === 'placebo').status, 'unknown');
  assert.equal(result.scenarioReadiness.mine_approval.status, 'unknown');
  assert.equal(result.pilot.totalScoredRows, 296);
  assert.equal(result.pilot.onTopicPosts, 277);
  assert.deepEqual(result.pilot.days, [1]);
  assert.equal(result.pilot.isScoredScenarioRun, false);
});

test('upstream scenario/group mapping preserves daily means and true post counts', () => {
  const parsed = normalizeSwarmReport(makeReport(), metadata);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.runs.runs.length, 9);
  const approval = parsed.runs.runs.find((r) => r.scenarioId === 'mine_approval');
  assert.deepEqual(approval.days.find((d) => d.day === 3).groups.industry, [5]);
  assert.equal(approval.sourcePostCounts[3].industry, 7);
  assert.equal(parsed.runs.scoreAggregation, 'daily_group_mean');
  const mapped = mapSwarm({ runs: parsed.runs, scenarioId: 'mine_approval' });
  assert.ok(Math.abs(mapped.value - .083) < 1e-12);
  const checked = inspectNormalizedSwarmDiagnostics(parsed.runs, 'mine_approval');
  assert.equal(checked.status, 'pass');
  assert.ok(Math.abs(checked.baselineSpread[0].band - .2) < 1e-12);
});

test('report generation time never substitutes for the source knowledge cutoff', () => {
  const parsed = normalizeSwarmReport(makeReport(), { ...metadata, knowledgeCutoff: null });
  assert.equal(parsed.runs, null);
  assert.ok(parsed.errors.some((s) => s.includes('knowledgeCutoff')));
  assert.equal(parsed.diagnosticRuns.knowledgeCutoff, null);
  assert.equal(parsed.diagnosticRuns.runs.length, 9);
  const result = inspectNormalizedSwarmDiagnostics(parsed.diagnosticRuns, 'mine_approval');
  assert.equal(result.status, 'unknown');
  assert.equal(result.diagnostics.find((d) => d.id === 'baseline_spread').status, 'pass');
  assert.equal(result.diagnostics.find((d) => d.id === 'knowledge_cutoff').status, 'unknown');
  assert.equal(mapSwarm({ runs: parsed.diagnosticRuns, scenarioId: 'mine_approval' }).value, null);
});

test('missing day, baseline replicate or report check remains unknown', () => {
  for (const mutate of [
    (r) => { delete r.runs.find((x) => x.scenario === 'mine_approved').daily.funds[5]; },
    (r) => { r.runs = r.runs.filter((x) => !(x.scenario === 'baseline' && x.seed === 3)); },
    (r) => { delete r.checks.grounding; },
  ]) {
    const report = makeReport(); mutate(report);
    const parsed = normalizeSwarmReport(report, metadata);
    assert.deepEqual(parsed.errors, []);
    assert.equal(inspectNormalizedSwarmDiagnostics(parsed.runs, 'mine_approval').status, 'unknown');
  }
});

test('an unstable placebo blocks otherwise complete scenario scores', () => {
  const report = makeReport();
  const placebo = report.runs.find((r) => r.scenario === 'placebo');
  for (const day of [3, 4, 5]) placebo.daily.retail[day].support = 6;
  const checked = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
  assert.equal(checked.status, 'fail');
  assert.equal(checked.diagnostics.find((d) => d.id === 'placebo').status, 'fail');
});

test('mirror failure affects approval/block scenarios without inventing unrelated failures', () => {
  const report = makeReport();
  const blocked = report.runs.find((r) => r.scenario === 'court_blocks_mine');
  for (const day of [3, 4, 5]) blocked.daily.funds[day].support = 7;
  const checked = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
  assert.equal(checked.scenarioReadiness.mine_approval.status, 'fail');
  assert.equal(checked.scenarioReadiness.mine_blocked.status, 'fail');
  assert.equal(checked.scenarioReadiness.proposed_tax.status, 'pass');
});

test('synthetic fixtures never report completed simulator checks', () => {
  const parsed = normalizeSwarmReport(makeReport(), metadata);
  parsed.runs.provenance = 'synthetic';
  const checked = inspectNormalizedSwarmDiagnostics(parsed.runs, 'mine_approval');
  assert.equal(checked.status, 'synthetic');
  assert.equal(checked.scenarioReadiness.mine_approval.status, 'unknown');
  assert.ok(checked.diagnostics.every((d) => d.status === 'unknown'));
});

test('invalid numeric support, counts, unknown mappings and duplicate seeds are rejected', () => {
  for (const mutate of [
    (r) => { r.runs[0].daily.funds[3].support = 11; },
    (r) => { r.runs[0].daily.funds[3].heat = 0; },
    (r) => { r.runs[0].daily.unmapped = {}; },
    (r) => { r.runs[0].scenario = 'invented_scenario'; },
    (r) => { r.runs.push(structuredClone(r.runs[0])); },
  ]) {
    const report = makeReport(); mutate(report);
    const parsed = normalizeSwarmReport(report, metadata);
    assert.equal(parsed.runs, null);
    assert.ok(parsed.errors.length);
  }
});

test('partial reported pass and explicit source failures are not promoted to pass', () => {
  const report = makeReport();
  report.checks.stability = { status: 'pass, partly not run', parts: [{ status: 'pass' }, { status: 'not run' }] };
  let checked = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
  assert.equal(checked.status, 'unknown');
  report.checks.stability = { status: 'fail', parts: [] };
  checked = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
  assert.equal(checked.status, 'fail');
});

const malformedChecks = [
  { placebo: { parts: {} } },
  { placebo: { status: 'pass', parts: {} } },
  { stability: { status: 'pass', parts: [null] } },
  { mirrors: { status: 'pass', parts: [1] } },
  { grounding: { status: 'pass', parts: null } },
  { judge: { status: 'pass', scope: {} } },
  [],
  'pass',
];

test('malformed normalized source checks never throw or pass diagnostics', () => {
  const document = normalizeSwarmReport(makeReport(), metadata).runs;
  for (const checks of malformedChecks) {
    const result = inspectNormalizedSwarmDiagnostics({ ...document, sourceChecks: checks }, 'mine_approval');
    assert.equal(result.status, 'unknown');
    assert.ok(result.errors.length > 0);
    assert.ok(result.diagnostics.every((d) => d.status === 'unknown'));
  }
});

test('report normalizer rejects malformed check collections and parts', () => {
  for (const checks of malformedChecks) {
    const result = normalizeSwarmReport({ ...makeReport(), checks }, metadata);
    assert.equal(result.runs, null);
    assert.ok(result.errors.length > 0);
  }
  const invalidJudge = normalizeSwarmReport(makeReport(), { ...metadata, judgeCheck: { status: 'pass', parts: [null] } });
  assert.equal(invalidJudge.runs, null);
  assert.ok(invalidJudge.errors.length > 0);
});

test('missing or null check evidence remains unknown and null metadata is rejected safely', () => {
  for (const document of [null, undefined]) assert.equal(inspectNormalizedSwarmDiagnostics(document, 'mine_approval').status, 'unknown');
  const document = normalizeSwarmReport(makeReport(), metadata).runs;
  for (const sourceChecks of [null, undefined, { judge: null, stability: null, grounding: null }]) {
    const result = inspectNormalizedSwarmDiagnostics({ ...document, sourceChecks }, 'mine_approval');
    assert.equal(result.status, 'unknown');
    assert.equal(result.diagnostics.find((d) => d.id === 'judge').status, 'unknown');
  }
  for (const checks of [null, undefined]) {
    const parsed = normalizeSwarmReport({ ...makeReport(), checks }, metadata);
    assert.deepEqual(parsed.errors, []);
    assert.equal(inspectNormalizedSwarmDiagnostics(parsed.runs, 'mine_approval').status, 'unknown');
  }
  assert.equal(normalizeSwarmReport(makeReport(), null).runs, null);
});

test('configuration confounds veto a numerically passing invented response', () => {
  for (const field of ['provider', 'tier1Model', 'mirofishCommit', 'patchSha256', 'memoryTokenLimit', 'maxCommentsPerPost', 'llmSemaphore']) {
    const report = makeReport();
    report.runs.find((r) => r.scenario === 'mine_approved').configuration[field] = ['memoryTokenLimit', 'maxCommentsPerPost', 'llmSemaphore'].includes(field) ? '999' : 'changed-test-setting';
    const result = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
    assert.equal(result.diagnostics.find((d) => d.id === 'direction_mine_approval').status, 'pass');
    assert.equal(result.diagnostics.find((d) => d.id === 'config_comparability').status, 'fail', field);
    assert.equal(result.scenarioReadiness.mine_approval.status, 'fail', field);
  }
  const report = makeReport(); delete report.runs[0].configuration.memoryTokenLimit;
  const result = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
  assert.equal(result.diagnostics.find((d) => d.id === 'config_comparability').status, 'unknown');
  assert.equal(result.status, 'unknown');
});

test('completed wrappers with null, absent or unparsed interviews cannot pass readiness', () => {
  for (const mutate of [
    (r) => { r.interviewCoverage = { expected: 48, returnedSlots: 48, nonemptyResponses: 0, parsedAnswers: 0, wrapperStatus: 'completed' }; },
    (r) => { r.interviewCoverage = { expected: 48, returnedSlots: 24, nonemptyResponses: 24, parsedAnswers: 24 }; },
    (r) => { r.interviewCoverage.parsedAnswers = 10; },
  ]) {
    const report = makeReport(); mutate(report.runs.find((r) => r.scenario === 'mine_approved'));
    const result = inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs, 'mine_approval');
    assert.equal(result.diagnostics.find((d) => d.id === 'interview_coverage').status, 'fail');
    assert.equal(result.status, 'fail');
  }
  const report = makeReport(); delete report.runs[0].interviewCoverage;
  assert.equal(inspectNormalizedSwarmDiagnostics(normalizeSwarmReport(report, metadata).runs).diagnostics.find((d) => d.id === 'interview_coverage').status, 'unknown');
});

test('fixing only cutoff never makes the actual failed and confounded report ready', () => {
  const attributed = { ...source, knowledgeCutoff: '2026-10-24T00:00:00Z' }; // Invented timestamp isolates the other gates.
  const result = inspectSwarmSource(attributed, 'mine_approval');
  assert.equal(result.runs.runs.length, 6);
  assert.equal(result.status, 'fail');
  for (const readiness of Object.values(result.scenarioReadiness)) assert.equal(readiness.status, 'fail');
  assert.equal(result.diagnostics.find((d) => d.id === 'direction_proposed_tax').status, 'unknown');
});
