import { v } from "convex/values";
import { query } from "./_generated/server";
import { runMode, summary, workstreamKey, workstreamStatus } from "./model/validators";

const latestRun = v.object({
  runId: v.string(),
  mode: runMode,
  publishedAt: v.number(),
  gitCommit: v.union(v.string(), v.null()),
  dirty: v.boolean(),
  summary,
});

/** Every workstream with its latest published run, for the website's Workstreams section. */
export const list = query({
  args: {},
  returns: v.array(v.object({
    key: workstreamKey,
    owner: v.string(),
    status: workstreamStatus,
    updatedAt: v.number(),
    latest: v.union(latestRun, v.null()),
  })),
  handler: async (ctx) => {
    const streams = await ctx.db.query("workstreams").take(10);
    return await Promise.all(streams.map(async (stream) => {
      const run = stream.latestRunId ? await ctx.db.get(stream.latestRunId) : null;
      return {
        key: stream.key,
        owner: stream.owner,
        status: stream.status,
        updatedAt: stream.updatedAt,
        latest: run && {
          runId: run.runId,
          mode: run.mode,
          publishedAt: run.publishedAt,
          gitCommit: run.producer.gitCommit,
          dirty: run.producer.dirty,
          summary: run.summary,
        },
      };
    }));
  },
});

/** A download URL for a run's full output, fetched only when someone asks for detail. */
export const payloadUrl = query({
  args: { runId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.query("runs").withIndex("by_runId", (q) => q.eq("runId", runId)).unique();
    return run ? await ctx.storage.getUrl(run.payloadFileId) : null;
  },
});
