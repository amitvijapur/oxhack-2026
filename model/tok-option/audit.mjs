import { readFile } from 'node:fs/promises';
import { DEFAULT_CONTROLS, inspectIntegratedSources, runWorkbench } from './workbench.mjs';

const features = (await Promise.all(['a', 'b'].map(async (area) => JSON.parse(await readFile(new URL(`../../frontend/public/data/tok-gold/site-${area}/samples.geojson`, import.meta.url), 'utf8')).features))).flat();
const sourceAudit = inspectIntegratedSources();
const auditCase = (label, controls) => {
  const r = runWorkbench({ features, controls: { ...DEFAULT_CONTROLS, mode: 'demo', ...controls } });
  return { label, mode: r.mode, status: r.status, evidenceGate: r.evidence.gate, signal: r.signal.value, reasons: r.reasons, assignmentValueUsd: r.mapped?.assignmentValueUsd ?? null, expectedNetCashUsd: r.mapped?.expectedNetCashUsd ?? null, action: r.mapped?.entryAction ?? null, cashDiagnostics: r.cashDiagnostics.mapped };
};
console.log(JSON.stringify({
  description: 'Pinned-source audit. Assumed economics, descriptive historical growth and simulated reactions are not measured predictive edge.',
  sources: { land: sourceAudit.land.provenance, swarm: sourceAudit.swarm.provenance },
  areaContext: ['A', 'B'].map((area) => ({ area, ...inspectIntegratedSources(area).land.summary })),
  goldTrend: sourceAudit.land.goldTrend,
  coverage: [...sourceAudit.land.coverage, ...sourceAudit.swarm.coverage, ...sourceAudit.modelGaps.filter((row) => row.id === 'predictive_validation')],
  swarmDiagnostics: sourceAudit.swarm.diagnostics,
  cases: [
    auditCase('Unchanged demo baseline', {}),
    auditCase('Historical annual-mean CAGR applied explicitly as a demo assumption', { annualGrowthRate: sourceAudit.land.goldTrend.annualGrowthRate }),
    auditCase('Actual branch swarm, mine approval remains pending', { scenarioId: 'mine_approval' }),
    auditCase('Area B still fails the geological screen', { area: 'B' }),
    auditCase('Real inputs still incomplete', { mode: 'real' }),
  ],
}, null, 2));
