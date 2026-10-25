import { EVIDENCE_RULE, within } from './config.mjs';

export function classifyBounds({ lowerPpm = null, upperPpm = null, upperInclusive = true } = {}, thresholdPpm = EVIDENCE_RULE.thresholdPpm) {
  if (!within(thresholdPpm, 0) || (lowerPpm !== null && !within(lowerPpm, 0)) || (upperPpm !== null && !within(upperPpm, 0))) return 'UNKNOWN';
  if (lowerPpm !== null && upperPpm !== null && (lowerPpm > upperPpm || (lowerPpm === upperPpm && !upperInclusive))) return 'UNKNOWN';
  if (lowerPpm !== null && lowerPpm >= thresholdPpm) return 'PASS';
  if (upperPpm !== null && (upperPpm < thresholdPpm || (upperPpm === thresholdPpm && !upperInclusive))) return 'FAIL';
  return 'UNKNOWN';
}

/** Read only the primary assay. A retest never replaces or duplicates it. */
export function sampleBounds(feature) {
  const p = feature?.properties ?? feature ?? {};
  if (p.gold_primary_unit !== 'ppm') return { lowerPpm: null, upperPpm: null, reason: 'unsupported_assay_unit' };
  const value = p.gold_primary_value_ppm;
  const bound = p.gold_primary_bound_ppm;
  if (p.gold_primary_status === 'quantified' && within(value, 0)) return { lowerPpm: value, upperPpm: value, upperInclusive: true };
  // The snapshot's status and method-bound fields decode negative analytical sentinels.
  if (p.gold_primary_status === 'above_detection' && within(bound, 0)) return { lowerPpm: bound, upperPpm: null, upperInclusive: false };
  if (p.gold_primary_status === 'below_detection' && within(bound, 0)) return { lowerPpm: 0, upperPpm: bound, upperInclusive: false };
  return { lowerPpm: null, upperPpm: null, reason: 'missing_or_invalid_primary_assay' };
}

export function evidenceFromCounts({ pass = 0, fail = 0, unknown = 0 } = {}, rule = EVIDENCE_RULE) {
  const valid = rule && typeof rule === 'object' && [pass, fail, unknown].every((n) => Number.isSafeInteger(n) && n >= 0)
    && within(rule.thresholdPpm, 0) && Number.isSafeInteger(rule.minimumClassifiedSamples) && rule.minimumClassifiedSamples >= 1
    && within(rule.minimumQualifyingFraction, 0, 1);
  if (!valid) return { gate: 'UNKNOWN', pass, fail, unknown, total: null, lowerFraction: null, upperFraction: null, reasons: ['invalid_evidence_rule_or_counts'] };
  const total = pass + fail + unknown;
  const lowerFraction = total ? pass / total : null;
  const upperFraction = total ? (pass + unknown) / total : null;
  let gate = 'UNKNOWN';
  if (total && pass + fail >= rule.minimumClassifiedSamples) {
    if (lowerFraction >= rule.minimumQualifyingFraction) gate = 'PASS';
    else if (upperFraction < rule.minimumQualifyingFraction) gate = 'FAIL';
  }
  return { gate, pass, fail, unknown, total, lowerFraction, upperFraction, rule: { ...rule }, reasons: gate === 'UNKNOWN' ? ['insufficient_or_ambiguous_evidence'] : [] };
}

export function evaluateEvidence(features = [], { area = null, rule = EVIDENCE_RULE } = {}) {
  const rows = Array.isArray(features) ? features.filter((f) => !area || f?.properties?.area === area) : [];
  const classified = rows.map((feature) => ({ sampleId: feature?.id ?? feature?.properties?.sample_id ?? null, sourceId: feature?.properties?.source_id ?? null, bounds: sampleBounds(feature), classification: classifyBounds(sampleBounds(feature), rule?.thresholdPpm ?? null) }));
  const counts = { pass: 0, fail: 0, unknown: 0 };
  for (const row of classified) counts[row.classification.toLowerCase()] += 1;
  return { ...evidenceFromCounts(counts, rule), area, provenance: 'observed', interpretation: 'Comparison-area screen only; not a deposit probability, legal parcel or resource estimate.', samples: classified };
}
