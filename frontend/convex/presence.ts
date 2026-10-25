import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";

/**
 * Who is looking at the map right now, and at which sample. Every open tab
 * heartbeats about every 8 s while visible. Nobody signs in: `sid` is the
 * tab's own random id and is never sent back out; others only see `pid`, a
 * hash of it, so nobody can speak for anyone else.
 *
 * Two tables, so the cost doesn't grow with the square of the crowd:
 * heartbeats go to `beats`, which no query reads; `people`, which `here`
 * reads, only changes when someone joins, leaves or looks at another
 * sample. The sweep (convex/crons.ts) removes whoever has gone quiet.
 */

/** Heard from this recently: still here (the sweep runs every 15 s). */
const ALIVE_MS = 30_000;
/** A tab's own random id. */
const SID = /^[A-Za-z0-9-]{16,64}$/;
/** A sample key from public/data, e.g. alaska_dggs_rdf2016_10:16MBW012:-200. */
const SAMPLE_KEY = /^[\w.-]{1,48}:[\w-]{1,24}:[\w-]{1,12}$/;
/** The most people `here` lists at once. */
const MOST = 50;
/** The most on the page at once: past it, a new tab just isn't added. */
const CAP = 200;
/** One focus change per person this often: each re-runs every viewer's `here`. */
const FOCUS_MS = 1_500;
/** Joins from everyone together in JOIN_WINDOW_MS (each one re-runs `here`). */
const JOIN_MOST = 30;
const JOIN_WINDOW_MS = 10_000;

const focusArg = v.union(v.string(), v.null());

/** A visitor's public id: their sid, hashed, so it can't be turned back into the sid. */
async function publicId(sid: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`tok:${sid}`));
  return Array.from(new Uint8Array(digest).slice(0, 10), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** I'm here, looking at `focus` (a sample key) or at nothing. Returns my public id, or null when full. */
export const heartbeat = mutation({
  args: { sid: v.string(), focus: focusArg },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { sid, focus }) => {
    if (!SID.test(sid)) throw new Error("bad visitor id");
    const wanted = focus !== null && SAMPLE_KEY.test(focus) ? focus : null;
    const now = Date.now();
    let mine = await ctx.db.query("people").withIndex("by_sid", (q) => q.eq("sid", sid)).unique();
    if (!mine) {
      const everyone = await ctx.db.query("people").take(CAP);
      if (everyone.length >= CAP) return null;
      const joins = await ctx.db
        .query("presenceJoins")
        .withIndex("by_at", (q) => q.gt("at", now - JOIN_WINDOW_MS))
        .take(JOIN_MOST);
      if (joins.length >= JOIN_MOST) return null;
      await ctx.db.insert("presenceJoins", { at: now });
      const pid = await publicId(sid);
      const id = await ctx.db.insert("people", { sid, pid, focus: wanted, focusedAt: now });
      mine = (await ctx.db.get(id))!;
    } else if (mine.focus !== wanted && now - mine.focusedAt > FOCUS_MS) {
      await ctx.db.patch(mine._id, { focus: wanted, focusedAt: now });
    }
    const beat = await ctx.db.query("beats").withIndex("by_sid", (q) => q.eq("sid", sid)).unique();
    if (beat) await ctx.db.patch(beat._id, { seen: now });
    else await ctx.db.insert("beats", { sid, seen: now });
    return mine.pid;
  },
});

async function remove(ctx: MutationCtx, sid: string) {
  const person = await ctx.db.query("people").withIndex("by_sid", (q) => q.eq("sid", sid)).unique();
  if (person) await ctx.db.delete(person._id);
  const beat = await ctx.db.query("beats").withIndex("by_sid", (q) => q.eq("sid", sid)).unique();
  if (beat) await ctx.db.delete(beat._id);
}

/** I'm off: the tab is closing or hidden. */
export const leave = mutation({
  args: { sid: v.string() },
  returns: v.null(),
  handler: async (ctx, { sid }) => {
    if (SID.test(sid)) await remove(ctx, sid);
    return null;
  },
});

/** Every 15 s (convex/crons.ts): clear whoever has gone quiet, and old join records. */
export const sweep = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const quiet = await ctx.db.query("beats").withIndex("by_seen", (q) => q.lt("seen", now - ALIVE_MS)).take(200);
    for (const beat of quiet) await remove(ctx, beat.sid);
    const joins = await ctx.db.query("presenceJoins").withIndex("by_at", (q) => q.lt("at", now - JOIN_WINDOW_MS)).take(1000);
    for (const join of joins) await ctx.db.delete(join._id);
    return null;
  },
});

/**
 * Everyone here, oldest first so the list doesn't churn. Takes no arguments,
 * so one cached result serves every viewer; heartbeats never re-run it.
 */
export const here = query({
  args: {},
  returns: v.object({
    list: v.array(v.object({ id: v.string(), focus: focusArg })),
    more: v.boolean(),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db.query("people").order("asc").take(MOST + 1);
    return { list: rows.slice(0, MOST).map((r) => ({ id: r.pid, focus: r.focus })), more: rows.length > MOST };
  },
});
