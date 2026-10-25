/** Freeze a display trace by executing an existing canonical checkout, not copied math. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCENARIOS = ['baseline', 'mine_approval', 'mine_blocked', 'sports_placebo', 'proposed_tax', 'protest', 'gold_reversal'];
const HORIZONS = [30, 90, 180];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (root, args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
const pick = (value, keys) => Object.fromEntries(keys.filter((key) => value?.[key] !== undefined).map((key) => [key, value[key]]));
const RESULT_KEYS = ['status', 'reasons', 'day', 'currency', 'baselineRawMaterialValueUsd', 'rawMaterialValueUsd', 'baselineSuccessValueUsd', 'successValueUsd', 'underlyingExpectedProxyUsd', 'baselineAssignmentValueUsd', 'assignmentValueUsd', 'adjustment', 'materialTrace', 'goldForecast', 'saleProbability', 'noSaleProbability', 'expectedNetCashUsd', 'conditionalSaleProfitUsd', 'weightedNoSaleResidualMarkUsd', 'unweightedNoSaleResidualMarkUsd', 'amountAtRiskUsd', 'intervals', 'version', 'id', 'underlyingId', 'horizonDays', 'entryAction', 'evidenceGate', 'expiryGate', 'riskGate', 'termsProvenance', 'calculation', 'assumption'];
const reducedResult = (value) => value ? {
  ...pick(value, RESULT_KEYS),
  intervals: value.intervals.map((row) => ({ ...row, goldForecast: row.goldForecast ? pick(row.goldForecast, ['day', 'baselinePriceUsdPerOz', 'scenarioPriceUsdPerOz', 'adjustment']) : undefined })),
} : null;

export async function buildAlgorithmSnapshot(sourceRoot) {
  const root = resolve(sourceRoot);
  const sourceCommit = git(root, ['rev-parse', 'HEAD']);
  const validationPath = 'frontend/public/data/event-study.json';
  const hasValidation = git(root, ['ls-tree', '--name-only', sourceCommit, validationPath]) === validationPath;
  const modelDirectory = join(root, 'model/tok-option');
  const direct = (await readdir(modelDirectory)).filter((file) => file.endsWith('.mjs')).map((file) => `model/tok-option/${file}`);
  const integration = (await readdir(join(modelDirectory, 'integrations'))).filter((file) => file.endsWith('.mjs')).map((file) => `model/tok-option/integrations/${file}`);
  const paths = [...direct, ...integration, 'model/tok-option/data/land-source.json', 'model/tok-option/data/swarm-source.json', 'frontend/public/data/tok-gold/site-a/samples.geojson', 'frontend/public/data/tok-gold/site-b/samples.geojson', ...(hasValidation ? [validationPath] : [])].sort();
  const hashInputs = async () => Object.fromEntries(await Promise.all(paths.map(async (path) => [path, sha(await readFile(join(root, path)))])));
  const inputHashes = await hashInputs();
  // Every executed source/input must match the recorded commit. Unrelated docs
  // can change in a collaborator's checkout without changing this trace.
  for (const path of paths) {
    const committed = execFileSync('git', ['-C', root, 'show', `${sourceCommit}:${path}`]);
    if (sha(committed) !== inputHashes[path]) throw new Error(`Uncommitted model/input file: ${path}`);
  }
  let validationStudy;
  if (hasValidation) {
    const study = JSON.parse(await readFile(join(root, validationPath), 'utf8'));
    const primary = study.horizons?.find((row) => row.primary === true);
    if (!primary || !Number.isSafeInteger(primary.days) || !Array.isArray(primary.trainEventIds) || !Array.isArray(primary.testEventIds)) throw new Error('Historical study has no valid primary evaluation.');
    const metric = (name) => Number.isFinite(primary.metrics?.[name]?.maePercentagePoints) ? primary.metrics[name].maePercentagePoints : null;
    validationStudy = {
      studyId: study.studyId, status: study.status, target: 'Alaska mining-equity returns',
      primaryHorizonSessions: primary.days, heldOutEvents: primary.testEventIds.length, trainEvents: primary.trainEventIds.length,
      metrics: { goldOnlyMaePp: metric('goldBaseline'), eventMaePp: metric('eventModel'), noChangeMaePp: metric('noChange') },
      swarmLiftStatus: study.swarmLift?.status ?? 'unknown',
      swarmLiftValue: Number.isFinite(study.swarmLift?.value) ? study.swarmLift.value : null,
      limitations: Array.isArray(study.limitations) ? study.limitations : [],
      sourceCommit, sourcePath: validationPath, sourceSha256: inputHashes[validationPath],
    };
  }
  const { runWorkbench, createDemoCandidate } = await import(pathToFileURL(join(modelDirectory, 'workbench.mjs')).href);
  const features = (await Promise.all(['a', 'b'].map(async (area) => JSON.parse(await readFile(join(root, `frontend/public/data/tok-gold/site-${area}/samples.geojson`), 'utf8')).features))).flat();
  const areas = {};
  let modelVersion;
  for (const area of ['A', 'B']) {
    const scenarios = {};
    let evidence;
    let landContext;
    for (const scenarioId of SCENARIOS) {
      const outputs = HORIZONS.map((horizonDays) => runWorkbench({ features, controls: { mode: 'demo', area, horizonDays, swarmPolicy: 'illustrative_contrast', scenarioId } }));
      const primary = outputs[1];
      modelVersion = primary.version;
      evidence = pick(primary.evidence, ['gate', 'pass', 'fail', 'unknown', 'total', 'lowerFraction', 'upperFraction', 'rule', 'reasons', 'area', 'provenance', 'interpretation']);
      landContext = pick(primary.sourceAudit.land, ['status', 'area', 'summary', 'coverage', 'provenance', 'reasons', 'limitations']);
      const signal = pick(primary.signal, ['status', 'value', 'adjustment', 'groups', 'reasons', 'provenance', 'usagePolicy', 'referenceRunId', 'scenarioRunId', 'researchReadiness', 'demoEligible', 'diagnosticOnly', 'transferTarget', 'transfer', 'limitations']);
      scenarios[scenarioId] = {
        status: primary.status, reasons: primary.reasons, controls: primary.controls,
        candidate: createDemoCandidate(primary.controls), signal,
        horizons: outputs.map((output, index) => ({
          days: HORIZONS[index], baseline: reducedResult(output.baseline), mapped: reducedResult(output.mapped), delta: output.delta,
          cashDiagnostics: output.cashDiagnostics, portfolio: output.portfolio,
        })),
      };
    }
    areas[area] = { evidence, landContext, scenarios };
  }
  if (JSON.stringify(inputHashes) !== JSON.stringify(await hashInputs())) throw new Error('Canonical inputs changed during snapshot generation; retry from a stable checkout.');
  // Share unchanged baseline traces, controls and research diagnostics instead
  // of shipping them repeatedly for every scenario.
  const researchDiagnostics = areas.A.scenarios.mine_approval.signal.researchReadiness?.diagnostics ?? [];
  for (const areaData of Object.values(areas)) {
    const base = areaData.scenarios.baseline;
    areaData.controls = base.controls;
    areaData.candidate = base.candidate;
    areaData.baseline = base.horizons.map((row) => ({ days: row.days, result: row.baseline, diagnostics: row.cashDiagnostics.baseline, portfolio: row.portfolio }));
    for (const [scenarioId, scenario] of Object.entries(areaData.scenarios)) {
      delete scenario.controls;
      delete scenario.candidate;
      if (scenario.signal.researchReadiness) delete scenario.signal.researchReadiness.diagnostics;
      scenario.horizons = scenarioId === 'baseline' ? [] : scenario.horizons.map((row) => ({ days: row.days, mapped: row.mapped, delta: row.delta, diagnostics: row.cashDiagnostics.mapped, portfolio: row.portfolio }));
    }
  }
  return {
    schemaVersion: 1,
    source: { commit: sourceCommit, modelVersion, inputHashes, provenance: 'Canonical engine output snapshot', economics: 'assumed', liquidity: 'assumed', goldResponse: 'uncalibrated assumed relationship', mode: 'demo', researchReadiness: 'failed_or_unknown', note: 'Recorded contrasts can drive hypothetical calculations only; this does not change strict research readiness or supply executable land prices.' },
    researchDiagnostics, ...(validationStudy ? { validationStudy } : {}), areas,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceRoot = process.argv[2];
  if (!sourceRoot) throw new Error('Usage: node frontend/scripts/update-algorithm-workflow.mjs /path/to/canonical/checkout [output.json]');
  const output = process.argv[3] ? resolve(process.argv[3]) : resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/algorithm-workflow.json');
  const snapshot = await buildAlgorithmSnapshot(sourceRoot);
  await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${output} from ${snapshot.source.commit} (${snapshot.source.modelVersion}).`);
}
