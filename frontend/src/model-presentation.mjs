import { DEFAULT_CONTROLS } from '../../model/tok-option/workbench.mjs';

const finite = (value) => typeof value === 'number' && Number.isFinite(value);

/** Ratios are fractions. A missing or nonpositive denominator has no return. */
export function capitalRatio(value, capital) {
  if (!finite(value) || !finite(capital) || capital <= 0) return null;
  const ratio = value / capital;
  return finite(ratio) ? ratio : null;
}

export function cashReturn(result, key = 'expectedNetCashUsd') {
  return capitalRatio(result?.[key], result?.amountAtRiskUsd);
}

/** Difference of fractional returns; multiply by 100 to display percentage points. */
export function returnDifference(baseline, scenario) {
  const base = cashReturn(baseline);
  const next = cashReturn(scenario);
  const difference = base === null || next === null ? null : next - base;
  return finite(difference) ? difference : null;
}

export function relativeChange(value, baseline) {
  if (!finite(value) || !finite(baseline)) return null;
  return capitalRatio(value - baseline, baseline);
}

/** Website-only illustrative preset. Canonical defaults and source data are unchanged. */
export function createConservativeDemo() {
  return {
    ...DEFAULT_CONTROLS,
    mode: 'demo', scenarioId: 'synthetic', swarmPolicy: 'strict',
    goldResponseCap: 0.01, syntheticSignal: 0.5, eventExposure: 1,
    retention: 0.5, annualGrowthRate: 0,
    weights: { ...DEFAULT_CONTROLS.weights },
  };
}

export function isConservativeDemo(controls) {
  const preset = createConservativeDemo();
  return !!controls && ['A', 'B'].includes(controls.area) && Object.entries(preset).every(([key, value]) => key === 'area' || (key === 'weights'
    ? Object.keys(controls.weights ?? {}).length === Object.keys(value).length
      && Object.entries(value).every(([group, weight]) => controls.weights[group] === weight)
    : controls[key] === value));
}
