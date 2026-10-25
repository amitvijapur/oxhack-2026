import { HORIZONS, within, finite } from './config.mjs';

export function cashOutcomes({ horizonDays, hazardPer30Days, entryPremiumUsd, entryFeeUsd, additionalUpfrontCostUsd, exitFeeUsd, intervalPrices, annualDiscountRate = 0 } = {}) {
  const empty = { status: 'INSUFFICIENT_DATA', reasons: [], saleProbability: null, noSaleProbability: null, expectedNetCashUsd: null, conditionalSaleProfitUsd: null, weightedNoSaleResidualMarkUsd: null, unweightedNoSaleResidualMarkUsd: null, amountAtRiskUsd: null, intervals: [] };
  if (annualDiscountRate !== 0) return { ...empty, reasons: ['nonzero_discount_unsupported'] };
  if (!HORIZONS.includes(horizonDays)) return { ...empty, reasons: ['unsupported_horizon'] };
  if (![entryPremiumUsd, entryFeeUsd, additionalUpfrontCostUsd, exitFeeUsd].every((v) => within(v, 0))) return { ...empty, reasons: ['invalid_or_missing_costs'] };
  const amountAtRiskUsd = entryPremiumUsd + entryFeeUsd + additionalUpfrontCostUsd;
  if (!finite(amountAtRiskUsd)) return { ...empty, reasons: ['non_finite_costs'] };
  if (!Array.isArray(intervalPrices) || intervalPrices.length !== horizonDays / 30 || intervalPrices.some((v) => !within(v, 0))) return { ...empty, amountAtRiskUsd, reasons: ['missing_interval_prices'] };
  const lastPrice = intervalPrices.at(-1);
  const priced = { ...empty, amountAtRiskUsd, unweightedNoSaleResidualMarkUsd: lastPrice, conditionalSaleProfitUsd: lastPrice - exitFeeUsd - amountAtRiskUsd };
  if (intervalPrices.some((v) => v < exitFeeUsd)) return { ...priced, conditionalSaleProfitUsd: null, reasons: ['no_viable_sale_under_policy'] };
  if (!within(hazardPer30Days, 0, 1)) return { ...priced, reasons: ['missing_or_invalid_liquidity'] };
  const intervals = intervalPrices.map((assignmentValueUsd, index) => ({ day: (index + 1) * 30, weight: (1 - hazardPer30Days) ** index * hazardPer30Days, assignmentValueUsd, netSaleProceedsUsd: assignmentValueUsd - exitFeeUsd }));
  const noSaleProbability = (1 - hazardPer30Days) ** intervalPrices.length;
  const saleProbability = 1 - noSaleProbability;
  const expectedNetCashUsd = intervals.reduce((sum, interval) => sum + interval.weight * interval.netSaleProceedsUsd, 0) - amountAtRiskUsd;
  const weightedNoSaleResidualMarkUsd = noSaleProbability * lastPrice;
  if (![expectedNetCashUsd, weightedNoSaleResidualMarkUsd].every(finite)) return { ...empty, reasons: ['non_finite_cash'] };
  return { ...priced, status: 'illustrative', reasons: [], saleProbability, noSaleProbability, expectedNetCashUsd, weightedNoSaleResidualMarkUsd, intervals };
}
