/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const SAMPLE = "alaska_dggs_rdf2016_10:16MBW012:-200";
const sid = (n: number) => `tab-${String(n).padStart(16, "0")}`;

describe("presence", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  test("a tab joins with a hashed public id and what it looks at", async () => {
    const t = convexTest(schema, modules);
    const pid = await t.mutation(api.presence.heartbeat, { sid: sid(1), focus: SAMPLE });
    expect(pid).toMatch(/^[0-9a-f]{20}$/);
    expect(pid).not.toContain(sid(1));
    expect(await t.query(api.presence.here, {})).toEqual({ list: [{ id: pid, focus: SAMPLE }], more: false });
  });

  test("rejects bad ids and drops focus values that are not sample keys", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.presence.heartbeat, { sid: "short", focus: null })).rejects.toThrow("bad visitor id");
    await t.mutation(api.presence.heartbeat, { sid: sid(2), focus: "<script>" });
    const { list } = await t.query(api.presence.here, {});
    expect(list[0].focus).toBeNull();
  });

  test("focus changes are rate-limited to one per 1.5 s", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.presence.heartbeat, { sid: sid(3), focus: null });
    await t.mutation(api.presence.heartbeat, { sid: sid(3), focus: SAMPLE });
    expect((await t.query(api.presence.here, {})).list[0].focus).toBeNull();
    vi.setSystemTime(Date.now() + 2_000);
    await t.mutation(api.presence.heartbeat, { sid: sid(3), focus: SAMPLE });
    expect((await t.query(api.presence.here, {})).list[0].focus).toBe(SAMPLE);
  });

  test("joins are limited per 10 s window", async () => {
    const t = convexTest(schema, modules);
    const results = [];
    for (let n = 0; n < 31; n++) results.push(await t.mutation(api.presence.heartbeat, { sid: sid(100 + n), focus: null }));
    expect(results.slice(0, 30).every((pid) => pid !== null)).toBe(true);
    expect(results[30]).toBeNull();
    expect((await t.query(api.presence.here, {})).list).toHaveLength(30);
  });

  test("leave removes the tab, and the sweep clears tabs that went quiet", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.presence.heartbeat, { sid: sid(4), focus: null });
    await t.mutation(api.presence.heartbeat, { sid: sid(5), focus: null });
    await t.mutation(api.presence.leave, { sid: sid(4) });
    expect((await t.query(api.presence.here, {})).list).toHaveLength(1);
    vi.setSystemTime(Date.now() + 31_000);
    await t.mutation(internal.presence.sweep, {});
    expect((await t.query(api.presence.here, {})).list).toHaveLength(0);
  });
});
