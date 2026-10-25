import { within, finite, unavailable } from './config.mjs';
import { projectPrice } from './commodities.mjs';
import { forecastGoldForMaterials } from './gold.mjs';

/** cap bounds the assumed relative Au-price response, never an option markup. */
export function valueOption(candidate, day, { signal = 0, cap = 0.07, exposure = 1, retention = 1 } = {}) {
  const c = candidate ?? {};
  const reasons = [];
  if (!Array.isArray(c.materials) || c.materials.length === 0) reasons.push('missing_material_exposure');
  if (!within(day, 0) || !within(c.ownershipFraction, 0, 1) || !within(c.kappa, 0, 1) || !within(c.pGeo, 0, 1) || !within(c.remainingBuyerConsiderationUsd, 0)) reasons.push('invalid_valuation_inputs');
  if (c.resolutionBeforeExercise !== true || c.zeroFailureValue !== true) reasons.push('unsupported_success_resolution');
  if (!within(signal, -1, 1) || !within(cap, 0, 0.07) || !within(exposure, 0, 1) || !within(retention, 0, 1)) reasons.push('invalid_scenario_adjustment');
  const materialTrace = [];
  for (const material of Array.isArray(c.materials) ? c.materials : []) {
    if (!material || typeof material !== 'object') { reasons.push('invalid_material_record'); continue; }
    const { quantity, price, unit, priceUnit, currency, annualGrowthRate } = material;
    if (!within(quantity, 0) || !within(price, Number.MIN_VALUE) || currency !== 'USD' || !['troy_oz', 'kg', 'tonne'].includes(unit) || priceUnit !== `USD/${unit}` || material.derivedFromPpm !== false || !material.material || !material.sourceId || !['assumed', 'observed'].includes(material.provenance)) { reasons.push('invalid_material_units_or_provenance'); continue; }
    const baselineProjectedPrice = projectPrice(price, annualGrowthRate, day);
    if (baselineProjectedPrice === null) { reasons.push('missing_or_invalid_growth'); continue; }
    materialTrace.push({ material: material.material, quantity, unit, priceUnit, baselineProjectedPrice, baselineRawValueUsd: quantity * baselineProjectedPrice, sourceId: material.sourceId, provenance: material.provenance });
  }
  const goldForecast = forecastGoldForMaterials(materialTrace, day, { signal, cap, exposure, retention });
  if (goldForecast.status === 'INSUFFICIENT_DATA') reasons.push(...goldForecast.reasons);
  if (reasons.length) return { ...unavailable(...new Set(reasons)), assignmentValueUsd: null, baselineAssignmentValueUsd: null, rawMaterialValueUsd: null, baselineRawMaterialValueUsd: null, successValueUsd: null, baselineSuccessValueUsd: null, underlyingExpectedProxyUsd: null, adjustment: null, materialTrace, goldForecast };
  for (const row of materialTrace) {
    row.projectedPrice = row.baselineProjectedPrice * (row.material === 'Au' ? 1 + goldForecast.adjustment : 1);
    row.rawValueUsd = row.quantity * row.projectedPrice;
  }
  const baselineRawMaterialValueUsd = materialTrace.reduce((sum, row) => sum + row.baselineRawValueUsd, 0);
  const rawMaterialValueUsd = materialTrace.reduce((sum, row) => sum + row.rawValueUsd, 0);
  const baselineSuccessValueUsd = baselineRawMaterialValueUsd * c.ownershipFraction * c.kappa;
  const successValueUsd = rawMaterialValueUsd * c.ownershipFraction * c.kappa;
  const underlyingExpectedProxyUsd = c.pGeo * successValueUsd;
  const baselineAssignmentValueUsd = c.pGeo * Math.max(baselineSuccessValueUsd - c.remainingBuyerConsiderationUsd, 0);
  const assignmentValueUsd = c.pGeo * Math.max(successValueUsd - c.remainingBuyerConsiderationUsd, 0);
  if (![baselineRawMaterialValueUsd, rawMaterialValueUsd, baselineSuccessValueUsd, successValueUsd, underlyingExpectedProxyUsd, baselineAssignmentValueUsd, assignmentValueUsd].every(finite)) return { ...unavailable('non_finite_valuation'), assignmentValueUsd: null, rawMaterialValueUsd: null, baselineRawMaterialValueUsd: null, successValueUsd: null, baselineSuccessValueUsd: null, underlyingExpectedProxyUsd: null, baselineAssignmentValueUsd: null, adjustment: null, materialTrace: [], goldForecast: { ...goldForecast, status: 'INSUFFICIENT_DATA', reasons: ['non_finite_valuation'], baselinePriceUsdPerOz: null, scenarioPriceUsdPerOz: null, priceDeltaUsdPerOz: null, adjustment: null } };
  return { status: 'illustrative', reasons: [], day, currency: 'USD', baselineRawMaterialValueUsd, rawMaterialValueUsd, baselineSuccessValueUsd, successValueUsd, underlyingExpectedProxyUsd, baselineAssignmentValueUsd, assignmentValueUsd, adjustment: goldForecast.adjustment, materialTrace, goldForecast };
}
