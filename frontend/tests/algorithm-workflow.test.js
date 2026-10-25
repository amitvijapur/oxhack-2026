import test from 'node:test';
import assert from 'node:assert/strict';
import { algorithmSnapshot as snapshot, getAlgorithmFrame } from '../src/lib/algorithm-workflow.mjs';

const frame = (selection = {}) => getAlgorithmFrame(snapshot, selection);
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('the calculation trace pins the canonical v2 engine and every executed input', () => {
  assert.equal(snapshot.schemaVersion, 1);
  assert.match(snapshot.source.commit, /^[a-f0-9]{40}$/);
  assert.equal(snapshot.source.modelVersion, 'tok-option-demo-v2');
  assert.equal(snapshot.source.mode, 'demo');
  assert.equal(snapshot.source.economics, 'assumed');
  assert.equal(snapshot.source.goldResponse, 'uncalibrated assumed relationship');
  for (const path of ['model/tok-option/gold.mjs', 'model/tok-option/valuation.mjs', 'model/tok-option/data/swarm-source.json', 'model/tok-option/data/land-source.json', 'frontend/public/data/tok-gold/site-a/samples.geojson', 'frontend/public/data/tok-gold/site-b/samples.geojson']) assert.match(snapshot.source.inputHashes[path], /^[a-f0-9]{64}$/);
  assert.ok(Object.keys(snapshot.source.inputHashes).every((path) => !path.startsWith('/')));
});

test('approval contrasts with the matching recorded placebo while research stays failed', () => {
  const result = frame();
  assert.equal(result.available, true);
  assert.equal(result.signal.referenceRunId, '04_placebo_s1');
  assert.equal(result.signal.scenarioRunId, '05_mine_approved_s1');
  assert.equal(result.signal.demoEligible, true);
  assert.equal(result.signal.researchReadiness.status, 'fail');
  assert.equal(result.signal.transferTarget, 'gold_price');
  near(result.signal.value, -0.02517925880444946);
  near(result.signal.groups.find((row) => row.group === 'industry').delta, -0.026002506265664138);
});

test('the recorded contrast adjusts gold before material value and the assignment floor', () => {
  const result = frame();
  near(result.mapped.goldForecast.baselinePriceUsdPerOz, 2000);
  near(result.mapped.goldForecast.scenarioPriceUsdPerOz, 1996.474903767377);
  near(result.mapped.rawMaterialValueUsd, 998237.4518836886);
  near(result.mapped.successValueUsd, 9982.374518836887);
  near(result.mapped.assignmentValueUsd, 1495.5936297092217);
  near(result.baseline.assignmentValueUsd, 1500);
  assert.equal(result.mapped.materialTrace[0].quantity, 500);
  assert.equal(result.baseline.materialTrace[0].quantity, 500);
  assert.equal(result.candidate.materials[0].derivedFromPpm, false);
});

test('source evidence gates differ by area without pretending to establish resources or rights', () => {
  const a = frame();
  const b = frame({ area: 'B' });
  assert.deepEqual([a.evidence.gate, a.evidence.pass, a.evidence.total], ['PASS', 25, 33]);
  assert.deepEqual([b.evidence.gate, b.evidence.pass, b.evidence.total], ['FAIL', 16, 34]);
  assert.equal(a.mapped.entryAction, 'SKIP');
  assert.equal(b.mapped.entryAction, 'SKIP');
  assert.ok(b.mapped.reasons.includes('evidence_gate_failed'));
  assert.equal(a.controls.quantity, b.controls.quantity);
  assert.match(b.evidence.interpretation, /not a deposit probability/);
  assert.equal(b.candidate.provenance, 'assumed');
});

test('cash distinguishes the sale distribution, unsold mark and full upfront exposure', () => {
  const result = frame();
  near(result.mapped.saleProbability, 0.488);
  near(result.mapped.noSaleProbability, 0.512);
  near(result.mapped.expectedNetCashUsd, -29344.5503087019);
  assert.equal(result.mapped.amountAtRiskUsd, 30050);
  assert.equal(result.cashDiagnostics.mapped.outcomes.at(-1).kind, 'no_sale');
  assert.equal(result.cashDiagnostics.mapped.outcomes.at(-1).netCashUsd, -30050);
  assert.notEqual(result.mapped.expectedNetCashUsd, result.mapped.weightedNoSaleResidualMarkUsd);
});

test('holding horizons return their own canonical sale intervals and entry outcomes', () => {
  const short = frame({ horizonDays: 30 });
  const medium = frame({ horizonDays: 90 });
  const long = frame({ horizonDays: 180 });
  assert.deepEqual(short.mapped.intervals.map((row) => row.day), [30]);
  assert.deepEqual(medium.mapped.intervals.map((row) => row.day), [30, 60, 90]);
  assert.deepEqual(long.mapped.intervals.map((row) => row.day), [30, 60, 90, 120, 150, 180]);
  assert.equal(short.mapped.entryAction, 'SKIP');
  assert.equal(medium.mapped.entryAction, 'SKIP');
  assert.ok(long.mapped.expectedNetCashUsd > medium.mapped.expectedNetCashUsd);
  assert.equal(short.controls.horizonDays, 30);
  assert.equal(long.controls.horizonDays, 180);
});

test('unsupported or missing conditions never become neutral scored effects or mapped prices', () => {
  for (const scenarioId of ['sports_placebo', 'proposed_tax', 'protest', 'gold_reversal', 'missing']) {
    const result = frame({ scenarioId });
    assert.equal(result.available, false, scenarioId);
    assert.equal(result.mapped, null, scenarioId);
    assert.equal(result.signal?.value ?? null, null, scenarioId);
    assert.ok(result.reasons.length > 0, scenarioId);
  }
  assert.equal(frame({ area: 'missing' }).baseline, null);
  assert.equal(frame({ horizonDays: 45 }).mapped, null);
});

test('baseline zero is a no-event comparison rather than a measured swarm signal', () => {
  const result = frame({ scenarioId: 'baseline' });
  assert.equal(result.available, true);
  assert.equal(result.signal.value, 0);
  assert.equal(result.signal.provenance, 'baseline_comparison');
  assert.equal(result.signal.diagnosticOnly, true);
  near(result.mapped.goldForecast.scenarioPriceUsdPerOz, 2000);
  near(result.mapped.expectedNetCashUsd, -29342.4);
  assert.equal(result.cashDiagnostics.mapped.outcomes.length, 4);
});


test('the separate historical pilot retains its negative held-out result and pinned artifact', () => {
  const study = snapshot.validationStudy;
  assert.equal(study.studyId, 'alaska-project-event-pilot-v1');
  assert.equal(study.status, 'evaluated_selected_sample');
  assert.equal(study.target, 'Alaska mining-equity returns');
  assert.equal(study.trainEvents, 7);
  assert.equal(study.heldOutEvents, 5);
  near(study.metrics.goldOnlyMaePp, 3.129094706562224);
  near(study.metrics.eventMaePp, 8.059555218458533);
  near(study.metrics.noChangeMaePp, 2.556165327782003);
  assert.ok(study.metrics.eventMaePp > study.metrics.goldOnlyMaePp);
  assert.equal(study.sourceCommit, snapshot.source.commit);
  assert.equal(study.sourcePath, 'frontend/public/data/event-study.json');
  assert.equal(study.sourceSha256, snapshot.source.inputHashes[study.sourcePath]);
  assert.equal(study.sourceSha256, 'c62c41eec95916566620413568c23dce0f4d0f5925acec4f18798241c9eff3ac');
});

test('historical equity evaluation does not become a swarm forecast or option holding horizon', () => {
  const study = snapshot.validationStudy;
  assert.equal(study.primaryHorizonSessions, 5);
  assert.equal(frame().horizonDays, 90);
  assert.equal(study.swarmLiftStatus, 'unavailable');
  assert.equal(study.swarmLiftValue, null);
  assert.ok(study.limitations.some((line) => /does not estimate Tok option returns/.test(line)));
  assert.equal(frame().signal.researchReadiness.status, 'fail');
  near(frame().mapped.expectedNetCashUsd, -29344.5503087019);
});


test('snapshot carries the historical whole-contract basis and approved fund policy', () => {
  assert.equal(snapshot.lotBasis.unit, 'whole_contract');
  assert.equal(snapshot.lotBasis.initialPremiumUsd, 30000);
  assert.equal(snapshot.lotBasis.referenceCount, 2);
  assert.equal(snapshot.lotBasis.sources.length, 2);
  assert.deepEqual([snapshot.capitalPolicy.startingFundUsd, snapshot.capitalPolicy.maxRiskPerOptionUsd, snapshot.capitalPolicy.maxOpenRiskUsd, snapshot.capitalPolicy.maxWholeCohortCommittedUsd, snapshot.capitalPolicy.maxPositions], [1502500, 30050, 150250, 150250, 5]);
  assert.equal(frame().controls.entryPremiumUsd, 30000);
  assert.ok(frame().mapped.reasons.includes('nonpositive_expected_cash'));
});
