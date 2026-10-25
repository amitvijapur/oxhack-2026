import { query } from "./_generated/server";
import { v } from "convex/values";

/** Proves the website is connected to a Convex deployment. */
export const ping = query({
  args: {},
  returns: v.object({ ok: v.literal(true), serverTime: v.number() }),
  handler: async () => ({ ok: true as const, serverTime: Date.now() }),
});
