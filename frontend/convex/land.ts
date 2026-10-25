import { v } from "convex/values";
import { query } from "./_generated/server";
import { landMatch } from "./model/validators";

/** Land and claim records at one sample location, from the latest published land run. */
export const matchesForSample = query({
  args: { sampleKey: v.string() },
  returns: v.union(v.object({ runId: v.string(), matches: v.array(landMatch) }), v.null()),
  handler: async (ctx, { sampleKey }) => {
    const stream = await ctx.db.query("workstreams").withIndex("by_key", (q) => q.eq("key", "land")).unique();
    const run = stream?.latestRunId ? await ctx.db.get(stream.latestRunId) : null;
    if (!run) return null;
    const rows = await ctx.db
      .query("landMatches")
      .withIndex("by_run_sample", (q) => q.eq("run", run._id).eq("sampleKey", sampleKey))
      .take(50);
    return { runId: run.runId, matches: rows.map(({ _id, _creationTime, run: _run, ...match }) => match) };
  },
});
