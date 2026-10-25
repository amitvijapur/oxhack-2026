import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runWorkbench, compareFeePolicies, DEFAULT_CONTROLS } from '../../model/tok-option/workbench.mjs';
import { LOT_BASIS, SYNTHETIC_LOT_PROFILE } from '../../model/tok-option/lot-basis.mjs';
import { CAPITAL } from '../../model/tok-option/config.mjs';
import { requiredAssignmentProceeds } from '../../model/tok-option/diagnostics.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const snapshot = JSON.parse(await readFile(path.join(root, 'frontend/src/lib/algorithm-workflow.json'), 'utf8'));
const inputHashes = snapshot.source.inputHashes;
async function verifyInputs() {
  for (const [name, expected] of Object.entries(inputHashes)) {
    const current = createHash('sha256').update(await readFile(path.join(root, name))).digest('hex');
    const committed = createHash('sha256').update(execFileSync('git', ['show', `${snapshot.source.commit}:${name}`], { cwd: root })).digest('hex');
    if (current !== expected || committed !== expected) throw new Error(`Model/input differs from the pinned snapshot: ${name}`);
  }
}
await verifyInputs();
const features = (await Promise.all(['a', 'b'].map(async area => JSON.parse(await readFile(path.join(root, `frontend/public/data/tok-gold/site-${area}/samples.geojson`), 'utf8')).features))).flat();
const run = controls => runWorkbench({ features, controls: { mode: 'demo', area: 'A', scenarioId: 'baseline', horizonDays: 90, ...controls } });
const project = output => ({
  area: output.controls.area, scenarioId: output.controls.scenarioId, horizonDays: output.controls.horizonDays,
  quantityOz: output.controls.quantity, buyerConsiderationUsd: output.controls.remainingBuyerConsiderationUsd,
  entryPremiumUsd: output.controls.entryPremiumUsd, entryFeeUsd: output.controls.entryFeeUsd, exitFeeUsd: output.controls.exitFeeUsd,
  assignmentValueUsd: output.mapped?.assignmentValueUsd ?? null, amountAtRiskUsd: output.mapped?.amountAtRiskUsd ?? null,
  expectedNetCashUsd: output.mapped?.expectedNetCashUsd ?? null,
  expectedReturnRatio: output.mapped?.amountAtRiskUsd > 0 ? output.mapped.expectedNetCashUsd / output.mapped.amountAtRiskUsd : null,
  saleProbability: output.mapped?.saleProbability ?? null, noSaleProbability: output.mapped?.noSaleProbability ?? null,
  medianCashUsd: output.cashDiagnostics.mapped?.medianCashUsd ?? null,
  riskGate: output.mapped?.riskGate ?? null, evidenceGate: output.evidence.gate,
  entryAction: output.mapped?.entryAction ?? null, reasons: output.mapped?.reasons ?? [],
});
const reference = SYNTHETIC_LOT_PROFILE.referenceUnit;
const priorInputs = { quantity: reference.quantity, remainingBuyerConsiderationUsd: reference.remainingBuyerConsiderationUsd, entryFeeUsd: reference.entryFeeUsd, exitFeeUsd: reference.exitFeeUsd };
const baseline = run({});
const fees = compareFeePolicies({ controls: baseline.controls, evidenceGate: baseline.evidence.gate, signal: 0 });
const report = {
  status: 'local_review_only_not_approved_for_publication',
  sourceCommit: snapshot.source.commit, inputHashes,
  builderSha256: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex'),
  interpretation: 'A consistent synthetic larger-interest illustration using the original invented unit-economics ratio. The historical initial payments do not independently establish this economic exposure or resale price. No parameters were chosen from a target return.',
  historicalPaymentReference: LOT_BASIS, syntheticLotProfile: SYNTHETIC_LOT_PROFILE, capitalPolicy: CAPITAL,
  comparisons: {
    originalArithmeticFixture: project(run({ ...priorInputs, entryPremiumUsd: reference.initialPremiumUsd })),
    rejectedEntryOnlyChange: project(run({ ...priorInputs, entryPremiumUsd: LOT_BASIS.initialPremiumUsd })),
    proposedFixedExposure: project(baseline),
  },
  horizons: [30, 90, 180].map(horizonDays => project(run({ horizonDays }))),
  recordedScenarios: Object.fromEntries(['mine_approval', 'mine_blocked'].map(scenarioId => [scenarioId, project(run({ scenarioId, swarmPolicy: 'illustrative_contrast' }))])),
  feeComparison: fees,
  hurdle25Percent: requiredAssignmentProceeds(baseline.mapped, { targetReturnRatio: 0.25 }),
  premiumEdit: project(run({ entryPremiumUsd: 40000 })),
  sourceLimits: [
    'The original reference inputs are explicitly invented. Maintaining their valuation-to-premium ratio cannot validate a market margin.',
    'The larger return with fixed fees reflects their lower proportional burden. Proportionally scaling both fees retains the original return.',
    'The proportional-fee case exceeds the current per-option risk cap and cannot be presented as an eligible trade.',
    'Conditional quantity is not a measured resource or reserve. A/B are evidence partitions, not matched legal parcels.',
    'The unsold mark is separate from cash. Negative cash at the horizon while still holding an interest is not necessarily a realized economic loss.',
    'No available assignable contract, full actual obligation schedule, buyer bid, calibrated sale hazard or predictive edge is established.',
  ],
};
if (report.premiumEdit.assignmentValueUsd !== report.comparisons.proposedFixedExposure.assignmentValueUsd || report.premiumEdit.quantityOz !== DEFAULT_CONTROLS.quantity || report.premiumEdit.buyerConsiderationUsd !== DEFAULT_CONTROLS.remainingBuyerConsiderationUsd) throw new Error('Premium edit changed the fixed interest.');
const money = v => Number.isFinite(v) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v) : 'Unavailable';
const pct = v => Number.isFinite(v) ? `${(100 * v).toFixed(2)}%` : 'Unavailable';
const row = (label, v) => `| ${label} | ${money(v.assignmentValueUsd)} | ${money(v.amountAtRiskUsd)} | ${money(v.expectedNetCashUsd)} | ${pct(v.expectedReturnRatio ?? v.returnRatio)} | ${v.entryAction} |`;
const text = `# Orecast consistent-lot review\n\nLocal review only. No push, merge or deployment is authorized.\n\n${report.interpretation}\n\n## One frozen hypothetical interest\n\nThe scale factor is ${SYNTHETIC_LOT_PROFILE.scaleFactor.toFixed(9)}, applied once to both the original 500oz exposure and $4,000 remaining buyer consideration. The proposed single contract has ${DEFAULT_CONTROLS.quantity.toLocaleString('en-US', { maximumFractionDigits: 3 })} assumed conditional troy ounces and ${money(DEFAULT_CONTROLS.remainingBuyerConsiderationUsd)} remaining buyer consideration. Ownership stays 50%, material conversion 2%, geological success 25%, gold $2,000/oz and baseline growth zero. Neither quantity nor buyer consideration changes when the premium changes. This is a synthetic design choice, not the valuation of Tibbs or Northway.\n\nThe independent input sequence is:\n\n\`success value = 50% × 2% × (quantity × gold price)\`\n\n\`assignment = 25% × max(success value − remaining buyer consideration, 0)\`\n\n\`E[cash] = sum(monthly sale weights × (dated assignment − exit fee)) − all upfront capital\`\n\nThe model's arithmetic is independent of subsequent premium edits. The chosen default profile nevertheless retains the original invented assignment-to-premium ratio, so it does not independently establish fair value.\n\n## What changed\n\n| Example | Conditional assignment | Upfront capital | Expected 90-day cash | Expected return | Model action |\n| --- | ---: | ---: | ---: | ---: | --- |\n${row('Original small arithmetic fixture', report.comparisons.originalArithmeticFixture)}\n${row('Rejected entry-only change', report.comparisons.rejectedEntryOnlyChange)}\n${row('Proposed frozen larger interest, fixed fees', report.comparisons.proposedFixedExposure)}\n\n## Same interest, different fee assumptions\n\n| Fee case | Entry fee | Exit fee | Expected return | Upfront capital | Risk gate | Model action |\n| --- | ---: | ---: | ---: | ---: | --- | --- |\n${[['Fixed per-contract fees', fees.fixedFees], ['Proportional reference fees', fees.proportionalFees]].map(([label, c]) => `| ${label} | ${money(c.entryFeeUsd)} | ${money(c.exitFeeUsd)} | ${pct(c.returnRatio)} | ${money(c.amountAtRiskUsd)} | ${c.riskGate} | ${c.entryAction} |`).join('\n')}\n\nBoth rows use the same quantity, buyer consideration, assignment value, sale hazard and premium. The higher fixed-fee return comes from assumed fee economics. The second row exceeds the ${money(CAPITAL.maxRiskPerOptionUsd)} per-option cap.\n\n## Holding horizons with fixed fees\n\n| Horizon | Conditional assignment | Upfront capital | Expected cash | Non-annualized return | Model action |\n| --- | ---: | ---: | ---: | ---: | --- |\n${report.horizons.map(v => row(`${v.horizonDays} days`, v)).join('\n')}\n\n## Recorded scenario comparisons, 90 days\n\n| Scenario | Conditional assignment | Upfront capital | Expected cash | Non-annualized return | Model action |\n| --- | ---: | ---: | ---: | ---: | --- |\n${Object.entries(report.recordedScenarios).map(([label, v]) => row(label, v)).join('\n')}\n\nThe recorded contrasts remain simulated mining-support comparisons with failed research checks and an uncalibrated transfer to gold. They do not establish a historical trading edge.\n\n## Cash risk and target hurdle\n\nSale probability is ${pct(baseline.mapped.saleProbability)} and no sale is ${pct(baseline.mapped.noSaleProbability)} at 90 days, both under assumed liquidity. No-sale cash and median cash are ${money(baseline.cashDiagnostics.mapped.medianCashUsd)}. An unsold model mark is separate from cash. A positive expectation does not make the result typical or guaranteed.\n\nA 25% expected return requires ${money(report.hurdle25Percent.requiredAssignmentProceedsUsd)} constant gross assignment proceeds under the same fixed-fee liquidity assumptions. It remains a requirement, not the forecast. Raising the premium to $40,000 leaves assignment at ${money(report.premiumEdit.assignmentValueUsd)}, makes expected cash ${money(report.premiumEdit.expectedNetCashUsd)}, and gives ${report.premiumEdit.entryAction}.\n\n## Source boundary\n\nThe two historical $30,000 signing payments give an initial-payment scale only. The [2019 issuer AIF, pp7,13–15](https://www.tectonicmetals.com/_resources/financials/TECT-AIF-2019-Final.pdf?v=061201) reports no identified mineral resources or reserves for its properties at that time. The [Tibbs agreement description, p4](https://www.tectonicmetals.com/_resources/financials/MDA-Q2-2019-FINAL.pdf?v=070606) and [Northway financial note, pp17–18](https://www.tectonicmetals.com/_resources/financials/FS-Tectonic-2018YE-AUDITED.pdf?v=090403) describe different long-term rights and substantial additional payments and work obligations. They do not support the synthetic resource quantity, short holding term or assignment value used here.\n\n${report.sourceLimits.map(value => `- ${value}`).join('\n')}\n\nReproduce from the repository root with:\n\n\`node research/orecast-contract-pricing/build-consistent-lot-review.mjs\`\n\nLocal model input commit: \`${report.sourceCommit}\`. This commit is local and is not a published GitHub revision.\n`;
await verifyInputs();
await writeFile(path.join(directory, 'consistent-lot-review.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(path.join(directory, 'consistent-lot-review.md'), text);
console.log(JSON.stringify({ sourceCommit: report.sourceCommit, proposed: report.comparisons.proposedFixedExposure, proportionalFeeReturn: fees.proportionalFees.returnRatio, premiumEdit: report.premiumEdit }, null, 2));
