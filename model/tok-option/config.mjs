/** Versioned prototype constants. Numerical policies are assumptions, not calibration. */
export const VERSION = 'tok-option-demo-v2';
export const GROUPS = Object.freeze(['government', 'industry', 'community', 'funds', 'retail']);
export const WEIGHTS = Object.freeze({ government: 0.1, industry: 0.4, community: 0.07, funds: 0.4, retail: 0.03 });
export const NEWS_SCENARIOS = Object.freeze(['mine_approval', 'proposed_tax', 'protest', 'mine_blocked', 'gold_reversal']);
export const SCENARIOS = Object.freeze(['baseline', ...NEWS_SCENARIOS, 'sports_placebo']);
export const HORIZONS = Object.freeze([30, 90, 180]);
export const CAPITAL = Object.freeze({ startingFundUsd: 100000, maxRiskPerOptionUsd: 2000, maxOpenRiskUsd: 10000, maxWholeCohortCommittedUsd: 10000, maxPositions: 5, maximumCandidateCount: 20 });
export const EVIDENCE_RULE = Object.freeze({ thresholdPpm: 0.01, minimumClassifiedSamples: 10, minimumQualifyingFraction: 0.5 });
export const finite = (x) => typeof x === 'number' && Number.isFinite(x);
export const within = (x, min, max = Infinity) => finite(x) && x >= min && x <= max;
export const unavailable = (...reasons) => ({ status: 'INSUFFICIENT_DATA', reasons });
export const unique = (xs) => [...new Set(xs)];
