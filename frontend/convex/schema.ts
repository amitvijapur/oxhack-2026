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

  // Live presence on the map (convex/presence.ts). `people` is read by `here`
  // and changes only on join, leave or a new focus; heartbeats go to `beats`,
  // which no query reads. `presenceJoins` only rate-limits joins.
  people: defineTable({
    sid: v.string(),
    pid: v.string(),
    focus: v.union(v.string(), v.null()),
    focusedAt: v.number(),
  }).index("by_sid", ["sid"]),
  beats: defineTable({ sid: v.string(), seen: v.number() }).index("by_sid", ["sid"]).index("by_seen", ["seen"]),
  presenceJoins: defineTable({ at: v.number() }).index("by_at", ["at"]),
});
