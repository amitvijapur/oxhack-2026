import { runWorkbench } from '../../model/tok-option/workbench.mjs';
import { capitalRatio, cashReturn, returnDifference, createConservativeDemo } from './model-presentation.mjs';

export const DECIDE_SCENARIOS = Object.freeze([
  ['synthetic', 'Small-response synthetic demo'],
  ['baseline', 'Baseline, no gold response'],
  ['mine_approval', 'Recorded mine approval, illustrative'],
  ['mine_blocked', 'Recorded mine blockage, illustrative'],
]);

/** Presentation only. The area gate and financial action stay with the canonical engine. */
export function runDecideFinancial({ features = [], area = 'A', horizonDays = 90, scenarioId = 'synthetic' } = {}) {
  const controls = {
    ...createConservativeDemo(), area, horizonDays, scenarioId,
    swarmPolicy: ['synthetic', 'baseline'].includes(scenarioId) ? 'strict' : 'illustrative_contrast',
  };
  const result = runWorkbench({ features, controls });
  const mapped = result.mapped;
  const diagnostics = result.cashDiagnostics.mapped;
  return {
    result, controls,
    action: mapped?.entryAction ?? null,
    expectedReturn: cashReturn(mapped),
    baselineReturn: cashReturn(result.baseline),
    deltaReturn: returnDifference(result.baseline, mapped),
    medianReturn: capitalRatio(diagnostics?.medianCashUsd, mapped?.amountAtRiskUsd),
    worstReturn: capitalRatio(diagnostics?.worstCashUsd, mapped?.amountAtRiskUsd),
    noSaleReturn: capitalRatio(mapped ? -mapped.amountAtRiskUsd : null, mapped?.amountAtRiskUsd),
  };
}

export function geologicalScreenLabel(gate) {
  return gate === 'PASS' ? 'Screen passed' : gate === 'FAIL' ? 'Screen failed' : 'Screen incomplete';
}
