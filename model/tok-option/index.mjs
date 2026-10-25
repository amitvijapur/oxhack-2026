export * from './config.mjs';
export * from './evidence.mjs';
export * from './commodities.mjs';
export * from './valuation.mjs';
export * from './liquidity.mjs';
export * from './swarm.mjs';
export * from './portfolio.mjs';

import { CAPITAL, HORIZONS, VERSION, within, unique } from './config.mjs';
import { valueOption } from './valuation.mjs';
import { cashOutcomes } from './liquidity.mjs';

export function evaluateOpportunity({ candidate, evidenceGate, horizonDays = 90, signal = 0, exposure = 1, retention = 1, cap = 0.07, hazardPer30Days = null, expiryBufferDays = 15, annualDiscountRate = 0, maxRiskPerOptionUsd = CAPITAL.maxRiskPerOptionUsd } = {}) {
  const c = candidate ?? {};
  const valuation = valueOption(c, horizonDays, { signal, exposure, retention, cap });
  const intervalValues = HORIZONS.includes(horizonDays) ? Array.from({ length: horizonDays / 30 }, (_, i) => valueOption(c, (i + 1) * 30, { signal, exposure, retention, cap }).assignmentValueUsd) : [];
  const cash = cashOutcomes({ horizonDays, hazardPer30Days, entryPremiumUsd: c.entryPremiumUsd, entryFeeUsd: c.entryFeeUsd, additionalUpfrontCostUsd: c.unavoidableAdditionalObligationsUsd, exitFeeUsd: c.exitFeeUsd, intervalPrices: intervalValues, annualDiscountRate });
  const fails = [];
  const unknown = [];
  if (!['assumed', 'observed'].includes(c.provenance) || typeof c.sourceId !== 'string' || !c.sourceId) unknown.push('missing_candidate_provenance');
  if (typeof c.id !== 'string' || !c.id || typeof c.underlyingId !== 'string' || !c.underlyingId) unknown.push('missing_candidate_identity');
  if (evidenceGate === 'FAIL') fails.push('evidence_gate_failed');
  else if (evidenceGate !== 'PASS') unknown.push('evidence_gate_unknown');
  if (c.assignable === false || c.consentSatisfied === false || c.releasedOnAssignment === false || c.obligationsCapped === false || c.indivisible === false) fails.push('contract_terms_failed');
  else if (![c.assignable, c.consentSatisfied, c.releasedOnAssignment, c.obligationsCapped, c.indivisible].every((v) => v === true)) unknown.push('contract_terms_unknown');
  if (!within(c.unavoidableAdditionalObligationsUsd, 0)) unknown.push('additional_obligations_unknown');
  if (c.hasLaterMandatoryObligations !== false) unknown.push('later_or_unknown_obligations_unsupported');
  if (!within(expiryBufferDays, 0) || !within(c.remainingMaturityDays, 0)) unknown.push('expiry_unknown');
  else if (c.remainingMaturityDays < horizonDays + expiryBufferDays) fails.push('expiry_window_failed');
  if (!within(maxRiskPerOptionUsd, 0)) unknown.push('invalid_per_option_risk_limit');
  else if (cash.amountAtRiskUsd !== null && cash.amountAtRiskUsd > maxRiskPerOptionUsd) fails.push('per_option_risk_exceeded');
  if (valuation.assignmentValueUsd === null) unknown.push(...valuation.reasons);
  if (cash.expectedNetCashUsd === null) unknown.push(...cash.reasons);
  if (cash.expectedNetCashUsd !== null && cash.expectedNetCashUsd <= 0) fails.push('nonpositive_expected_cash');
  const reasons = unique([...fails, ...unknown]);
  const entryAction = fails.length ? 'SKIP' : unknown.length ? null : 'BUY_CANDIDATE';
  const status = fails.length ? 'ineligible' : unknown.length ? 'INSUFFICIENT_DATA' : 'illustrative';
  return { ...valuation, ...cash, version: VERSION, id: c.id ?? null, underlyingId: c.underlyingId ?? null, horizonDays, status, reasons, entryAction, evidenceGate: evidenceGate ?? 'UNKNOWN', expiryGate: reasons.includes('expiry_window_failed') ? 'FAIL' : reasons.includes('expiry_unknown') ? 'UNKNOWN' : 'PASS', riskGate: reasons.includes('per_option_risk_exceeded') ? 'FAIL' : cash.amountAtRiskUsd === null ? 'UNKNOWN' : 'PASS', amountAtRiskUsd: cash.amountAtRiskUsd, termsProvenance: c.provenance ?? 'unavailable', calculation: { signal, cap, exposure, retention, annualDiscountRate, hazardPer30Days, expiryBufferDays }, assumption: 'Conditional assignment proxy and fixed selling policy; not an executable quote or calibrated prediction.' };
}
