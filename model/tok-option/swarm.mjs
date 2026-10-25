import { GROUPS, WEIGHTS, SCENARIOS, within, unique } from './config.mjs';

export function validateWeights(weights = WEIGHTS) {
  if (!weights || GROUPS.some((g) => !within(weights[g], 0, 1)) || Object.keys(weights).some((g) => !GROUPS.includes(g))) return ['invalid_stakeholder_weights'];
  return Math.abs(GROUPS.reduce((sum, g) => sum + weights[g], 0) - 1) <= 1e-9 ? [] : ['stakeholder_weights_must_sum_to_one'];
}

/** Normalized daily-score contract. Upstream scored reports use integrations/swarm.mjs. */
export function parseSwarmImport(text) {
  let data;
  try { data = typeof text === 'string' ? JSON.parse(text) : null; } catch { return { runs: null, errors: ['Invalid JSON. Use the documented swarm import format.'] }; }
  if (!data || Array.isArray(data) || typeof data !== 'object') return { runs: null, errors: ['Import must be a JSON object.'] };
  const errors = [];
  if (data.version !== 1) errors.push('version must equal 1.');
  if (!['synthetic', 'simulated'].includes(data.provenance)) errors.push('provenance must be synthetic or simulated.');
  if (typeof data.sourceId !== 'string' || !data.sourceId.trim()) errors.push('A sourceId is required.');
  if (typeof data.knowledgeCutoff !== 'string' || !Number.isFinite(Date.parse(data.knowledgeCutoff))) errors.push('A valid knowledgeCutoff timestamp is required.');
  if (typeof data.eventDefinition !== 'string' || !data.eventDefinition.trim()) errors.push('eventDefinition is required, including the common baseline condition.');
  if (data.scoreMetric !== 'mining_support' || !Array.isArray(data.scoreRange) || data.scoreRange.length !== 2 || data.scoreRange[0] !== 0 || data.scoreRange[1] !== 10) errors.push('Scores must explicitly mean mining_support on scoreRange [0,10].');
  if (!Array.isArray(data.runs) || data.runs.length === 0 || data.runs.length > 100) errors.push('Supply 1 to 100 runs.');
  const keys = new Set();
  for (const run of Array.isArray(data.runs) ? data.runs : []) {
    if (!run || typeof run !== 'object') { errors.push('Each run must be an object.'); continue; }
    if (!SCENARIOS.includes(run.scenarioId)) errors.push(`Unsupported scenarioId: ${String(run.scenarioId)}.`);
    if (!Number.isSafeInteger(run.seed) || run.seed < 1 || typeof run.runId !== 'string' || !run.runId.trim()) errors.push('Each run needs a positive integer seed and runId.');
    const key = `${run.scenarioId}:${run.seed}`;
    if (keys.has(key)) errors.push(`Duplicate scenario/seed: ${key}.`);
    keys.add(key);
    if (!Array.isArray(run.days) || run.days.length > 100) { errors.push(`${key} days must be an array of at most 100 days.`); continue; }
    const days = new Set();
    for (const day of run.days) {
      if (!day || !Number.isSafeInteger(day.day) || day.day < 1 || !day.groups || typeof day.groups !== 'object' || Array.isArray(day.groups)) { errors.push(`${key} has an invalid day or groups object.`); continue; }
      if (days.has(day.day)) errors.push(`${key} duplicates day ${day.day}.`);
      days.add(day.day);
      for (const [group, scores] of Object.entries(day.groups)) {
        if (!GROUPS.includes(group)) errors.push(`Unsupported group: ${group}.`);
        if (!Array.isArray(scores) || scores.length > 10000 || scores.some((score) => !within(score, 0, 10))) errors.push(`${key} day ${day.day} ${group} must contain finite scores from 0 to 10.`);
      }
    }
  }
  // Missing days/groups are accepted as incomplete simulations, then remain pending.
  return errors.length ? { runs: null, errors: unique(errors) } : { runs: data, errors: [] };
}

const groupMean = (run, group) => {
  const days = [3, 4, 5].map((day) => run?.days?.find((row) => row.day === day)?.groups?.[group]);
  if (days.some((scores) => !Array.isArray(scores) || scores.length === 0 || scores.some((score) => !within(score, 0, 10)))) return null;
  const dailyMeans = days.map((scores) => scores.reduce((a, b) => a + b, 0) / scores.length);
  return { mean: dailyMeans.reduce((a, b) => a + b, 0) / 3, dailyMeans, counts: days.map((scores) => scores.length) };
};

export function mapSwarm({ runs, scenarioId, weights = WEIGHTS, exposure = 1, retention = 1, cap = 0.07 } = {}) {
  const empty = { status: 'PENDING_SWARM', value: null, adjustment: null, groups: [], reasons: [], provenance: runs?.provenance ?? 'unavailable', sourceId: runs?.sourceId ?? null };
  const weightErrors = validateWeights(weights);
  if (weightErrors.length || !within(exposure, 0, 1) || !within(retention, 0, 1) || !within(cap, 0, 0.07)) return { ...empty, status: 'INSUFFICIENT_DATA', reasons: [...weightErrors, ...(!within(exposure, 0, 1) || !within(retention, 0, 1) || !within(cap, 0, 0.07) ? ['invalid_scenario_adjustment'] : [])] };
  if (!SCENARIOS.includes(scenarioId)) return { ...empty, status: 'INSUFFICIENT_DATA', reasons: ['unsupported_scenario'] };
  if (!runs) return { ...empty, reasons: ['swarm_import_required'] };
  const parsed = parseSwarmImport(JSON.stringify(runs));
  if (parsed.errors.length) return { ...empty, status: 'INSUFFICIENT_DATA', reasons: ['invalid_swarm_import', ...parsed.errors] };
  const baseline = runs.runs.find((run) => run.scenarioId === 'baseline' && run.seed === 1);
  const scenario = runs.runs.find((run) => run.scenarioId === scenarioId && run.seed === 1);
  if (!baseline || !scenario) return { ...empty, reasons: [!baseline ? 'missing_seed_1_baseline' : 'missing_seed_1_scenario'] };
  const groups = GROUPS.map((group) => {
    const b = groupMean(baseline, group);
    const s = groupMean(scenario, group);
    const delta = b && s ? (s.mean - b.mean) / 10 : null;
    const counts = (run, mean) => runs.scoreAggregation === 'daily_group_mean'
      ? [3, 4, 5].map((day) => run.sourcePostCounts?.[day]?.[group] ?? null)
      : mean?.counts ?? [];
    return { group, weight: weights[group], baselineMean: b?.mean ?? null, scenarioMean: s?.mean ?? null, delta, contribution: delta === null ? null : weights[group] * delta, baselineCounts: counts(baseline, b), scenarioCounts: counts(scenario, s) };
  });
  if (groups.some((group) => group.delta === null)) return { ...empty, groups, reasons: ['missing_required_group_or_day'] };
  const value = Math.max(-1, Math.min(1, groups.reduce((sum, group) => sum + group.contribution, 0)));
  const baselineSeedValues = runs.runs.filter((run) => run.scenarioId === 'baseline').map((run) => {
    const means = GROUPS.map((group) => groupMean(run, group));
    return means.some((mean) => mean === null) ? null : { seed: run.seed, weightedSupport: GROUPS.reduce((sum, group, i) => sum + weights[group] * means[i].mean, 0) };
  }).filter(Boolean);
  return { ...empty, status: 'ready', value, adjustment: cap * value * exposure * retention, groups, reasons: [], scenarioId, baselineRunId: baseline.runId, scenarioRunId: scenario.runId, baselineSeedValues, diagnosticOnly: ['baseline', 'sports_placebo'].includes(scenarioId) };
}
