import { VERSION, HORIZONS, SCENARIOS } from './config.mjs';
import { diagnoseCash } from './diagnostics.mjs';

/** A projection of the canonical workbench, never a second decision engine. */
export const OUTPUT_CONTRACT = 'tok-assignment-output-v1';
export const SUMMARY_CONTRACT = 'tok-assignment-summary-v1';
const MODES = ['pending', 'demo', 'real'];
const STATUSES = ['pending', 'INSUFFICIENT_DATA', 'PENDING_SWARM', 'illustrative', 'ineligible', 'diagnostic'];
const GATES = ['PASS', 'FAIL', 'UNKNOWN'];
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

function outcome(value, mode, horizonDays, evidenceGate) {
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
  return {
    status: value.status, entryAction: value.entryAction, reasons: strings(value.reasons, 'outcome reasons'),
    ...numeric, negativeCashProbability: diagnostic.negativeCashProbability,
    evidenceGate: value.evidenceGate, expiryGate: value.expiryGate, riskGate: value.riskGate,
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
  if (result.mode !== 'demo' || result.signal.value === null) requireThat(result.mapped === null && result.horizons.every((row) => row.mapped === null), 'pending or unavailable signals cannot carry mapped money');
  if (result.mode !== 'demo') requireThat(result.baseline === null && result.horizons.every((row) => row.baseline === null), 'pending and real-data modes cannot carry demo money');
  const selected = result.horizons.find((row) => row.days === selection.horizonDays);
  requireThat(canonicalJson(selected.baseline) === canonicalJson(result.baseline) && canonicalJson(selected.mapped) === canonicalJson(result.mapped), 'selected outcomes do not match the day horizon');
  const horizons = result.horizons.map((row) => ({ days: row.days, baseline: outcome(row.baseline, result.mode, row.days, result.evidence.gate), mapped: outcome(row.mapped, result.mode, row.days, result.evidence.gate) }));
  const selectedSummary = horizons.find((row) => row.days === selection.horizonDays);
  const hasEconomics = horizons.some((row) => row.baseline || row.mapped);
  if (hasEconomics) requireThat(result.provenance?.economics === 'assumed' && result.provenance?.liquidity === 'assumed', 'demo economics and liquidity must be labelled assumed');
  return {
    kind: 'decision', contractVersion: SUMMARY_CONTRACT, modelVersion: VERSION,
    modelMode: result.mode, status: result.status, area: selection.area, horizonDays: selection.horizonDays, scenarioId: selection.scenarioId,
    readiness: { evidenceGate: result.evidence.gate, swarmStatus: result.signal.status, economicsStatus: hasEconomics ? 'assumed' : 'missing' },
    provenance: { evidence: result.evidence.provenance ?? null, economics: hasEconomics ? result.provenance.economics : null, liquidity: hasEconomics ? result.provenance.liquidity : null, signal: result.signal.provenance ?? null },
    reasons: strings(result.reasons, 'reasons'), assumptions: strings(result.assumptions, 'assumptions'),
    horizons, selected: { baseline: selectedSummary.baseline, mapped: selectedSummary.mapped },
  };
}

export function decisionRunMode(summary) {
  return summary.modelMode === 'demo' ? 'scenario' : 'evidence_only';
}
