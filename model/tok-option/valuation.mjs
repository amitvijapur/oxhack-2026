import { within, finite, unavailable } from './config.mjs';
import { projectPrice } from './commodities.mjs';

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
    const projectedPrice = projectPrice(price, annualGrowthRate, day);
    if (projectedPrice === null) { reasons.push('missing_or_invalid_growth'); continue; }
    materialTrace.push({ material: material.material, quantity, unit, priceUnit, projectedPrice, rawValueUsd: quantity * projectedPrice, sourceId: material.sourceId, provenance: material.provenance });
  }
  if (reasons.length) return { ...unavailable(...new Set(reasons)), assignmentValueUsd: null, baselineAssignmentValueUsd: null, rawMaterialValueUsd: null, successValueUsd: null, underlyingExpectedProxyUsd: null, adjustment: null, materialTrace };
  const rawMaterialValueUsd = materialTrace.reduce((sum, row) => sum + row.rawValueUsd, 0);
  const successValueUsd = rawMaterialValueUsd * c.ownershipFraction * c.kappa;
  const underlyingExpectedProxyUsd = c.pGeo * successValueUsd;
  const baselineAssignmentValueUsd = c.pGeo * Math.max(successValueUsd - c.remainingBuyerConsiderationUsd, 0);
  const adjustment = cap * signal * exposure * retention;
  const assignmentValueUsd = baselineAssignmentValueUsd * (1 + adjustment);
  if (![rawMaterialValueUsd, successValueUsd, underlyingExpectedProxyUsd, baselineAssignmentValueUsd, assignmentValueUsd].every(finite)) return { ...unavailable('non_finite_valuation'), assignmentValueUsd: null, rawMaterialValueUsd: null, successValueUsd: null, underlyingExpectedProxyUsd: null, baselineAssignmentValueUsd: null, adjustment: null, materialTrace: [] };
  return { status: 'illustrative', reasons: [], day, currency: 'USD', rawMaterialValueUsd, successValueUsd, underlyingExpectedProxyUsd, baselineAssignmentValueUsd, assignmentValueUsd, adjustment, materialTrace };
}
