import { GROUPS, WEIGHTS, within } from './config.mjs';
import { parseSwarmImport, validateWeights } from './swarm.mjs';

export const ILLUSTRATIVE_CONTRAST_METHOD = 'matched-placebo-post-contrast-v1';
const REFERENCE_RUN_ID = '04_placebo_s1';
const EVENT_RUN_IDS = Object.freeze({ mine_approval: '05_mine_approved_s1', mine_blocked: '06_court_blocks_mine_s1' });
const DAYS = Object.freeze([3, 4, 5]);
const CONFIG_FIELDS = Object.freeze(['provider', 'modelName', 'tier1Model', 'tier2Model', 'tier3Model', 'mirofishCommit', 'patchSha256', 'minutesPerRound', 'tiers', 'memoryTokenLimit', 'maxCommentsPerPost', 'llmSemaphore']);
const cutoffError = 'A valid knowledgeCutoff timestamp is required.';
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const knownText = (value) => typeof value === 'string' && value.trim().length > 0 && !['unknown', 'unverified', 'unavailable', 'null', 'none', 'undefined'].includes(value.trim().toLowerCase());
const stableValue = (value) => record(value) ? JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : JSON.stringify(value);

function validConfigValue(field, value) {
  if (field === 'tiers') return record(value) && Object.keys(value).length === 3 && ['1', '2', '3'].every((tier) => Number.isSafeInteger(value[tier]) && value[tier] > 0);
  if (field === 'minutesPerRound') return within(value, Number.MIN_VALUE);
  if (['memoryTokenLimit', 'maxCommentsPerPost', 'llmSemaphore'].includes(field)) return (typeof value === 'string' && /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value))) || (Number.isSafeInteger(value) && value > 0);
  if (field === 'mirofishCommit') return typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);
  if (field === 'patchSha256') return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
  return knownText(value);
}

function comparePair(reference, scenario) {
  const missingFields = CONFIG_FIELDS.filter((field) => !validConfigValue(field, reference?.[field]) || !validConfigValue(field, scenario?.[field]));
  const differentFields = CONFIG_FIELDS.filter((field) => !missingFields.includes(field) && stableValue(reference[field]) !== stableValue(scenario[field]));
  return { status: missingFields.length ? 'unknown' : differentFields.length ? 'different' : 'match', fields: [...CONFIG_FIELDS], missingFields, differentFields, reference: reference ?? null, scenario: scenario ?? null };
}

function groupWindow(run, group) {
  const daily = DAYS.map((day) => run.days.find((row) => row.day === day));
  // These are published daily means, not arrays of raw posts. Preserve the
  // separately attested post counts rather than treating each mean as one post.
  if (daily.some((row) => !record(row?.groups) || Object.keys(row.groups).length !== GROUPS.length || GROUPS.some((name) => !Object.hasOwn(row.groups, name)))) return null;
  const values = daily.map((row) => row.groups[group]);
  const counts = DAYS.map((day) => run.sourcePostCounts?.[day]?.[group]);
  if (values.some((scores) => !Array.isArray(scores) || scores.length !== 1 || !within(scores[0], 0, 10)) || counts.some((count) => !Number.isSafeInteger(count) || count < 1)) return null;
  const dailyMeans = values.map(([value]) => value);
  return { mean: dailyMeans.reduce((sum, value) => sum + value, 0) / DAYS.length, dailyMeans, counts };
}

/** Post-only demonstration policy. It never changes original research checks. */
export function mapIllustrativeContrast({ source, scenarioId, weights = WEIGHTS, exposure = 1, retention = 1, cap = 0.07 } = {}) {
  const document = source?.diagnosticRuns;
  const metadata = source?.provenance;
  const researchReadiness = { status: source?.status ?? 'unknown', diagnostics: source?.diagnostics ?? [], scenarioReadiness: source?.scenarioReadiness?.[scenarioId] ?? { status: 'unknown', reasons: ['scenario_readiness_unavailable'] } };
  const empty = {
    status: 'PENDING_SWARM', value: null, adjustment: null, groups: [], reasons: [],
    provenance: 'simulated', usagePolicy: 'illustrative_contrast', methodVersion: ILLUSTRATIVE_CONTRAST_METHOD,
    comparisonMethod: 'matched_configuration_placebo_contrast', referenceRunId: REFERENCE_RUN_ID,
    baselineRunId: REFERENCE_RUN_ID, scenarioRunId: EVENT_RUN_IDS[scenarioId] ?? null, scenarioId,
    sourceId: metadata?.sourceId ?? null, revision: metadata?.revision ?? null,
    knowledgeCutoff: metadata?.knowledgeCutoff ?? null, scoreWindow: [...DAYS],
    scoreMetric: 'mining_support', scoreAggregation: 'equal_daily_means',
    originalSourceChecks: document?.sourceChecks ?? null, researchReadiness, demoEligible: false,
  };
  const reject = (...reasons) => ({ ...empty, reasons });
  const weightErrors = validateWeights(weights);
  if (weightErrors.length || !within(exposure, 0, 1) || !within(retention, 0, 1) || !within(cap, 0, 0.07)) return reject(...weightErrors, ...(!within(exposure, 0, 1) || !within(retention, 0, 1) || !within(cap, 0, 0.07) ? ['invalid_scenario_adjustment'] : []));
  if (!Object.hasOwn(EVENT_RUN_IDS, scenarioId)) return reject('illustrative_contrast_scenario_unavailable');
  if (!record(source) || !record(document) || metadata?.type !== 'simulated' || document.provenance !== 'simulated' || !knownText(metadata.sourceId) || document.sourceId !== metadata.sourceId || typeof metadata.revision !== 'string' || !/^[a-f0-9]{40}$/i.test(metadata.revision)) return reject('illustrative_contrast_source_unavailable');
  if (document.scoreAggregation !== 'daily_group_mean' || !Array.isArray(document.runs)) return reject('invalid_illustrative_score_aggregation');
  if (metadata.knowledgeCutoff !== document.knowledgeCutoff || (metadata.knowledgeCutoff !== null && (typeof metadata.knowledgeCutoff !== 'string' || !Number.isFinite(Date.parse(metadata.knowledgeCutoff))))) return reject('invalid_illustrative_source_cutoff');
  const references = document.runs.filter((run) => run?.runId === REFERENCE_RUN_ID);
  const scenarios = document.runs.filter((run) => run?.runId === EVENT_RUN_IDS[scenarioId]);
  if (references.length !== 1 || scenarios.length !== 1) return reject('missing_or_duplicate_illustrative_run');
  const reference = references[0];
  const scenario = scenarios[0];
  if (reference.scenarioId !== 'sports_placebo' || scenario.scenarioId !== scenarioId || reference.seed !== 1 || scenario.seed !== 1) return reject('invalid_illustrative_run_identity');
  // The explicit post-only demo permits an unknown cutoff, never an invented
  // timestamp. Other normalized schema failures remain structural blockers.
  const parsed = parseSwarmImport(JSON.stringify({ ...document, runs: [reference, scenario] }));
  const structuralErrors = parsed.errors.filter((error) => error !== cutoffError);
  if (structuralErrors.length) return reject('invalid_illustrative_score_structure', ...structuralErrors);
  const pairwiseConfiguration = comparePair(reference.configuration, scenario.configuration);
  if (pairwiseConfiguration.status !== 'match') return { ...reject('illustrative_configuration_not_matched'), pairwiseConfiguration };
  const groups = GROUPS.map((group) => {
    const r = groupWindow(reference, group);
    const s = groupWindow(scenario, group);
    const delta = r && s ? (s.mean - r.mean) / 10 : null;
    return { group, weight: weights[group], baselineMean: r?.mean ?? null, referenceMean: r?.mean ?? null, scenarioMean: s?.mean ?? null, delta, contribution: delta === null ? null : weights[group] * delta, baselineCounts: r?.counts ?? [], scenarioCounts: s?.counts ?? [], referenceDailyMeans: r?.dailyMeans ?? [], scenarioDailyMeans: s?.dailyMeans ?? [] };
  });
  if (groups.some((group) => group.delta === null)) return { ...reject('missing_illustrative_group_day_or_count'), groups, pairwiseConfiguration };
  const value = Math.max(-1, Math.min(1, groups.reduce((sum, group) => sum + group.contribution, 0)));
  return {
    ...empty, status: 'ready', value, adjustment: cap * value * exposure * retention, groups,
    demoEligible: true, pairwiseConfiguration, diagnosticOnly: false,
    transfer: { cap, exposure, retention, assumed: true },
    limitations: [
      'Actual simulated post scores are contrasted with the matching Claude sports placebo, not an untreated control. This does not identify a causal news effect.',
      'The original failed or missing research checks and unknown source cutoff remain unchanged. Missing interviews are not imputed.',
      'One seed per condition and dependent posts do not estimate forecast uncertainty. Mining support is not willingness to buy a mineral option.',
      'The price transfer is a hypothetical assignment-value sensitivity, not a fitted gold-price or land-price prediction. Sale hazard and geology are unchanged.',
    ],
  };
}
