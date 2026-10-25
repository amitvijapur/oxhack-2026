import { readFileSync } from 'node:fs';
import { WEIGHTS } from '../../config.mjs';

/** Frozen arithmetic fixture only. These are not active platform defaults. */
const spec = JSON.parse(readFileSync(new URL('../../../../research/tok-option-model/fixtures.json', import.meta.url)));
export const LEGACY_CONTROLS = Object.freeze({
  mode: 'pending', area: 'A', horizonDays: spec.base.horizonDays, scenarioId: 'baseline', swarmPolicy: 'strict',
  syntheticSignal: 0.203, goldResponseCap: 0.07,
  quantity: spec.base.quantity.value, price: spec.base.materialPrice.value, annualGrowthRate: spec.base.annualGrowthRate,
  ownershipFraction: spec.base.ownershipFraction, kappa: spec.base.kappa, pGeo: spec.base.pGeo,
  remainingBuyerConsiderationUsd: spec.base.remainingBuyerConsiderationUsd,
  entryPremiumUsd: spec.base.entryPremiumUsd, entryFeeUsd: spec.base.entryFeeUsd, exitFeeUsd: spec.base.exitFeeUsd,
  unavoidableAdditionalObligationsUsd: spec.base.unavoidableAdditionalObligationsUsd,
  remainingMaturityDays: spec.base.remainingMaturityDays, hazardPer30Days: spec.base.assumedHazardPer30Days,
  eventExposure: spec.base.eventExposure, retention: spec.base.retention, weights: WEIGHTS,
});
export const LEGACY_CAPITAL = Object.freeze({ startingFundUsd: 100000, maxRiskPerOptionUsd: 2000, maxOpenRiskUsd: 10000, maxWholeCohortCommittedUsd: 10000, maxPositions: 5, maximumCandidateCount: 20 });
