import { inspectIntegratedSources } from '../../../model/tok-option/workbench.mjs';
import { WEIGHTS } from '../../../model/tok-option/config.mjs';
import { SOURCE_GROUPS } from '../../../model/tok-option/integrations/swarm.mjs';
import swarmSource from '../../../model/tok-option/data/swarm-source.json' with { type: 'json' };

/** Plain names for the source report's scenario folders and stakeholder groups. */
const SCENARIO_LABELS = {
  baseline: 'Baseline', placebo: 'Placebo (sports news)', mine_approved: 'Mine approved', court_blocks_mine: 'Court blocks mine',
  tax_rise: 'Tax rise', protest: 'Protest', gold_back_to_4000: 'Gold back to $4,000',
};
const GROUP_LABELS = { government: 'Government', land_industry: 'Industry', land_community: 'Community', funds: 'Funds', retail: 'Retail' };

/**
 * One read of the pinned swarm bundle for display. Every value comes from
 * `model/tok-option/data/swarm-source.json` or the model's own diagnostics.
 * Replacing that bundle (and passing the model tests) updates this view.
 */
export function swarmView() {
  const report = swarmSource.report;
  const audit = inspectIntegratedSources().swarm;
  const groups = Object.keys(SOURCE_GROUPS).map((key) => ({ key, label: GROUP_LABELS[key], canonical: SOURCE_GROUPS[key], weight: WEIGHTS[SOURCE_GROUPS[key]] }));
  const runs = report.runs.map((run) => ({
    id: run.folder,
    scenario: run.scenario,
    label: `${SCENARIO_LABELS[run.scenario] ?? run.scenario}${run.scenario === 'baseline' ? ` · seed ${run.seed}` : ''}`,
    seed: run.seed,
    judged: run.status === 'judged',
    status: run.status,
    tiers: run.tiers,
    minutesPerRound: run.minutes_per_round,
    provider: run.configuration?.provider ?? null,
    models: run.configuration ? [run.configuration.tier1Model, run.configuration.tier2Model, run.configuration.tier3Model] : null,
    simulatorCommit: run.configuration?.mirofishCommit ?? null,
    interviews: run.interviewCoverage ?? null,
    calls: run.calls ?? null,
    days3to5: run.days3to5 ?? null,
    /** daily[group] = [{ day, support, posts }] for days 1–5. */
    daily: run.daily ? Object.fromEntries(groups.map((g) => [g.key, [1, 2, 3, 4, 5].map((day) => ({ day, support: run.daily[g.key]?.[day]?.support ?? null, posts: run.daily[g.key]?.[day]?.heat ?? 0 }))])) : null,
    scoredRows: run.scoreRows ?? null,
  }));
  return {
    source: { branch: swarmSource.branch, commit: swarmSource.commit, committedAt: swarmSource.committedAt, repository: swarmSource.repository, knowledgeCutoff: swarmSource.knowledgeCutoff },
    news: swarmSource.eventDefinition,
    judgeModel: report.judge_model,
    judge: swarmSource.judgeCheck,
    inventory: swarmSource.inventory,
    limitations: swarmSource.limitations,
    groups,
    runs,
    bands: report.chance_band,
    effects: Object.entries(report.effects ?? {}).map(([scenario, byGroup]) => ({ scenario, label: SCENARIO_LABELS[scenario] ?? scenario, byGroup })),
    checks: Object.entries(report.checks ?? {}).map(([id, check]) => ({ id, status: check.status, parts: check.parts ?? [] })),
    diagnostics: audit.diagnostics,
    readiness: audit.scenarioReadiness,
    limitation: audit.limitation,
  };
}
