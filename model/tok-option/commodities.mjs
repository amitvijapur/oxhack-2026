import { within, unavailable } from './config.mjs';
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString().slice(0, 10) === value.slice(0, 10);

/** Uses only observations available at the cutoff, with no future-row fallback. */
export function growthFromHistory({ observations, cutoff, material = 'Au', currency = 'USD', unit = 'troy_oz', lookbackYears = 5 } = {}) {
  if (!validDate(cutoff) || !within(lookbackYears, 0.01, 100) || !Array.isArray(observations) || observations.length < 2) return { ...unavailable('missing_or_invalid_history'), annualGrowthRate: null };
  const end = Date.parse(cutoff);
  const start = end - lookbackYears * 365 * 86400000;
  const rows = [];
  for (const row of observations) {
    if (!row || typeof row !== 'object' || !validDate(row.date) || !validDate(row.availableAt) || !within(row.price, Number.MIN_VALUE) || row.material !== material || row.currency !== currency || row.unit !== unit || !row.sourceId) return { ...unavailable('invalid_history_record_or_units'), annualGrowthRate: null };
    if (Date.parse(row.availableAt) < Date.parse(row.date)) return { ...unavailable('invalid_availability_time'), annualGrowthRate: null };
    if (Date.parse(row.date) > end || Date.parse(row.availableAt) > end) return { ...unavailable('history_not_available_at_cutoff'), annualGrowthRate: null };
    if (Date.parse(row.date) >= start) rows.push(row);
  }
  rows.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (rows.length < 2 || new Set(rows.map((r) => r.date)).size !== rows.length) return { ...unavailable('insufficient_or_duplicate_history'), annualGrowthRate: null };
  const first = rows[0];
  const last = rows.at(-1);
  const elapsedDays = (Date.parse(last.date) - Date.parse(first.date)) / 86400000;
  const annualGrowthRate = (last.price / first.price) ** (365 / elapsedDays) - 1;
  if (!Number.isFinite(annualGrowthRate)) return { ...unavailable('non_finite_growth'), annualGrowthRate: null };
  return { status: 'ready', reasons: [], annualGrowthRate, elapsedDays, coverageYears: elapsedDays / 365, requestedLookbackYears: lookbackYears, completeWindow: elapsedDays >= lookbackYears * 365 * 0.95, startPrice: first.price, endPrice: last.price, sourceIds: [...new Set(rows.map((r) => r.sourceId))], provenance: 'derived', cutoff };
}

export function projectPrice(price, annualGrowthRate, day) {
  if (!within(price, Number.MIN_VALUE) || !within(annualGrowthRate, -1 + Number.EPSILON) || !within(day, 0)) return null;
  const value = price * (1 + annualGrowthRate) ** (day / 365);
  return Number.isFinite(value) ? value : null;
}
