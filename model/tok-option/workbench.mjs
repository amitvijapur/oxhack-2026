import { VERSION, WEIGHTS, GROUPS, HORIZONS, SCENARIOS, within } from './config.mjs';
import { evaluateEvidence } from './evidence.mjs';
import { evaluateOpportunity } from './index.mjs';
import { mapSwarm, validateWeights, parseSwarmImport as parseNormalizedSwarmImport } from './swarm.mjs';
import { optimizePortfolio } from './portfolio.mjs';
import { diagnoseCash } from './diagnostics.mjs';
import { inspectLandSource } from './integrations/land.mjs';
import { inspectSwarmSource, inspectNormalizedSwarmDiagnostics, normalizeSwarmReport } from './integrations/swarm.mjs';
import { mapIllustrativeContrast } from './illustrative.mjs';
import { GOLD_FORECAST_METHOD } from './gold.mjs';
import { LOT_BASIS, SYNTHETIC_LOT_PROFILE, DEMO_ENTRY_COSTS, lotContext, exposureContext } from './lot-basis.mjs';
import landSource from './data/land-source.json' with { type: 'json' };
import swarmSource from './data/swarm-source.json' with { type: 'json' };

/** Accept the existing normalized schema or an attributed upstream report wrapper. */
export function parseSwarmImport(text) {
  let document;
  try { document = JSON.parse(text); } catch { return parseNormalizedSwarmImport(text); }
  if (document?.report && document?.metadata) return normalizeSwarmReport(document.report, document.metadata);
  const parsed = parseNormalizedSwarmImport(text);
  if (parsed.runs) {
    const checks = inspectNormalizedSwarmDiagnostics(parsed.runs);
    if (checks.errors.length) return { runs: null, errors: checks.errors };
  }
  return parsed;
}

const MODEL_GAPS = Object.freeze([
  { id: 'recoverable_resources', label: 'Recoverable material and geological success', status: 'missing', detail: 'Sediment assays and claim overlays do not supply a resource estimate, recoverable ounces or a calibrated success probability.' },
  { id: 'available_option', label: 'An available Tok option and verified terms', status: 'missing', detail: 'No executable premium, assignment consent, release of obligations, ownership interest or exercise terms have been supplied for these areas.' },
  { id: 'assignment_liquidity', label: 'Completed assignments and time to sale', status: 'missing', detail: 'Claim registrations and mixed deal examples do not estimate a 30-day assignment hazard or a resale-price distribution.' },
  { id: 'predictive_validation', label: 'Measured predictive edge', status: 'missing', detail: 'No dated Tok option outcomes establish out-of-sample price skill, sale-probability calibration or net trading returns.' },
]);

export function inspectIntegratedSources(area = 'A') {
  return { land: inspectLandSource(landSource, { area }), swarm: inspectSwarmSource(swarmSource), modelGaps: [...MODEL_GAPS] };
}

export const DEFAULT_CONTROLS = Object.freeze({ mode: 'pending', area: 'A', horizonDays: 90, scenarioId: 'baseline', swarmPolicy: 'strict', syntheticSignal: 0.203, goldResponseCap: 0.07, quantity: SYNTHETIC_LOT_PROFILE.quantity, price: SYNTHETIC_LOT_PROFILE.price, annualGrowthRate: SYNTHETIC_LOT_PROFILE.annualGrowthRate, ownershipFraction: SYNTHETIC_LOT_PROFILE.ownershipFraction, kappa: SYNTHETIC_LOT_PROFILE.kappa, pGeo: SYNTHETIC_LOT_PROFILE.pGeo, remainingBuyerConsiderationUsd: SYNTHETIC_LOT_PROFILE.remainingBuyerConsiderationUsd, entryPremiumUsd: LOT_BASIS.initialPremiumUsd, ...DEMO_ENTRY_COSTS, remainingMaturityDays: 365, hazardPer30Days: 0.2, eventExposure: 1, retention: 1, weights: WEIGHTS });

export function createDemoCandidate(controls = DEFAULT_CONTROLS) {
  return { lotContext: lotContext(controls), exposureContext: exposureContext(controls), id: `hypothetical-option-${controls.area}`, underlyingId: `hypothetical-interest-${controls.area}`, provenance: 'assumed', sourceId: 'orecast-whole-contract-demo-v1', materials: [{ material: 'Au', quantity: controls.quantity, unit: 'troy_oz', price: controls.price, priceUnit: 'USD/troy_oz', currency: 'USD', annualGrowthRate: controls.annualGrowthRate, sourceId: 'tok-option-fixture-v1', provenance: 'assumed', derivedFromPpm: false }], ownershipFraction: controls.ownershipFraction, kappa: controls.kappa, pGeo: controls.pGeo, remainingBuyerConsiderationUsd: controls.remainingBuyerConsiderationUsd, resolutionBeforeExercise: true, zeroFailureValue: true, entryPremiumUsd: controls.entryPremiumUsd, entryFeeUsd: controls.entryFeeUsd, exitFeeUsd: controls.exitFeeUsd, unavoidableAdditionalObligationsUsd: controls.unavoidableAdditionalObligationsUsd, remainingMaturityDays: controls.remainingMaturityDays, assignable: true, consentSatisfied: true, releasedOnAssignment: true, obligationsCapped: true, indivisible: true, hasLaterMandatoryObligations: false };
}

const deltaOf = (baseline, mapped) => ({ assignmentValueUsd: baseline?.assignmentValueUsd != null && mapped?.assignmentValueUsd != null ? mapped.assignmentValueUsd - baseline.assignmentValueUsd : null, expectedNetCashUsd: baseline?.expectedNetCashUsd != null && mapped?.expectedNetCashUsd != null ? mapped.expectedNetCashUsd - baseline.expectedNetCashUsd : null });

function validateControls(c) {
  const errors = [];
  if (!['pending', 'demo', 'real'].includes(c.mode)) errors.push('Choose pending, demo or real mode.');
  if (!['strict', 'illustrative_contrast'].includes(c.swarmPolicy)) errors.push('Choose strict or illustrative_contrast swarm policy.');
  if (!['A', 'B'].includes(c.area)) errors.push('Choose comparison area A or B.');
  if (!HORIZONS.includes(c.horizonDays)) errors.push('Choose a 30, 90 or 180 day horizon.');
  if (![...SCENARIOS, 'synthetic'].includes(c.scenarioId)) errors.push('Choose a supported scenario.');
  const ranges = { syntheticSignal: [-1, 1], goldResponseCap: [0, 0.07], quantity: [0, Infinity], price: [Number.MIN_VALUE, Infinity], annualGrowthRate: [-1 + Number.EPSILON, Infinity], ownershipFraction: [0, 1], kappa: [0, 1], pGeo: [0, 1], remainingBuyerConsiderationUsd: [0, Infinity], entryPremiumUsd: [0, Infinity], entryFeeUsd: [0, Infinity], exitFeeUsd: [0, Infinity], unavoidableAdditionalObligationsUsd: [0, Infinity], remainingMaturityDays: [0, Infinity], hazardPer30Days: [0, 1], eventExposure: [0, 1], retention: [0, 1] };
  if (c.mode === 'demo') for (const [key, [min, max]] of Object.entries(ranges)) if (!within(c[key], min, max)) errors.push(`${key} must be a finite number from ${min === Number.MIN_VALUE ? 'greater than zero' : min}${max === Infinity ? ' upward' : ` to ${max}`}.`);
  errors.push(...validateWeights(c.weights));
  return errors;
}

const ASSUMPTIONS = Object.freeze([
  'Primary sediment assays and supplied land-source context are observed inputs. A and B remain comparison areas, not verified mineral interests.',
  'The USD 30,000 whole-contract initial-payment reference is based on two selected historical signing payments, not a current Tok average, full contract capital or an available offer. Demo use as a premium remains assumed; fees and obligations are separate.',
  'The synthetic whole-contract profile scales both quantity and buyer consideration from an invented reference unit. It retains an assumed unit-economics ratio; historical payments do not establish its resources, fair value or assignment price. Editing the premium does not rescale that interest.',
  'The success state resolves before buyer exercise and failure interest value is zero. This call-shaped proxy omits option time value.',
  'Sale hazard is assumed per 30 days. It is unchanged by news or asking price in this controlled comparison.',
  'The bounded swarm response changes Au price once before material value and the assignment floor. The cap is a hypothetical gold-price response, not an option-return or investment-loss limit.',
  'The retained relative gold response is constant at every valuation and sale date; baseline growth is applied separately. It is uncalibrated and does not add the common day-one simulation gold jump again.',
  'Unsold model marks are separate from cash and never fund new positions. No exercise, leverage or reinvestment.',
  'One hypothetical option is screened against the selected comparison area. No available Tok contract is asserted.',
]);

/** Compare fee assumptions on the same selected interest, never resize it. */
export function compareFeePolicies({ controls = {}, evidenceGate = 'PASS', horizonDays, signal = 0 } = {}) {
  const c = { ...DEFAULT_CONTROLS, ...controls, ...(horizonDays === undefined ? {} : { horizonDays }) };
  const base = {
    status: 'INSUFFICIENT_DATA', profileId: SYNTHETIC_LOT_PROFILE.id,
    scaleFactor: SYNTHETIC_LOT_PROFILE.scaleFactor, fixedFees: null, proportionalFees: null, reasons: [],
    assumption: 'Fee sensitivity for one unchanged assumed interest and the same premium, valuation and sale hazard. Fixed USD 50 fees are compared with reference-unit fees multiplied by the frozen exposure scale. Returns are non-annualized; proportional fees can fail the approved risk cap. Neither case is a market-calibrated margin.',
  };
  if (c.mode !== 'demo') return { ...base, reasons: ['fee_comparison_requires_explicit_demo'] };
  const errors = validateControls(c);
  if (errors.length || !within(signal, -1, 1) || !['PASS', 'FAIL', 'UNKNOWN'].includes(evidenceGate)) return { ...base, reasons: ['invalid_fee_comparison_inputs'] };
  const evaluate = (entryFeeUsd, exitFeeUsd, feePolicyId) => {
    const candidate = createDemoCandidate({ ...c, entryFeeUsd, exitFeeUsd });
    const outcome = evaluateOpportunity({ candidate, evidenceGate, horizonDays: c.horizonDays, signal,
      cap: c.goldResponseCap, exposure: c.eventExposure, retention: c.retention, hazardPer30Days: c.hazardPer30Days });
    return {
      ...outcome, entryFeeUsd, exitFeeUsd, feePolicyId,
      returnRatio: typeof outcome.expectedNetCashUsd === 'number' && outcome.amountAtRiskUsd > 0 ? outcome.expectedNetCashUsd / outcome.amountAtRiskUsd : null,
    };
  };
  return {
    ...base, status: 'illustrative',
    fixedFees: evaluate(DEMO_ENTRY_COSTS.entryFeeUsd, DEMO_ENTRY_COSTS.exitFeeUsd, 'fixed_50_usd_assumption'),
    proportionalFees: evaluate(SYNTHETIC_LOT_PROFILE.referenceUnit.entryFeeUsd * SYNTHETIC_LOT_PROFILE.scaleFactor,
      SYNTHETIC_LOT_PROFILE.referenceUnit.exitFeeUsd * SYNTHETIC_LOT_PROFILE.scaleFactor, 'proportional_reference_fee_assumption'),
  };
}

export function runWorkbench({ features = [], controls = {}, swarmRuns = null } = {}) {
  const c = { ...DEFAULT_CONTROLS, ...(controls && typeof controls === 'object' ? controls : {}) };
  const evidence = evaluateEvidence(features, { area: c.area });
  const sourceAudit = inspectIntegratedSources(c.area);
  const activeRuns = swarmRuns ?? sourceAudit.swarm.runs;
  const swarmDiagnostics = activeRuns ? inspectNormalizedSwarmDiagnostics(activeRuns, c.scenarioId) : sourceAudit.swarm;
  const base = { version: VERSION, mode: c.mode, lotContext: c.mode === 'demo' ? lotContext(c) : null, exposureContext: c.mode === 'demo' ? exposureContext(c) : null, status: 'pending', reasons: [], evidence, sourceAudit, swarmDiagnostics, cashDiagnostics: { baseline: null, mapped: null }, baseline: null, mapped: null, signal: { status: 'PENDING_SWARM', value: null, adjustment: null, groups: [], reasons: ['swarm_import_required'] }, horizons: HORIZONS.map((days) => ({ days, baseline: null, mapped: null, delta: deltaOf(null, null) })), delta: deltaOf(null, null), portfolio: { status: 'INSUFFICIENT_DATA', selectedIds: [], totalRiskUsd: null, totalExpectedNetCashUsd: null, reasons: ['no_evaluated_contract'] }, assumptions: [...ASSUMPTIONS], validationErrors: [] };
  const validationErrors = validateControls(c);
  if (validationErrors.length) return { ...base, status: 'INSUFFICIENT_DATA', reasons: ['invalid_controls'], validationErrors };
  if (c.mode === 'pending') return { ...base, reasons: ['Select explicit demo assumptions to run the hypothetical economics, or inspect real-data availability.'] };
  let signal;
  if (c.scenarioId === 'baseline') signal = { status: 'ready', value: 0, adjustment: 0, groups: GROUPS.map((group) => ({ group, weight: c.weights[group], baselineMean: null, scenarioMean: null, delta: 0, contribution: 0 })), reasons: [], provenance: 'baseline_comparison', diagnosticOnly: true };
  else if (c.scenarioId === 'synthetic' && c.mode === 'demo') signal = { status: 'ready', value: c.syntheticSignal, adjustment: c.goldResponseCap * c.syntheticSignal * c.eventExposure * c.retention, groups: GROUPS.map((group) => ({ group, weight: c.weights[group], baselineMean: null, scenarioMean: null, delta: null, contribution: null })), reasons: [], provenance: 'synthetic_sensitivity', diagnosticOnly: false };
  else if (c.scenarioId === 'synthetic' || (c.mode === 'real' && activeRuns?.provenance === 'synthetic')) signal = { ...base.signal, reasons: ['synthetic_signals_require_explicit_demo_mode'] };
  else if (c.swarmPolicy === 'illustrative_contrast') {
    if (c.mode !== 'demo') signal = { ...base.signal, usagePolicy: 'illustrative_contrast', demoEligible: false, reasons: ['illustrative_contrast_requires_explicit_demo_mode'] };
    else if (swarmRuns !== null) signal = { ...base.signal, usagePolicy: 'illustrative_contrast', demoEligible: false, reasons: ['illustrative_contrast_requires_bundled_source'] };
    else signal = mapIllustrativeContrast({ source: sourceAudit.swarm, scenarioId: c.scenarioId, weights: c.weights, exposure: c.eventExposure, retention: c.retention, cap: c.goldResponseCap });
  }
  else signal = mapSwarm({ runs: activeRuns, scenarioId: c.scenarioId, weights: c.weights, exposure: c.eventExposure, retention: c.retention, cap: c.goldResponseCap });
  signal = { ...signal, transferTarget: 'gold_price', transfer: { ...signal.transfer, target: 'gold_price', methodVersion: GOLD_FORECAST_METHOD, cap: c.goldResponseCap, exposure: c.eventExposure, retention: c.retention, assumed: true, calibrationStatus: 'uncalibrated' } };
  // Display support scores but do not price a real simulation while its checks
  // are failed or missing. Explicit synthetic demo fixtures remain exploratory.
  if (signal.value !== null && signal.usagePolicy !== 'illustrative_contrast' && activeRuns?.provenance === 'simulated' && !['baseline', 'synthetic'].includes(c.scenarioId)) {
    const readiness = swarmDiagnostics.scenarioReadiness?.[c.scenarioId];
    if (readiness?.status !== 'pass') signal = { ...signal, status: 'PENDING_SWARM', value: null, adjustment: null, reasons: [readiness?.status === 'fail' ? 'swarm_diagnostics_failed' : 'swarm_diagnostics_incomplete', ...(readiness?.reasons || [])] };
  }
  if (c.mode === 'real') return { ...base, status: 'INSUFFICIENT_DATA', signal, reasons: ['Land-source context and historical gold prices are connected. Verified Tok option terms, recoverable resources and a supported sale-probability input are still missing.'], assumptions: ['Observed samples, land context and imported simulations can be inspected. Demo financial values are not used in real-data mode.'] };
  const candidate = createDemoCandidate(c);
  const evaluate = (days, value) => evaluateOpportunity({ candidate, evidenceGate: evidence.gate, horizonDays: days, signal: value, exposure: c.eventExposure, retention: c.retention, cap: c.goldResponseCap, hazardPer30Days: c.hazardPer30Days });
  const horizons = HORIZONS.map((days) => {
    const baseline = evaluate(days, 0);
    let mapped = signal.value === null ? null : evaluate(days, signal.value);
    if (mapped && c.scenarioId === 'sports_placebo') mapped = { ...mapped, status: 'diagnostic', entryAction: null, reasons: [...mapped.reasons, 'sports_placebo_is_diagnostic_only'] };
    return { days, baseline, mapped, delta: deltaOf(baseline, mapped) };
  });
  const selected = horizons.find((row) => row.days === c.horizonDays);
  const portfolio = selected.mapped ? optimizePortfolio([selected.mapped]) : base.portfolio;
  return { ...base, status: signal.value === null ? 'PENDING_SWARM' : selected.mapped?.status ?? selected.baseline.status, reasons: signal.value === null ? signal.reasons : selected.mapped?.reasons ?? [], baseline: selected.baseline, mapped: selected.mapped, signal, horizons, delta: selected.delta, portfolio, cashDiagnostics: { baseline: diagnoseCash(selected.baseline, { candidate }), mapped: diagnoseCash(selected.mapped, { candidate }) }, assumptions: [...ASSUMPTIONS, ...(signal.usagePolicy === 'illustrative_contrast' && signal.demoEligible ? signal.limitations : [])], controls: c, candidateId: candidate.id, provenance: { evidence: 'observed', economics: 'assumed', liquidity: 'assumed', signal: signal.provenance }, validationErrors: [] };
}
