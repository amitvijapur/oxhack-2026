import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { landMatch, producer, input, runMode, summary, workstreamKey, workstreamStatus } from "./model/validators";

// Teammate outputs arrive through POST /ingest/<workstream> (convex/http.ts).
// The static evidence snapshot stays in public/data/. See convex/README.md.
export default defineSchema({
  workstreams: defineTable({
    key: workstreamKey,
    owner: v.string(),
    status: workstreamStatus,
    latestRunId: v.optional(v.id("runs")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  runs: defineTable({
    workstream: workstreamKey,
    runId: v.string(),
    schemaVersion: v.literal(1),
    mode: runMode,
    publishedAt: v.number(),
    producer,
    inputs: v.array(input),
    payloadFileId: v.id("_storage"),
    payloadSha256: v.string(),
    payloadBytes: v.number(),
    summary,
  })
    .index("by_runId", ["runId"])
    .index("by_workstream", ["workstream"])
    .index("by_payloadFile", ["payloadFileId"]),

  landMatches: defineTable({ run: v.id("runs"), ...landMatch.fields }).index("by_run_sample", ["run", "sampleKey"]),
});
