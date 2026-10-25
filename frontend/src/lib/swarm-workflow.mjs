import { GROUPS, WEIGHTS, NEWS_SCENARIOS } from '../../../model/tok-option/config.mjs';
import { inspectSwarmSource, SOURCE_SCENARIOS } from '../../../model/tok-option/integrations/swarm.mjs';

const GROUP_META = Object.freeze({
  government: { label: 'Government', agents: 10, source: 'government' },
  industry: { label: 'Industry', agents: 13, source: 'land_industry' },
  community: { label: 'Community', agents: 7, source: 'land_community' },
  funds: { label: 'Funds', agents: 24, source: 'funds' },
  retail: { label: 'Retail', agents: 6, source: 'retail' },
});
const PLANNED = Object.freeze([
  ['01_baseline_s1', 'baseline', 1, 'Baseline / seed 1'],
  ['02_baseline_s2', 'baseline', 2, 'Baseline / seed 2'],
  ['03_baseline_s3', 'baseline', 3, 'Baseline / seed 3'],
  ['04_placebo_s1', 'sports_placebo', 1, 'Sports placebo'],
  ['05_mine_approved_s1', 'mine_approval', 1, 'Mine approval'],
  ['06_court_blocks_mine_s1', 'mine_blocked', 1, 'Court blocks mine'],
  ['07_tax_rise_s1', 'proposed_tax', 1, 'Tax proposal'],
  ['08_protest_s1', 'protest', 1, 'Local protest'],
  ['09_gold_back_to_4000_s1', 'gold_reversal', 1, 'Gold reversal'],
]);
const integer = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const finiteScore = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10;
const sumKnown = (values) => values.length && values.every((v) => v !== null) ? values.reduce((a, b) => a + b, 0) : null;
const meanKnown = (values) => values.length && values.every((v) => v !== null) ? values.reduce((a, b) => a + b, 0) / values.length : null;

function readCell(cell) {
  const count = integer(cell?.heat);
  if (cell?.support === null && count === 0) return { mean: null, count: 0 };
  return finiteScore(cell?.support) && count !== null && count > 0
    ? { mean: cell.support, count }
    : { mean: null, count: null };
}

function periodMean(run, id) {
  return meanKnown([3, 4, 5].map((day) => run?.days.find((d) => d.day === day)?.groups.find((g) => g.id === id)?.mean ?? null));
}

/** Descriptive mapping only. This cannot bypass the canonical readiness gate. */
function compareRun(run, runs, groups) {
  const baseline = runs.find((r) => r.scenario === 'baseline' && r.seed === run.seed && r.available);
  const rows = groups.map((group) => {
    const baselineMean = periodMean(baseline, group.id);
    const scenarioMean = periodMean(run, group.id);
    const delta = baselineMean === null || scenarioMean === null ? null : (scenarioMean - baselineMean) / 10;
    return { id: group.id, baselineMean, scenarioMean, delta, contribution: delta === null ? null : delta * group.weight };
  });
  const signal = sumKnown(rows.map((r) => r.contribution));
  return {
    baselineRunId: baseline?.id ?? null,
    window: [3, 4, 5],
    groups: rows,
    signal: signal === null ? null : Math.max(-1, Math.min(1, signal)),
    diagnosticOnly: true,
  };
}

/**
 * Summarize the pinned source report for a serializable display payload.
 * Full-run exports contain published daily group means and numeric-post counts,
 * not individual message text or wall-clock processing timestamps.
 */
export function buildWorkflowData(bundle) {
  const source = bundle && typeof bundle === 'object' ? bundle : {};
  const inspected = inspectSwarmSource(source);
  const groups = GROUPS.map((id) => ({ id, sourceId: GROUP_META[id].source, label: GROUP_META[id].label, agents: GROUP_META[id].agents, weight: WEIGHTS[id] }));
  const rawRuns = Array.isArray(source.report?.runs) ? source.report.runs : [];
  const runs = PLANNED.map(([id, scenario, seed, label]) => {
    const row = rawRuns.find((r) => r?.folder === id && SOURCE_SCENARIOS[r.scenario] === scenario && r.seed === seed);
    const available = row?.status === 'judged' && row.daily !== null && typeof row.daily === 'object' && !Array.isArray(row.daily);
    const days = available ? [1, 2, 3, 4, 5].map((day) => {
      const readings = groups.map((g) => ({ id: g.id, ...readCell(row.daily[GROUP_META[g.id].source]?.[day]) }));
      return { day, count: sumKnown(readings.map((g) => g.count)), groups: readings };
    }) : [];
    return {
      id, label, scenario, seed, available, days,
      totalRows: available ? integer(row.scoreRows?.total) : null,
      numericRows: available ? integer(row.scoreRows?.numeric) : null,
      nullRows: available ? integer(row.scoreRows?.offTopicOrNull) : null,
      configuration: available ? {
        provider: row.configuration?.provider ?? null,
        model: row.configuration?.modelName ?? null,
        minutesPerRound: row.configuration?.minutesPerRound ?? null,
        simulatorCommit: row.configuration?.mirofishCommit ?? null,
      } : null,
      readiness: inspected.scenarioReadiness?.[scenario] ?? { status: 'unknown', reasons: ['No scored output is supplied.'] },
    };
  });
  const available = runs.filter((r) => r.available);
  const checks = [...inspected.diagnostics];
  const interviewRows = rawRuns.filter((r) => r?.status === 'judged').map((r) => r.interviewCoverage);
  const monetaryReady = Boolean(inspected.runs && NEWS_SCENARIOS.every((id) => inspected.scenarioReadiness?.[id]?.status === 'pass'));
  return {
    source: {
      id: source.sourceId ?? null, commit: source.commit ?? null, ref: source.branch ?? null,
      committedAt: source.committedAt ?? null, retrievedAt: source.retrievedAt ?? null,
      knowledgeCutoff: source.knowledgeCutoff ?? null,
      url: source.repository && source.commit ? `https://github.com/${source.repository}/tree/${source.commit}/swarm` : null,
    },
    counts: {
      plannedRuns: PLANNED.length, availableRuns: available.length,
      scoreRows: sumKnown(available.map((r) => r.totalRows)),
      numericRows: sumKnown(available.map((r) => r.numericRows)),
      nullRows: sumKnown(available.map((r) => r.nullRows)),
      agents: groups.reduce((n, g) => n + g.agents, 0), groups: groups.length, newsWires: 1,
      interviewsExpected: sumKnown(interviewRows.map((r) => integer(r?.expected))),
      interviewsParsed: sumKnown(interviewRows.map((r) => integer(r?.parsedAnswers))),
    },
    groups,
    runs: runs.map((run) => ({ ...run, comparison: compareRun(run, runs, groups) })),
    checks,
    limitations: Array.isArray(source.limitations) ? [...source.limitations] : [],
    eventDefinition: source.eventDefinition ?? null,
    replayGrain: 'daily_group_mean',
    replayNote: 'Replay of recorded daily group means, not a live simulation or individual-post feed.',
    scoreMetric: 'Mining support at Tok', scoreRange: [0, 10],
    monetaryReady,
  };
}

/** Reveal only recorded days up to the replay cursor. An unavailable run stays empty. */
export function getReplayFrame(data, runId, day) {
  const run = data.runs.find((r) => r.id === runId) ?? null;
  const cursor = typeof day === 'number' && Number.isFinite(day) ? Math.max(0, Math.min(5, Math.floor(day))) : 0;
  const days = run?.available ? run.days.filter((d) => d.day <= cursor) : [];
  const selected = days.find((d) => d.day === cursor);
  return {
    run, day: cursor, days,
    groups: data.groups.map((group) => ({ ...group, ...(selected?.groups.find((g) => g.id === group.id) ?? { mean: null, count: null }) })),
    cumulativeCount: run?.available ? (cursor === 0 ? 0 : sumKnown(days.map((d) => d.count))) : null,
    complete: Boolean(run?.available && cursor === 5),
    comparison: run?.available && cursor === 5 ? run.comparison : null,
  };
}
