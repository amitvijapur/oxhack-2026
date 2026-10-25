import { inspectIntegratedSources, runWorkbench } from '../../../model/tok-option/workbench.mjs';

/** Inspect source readiness without supplying hypothetical contract economics. */
export function inspectRealInputs(features) {
  return runWorkbench({ features, controls: { mode: 'real' } });
}

/** The model's observed-evidence screen for both comparison areas. */
export function evidenceByArea(features) {
  return ['A', 'B'].map((area) => runWorkbench({ features, controls: { area } }).evidence);
}

/** Recorded land layers at each sample point (claims, state land), from the team's pinned land bundle. */
export function landRecordsFor(sampleIds) {
  const audit = ['A', 'B'].map((area) => inspectIntegratedSources(area).land);
  const matches = new Map(audit.flatMap((land) => land.sampleMatches).map((sample) => [sample.sampleId, sample]));
  return { samples: sampleIds.map((id) => matches.get(id)).filter(Boolean), provenance: audit[0].provenance };
}

/**
 * The opening projection, all from the team model: the descriptive 2020–25 gold CAGR from the land
 * bundle, and the demo option's 30/90/180-day horizons with that growth applied. Demo economics are
 * the model's hypothetical inputs, not an available contract.
 */
export function projectionHorizons(features) {
  const trend = inspectIntegratedSources().land.goldTrend;
  const run = runWorkbench({ features, controls: { mode: 'demo', annualGrowthRate: trend.annualGrowthRate ?? 0 } });
  return {
    trend,
    controls: run.controls,
    horizons: run.horizons.map(({ days, baseline }) => ({
      days,
      status: baseline?.status ?? null,
      assignmentValueUsd: baseline?.assignmentValueUsd ?? null,
      saleProbability: baseline?.saleProbability ?? null,
      expectedNetCashUsd: baseline?.expectedNetCashUsd ?? null,
      amountAtRiskUsd: baseline?.amountAtRiskUsd ?? null,
    })),
  };
}

/** The model's descriptive five-year gold trend (2020–25 annual means), without running the workbench. */
export function goldTrend() {
  return inspectIntegratedSources().land.goldTrend;
}
