import { v } from "convex/values";
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";
import { DEFAULT_WORKSTREAMS } from "./model/defaults";
import { envelopeProblem } from "./model/envelope";
import { runEnvelope } from "./model/validators";

const checkResult = v.union(
  v.object({ status: v.literal("new") }),
  v.object({ status: v.literal("unchanged") }),
  v.object({ status: v.literal("conflict") }),
  v.object({ status: v.literal("invalid"), message: v.string() }),
);

async function existingRun(ctx: QueryCtx, runId: string) {
  return await ctx.db.query("runs").withIndex("by_runId", (q) => q.eq("runId", runId)).unique();
}

/**
 * Validates an envelope (argument validators plus envelopeProblem) and reports whether the
 * runId is new, an identical re-publish or a conflicting one, before anything is stored.
 */
export const checkRun = internalQuery({
  args: runEnvelope,
  returns: checkResult,
  handler: async (ctx, envelope) => {
    const problem = envelopeProblem(envelope);
    if (problem) return { status: "invalid" as const, message: problem };
    const existing = await existingRun(ctx, envelope.runId);
    if (!existing) return { status: "new" as const };
    return existing.payloadSha256 === envelope.payloadSha256 && existing.workstream === envelope.workstream
      ? { status: "unchanged" as const }
      : { status: "conflict" as const };
  },
});

async function workstreamRow(ctx: MutationCtx, key: keyof typeof DEFAULT_WORKSTREAMS) {
  const row = await ctx.db.query("workstreams").withIndex("by_key", (q) => q.eq("key", key)).unique();
  if (row) return row;
  const id = await ctx.db.insert("workstreams", { key, ...DEFAULT_WORKSTREAMS[key], updatedAt: Date.now() });
  return (await ctx.db.get(id))!;
}

/** Records a stored run, its child rows and the workstream's latest pointer in one transaction. */
export const recordRun = internalMutation({
  args: { ...runEnvelope, payloadFileId: v.id("_storage") },
  returns: v.union(v.literal("created"), v.literal("unchanged")),
  handler: async (ctx, { landMatches, ...run }) => {
    const problem = envelopeProblem({ ...run, landMatches });
    if (problem) throw new Error(problem);
    // Mutations are serializable, so this re-check closes the race between two identical publishes.
    const existing = await existingRun(ctx, run.runId);
    if (existing) {
      if (existing.payloadSha256 !== run.payloadSha256 || existing.workstream !== run.workstream) throw new Error(`runId ${run.runId} already holds a different payload or workstream`);
      return "unchanged" as const;
    }
    const now = Date.now();
    const id = await ctx.db.insert("runs", { ...run, publishedAt: now });
    for (const match of landMatches ?? []) await ctx.db.insert("landMatches", { run: id, ...match });
    const stream = await workstreamRow(ctx, run.workstream);
    await ctx.db.patch(stream._id, { status: "live", latestRunId: id, updatedAt: now });
    return "created" as const;
  },
});

/** Deletes stored payloads that no run references, left behind when a publish failed after storing. */
export const cleanupOrphanPayloads = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const files = await ctx.db.system.query("_storage").order("asc").take(200);
    let removed = 0;
    for (const file of files) {
      if (file._creationTime > cutoff) break;
      const owner = await ctx.db.query("runs").withIndex("by_payloadFile", (q) => q.eq("payloadFileId", file._id)).first();
      if (!owner) {
        await ctx.storage.delete(file._id);
        removed += 1;
      }
    }
    return removed;
  },
});
