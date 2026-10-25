// Specification consistency checks only. No production engine is imported or exercised.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (name) => JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
const d = await read('defaults.json');
const f = await read('fixtures.json');
const b = f.base;
let checks = 0;
const close = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const check = (name, fn) => {
  try { fn(); checks += 1; }
  catch (error) { throw new Error(`Specification check failed: ${name}`, { cause: error }); }
};
const raw = b.quantity.value * b.materialPrice.value;
const success = raw * b.ownershipFraction * b.kappa;
const assignment = b.pGeo * Math.max(success - b.remainingBuyerConsiderationUsd, 0);
const risk = b.entryPremiumUsd + b.entryFeeUsd + b.unavoidableAdditionalObligationsUsd;
const weights = Array.from({ length: b.horizonDays / 30 }, (_, i) => (1 - b.assumedHazardPer30Days) ** i * b.assumedHazardPer30Days);
const probability = weights.reduce((sum, value) => sum + value, 0);

check('versions and explicit provenance', () => {
  assert.equal(d.version, 'tok-option-demo-v2');
  assert.equal(f.version, d.version);
  assert.equal(d.mode, 'explicit_demo');
  assert.equal(b.mode, d.mode);
  assert.equal(d.requiresExplicitDemoSelection, true);
  assert.equal(f.provenance.defaultStatus, 'hypothetical_fixture');
  assert.equal(f.provenance.actualContractsIncluded, false);
  assert.equal(f.provenance.actualSwarmRunsIncluded, false);
  assert.ok(d.provenance.some((record) => record.status === 'user_choice'));
  assert.ok(d.provenance.some((record) => record.status === 'proposed_default'));
});
check('dimensions and separate dollar layers', () => {
  assert.equal(b.quantity.unit, 'troy_oz');
  assert.equal(b.materialPrice.unit, 'USD/troy_oz');
  assert.equal(b.quantity.derivedFromPpm, false);
  close(raw, b.expected.rawMaterialValueUsd);
  close(success, b.expected.successValueUsd);
  close(b.pGeo * success, b.expected.underlyingExpectedProxyUsd);
  close(assignment, b.expected.baselineAssignmentValueUsd);
  assert.notEqual(b.expected.underlyingExpectedProxyUsd, assignment);
  close(risk, b.expected.amountAtRiskUsd);
});
check('canonical groups and normalized weights', () => {
  assert.deepEqual(d.swarm.canonicalGroups, ['government', 'industry', 'community', 'funds', 'retail']);
  assert.deepEqual(Object.keys(d.swarm.groupWeights).sort(), [...d.swarm.canonicalGroups].sort());
  close(Object.values(d.swarm.groupWeights).reduce((a, x) => a + x, 0), 1);
  assert.ok(Object.values(d.swarm.groupWeights).every((x) => x >= 0));
  assert.equal(d.swarm.priceAdjustmentCap, 0.07);
  assert.equal(d.swarm.transferTarget, 'gold_price');
  assert.equal(d.swarm.forecastMethod, 'assumed-gold-response-v1');
  assert.deepEqual(d.swarm.groupWeights, { government: 0.1, industry: 0.4, community: 0.07, funds: 0.4, retail: 0.03 });
  assert.deepEqual([d.swarm.scoreMin, d.swarm.scoreMax], [0, 10]);
  assert.equal(d.swarm.comparison.normalizationDivisor, d.swarm.scoreMax - d.swarm.scoreMin);
  assert.deepEqual(d.swarm.comparison.days, [3, 4, 5]);
  assert.equal(d.swarm.comparison.baselineSeed, 1);
});
check('disjoint interval sale probabilities', () => {
  assert.equal(weights.length, b.expected.intervalSaleWeights.length);
  weights.forEach((value, i) => close(value, b.expected.intervalSaleWeights[i]));
  close(probability, b.expected.saleProbability);
  close(1 - probability, b.expected.noSaleProbability);
  close(probability, 1 - (1 - b.assumedHazardPer30Days) ** (b.horizonDays / 30));
});
for (const c of f.cashCases) check(c.id, () => {
  if (c.groupScoreDeltas) close(Object.entries(c.groupScoreDeltas).reduce((sum, [group, delta]) => sum + d.swarm.groupWeights[group] * delta / 10, 0), c.signal);
  assert.ok(c.signal >= -1 && c.signal <= 1);
  const goldPrice = b.materialPrice.value * (1 + d.swarm.priceAdjustmentCap * c.signal * b.eventExposure * b.retention);
  const value = b.pGeo * Math.max(b.quantity.value * goldPrice * b.ownershipFraction * b.kappa - b.remainingBuyerConsiderationUsd, 0);
  const cash = weights.reduce((sum, weight) => sum + weight * (value - b.exitFeeUsd), 0) - risk;
  close(value, c.expected.assignmentValueUsd);
  close(value - b.exitFeeUsd - risk, c.expected.conditionalSaleProfitUsd);
  close(cash, c.expected.expectedNetCashUsd);
  close((1 - probability) * value, c.expected.weightedNoSaleResidualMarkUsd);
  assert.equal(c.expected.entryAction, cash > 0 ? 'BUY_CANDIDATE' : 'SKIP');
});
for (const c of f.horizonCases) check(`horizon ${c.horizonDays}`, () => {
  assert.ok(d.time.horizonsDays.includes(c.horizonDays));
  const p = 1 - (1 - b.assumedHazardPer30Days) ** (c.horizonDays / 30);
  close(p, c.expectedSaleProbability);
  close(p * (assignment - b.exitFeeUsd) - risk, c.expectedNetCashUsd);
  close((1 - p) * assignment, c.expectedWeightedNoSaleResidualMarkUsd);
});
const blocked = Object.fromEntries(f.blockedCases.map((c) => [c.id, c]));
check('missing real liquidity is null, not zero', () => {
  const c = blocked.insufficient_liquidity;
  assert.equal(c.mode, 'real');
  assert.equal(c.hazardPer30Days, null);
  assert.deepEqual(c.expected, { status: 'INSUFFICIENT_DATA', saleProbability: null, mappedExpectedNetCashUsd: null, entryAction: null });
});
check('missing swarm preserves baseline and null mapped outputs', () => {
  const c = blocked.missing_swarm;
  assert.equal(c.swarm, null);
  close(probability * (assignment - b.exitFeeUsd) - risk, c.expected.baselineExpectedNetCashUsd);
  assert.equal(c.expected.status, 'PENDING_SWARM');
  for (const key of ['mappedAssignmentValueUsd', 'mappedExpectedNetCashUsd', 'entryAction']) assert.equal(c.expected[key], null);
});
check('historical USD 650 fixture retains its explicit former risk policy', () => {
  const c = blocked.over_risk;
  const amount = c.entryPremiumUsd + c.entryFeeUsd + b.unavoidableAdditionalObligationsUsd;
  close(amount, c.expected.amountAtRiskUsd);
  assert.ok(amount > 2000); // Historical fixture limit, not the active whole-lot policy.
  assert.equal(c.expected.riskGate, 'FAIL');
  assert.equal(c.expected.entryAction, 'SKIP');
});
check('expiry buffer fails a 90-day expiry for a 90-day exit horizon', () => {
  const c = blocked.expiry_window_failure;
  close(c.horizonDays + c.expiryBufferDays, c.expected.requiredRemainingMaturityDays);
  assert.ok(c.remainingMaturityDays < c.expected.requiredRemainingMaturityDays);
  assert.equal(c.expected.expiryGate, 'FAIL');
  assert.equal(c.expected.entryAction, 'SKIP');
});
for (const c of f.timeCases) check(c.id, () => {
  const price = b.materialPrice.value * (1 + c.annualGrowthRate) ** (c.day / 365);
  const grownSuccess = b.quantity.value * price * b.ownershipFraction * b.kappa;
  close(price, c.expectedMaterialPriceUsdPerTroyOz);
  close(grownSuccess, c.expectedSuccessValueUsd);
  close(b.pGeo * Math.max(grownSuccess - b.remainingBuyerConsiderationUsd, 0), c.expectedBaselineAssignmentValueUsd);
});
for (const c of f.evidenceCases) check(c.id, () => {
  const classified = c.pass + c.fail;
  const total = classified + c.unknown;
  const lower = c.pass / total;
  const upper = (c.pass + c.unknown) / total;
  close(lower, c.expectedLowerFraction);
  close(upper, c.expectedUpperFraction);
  const gate = classified < d.evidence.minimumClassifiedSamples ? 'UNKNOWN' : lower >= d.evidence.minimumQualifyingFraction ? 'PASS' : upper < d.evidence.minimumQualifyingFraction ? 'FAIL' : 'UNKNOWN';
  assert.equal(gate, c.expectedGate);
});
for (const c of f.sampleBoundCases) check(c.id, () => {
  const threshold = d.evidence.thresholdPpm;
  const passes = c.lowerPpm !== null && c.lowerPpm >= threshold;
  const fails = c.upperPpm !== null && (c.upperPpm < threshold || (c.upperPpm === threshold && !c.upperInclusive));
  assert.equal(passes ? 'PASS' : fails ? 'FAIL' : 'UNKNOWN', c.expectedClass);
});
check('equal daily means, not pooled posts', () => {
  const c = f.aggregationCase;
  const means = c.dailyScores.map((scores) => scores.reduce((a, x) => a + x, 0) / scores.length);
  assert.deepEqual(means, c.expectedDailyMeans);
  close(means.reduce((a, x) => a + x, 0) / 3, c.expectedThreeDayMean);
});
check('configuration-only guardrails and fixed scope', () => {
  assert.equal(d.time.dayBasis, 365);
  assert.equal(d.time.annualDiscountRate, 0);
  assert.equal(d.time.historicalLookbackYears, 5);
  assert.deepEqual(d.time.horizonsDays, [30, 90, 180]);
  assert.equal(d.time.primaryHorizonDays, 90);
  assert.equal(d.evidence.thresholdPpm, 0.01);
  assert.equal(d.evidence.thresholdInclusive, true);
  assert.equal(d.evidence.minimumClassifiedSamples, 10);
  assert.equal(d.evidence.minimumQualifyingFraction, 0.5);
  assert.equal(d.evidence.snapshotSampleCount, 67);
  assert.equal(d.evidence.otherMaterials.enabled, false);
  assert.equal(d.liquidity.newsAdjustsHazard, false);
  assert.equal(d.liquidity.assumedHazardPer30Days, 0.2);
  assert.equal(b.assumedHazardPer30Days, d.liquidity.assumedHazardPer30Days);
  assert.equal(d.time.expiryBufferDays, 15);
  assert.equal(b.expiryBufferDays, d.time.expiryBufferDays);
  assert.equal(d.swarm.assumedEventExposure, 1);
  assert.equal(d.swarm.assumedRetention, 1);
  assert.equal(b.eventExposure, d.swarm.assumedEventExposure);
  assert.equal(b.retention, d.swarm.assumedRetention);
  assert.deepEqual([d.capital.startingFundUsd, d.capital.maxRiskPerOptionUsd, d.capital.maxOpenRiskUsd, d.capital.maxWholeCohortCommittedUsd, d.capital.maxPositions], [1502500, 30050, 150250, 150250, 5]);
  assert.equal(d.lotBasis.initialPremiumUsd, 30000);
  assert.equal(d.lotBasis.initialPremiumUsd + d.lotBasis.entryFeeUsd + d.lotBasis.unavoidableAdditionalObligationsUsd, d.capital.maxRiskPerOptionUsd);
  assert.equal(d.capital.maxRiskPerOptionUsd / d.capital.startingFundUsd, 0.02);
  assert.equal(d.capital.maxWholeCohortCommittedUsd / d.capital.startingFundUsd, 0.10);
  assert.ok(!d.capital.leverage && !d.capital.exercise && !d.capital.reinvestment);
  assert.equal(d.capital.oneUnderlyingAtMostOnce, true);
  assert.equal(d.capital.optimizer.maximumCandidateCount, 20);
  assert.ok(d.swarm.diagnosticOnlyScenarios.every((id) => !d.swarm.entryNewsScenarios.includes(id)));
});
check('synthetic whole-contract exposure is frozen independently of editable entry premium', () => {
  const profile = d.syntheticLotProfile;
  assert.equal(profile.id, 'synthetic-same-interest-whole-contract-v1');
  assert.equal(profile.provenance, 'assumed');
  close(profile.scaleFactor, 30000 / 650);
  close(profile.quantity, b.quantity.value * profile.scaleFactor);
  close(profile.remainingBuyerConsiderationUsd, b.remainingBuyerConsiderationUsd * profile.scaleFactor);
  const assignment = profile.pGeo * Math.max(profile.quantity * profile.price * profile.ownershipFraction * profile.kappa - profile.remainingBuyerConsiderationUsd, 0);
  close(assignment, 69230.76923076925);
  const fixedCash = probability * (assignment - d.lotBasis.exitFeeUsd) - (d.lotBasis.initialPremiumUsd + d.lotBasis.entryFeeUsd);
  close(fixedCash, 3710.215384615396);
  const scaledRisk = 30000 + profile.referenceUnit.entryFeeUsd * profile.scaleFactor;
  const scaledCash = probability * (assignment - profile.referenceUnit.exitFeeUsd * profile.scaleFactor) - scaledRisk;
  close(scaledCash / scaledRisk, 7.6 / 700);
  assert.ok(scaledRisk > d.capital.maxRiskPerOptionUsd);
});
console.log(`PASS: ${checks} specification consistency checks. No model engine, optimizer, adapter or real forecast was exercised.`);
