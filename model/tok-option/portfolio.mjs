import { CAPITAL, finite, within } from './config.mjs';

/** One indivisible, nonreplenishing cohort. Cash expectations, never residual marks. */
export function optimizePortfolio(candidates = [], { limits = CAPITAL, ledger = {} } = {}) {
  const empty = { status: 'INSUFFICIENT_DATA', selectedIds: [], totalRiskUsd: 0, totalExpectedNetCashUsd: 0, reasons: [] };
  if (!ledger || typeof ledger !== 'object' || !limits || typeof limits !== 'object') return { ...empty, reasons: ['invalid_portfolio_limits_or_ledger'] };
  const settings = { ...CAPITAL, ...limits };
  const openRisk = Object.hasOwn(ledger, 'openRiskUsd') ? ledger.openRiskUsd : 0;
  const lifetime = Object.hasOwn(ledger, 'lifetimeCommittedUsd') ? ledger.lifetimeCommittedUsd : 0;
  const activeCount = Object.hasOwn(ledger, 'openPositions') ? ledger.openPositions : 0;
  const priorUnderlying = Object.hasOwn(ledger, 'usedUnderlyingIds') ? ledger.usedUnderlyingIds : [];
  if (!Array.isArray(candidates) || Object.values(settings).some((value) => !within(value, 0)) || !Number.isSafeInteger(settings.maxPositions) || !Number.isSafeInteger(settings.maximumCandidateCount) || settings.maximumCandidateCount > 20 || settings.maximumCandidateCount < 1 || !within(openRisk, 0) || !within(lifetime, 0) || !Number.isSafeInteger(activeCount) || activeCount < 0 || !Array.isArray(priorUnderlying) || priorUnderlying.some((id) => typeof id !== 'string' || !id)) return { ...empty, reasons: ['invalid_portfolio_limits_or_ledger'] };
  if (candidates.length > settings.maximumCandidateCount) return { ...empty, reasons: ['candidate_limit_requires_declared_prefilter'] };
  if (openRisk > lifetime || openRisk > settings.maxOpenRiskUsd || lifetime > settings.maxWholeCohortCommittedUsd || lifetime > settings.startingFundUsd || activeCount > settings.maxPositions) return { ...empty, reasons: ['existing_ledger_exceeds_limits'] };
  const ids = new Set();
  if (candidates.some((candidate) => !candidate || typeof candidate.id !== 'string' || !candidate.id || typeof candidate.underlyingId !== 'string' || !candidate.underlyingId || ids.has(candidate.id) || !ids.add(candidate.id))) return { ...empty, reasons: ['invalid_or_duplicate_candidate_identity'] };
  const eligible = candidates.filter((c) => c.entryAction === 'BUY_CANDIDATE' && within(c.amountAtRiskUsd, 0, settings.maxRiskPerOptionUsd) && finite(c.expectedNetCashUsd) && c.expectedNetCashUsd > 0 && !priorUnderlying.includes(c.underlyingId));
  if (!finite(eligible.reduce((sum, c) => sum + c.expectedNetCashUsd, 0))) return { ...empty, reasons: ['portfolio_expectation_overflow'] };
  const capacity = Math.min(settings.maxOpenRiskUsd - openRisk, settings.maxWholeCohortCommittedUsd - lifetime, settings.startingFundUsd - lifetime);
  let best = { selectedIds: [], totalRiskUsd: 0, totalExpectedNetCashUsd: 0 };
  const used = new Set(priorUnderlying);
  const selected = [];
  function enumerate(index, risk, expectation) {
    if (index === eligible.length) {
      if (expectation > best.totalExpectedNetCashUsd + 1e-10 || (Math.abs(expectation - best.totalExpectedNetCashUsd) <= 1e-10 && risk < best.totalRiskUsd)) best = { selectedIds: [...selected], totalRiskUsd: risk, totalExpectedNetCashUsd: expectation };
      return;
    }
    enumerate(index + 1, risk, expectation);
    const c = eligible[index];
    if (selected.length + activeCount >= settings.maxPositions || used.has(c.underlyingId) || risk + c.amountAtRiskUsd > capacity + 1e-9) return;
    used.add(c.underlyingId); selected.push(c.id);
    enumerate(index + 1, risk + c.amountAtRiskUsd, expectation + c.expectedNetCashUsd);
    selected.pop(); used.delete(c.underlyingId);
  }
  enumerate(0, 0, 0);
  return { status: 'illustrative', ...best, reasons: best.selectedIds.length ? [] : ['no_eligible_positive_cash_candidate'], limits: settings, ledger: { openRiskUsd: openRisk, lifetimeCommittedUsd: lifetime, openPositions: activeCount, usedUnderlyingIds: priorUnderlying }, remainingLifetimeCommitmentUsd: settings.maxWholeCohortCommittedUsd - lifetime - best.totalRiskUsd, allPositionsMayFailTogether: true };
}
