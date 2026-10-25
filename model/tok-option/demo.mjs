import { readFile } from 'node:fs/promises';
import { runWorkbench, DEFAULT_CONTROLS } from './workbench.mjs';
const features = (await Promise.all(['a', 'b'].map(async (area) => JSON.parse(await readFile(new URL(`../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url), 'utf8')).features))).flat();
const imported = JSON.parse(await readFile(new URL('./example-swarm.json', import.meta.url), 'utf8'));
const cases = [
  { label: 'Area A, baseline', area: 'A', scenarioId: 'baseline' },
  { label: 'Area A, synthetic +1 boundary', area: 'A', scenarioId: 'synthetic', syntheticSignal: 1 },
  { label: 'Area A, synthetic -1 boundary', area: 'A', scenarioId: 'synthetic', syntheticSignal: -1 },
  { label: 'Area A, synthetic import example', area: 'A', scenarioId: 'mine_approval' },
  { label: 'Area B, baseline screen fails', area: 'B', scenarioId: 'baseline' },
];
console.log(JSON.stringify({ provenance: 'Observed sediment evidence; all economics and simulation scores are hypothetical.', results: cases.map(({ label, ...controls }) => {
  const r = runWorkbench({ features, controls: { ...DEFAULT_CONTROLS, ...controls, mode: 'demo' }, swarmRuns: imported });
  return { label, evidence: { gate: r.evidence.gate, pass: r.evidence.pass, fail: r.evidence.fail, unknown: r.evidence.unknown }, signal: r.signal.value, assignmentValueUsd: r.mapped?.assignmentValueUsd, saleProbability: r.mapped?.saleProbability, expectedNetCashUsd: r.mapped?.expectedNetCashUsd, amountAtRiskUsd: r.mapped?.amountAtRiskUsd, unsoldResidualMarkUsd: r.mapped?.weightedNoSaleResidualMarkUsd, action: r.mapped?.entryAction, portfolio: r.portfolio.selectedIds };
}) }, null, 2));
