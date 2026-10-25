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

export const decisionSection = v.object({
  label: v.string(),
  action: nullableString,
  signal: nullableString,
  status: nullableString,
  valueUsd: nullableNumber,
  worstOutcomeUsd: nullableNumber,
  pLoss: nullableNumber,
  fragile: v.array(v.string()),
  conditionalOn: v.array(v.string()),
  swarmUsed: v.boolean(),
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
  v.object({ kind: v.literal("decision"), sections: v.array(decisionSection) }),
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
