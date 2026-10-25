import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { DEFAULT_WORKSTREAMS } from "./model/defaults";
import { WORKSTREAM_KEYS } from "./model/validators";

/**
 * Creates the three workstream rows if they are missing. Safe to repeat; never touches a
 * live workstream and never seeds result data. Runs on new preview deployments via
 * `convex deploy --preview-run seed:init` and by hand with `npx convex run seed:init`.
 */
export const init = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let created = 0;
    for (const key of WORKSTREAM_KEYS) {
      const row = await ctx.db.query("workstreams").withIndex("by_key", (q) => q.eq("key", key)).unique();
      if (!row) {
        await ctx.db.insert("workstreams", { key, ...DEFAULT_WORKSTREAMS[key], updatedAt: Date.now() });
        created += 1;
      }
    }
    return created;
  },
});
