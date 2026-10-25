import { v, type Infer } from "convex/values";

// One shape per published run. Summaries hold only the fields the website
// lists; the full producer output stays in file storage. Unknown values are
// null, never 0, so missing evidence cannot look like a measurement.

export const workstreamKey = v.union(v.literal("decision"), v.literal("swarm"), v.literal("land"));
export type WorkstreamKey = Infer<typeof workstreamKey>;
export const WORKSTREAM_KEYS: readonly WorkstreamKey[] = ["decision", "swarm", "land"];

export const workstreamStatus = v.union(v.literal("pending"), v.literal("planning"), v.literal("live"));

/** Whether values are observed, assumed or evaluated; the website labels each run with it. */
export const runMode = v.union(
  v.literal("measured"),
  v.literal("evidence_only"),
  v.literal("scenario"),
  v.literal("empirical"),
);

const nullableString = v.union(v.string(), v.null());
const nullableNumber = v.union(v.number(), v.null());

const gate = v.union(v.literal("PASS"), v.literal("FAIL"), v.literal("UNKNOWN"));
const horizonDays = v.union(v.literal(30), v.literal(90), v.literal(180));
const decisionStatus = v.union(v.literal("pending"), v.literal("INSUFFICIENT_DATA"), v.literal("PENDING_SWARM"), v.literal("illustrative"), v.literal("ineligible"), v.literal("diagnostic"));
const signalStatus = v.union(v.literal("ready"), v.literal("PENDING_SWARM"), v.literal("INSUFFICIENT_DATA"));
const researchStatus = v.union(v.literal("pass"), v.literal("fail"), v.literal("unknown"));
const signalContext = v.object({
  usagePolicy: v.literal("illustrative_contrast"),
  calculationStatus: signalStatus,
  provenance: v.literal("simulated"),
  methodVersion: v.literal("matched-placebo-post-contrast-v1"),
  comparisonMethod: v.literal("matched_configuration_placebo_contrast"),
  referenceRunId: v.literal("04_placebo_s1"),
  scenarioRunId: v.string(),
  sourceId: v.string(),
  revision: v.string(),
  knowledgeCutoff: nullableString,
  scoreWindow: v.array(v.number()),
  scoreMetric: v.literal("mining_support"),
  scoreAggregation: v.literal("equal_daily_means"),
  demoEligible: v.boolean(),
  researchReadiness: v.object({
    status: researchStatus,
    diagnostics: v.array(v.object({ id: v.string(), label: v.string(), status: researchStatus, detail: v.string() })),
    scenarioReadiness: v.object({ status: researchStatus, reasons: v.array(v.string()) }),
  }),
  sourceChecks: v.array(v.object({ name: v.string(), status: v.string() })),
  pairwiseConfigurationStatus: v.union(v.literal("match"), v.literal("different"), v.literal("unknown")),
});

/** Canonical assignment-only output. Cash shortfall is not a realized loss. */
const decisionOutcome = v.union(v.null(), v.object({
  status: decisionStatus,
  entryAction: v.union(v.literal("BUY_CANDIDATE"), v.literal("SKIP"), v.null()),
  reasons: v.array(v.string()),
  assignmentValueUsd: nullableNumber,
  expectedNetCashUsd: nullableNumber,
  amountAtRiskUsd: nullableNumber,
  saleProbability: nullableNumber,
  negativeCashProbability: nullableNumber,
  evidenceGate: gate,
  expiryGate: gate,
  riskGate: gate,
}));

const outcomePair = { baseline: decisionOutcome, mapped: decisionOutcome };
export const decisionSummary = v.object({
  kind: v.literal("decision"),
  contractVersion: v.literal("tok-assignment-summary-v1"),
  modelVersion: v.literal("tok-option-demo-v1"),
  modelMode: v.union(v.literal("pending"), v.literal("demo"), v.literal("real")),
  status: decisionStatus,
  area: v.union(v.literal("A"), v.literal("B")),
  horizonDays,
  scenarioId: v.string(),
  readiness: v.object({ evidenceGate: gate, swarmStatus: v.union(signalStatus, researchStatus), economicsStatus: v.union(v.literal("assumed"), v.literal("missing")) }),
  signalContext: v.optional(signalContext),
  provenance: v.object({ evidence: nullableString, economics: nullableString, liquidity: nullableString, signal: nullableString }),
  reasons: v.array(v.string()),
  assumptions: v.array(v.string()),
  horizons: v.array(v.object({ days: horizonDays, ...outcomePair })),
  selected: v.object(outcomePair),
});

const checkStatus = v.object({
  placebo: nullableString,
  mirrors: nullableString,
  stability: nullableString,
  grounding: nullableString,
});

const call = v.union(v.object({ call: nullableString, answers: nullableNumber }), v.null());

const landSite = v.object({
  samples: nullableNumber,
  insideActiveClaim: nullableNumber,
  insideClosedClaim: nullableNumber,
  medianMToActiveClaim: nullableNumber,
});

export const summary = v.union(
  decisionSummary,
  v.object({
    kind: v.literal("swarm"),
    generated: nullableString,
    checks: checkStatus,
    scenarios: v.array(v.string()),
    runsJudged: v.number(),
    runsTotal: v.number(),
    baselineCalls: v.union(v.object({ price: call, policy: call, leaning: call }), v.null()),
  }),
  v.object({
    kind: v.literal("land"),
    snapshotAt: nullableString,
    activeClaimsInBox: nullableNumber,
    closedClaimsInBox: nullableNumber,
    sites: v.object({ A: landSite, B: landSite }),
  }),
);
export type Summary = Infer<typeof summary>;

export const landMatch = v.object({
  sampleKey: v.string(),
  sampleId: v.string(),
  area: v.string(),
  matchStatus: v.string(),
  contractSourceId: nullableString,
  contractRecordId: nullableString,
  contractInterestType: nullableString,
  contractSnapshotAt: nullableString,
  spatialRelation: nullableString,
  boundaryDistanceM: nullableNumber,
  temporalRelation: nullableString,
  notes: nullableString,
});

export const producer = v.object({
  script: v.string(),
  gitCommit: nullableString,
  dirty: v.boolean(),
});

export const input = v.object({ name: v.string(), sha256: v.string() });

/** Everything about a run except its stored payload file. */
export const runEnvelope = {
  workstream: workstreamKey,
  runId: v.string(),
  schemaVersion: v.literal(1),
  mode: runMode,
  producer,
  inputs: v.array(input),
  payloadSha256: v.string(),
  payloadBytes: v.number(),
  summary,
  landMatches: v.optional(v.array(landMatch)),
};
