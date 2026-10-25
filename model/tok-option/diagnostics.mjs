import { HORIZONS, finite, within } from './config.mjs';

const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const emptyBreakEven = () => ({
  maximumEntryPremiumUsd: null,
  premiumHeadroomUsd: null,
  minimumSaleProbability: null,
  minimumHazardPer30Days: null,
  minimumConstantAssignmentValueUsd: null,
  hazardThresholdStatus: 'unavailable',
  reasons: [],
  basis: 'Deterministic sensitivity with other assumptions held fixed. Equality gives zero expected cash and does not pass the positive-cash entry rule. Evidence, contract and risk gates still apply.',
  constantAssignmentBasis: 'Equivalent assignment value held constant at every sale date, using the current sale probability and exit fee.',
});

function unavailable(reason) {
  return {
    status: 'INSUFFICIENT_DATA', outcomes: [], negativeCashProbability: null,
    medianCashUsd: null, worstCashUsd: null, p05CashUsd: null, p95CashUsd: null,
    expectedCashUsd: null, breakEven: emptyBreakEven(), reasons: [reason],
  };
}

function quantile(sorted, probability) {
  let cumulative = 0;
  for (const row of sorted) {
    cumulative += row.probability;
    if (cumulative + 1e-12 >= probability) return row.netCashUsd;
  }
  return sorted.at(-1).netCashUsd;
}

// For nonincreasing nonnegative proceeds, a higher hazard moves sales earlier
// without lowering receipts. Increasing price paths need a different search:
// earlier selling can give lower receipts, so do not imply a monotone threshold.
function hazardThreshold(proceeds, commitment) {
  if (commitment === 0) return { hazard: 0, status: 'ready', reason: null };
  if (proceeds.some((value, index) => index > 0 && value > proceeds[index - 1])) {
    return { hazard: null, status: 'unsupported', reason: 'minimum_hazard_unsupported_for_increasing_interval_proceeds' };
  }
  if (proceeds[0] < commitment) return { hazard: null, status: 'unattainable', reason: 'no_hazard_reaches_break_even' };
  if (proceeds[0] === commitment) return { hazard: 1, status: 'ready', reason: null };
  const receipts = (hazard) => proceeds.reduce((sum, value, index) => sum + hazard * (1 - hazard) ** index * value, 0);
  let lower = 0;
  let upper = 1;
  for (let iteration = 0; iteration < 64; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (receipts(middle) >= commitment) upper = middle;
    else lower = middle;
  }
  return { hazard: upper, status: 'ready', reason: null };
}

/**
 * Describe the existing cash model without changing valuation or entry policy.
 * An unsold option contributes zero receipts, not its residual mark. Negative
 * cash by the horizon is not necessarily a realized loss while it remains held.
 * Quantiles and the worst outcome use only branches with positive probability.
 */
export function diagnoseCash(result, { candidate, horizonDays = result?.horizonDays, hazardPer30Days = result?.calculation?.hazardPer30Days } = {}) {
  if (!result || !finite(result.expectedNetCashUsd) || !within(result.amountAtRiskUsd, 0)
      || !within(result.saleProbability, 0, 1) || !within(result.noSaleProbability, 0, 1)
      || !Array.isArray(result.intervals) || result.intervals.length === 0) {
    return unavailable('cash_outcomes_unavailable');
  }
  const horizon = horizonDays ?? result.intervals.at(-1)?.day;
  const hazard = hazardPer30Days ?? result.intervals[0]?.weight;
  const intervals = result.intervals;
  if (!HORIZONS.includes(horizon) || intervals.length !== horizon / 30 || !within(hazard, 0, 1)
      || intervals.some((row, index) => !row || row.day !== (index + 1) * 30
        || !within(row.weight, 0, 1) || !within(row.netSaleProceedsUsd, 0)
        || !within(row.assignmentValueUsd, row.netSaleProceedsUsd)
        || !near(row.weight, hazard * (1 - hazard) ** index))
      || !near(result.noSaleProbability, (1 - hazard) ** intervals.length)
      || !near(result.saleProbability + result.noSaleProbability, 1)
      || !near(intervals.reduce((sum, row) => sum + row.weight, 0), result.saleProbability)) {
    return unavailable('invalid_or_inconsistent_cash_distribution');
  }

  const commitment = result.amountAtRiskUsd;
  const outcomes = intervals.map((row) => ({
    kind: 'sale', day: row.day, probability: row.weight,
    netCashUsd: row.netSaleProceedsUsd - commitment,
    netSaleProceedsUsd: row.netSaleProceedsUsd,
  }));
  outcomes.push({ kind: 'no_sale', day: horizon, probability: result.noSaleProbability, netCashUsd: -commitment, netSaleProceedsUsd: 0 });
  const expectedCashUsd = outcomes.reduce((sum, row) => sum + row.probability * row.netCashUsd, 0);
  if (!finite(expectedCashUsd) || !near(expectedCashUsd, result.expectedNetCashUsd)) return unavailable('cash_expectation_mismatch');
  const supported = outcomes.filter((row) => row.probability > 0).sort((a, b) => a.netCashUsd - b.netCashUsd);
  const breakEven = emptyBreakEven();
  const expectedReceipts = intervals.reduce((sum, row) => sum + row.weight * row.netSaleProceedsUsd, 0);

  if (candidate && [candidate.entryPremiumUsd, candidate.entryFeeUsd, candidate.unavoidableAdditionalObligationsUsd].every((value) => within(value, 0))
      && near(candidate.entryPremiumUsd + candidate.entryFeeUsd + candidate.unavoidableAdditionalObligationsUsd, commitment)) {
    breakEven.maximumEntryPremiumUsd = expectedReceipts - candidate.entryFeeUsd - candidate.unavoidableAdditionalObligationsUsd;
    breakEven.premiumHeadroomUsd = breakEven.maximumEntryPremiumUsd - candidate.entryPremiumUsd;
  } else breakEven.reasons.push('entry_cost_allocation_unavailable_or_inconsistent');

  const threshold = hazardThreshold(intervals.map((row) => row.netSaleProceedsUsd), commitment);
  breakEven.minimumHazardPer30Days = threshold.hazard;
  breakEven.hazardThresholdStatus = threshold.status;
  if (threshold.hazard !== null) breakEven.minimumSaleProbability = 1 - (1 - threshold.hazard) ** intervals.length;
  if (threshold.reason) breakEven.reasons.push(threshold.reason);

  const exitFee = intervals[0].assignmentValueUsd - intervals[0].netSaleProceedsUsd;
  if (result.saleProbability > 0 && intervals.every((row) => near(row.assignmentValueUsd - row.netSaleProceedsUsd, exitFee))) {
    const constantValue = exitFee + commitment / result.saleProbability;
    if (finite(constantValue)) breakEven.minimumConstantAssignmentValueUsd = constantValue;
    else breakEven.reasons.push('non_finite_constant_assignment_threshold');
  } else breakEven.reasons.push(result.saleProbability === 0 ? 'constant_assignment_threshold_unavailable_without_sales' : 'nonconstant_exit_fees');

  return {
    status: 'illustrative', outcomes,
    negativeCashProbability: Math.min(1, outcomes.filter((row) => row.netCashUsd < 0).reduce((sum, row) => sum + row.probability, 0)),
    medianCashUsd: quantile(supported, 0.5), worstCashUsd: supported[0].netCashUsd,
    p05CashUsd: quantile(supported, 0.05), p95CashUsd: quantile(supported, 0.95),
    expectedCashUsd, breakEven, reasons: [],
    definition: 'Net cash received by the horizon after all upfront costs. Unsold option marks are excluded. A cash shortfall while an option is held is not necessarily a realized investment loss.',
  };
}
