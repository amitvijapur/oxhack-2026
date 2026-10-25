import { within, finite } from './config.mjs';

export const GOLD_FORECAST_METHOD = 'assumed-gold-response-v1';
export const GOLD_TIMING_ASSUMPTION = 'The retained relative gold-price response is applied once at every valuation and sale date, alongside baseline annual growth. Its size and persistence are assumptions, not estimated market timing.';
const TROY_OZ_PER_UNIT = Object.freeze({ troy_oz: 1, kg: 1000 / 31.1034768, tonne: 1000000 / 31.1034768 });

/** A bounded assumed Au-price response, shared by valuation and saved-output checks. */
export function forecastGoldForMaterials(materialTrace, day, { signal = 0, cap = 0.07, exposure = 1, retention = 1 } = {}) {
  const base = {
    status: 'INSUFFICIENT_DATA', reasons: [], methodVersion: GOLD_FORECAST_METHOD,
    transferTarget: 'gold_price', provenance: 'assumed', calibrationStatus: 'uncalibrated',
    day: within(day, 0) ? day : null,
    baselinePriceUsdPerOz: null, scenarioPriceUsdPerOz: null, priceDeltaUsdPerOz: null,
    adjustment: null, signal: within(signal, -1, 1) ? signal : null,
    cap: within(cap, 0, 0.07) ? cap : null, exposure: within(exposure, 0, 1) ? exposure : null,
    retention: within(retention, 0, 1) ? retention : null,
    timingAssumption: GOLD_TIMING_ASSUMPTION, priceBasis: null,
  };
  if (!within(day, 0) || !within(signal, -1, 1) || !within(cap, 0, 0.07) || !within(exposure, 0, 1) || !within(retention, 0, 1)) return { ...base, reasons: ['invalid_gold_forecast_inputs'] };
  if (!Array.isArray(materialTrace) || materialTrace.some((row) => !row || typeof row !== 'object' || !row.material || !within(row.quantity, 0) || !within(row.baselineProjectedPrice, 0) || !Object.hasOwn(TROY_OZ_PER_UNIT, row.unit))) return { ...base, reasons: ['invalid_gold_material_trace'] };
  const adjustment = cap * signal * exposure * retention;
  const gold = materialTrace.filter((row) => row.material === 'Au');
  if (!gold.length) return { ...base, status: 'not_applicable', reasons: ['no_Au_material'], adjustment };
  const ounces = gold.reduce((sum, row) => sum + row.quantity * TROY_OZ_PER_UNIT[row.unit], 0);
  const baselineGoldValue = gold.reduce((sum, row) => sum + row.quantity * row.baselineProjectedPrice, 0);
  // With zero exposure the supplied quotes still have a displayable mean. It
  // does not invent a quantity or contribute to material/assignment value.
  const baselinePriceUsdPerOz = ounces > 0 ? baselineGoldValue / ounces : gold.reduce((sum, row) => sum + row.baselineProjectedPrice / TROY_OZ_PER_UNIT[row.unit], 0) / gold.length;
  const scenarioPriceUsdPerOz = baselinePriceUsdPerOz * (1 + adjustment);
  const priceDeltaUsdPerOz = scenarioPriceUsdPerOz - baselinePriceUsdPerOz;
  if (![ounces, baselineGoldValue, baselinePriceUsdPerOz, scenarioPriceUsdPerOz, priceDeltaUsdPerOz].every(finite)) return { ...base, reasons: ['non_finite_gold_forecast'] };
  return { ...base, status: 'illustrative', baselinePriceUsdPerOz, scenarioPriceUsdPerOz, priceDeltaUsdPerOz, adjustment, priceBasis: ounces > 0 ? 'quantity_weighted_au_oz' : 'equal_quote_mean_zero_quantity' };
}
