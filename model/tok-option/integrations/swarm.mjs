import { GROUPS, NEWS_SCENARIOS, within } from '../config.mjs';
import { parseSwarmImport } from '../swarm.mjs';

export const SOURCE_SCENARIOS = Object.freeze({ baseline: 'baseline', mine_approved: 'mine_approval', tax_rise: 'proposed_tax', protest: 'protest', court_blocks_mine: 'mine_blocked', gold_back_to_4000: 'gold_reversal', placebo: 'sports_placebo' });
export const SOURCE_GROUPS = Object.freeze({ government: 'government', land_industry: 'industry', land_community: 'community', funds: 'funds', retail: 'retail' });
const EXPECTED = Object.freeze({ mine_approval: { funds: 1, government: 1, community: -1 }, proposed_tax: { funds: -1, industry: -1 }, protest: { community: -1, government: -1, funds: -1 }, mine_blocked: { funds: -1 }, gold_reversal: { funds: -1, retail: -1 } });
const requiredDays = [3, 4, 5];
const aggregate = (statuses) => statuses.includes('fail') ? 'fail' : statuses.length && statuses.every((s) => s === 'pass') ? 'pass' : 'unknown';
const diagnostic = (id, label, status, detail) => ({ id, label, status, detail });
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const checkStatuses = ['pass', 'fail', 'unknown', 'not run', 'pass, partly not run'];
function validateSourceChecks(checks) {
  if (checks == null) return [];
  if (!record(checks)) return ['sourceChecks must be an object when supplied.'];
  const errors = [];
  for (const [name, check] of Object.entries(checks)) {
    if (check == null) continue;
    if (!record(check) || !checkStatuses.includes(check.status)) { errors.push(`sourceChecks.${name} must be a check object with a supported status.`); continue; }
    if (check.scope != null && typeof check.scope !== 'string') errors.push(`sourceChecks.${name}.scope must be text.`);
    if (Object.hasOwn(check, 'parts') && (!Array.isArray(check.parts) || check.parts.some((p) => !record(p) || !checkStatuses.includes(p.status)))) errors.push(`sourceChecks.${name}.parts must be an array of check objects with supported statuses.`);
  }
  return errors;
}
const findPart = (check, name) => Array.isArray(check?.parts) ? check.parts.find((p) => record(p) && p.part === name) : undefined;
const reportedStatus = (check) => {
  if (!record(check) || validateSourceChecks({ check }).length || !['pass', 'fail'].includes(check.status)) return 'unknown';
  if (check.status === 'fail') return 'fail';
  if (Array.isArray(check.parts) && (!check.parts.length || check.parts.some((p) => p.status !== 'pass'))) return check.parts.some((p) => p.status === 'fail') ? 'fail' : 'unknown';
  return 'pass';
};

/** Accept the upstream report only with explicit source metadata, never an inferred cutoff. */
export function normalizeSwarmReport(report, metadata = {}) {
  if (!report || !Array.isArray(report.runs)) return { runs: null, errors: ['The source report must contain runs.'] };
  if (!record(metadata)) return { runs: null, errors: ['Explicit source metadata must be an object.'] };
  const errors = [...validateSourceChecks(report.checks), ...validateSourceChecks({ judge: metadata.judgeCheck })];
  const runs = [];
  for (const row of report.runs) {
    if (!row || !SOURCE_SCENARIOS[row.scenario]) { errors.push('The source report contains an unsupported scenario.'); continue; }
    if (row.status !== 'judged') continue;
    if (!row.daily || typeof row.daily !== 'object' || Array.isArray(row.daily)) { errors.push(`${row.folder}: judged run is missing daily means.`); continue; }
    if (Object.keys(row.daily).some((g) => !SOURCE_GROUPS[g])) errors.push(`${row.folder}: unsupported source group.`);
    const days = [];
    const sourcePostCounts = {};
    for (const day of [1, 2, 3, 4, 5]) {
      const groups = {};
      sourcePostCounts[day] = {};
      for (const [sourceGroup, canonical] of Object.entries(SOURCE_GROUPS)) {
        const cell = row.daily[sourceGroup]?.[day];
        if (cell == null) continue;
        if (!Number.isSafeInteger(cell.heat) || cell.heat < 0 || (cell.support === null ? cell.heat !== 0 : !within(cell.support, 0, 10) || cell.heat === 0)) {
          errors.push(`${row.folder}: invalid ${sourceGroup} day ${day} support/count.`); continue;
        }
        // One published daily mean, explicitly not one raw scored post.
        groups[canonical] = cell.support === null ? [] : [cell.support];
        sourcePostCounts[day][canonical] = cell.heat;
      }
      days.push({ day, groups });
    }
    if (row.unmapped_posts > 0) errors.push(`${row.folder}: source reports unmapped posts.`);
    if (row.outcome && row.outcome !== 'ok') errors.push(`${row.folder}: simulation outcome is not ok.`);
    runs.push({ scenarioId: SOURCE_SCENARIOS[row.scenario], seed: row.seed, runId: row.folder, days, sourcePostCounts });
  }
  const document = {
    version: 1, provenance: 'simulated', sourceId: metadata.sourceId,
    knowledgeCutoff: metadata.knowledgeCutoff, eventDefinition: metadata.eventDefinition,
    scoreMetric: 'mining_support', scoreRange: [0, 10], scoreAggregation: 'daily_group_mean',
    generatedAt: report.generated ?? null, sourceChecks: { ...(report.checks ?? {}), judge: metadata.judgeCheck ?? report.checks?.judge }, runs,
  };
  const parsed = parseSwarmImport(JSON.stringify(document));
  return errors.length || parsed.errors.length ? { runs: null, errors: [...new Set([...errors, ...parsed.errors])] } : parsed;
}

function meanFor(document, scenarioId, group, seed = 1) {
  const run = document.runs.find((r) => r.scenarioId === scenarioId && r.seed === seed);
  const means = requiredDays.map((day) => {
    const scores = run?.days?.find((d) => d.day === day)?.groups?.[group];
    return scores?.length && scores.every((s) => within(s, 0, 10)) ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  });
  return means.some((m) => m === null) ? null : means.reduce((a, b) => a + b, 0) / means.length;
}

/** Simulator checks only. A pass does not establish predictive trading value. */
export function inspectNormalizedSwarmDiagnostics(document, scenarioId = 'baseline') {
  const parsed = document ? parseSwarmImport(JSON.stringify(document)) : { runs: null, errors: ['No completed swarm export is supplied.'] };
  const errors = [...parsed.errors, ...validateSourceChecks(document?.sourceChecks)];
  const synthetic = document?.provenance === 'synthetic';
  const valid = errors.length === 0;
  const readMean = (scenario, group, seed) => valid ? meanFor(document, scenario, group, seed) : null;
  const baselineSpread = GROUPS.map((group) => {
    const means = [1, 2, 3].map((seed) => readMean('baseline', group, seed));
    return { group, seedMeans: means, band: means.every((m) => m !== null) ? Math.max(...means) - Math.min(...means) : null };
  });
  const bands = Object.fromEntries(baselineSpread.map((r) => [r.group, r.band]));
  const allBands = baselineSpread.every((r) => r.band !== null);
  const effect = (scenario, group) => {
    const a = readMean(scenario, group, 1); const b = readMean('baseline', group, 1);
    return a === null || b === null ? null : a - b;
  };
  const hasScenario = (scenario) => GROUPS.every((g) => readMean(scenario, g, 1) !== null);
  const placeboComplete = allBands && hasScenario('sports_placebo');
  const placeboQuiet = placeboComplete ? GROUPS.every((g) => Math.abs(effect('sports_placebo', g)) <= bands[g] + 1e-9) : null;
  const sourceChecks = valid ? document.sourceChecks ?? {} : {};
  const sourceVeto = (computed, reported) => reportedStatus(reported) === 'fail' ? 'fail' : computed;
  const diagnostics = [
    diagnostic('judge', 'Human check of scoring judge', reportedStatus(sourceChecks.judge), sourceChecks.judge?.scope ?? 'Requires a reported human agreement check; simulation scores alone cannot supply it.'),
    diagnostic('baseline_spread', 'Three-baseline spread available', allBands ? 'pass' : 'unknown', allBands ? 'Days 3–5 group means from seeds 1, 2 and 3 define max-minus-min chance bands.' : 'Complete days 3–5 group means from baseline seeds 1, 2 and 3 are required.'),
    diagnostic('placebo', 'Placebo remains inside baseline bands', sourceVeto(placeboQuiet === null ? 'unknown' : placeboQuiet ? 'pass' : 'fail', findPart(sourceChecks.placebo, 'placebo moves no group beyond its band')), placeboComplete ? 'Compares every group with the same-seed baseline; no placebo effect may exceed its baseline spread.' : 'The placebo and three scored baselines are required.'),
    diagnostic('baseline_calls', 'Baseline interview-call stability', reportedStatus(sourceChecks.stability), 'Upstream check requires at least two of three baseline majority calls to agree.'),
    diagnostic('grounding', 'Interview evidence grounding', reportedStatus(sourceChecks.grounding), 'Requires the upstream sampled-answer grounding check; no market outcome is tested.'),
  ];
  const shared = () => diagnostics.filter((d) => ['judge', 'baseline_spread', 'placebo', 'baseline_calls', 'grounding'].includes(d.id));
  const scenarioReadiness = {};
  for (const scenario of NEWS_SCENARIOS) {
    let status = 'unknown';
    if (placeboComplete && hasScenario(scenario)) {
      status = Object.entries(EXPECTED[scenario]).some(([g, direction]) => {
        const change = effect(scenario, g);
        return change * direction > 0 && Math.abs(change) > bands[g] + 1e-9 && Math.abs(change) > Math.abs(effect('sports_placebo', g)) + 1e-9;
      }) ? 'pass' : 'fail';
    }
    const sourceName = Object.keys(SOURCE_SCENARIOS).find((name) => SOURCE_SCENARIOS[name] === scenario);
    status = sourceVeto(status, findPart(sourceChecks.placebo, sourceName));
    const directionCheck = diagnostic(`direction_${scenario}`, `${scenario.replaceAll('_', ' ')} expected response`, status, 'At least one pre-registered group must move in the expected direction beyond both its chance band and the placebo effect.');
    diagnostics.push(directionCheck);
    let mirror = null;
    if (['mine_approval', 'mine_blocked'].includes(scenario)) {
      const a = effect('mine_approval', 'funds'); const b = effect('mine_blocked', 'funds');
      const ready = a !== null && b !== null && bands.funds !== null;
      const ok = ready && a * b < 0 && Math.abs(a) > bands.funds + 1e-9 && Math.abs(b) > bands.funds + 1e-9;
      const reportPart = findPart(sourceChecks.mirrors, 'funds move opposite ways after mine approved and court blocks, both beyond the band');
      mirror = diagnostic(`mirror_${scenario}`, 'Approval and court-block mirror', sourceVeto(!ready ? 'unknown' : ok ? 'pass' : 'fail', reportPart), 'Fund responses must oppose each other and each exceed the baseline band.');
    } else if (scenario === 'gold_reversal') {
      const ready = ['funds', 'retail'].every((g) => effect(scenario, g) !== null && bands[g] !== null);
      const ok = ready && ['funds', 'retail'].every((g) => effect(scenario, g) < -bands[g] - 1e-9);
      const reportPart = findPart(sourceChecks.mirrors, 'funds and retail fall beyond their bands when gold drops back');
      mirror = diagnostic('mirror_gold_reversal', 'Gold-reversal mirror', sourceVeto(!ready ? 'unknown' : ok ? 'pass' : 'fail', reportPart), 'Fund and retail support must both fall beyond their baseline bands.');
    }
    if (mirror) diagnostics.push(mirror);
    const applicable = [...shared(), directionCheck, ...(mirror ? [mirror] : [])];
    scenarioReadiness[scenario] = { status: synthetic ? 'unknown' : aggregate(applicable.map((d) => d.status)), reasons: synthetic ? ['Synthetic inputs are demonstrations, not completed simulator checks.'] : applicable.filter((d) => d.status !== 'pass').map((d) => `${d.label}: ${d.status}`) };
  }
  scenarioReadiness.baseline = { status: synthetic ? 'unknown' : aggregate(shared().map((d) => d.status)), reasons: ['Baseline is diagnostic only and has no news adjustment.'] };
  scenarioReadiness.sports_placebo = { status: synthetic ? 'unknown' : aggregate(shared().map((d) => d.status)), reasons: ['Placebo is diagnostic only and cannot authorize entry.'] };
  if (synthetic) for (const d of diagnostics) { d.status = 'unknown'; d.detail = `Synthetic demonstration only. ${d.detail}`; }
  return { status: synthetic ? 'synthetic' : scenarioReadiness[scenarioId]?.status ?? 'unknown', diagnostics, scenarioReadiness, baselineSpread, errors, limitation: 'These checks measure simulator consistency, not predictive market performance.' };
}

export function inspectSwarmSource(source, scenarioId = 'baseline') {
  const report = source?.report;
  const normalized = report ? normalizeSwarmReport(report, source) : { runs: null, errors: [] };
  const checks = inspectNormalizedSwarmDiagnostics(normalized.runs, scenarioId);
  // The pinned pilot judge check is real evidence even though scenario diagnostics are absent.
  if (!report && source?.judgeCheck) {
    const judgeStatus = reportedStatus(source.judgeCheck);
    checks.diagnostics[0] = diagnostic('judge', 'Human check of scoring judge', judgeStatus, `${source.judgeCheck.withinTolerance}/${source.judgeCheck.sampleSize} pilot scores within ${source.judgeCheck.tolerancePoints} points; threshold ${source.judgeCheck.minimumRequired}/${source.judgeCheck.sampleSize}. This does not validate market prediction.`);
    for (const readiness of Object.values(checks.scenarioReadiness)) {
      readiness.reasons = readiness.reasons.filter((reason) => !reason.startsWith('Human check of scoring judge:'));
      if (judgeStatus !== 'pass') readiness.reasons.push(`Human check of scoring judge: ${judgeStatus}`);
      if (judgeStatus === 'fail') readiness.status = 'fail';
    }
  }
  const inventory = source?.inventory;
  const coverage = [
    diagnostic('planned_runs', 'Scenario run inputs', inventory?.runInputConfigurations === 9 ? 'pass' : 'unknown', `${inventory?.runInputConfigurations ?? 0}/9 configurations supplied. Configurations are not completed simulations.`),
    diagnostic('pilot', 'One-day pilot output', source?.pilot?.days?.includes(1) ? 'pass' : 'unknown', source?.pilot?.detail ?? 'Pilot output not supplied.'),
    diagnostic('full_runs', 'Completed scored scenario runs', normalized.runs && NEWS_SCENARIOS.every((id) => checks.scenarioReadiness[id]?.status === 'pass') ? 'pass' : 'unknown', report ? 'Daily output and applicable quality checks must pass for each scenario.' : 'No final report exists in the pinned branch tree; the day-1 pilot cannot supply day-3 scenario effects.'),
    diagnostic('knowledge_cutoff', 'Scenario source knowledge cutoff', typeof source?.knowledgeCutoff === 'string' && Number.isFinite(Date.parse(source.knowledgeCutoff)) ? 'pass' : 'unknown', 'Input information availability must be supplied separately from generation, commit and retrieval times.'),
  ];
  return { ...checks, status: normalized.errors.length ? 'INVALID_SWARM_SOURCE' : normalized.runs ? checks.status : 'PENDING_SWARM', runs: normalized.runs, coverage, errors: normalized.errors, pilot: source?.pilot ?? null, provenance: { type: 'simulated', sourceId: source?.sourceId ?? null, branch: source?.branch ?? null, revision: source?.commit ?? null, sourceUrl: source?.repository && source?.commit ? `https://github.com/${source.repository}/tree/${source.commit}/swarm` : null, commit: source?.commit ?? null, committedAt: source?.committedAt ?? null, retrievedAt: source?.retrievedAt ?? null, knowledgeCutoff: source?.knowledgeCutoff ?? null }, sourceFiles: source?.sourceFiles ?? [] };
}
