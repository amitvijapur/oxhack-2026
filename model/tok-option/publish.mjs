import { VERSION, HORIZONS, SCENARIOS, within } from './config.mjs';
import { diagnoseCash, requiredAssignmentProceeds } from './diagnostics.mjs';
import { lotContext, exposureContext } from './lot-basis.mjs';
import { evaluateOpportunity } from './index.mjs';
import { createDemoCandidate, applyScenarioDecisionPolicy } from './workbench.mjs';

/** A projection of the canonical workbench, never a second decision engine. */
export const OUTPUT_CONTRACT = 'tok-assignment-output-v1';
export const SUMMARY_CONTRACT = 'tok-assignment-summary-v1';
const MODES = ['pending', 'demo', 'real'];
const STATUSES = ['pending', 'INSUFFICIENT_DATA', 'PENDING_SWARM', 'illustrative', 'ineligible', 'diagnostic'];
const GATES = ['PASS', 'FAIL', 'UNKNOWN'];
const RESEARCH_STATUSES = ['pass', 'fail', 'unknown'];
const CONTRAST_RUNS = { mine_approval: '05_mine_approved_s1', mine_blocked: '06_court_blocks_mine_s1' };
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (message) => { throw new Error(`Invalid canonical assignment output: ${message}`); };
const requireThat = (condition, message) => { if (!condition) fail(message); };
const strings = (values, name) => {
  requireThat(Array.isArray(values) && values.length <= 50 && values.every((value) => typeof value === 'string'), `${name} must contain at most 50 strings`);
  return [...values];
};

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function contrastContext(result, selection) {
  const signal = result.signal;
  if (signal.usagePolicy !== 'illustrative_contrast') {
    requireThat(!(result.controls?.swarmPolicy === 'illustrative_contrast' && Object.hasOwn(CONTRAST_RUNS, selection.scenarioId) && signal.value !== null), 'priced contrast requires explicit signal usage policy');
    return null;
  }
  // Rejected requests retain their null mapped outcomes and reasons. They have
  // no completed contrast to attribute, including real mode and rejected imports.
  if (signal.demoEligible === false && signal.value === null) return null;
  requireThat(result.mode === 'demo' && result.controls?.swarmPolicy === 'illustrative_contrast', 'contrast publication requires explicit demo controls and policy');
  requireThat(signal.provenance === 'simulated' && signal.methodVersion === 'matched-placebo-post-contrast-v1'
    && signal.comparisonMethod === 'matched_configuration_placebo_contrast', 'contrast method and simulated provenance are required');
  requireThat(Object.hasOwn(CONTRAST_RUNS, selection.scenarioId) && signal.referenceRunId === '04_placebo_s1' && signal.baselineRunId === signal.referenceRunId
    && signal.scenarioRunId === CONTRAST_RUNS[selection.scenarioId], 'contrast reference and scenario run attribution must match');
  const source = result.sourceAudit?.swarm;
  const provenance = source?.provenance;
  for (const key of ['sourceId', 'revision', 'knowledgeCutoff']) {
    requireThat(signal[key] === provenance?.[key], `contrast ${key} does not match the source audit`);
  }
  requireThat(typeof signal.sourceId === 'string' && signal.sourceId.length > 0 && signal.sourceId.length <= 256
    && typeof signal.revision === 'string' && /^[0-9a-f]{40}$/.test(signal.revision), 'contrast source identity and pinned revision are required');
  requireThat(signal.knowledgeCutoff === null || (typeof signal.knowledgeCutoff === 'string' && Number.isFinite(Date.parse(signal.knowledgeCutoff))), 'contrast knowledge cutoff must remain null or an attributed timestamp');
  requireThat(canonicalJson(signal.scoreWindow) === '[3,4,5]', 'contrast score window must be days 3, 4 and 5');
  requireThat(signal.scoreMetric === 'mining_support' && signal.scoreAggregation === 'equal_daily_means', 'contrast score metric and aggregation are required');
  requireThat(typeof signal.demoEligible === 'boolean' && ['match', 'different', 'unknown'].includes(signal.pairwiseConfiguration?.status), 'contrast eligibility and pairwise configuration are required');
  if (signal.value !== null) requireThat(signal.demoEligible && signal.pairwiseConfiguration.status === 'match', 'priced contrast requires an eligible matched configuration');
  const research = signal.researchReadiness;
  const original = result.swarmDiagnostics;
  requireThat(object(research) && RESEARCH_STATUSES.includes(research.status) && research.status === original?.status && research.status === source.status,
    'contrast research status must preserve the original source status');
  requireThat(canonicalJson(research.diagnostics) === canonicalJson(original.diagnostics)
    && canonicalJson(research.diagnostics) === canonicalJson(source.diagnostics)
    && canonicalJson(research.scenarioReadiness) === canonicalJson(original.scenarioReadiness?.[selection.scenarioId])
    && canonicalJson(research.scenarioReadiness) === canonicalJson(source.scenarioReadiness?.[selection.scenarioId]),
  'contrast research diagnostics must preserve the original source checks');
  requireThat(Array.isArray(research.diagnostics) && research.diagnostics.length <= 50, 'contrast diagnostics must hold at most 50 checks');
  const diagnostics = research.diagnostics.map((item) => {
    requireThat(object(item) && RESEARCH_STATUSES.includes(item.status), 'contrast diagnostic status is required');
    for (const key of ['id', 'label', 'detail']) requireThat(typeof item[key] === 'string' && item[key].length <= 4096, `contrast diagnostic ${key} must be bounded text`);
    return { id: item.id, label: item.label, status: item.status, detail: item.detail };
  });
  const scenario = research.scenarioReadiness;
  requireThat(object(scenario) && RESEARCH_STATUSES.includes(scenario.status), 'contrast scenario research readiness is required');
  requireThat(object(signal.originalSourceChecks) && canonicalJson(signal.originalSourceChecks) === canonicalJson(source.diagnosticRuns?.sourceChecks), 'contrast must retain original reported source checks');
  const sourceChecks = Object.entries(signal.originalSourceChecks).map(([name, check]) => {
    requireThat(name.length <= 128 && object(check) && typeof check.status === 'string' && check.status.length <= 128, 'contrast source check must have a bounded name and status');
    return { name, status: check.status };
  });
  requireThat(sourceChecks.length <= 50, 'contrast source checks must hold at most 50 checks');
  return {
    usagePolicy: signal.usagePolicy, calculationStatus: signal.status, provenance: signal.provenance,
    methodVersion: signal.methodVersion, comparisonMethod: signal.comparisonMethod,
    referenceRunId: signal.referenceRunId, scenarioRunId: signal.scenarioRunId,
    sourceId: signal.sourceId, revision: signal.revision, knowledgeCutoff: signal.knowledgeCutoff,
    scoreWindow: [...signal.scoreWindow], scoreMetric: signal.scoreMetric, scoreAggregation: signal.scoreAggregation, demoEligible: signal.demoEligible,
    researchReadiness: { status: research.status, diagnostics, scenarioReadiness: { status: scenario.status, reasons: strings(scenario.reasons, 'contrast scenario research reasons') } },
    sourceChecks, pairwiseConfigurationStatus: signal.pairwiseConfiguration.status,
  };
}

function canonicalEconomics(value, controls, expectedSignal, diagnosticOnly) {
  requireThat(object(controls), 'priced outcomes require their original controls');
  // Re-evaluate using the same candidate factory and engine as the workbench.
  // A self-consistent cash distribution alone does not prove that its sale
  // prices came from the v2 gold-first valuation rather than the old markup.
  let canonical = evaluateOpportunity({
    candidate: createDemoCandidate(controls), evidenceGate: value.evidenceGate,
    horizonDays: value.horizonDays, signal: expectedSignal,
    cap: controls.goldResponseCap, exposure: controls.eventExposure,
    retention: controls.retention, hazardPer30Days: controls.hazardPer30Days,
  });
  // The workbench deliberately makes a priced placebo diagnostic-only. Preserve
  // that exact policy, rather than accepting caller-supplied gate/action labels.
  if (diagnosticOnly) canonical = applyScenarioDecisionPolicy(canonical, 'sports_placebo');
  for (const key of ['riskGate', 'expiryGate', 'entryAction', 'status', 'reasons']) {
    requireThat(canonicalJson(value[key]) === canonicalJson(canonical[key]), `${key} does not match canonical decision policy`);
  }
  requireThat(canonicalJson(value.calculation) === canonicalJson(canonical.calculation), 'calculation does not match the canonical controls');
  requireThat(canonicalJson(value.materialTrace) === canonicalJson(canonical.materialTrace), 'material trace does not match the canonical controls');
  for (const key of ['assignmentValueUsd', 'baselineAssignmentValueUsd', 'rawMaterialValueUsd', 'baselineRawMaterialValueUsd',
    'successValueUsd', 'baselineSuccessValueUsd', 'underlyingExpectedProxyUsd', 'expectedNetCashUsd', 'amountAtRiskUsd',
    'saleProbability', 'noSaleProbability', 'conditionalSaleProfitUsd', 'unweightedNoSaleResidualMarkUsd', 'weightedNoSaleResidualMarkUsd']) {
    // Null stays unavailable. Every claimed value must be produced by the
    // current engine, including its no-sale and liquidity policy.
    if (value[key] !== null) requireThat(value[key] === canonical[key], `${key} does not match canonical gold-first economics`);
  }
  requireThat(Array.isArray(value.intervals), 'canonical sale intervals are required');
  if (value.intervals.length || value.expectedNetCashUsd !== null) {
    requireThat(canonicalJson(value.intervals) === canonicalJson(canonical.intervals), 'sale intervals do not match canonical gold-first economics');
  }
  return canonical;
}

function forecastSummary(value, controls, expectedSignal, canonical) {
  const forecast = value.goldForecast;
  requireThat(object(forecast), 'v2 outcomes require a gold forecast trace');
  requireThat(forecast.methodVersion === 'assumed-gold-response-v1' && forecast.transferTarget === 'gold_price'
    && forecast.provenance === 'assumed' && forecast.calibrationStatus === 'uncalibrated', 'gold forecast method, target and assumed provenance are required');
  requireThat(['illustrative', 'not_applicable', 'INSUFFICIENT_DATA'].includes(forecast.status), 'unsupported gold forecast status');
  requireThat(forecast.day === value.horizonDays, 'gold forecast day does not match outcome');
  requireThat(typeof forecast.timingAssumption === 'string' && forecast.timingAssumption.length <= 4096, 'gold forecast timing assumption must be bounded text');
  requireThat([null, 'quantity_weighted_au_oz', 'equal_quote_mean_zero_quantity'].includes(forecast.priceBasis), 'unsupported gold forecast price basis');
  const calculation = value.calculation;
  requireThat(object(calculation) && calculation.transferTarget === 'gold_price'
    && calculation.goldForecastMethodVersion === forecast.methodVersion, 'calculation must identify the gold forecast method');
  for (const [key, control] of [['cap', 'goldResponseCap'], ['exposure', 'eventExposure'], ['retention', 'retention']]) {
    requireThat(within(forecast[key], 0, key === 'cap' ? 0.07 : 1)
      && forecast[key] === calculation[key] && forecast[key] === controls?.[control], `gold forecast ${key} does not match calculation controls`);
  }
  requireThat(within(forecast.signal, -1, 1) && forecast.signal === expectedSignal && forecast.signal === calculation.signal,
    'gold forecast signal does not match the selected comparison');
  for (const key of ['baselinePriceUsdPerOz', 'scenarioPriceUsdPerOz', 'priceDeltaUsdPerOz', 'adjustment']) {
    requireThat(forecast[key] === null || (typeof forecast[key] === 'number' && Number.isFinite(forecast[key])), `gold forecast ${key} must be finite or null`);
  }
  if (forecast.status !== 'INSUFFICIENT_DATA') {
    requireThat(Array.isArray(value.materialTrace), 'gold forecast requires a material trace');
    requireThat(canonicalJson(forecast) === canonicalJson(canonical.goldForecast), 'gold forecast does not match the canonical material trace');
    if (value.assignmentValueUsd !== null) requireThat(value.adjustment === forecast.adjustment, 'outcome adjustment must match its gold forecast');
  } else {
    requireThat(value.assignmentValueUsd === null && value.expectedNetCashUsd === null, 'unavailable gold forecast cannot carry money');
  }
  return {
    status: forecast.status, methodVersion: forecast.methodVersion, transferTarget: forecast.transferTarget,
    provenance: forecast.provenance, calibrationStatus: forecast.calibrationStatus,
    day: forecast.day, baselinePriceUsdPerOz: forecast.baselinePriceUsdPerOz,
    scenarioPriceUsdPerOz: forecast.scenarioPriceUsdPerOz, priceDeltaUsdPerOz: forecast.priceDeltaUsdPerOz,
    adjustment: forecast.adjustment, signal: forecast.signal, cap: forecast.cap,
    exposure: forecast.exposure, retention: forecast.retention, timingAssumption: forecast.timingAssumption,
    priceBasis: forecast.priceBasis, reasons: strings(forecast.reasons, 'gold forecast reasons'),
  };
}

function outcome(value, mode, horizonDays, evidenceGate, controls, expectedSignal, diagnosticOnly = false) {
  if (value === null) return null;
  requireThat(object(value) && value.version === VERSION && value.horizonDays === horizonDays, 'outcome version or day horizon does not match');
  requireThat(mode === 'demo', 'monetary outcomes require explicit demo mode');
  requireThat(STATUSES.includes(value.status), 'unsupported outcome status');
  requireThat([null, 'SKIP', 'BUY_CANDIDATE'].includes(value.entryAction), 'unsupported entry action');
  for (const key of ['evidenceGate', 'expiryGate', 'riskGate']) requireThat(GATES.includes(value[key]), `invalid ${key}`);
  requireThat(value.evidenceGate === evidenceGate, 'outcome evidence gate does not match the workbench evidence gate');
  if (value.entryAction === 'BUY_CANDIDATE') {
    requireThat(value.status === 'illustrative' && ['evidenceGate', 'expiryGate', 'riskGate'].every((key) => value[key] === 'PASS'), 'BUY_CANDIDATE requires passing canonical gates');
  }
  const numeric = {};
  for (const key of ['assignmentValueUsd', 'expectedNetCashUsd', 'amountAtRiskUsd', 'saleProbability']) {
    const item = value[key];
    requireThat(item === null || (typeof item === 'number' && Number.isFinite(item)), `${key} must be finite or null`);
    if (key === 'saleProbability' && item !== null) requireThat(item >= 0 && item <= 1, 'saleProbability must be between zero and one');
    numeric[key] = item;
  }
  if (value.entryAction === 'BUY_CANDIDATE') requireThat(Object.values(numeric).every((item) => typeof item === 'number') && numeric.expectedNetCashUsd > 0, 'BUY_CANDIDATE requires complete positive expected cash');
  // The canonical diagnostic excludes unsold marks from receipts. It does not
  // call a cash shortfall a realized investment loss.
  const diagnostic = diagnoseCash(value);
  if (numeric.expectedNetCashUsd !== null) requireThat(diagnostic.status === 'illustrative', 'finite expected cash must pass the canonical cash diagnostic');
  const canonical = canonicalEconomics(value, controls, expectedSignal, diagnosticOnly);
  const goldForecast = forecastSummary(value, controls, expectedSignal, canonical);
  return {
    status: value.status, entryAction: value.entryAction, reasons: strings(value.reasons, 'outcome reasons'),
    ...numeric, negativeCashProbability: diagnostic.negativeCashProbability,
    evidenceGate: value.evidenceGate, expiryGate: value.expiryGate, riskGate: value.riskGate, goldForecast,
    assignmentHurdles: { breakEven: requiredAssignmentProceeds(value), target25Percent: requiredAssignmentProceeds(value, { targetReturnRatio: 0.25 }) },
  };
}

/** Required explicit input selection also works when a pending workbench omits controls. */
export function decisionOutput({ selection, result } = {}) {
  const output = { contractVersion: OUTPUT_CONTRACT, modelVersion: VERSION, selection, result };
  decisionSummary(output);
  return output;
}

export function decisionSummary(output) {
  requireThat(object(output) && output.contractVersion === OUTPUT_CONTRACT && output.modelVersion === VERSION, 'unsupported contract or model version');
  const { selection, result } = output;
  requireThat(object(selection) && ['A', 'B'].includes(selection.area) && HORIZONS.includes(selection.horizonDays)
    && [...SCENARIOS, 'synthetic'].includes(selection.scenarioId), 'explicit area, 30/90/180 day horizon and scenario are required');
  requireThat(object(result) && result.version === VERSION && MODES.includes(result.mode) && STATUSES.includes(result.status), 'unsupported workbench result');
  requireThat(result.evidence?.area === selection.area && GATES.includes(result.evidence?.gate), 'evidence area or gate does not match selection');
  if (result.controls) requireThat(['area', 'horizonDays', 'scenarioId'].every((key) => result.controls[key] === selection[key]) && result.controls.mode === result.mode, 'controls do not match selection');
  requireThat(Array.isArray(result.horizons) && result.horizons.length === HORIZONS.length
    && result.horizons.every((row, index) => object(row) && row.days === HORIZONS[index]), 'all 30/90/180 day horizons are required in order');
  requireThat(object(result.signal) && ['ready', 'PENDING_SWARM', 'INSUFFICIENT_DATA'].includes(result.signal.status), 'signal readiness is required');
  requireThat(result.signal.value === null || (typeof result.signal.value === 'number' && Number.isFinite(result.signal.value)), 'signal value must be finite or null');
  const signalContext = contrastContext(result, selection);
  if (result.mode !== 'demo' || result.signal.value === null) requireThat(result.mapped === null && result.horizons.every((row) => row.mapped === null), 'pending or unavailable signals cannot carry mapped money');
  if (result.mode !== 'demo') requireThat(result.baseline === null && result.horizons.every((row) => row.baseline === null), 'pending and real-data modes cannot carry demo money');
  const selected = result.horizons.find((row) => row.days === selection.horizonDays);
  requireThat(canonicalJson(selected.baseline) === canonicalJson(result.baseline) && canonicalJson(selected.mapped) === canonicalJson(result.mapped), 'selected outcomes do not match the day horizon');
  const horizons = result.horizons.map((row) => ({ days: row.days, baseline: outcome(row.baseline, result.mode, row.days, result.evidence.gate, result.controls, 0), mapped: outcome(row.mapped, result.mode, row.days, result.evidence.gate, result.controls, result.signal.value, selection.scenarioId === 'sports_placebo') }));
  if (result.mapped) requireThat(result.signal.transferTarget === 'gold_price'
    && (result.mapped.goldForecast.adjustment === null || result.signal.adjustment === result.mapped.goldForecast.adjustment),
    'signal adjustment must identify and match the gold forecast');
  const selectedSummary = horizons.find((row) => row.days === selection.horizonDays);
  const hasEconomics = horizons.some((row) => row.baseline || row.mapped);
  if (hasEconomics) requireThat(result.provenance?.economics === 'assumed' && result.provenance?.liquidity === 'assumed', 'demo economics and liquidity must be labelled assumed');
  const context = hasEconomics ? lotContext(result.controls) : null;
  const exposure = hasEconomics ? exposureContext(result.controls) : null;
  // Older explicitly controlled fixtures may omit this additive metadata.
  // Supplied context must never relabel a custom amount as an observed price.
  if (result.lotContext != null) requireThat(canonicalJson(result.lotContext) === canonicalJson(context), 'lot context does not match the canonical entry controls');
  if (result.exposureContext != null) requireThat(canonicalJson(result.exposureContext) === canonicalJson(exposure), 'exposure context does not match the canonical interest controls');
  return {
    kind: 'decision', contractVersion: SUMMARY_CONTRACT, modelVersion: VERSION,
    modelMode: result.mode, status: result.status, area: selection.area, horizonDays: selection.horizonDays, scenarioId: selection.scenarioId,
    readiness: { evidenceGate: result.evidence.gate, swarmStatus: signalContext?.researchReadiness.status ?? result.signal.status, economicsStatus: hasEconomics ? 'assumed' : 'missing' },
    provenance: { evidence: result.evidence.provenance ?? null, economics: hasEconomics ? result.provenance.economics : null, liquidity: hasEconomics ? result.provenance.liquidity : null, signal: result.signal.provenance ?? null },
    reasons: strings(result.reasons, 'reasons'), assumptions: strings(result.assumptions, 'assumptions'),
    horizons, selected: { baseline: selectedSummary.baseline, mapped: selectedSummary.mapped },
    lotContext: context,
    exposureContext: exposure,
    ...(signalContext ? { signalContext } : {}),
  };
}

export function decisionRunMode(summary) {
  return summary.modelMode === 'demo' ? 'scenario' : 'evidence_only';
}
