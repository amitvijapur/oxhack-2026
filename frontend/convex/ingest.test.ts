/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
// A deliberately low-entropy placeholder, so secret scanners do not flag the fixture.
const SECRET = "x".repeat(32);

function landBody(overrides: Record<string, unknown> = {}) {
  return {
    runId: "land-test-1",
    schemaVersion: 1,
    mode: "measured",
    producer: { script: "scripts/publish_run.py", gitCommit: "abc1234", dirty: false },
    inputs: [{ name: "site-a/land_matches.csv", sha256: "a".repeat(64) }],
    summary: {
      kind: "land",
      snapshotAt: "2026-10-24",
      activeClaimsInBox: 706,
      closedClaimsInBox: 763,
      sites: {
        A: { samples: 33, insideActiveClaim: 2, insideClosedClaim: 12, medianMToActiveClaim: 3427 },
        B: { samples: 34, insideActiveClaim: null, insideClosedClaim: null, medianMToActiveClaim: null },
      },
    },
    landMatches: [{
      sampleKey: "alaska_dggs_rdf2016_10:16MBW001:-200", sampleId: "16MBW001", area: "A",
      matchStatus: "point_inside_record", contractSourceId: "alaska_dnr_state_mining_claim_active",
      contractRecordId: "ADL 802461", contractInterestType: "state mining claim (active)",
      contractSnapshotAt: "2026-10-24", spatialRelation: "point_intersects_polygon", boundaryDistanceM: 204,
      temporalRelation: null, notes: "owner: GREAT LAND MINERALS, LLC.",
    }],
    payloadJson: JSON.stringify({ rows: 1 }),
    ...overrides,
  };
}

function post(t: ReturnType<typeof convexTest>, body: unknown, { path = "/ingest/land", secret = SECRET } = {}) {
  return t.fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /ingest/<workstream>", () => {
  beforeEach(() => vi.stubEnv("INGEST_SECRET_LAND", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  test("rejects a wrong or missing secret", async () => {
    const t = convexTest(schema, modules);
    expect((await post(t, landBody(), { secret: "wrong" })).status).toBe(401);
    expect((await post(t, landBody(), { secret: "" })).status).toBe(401);
  });

  test("reports an unconfigured workstream secret", async () => {
    const t = convexTest(schema, modules);
    const response = await post(t, landBody(), { path: "/ingest/swarm" });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "INGEST_SECRET_SWARM is not set on this deployment" });
  });

  test("rejects unknown workstreams and malformed bodies before storing", async () => {
    const t = convexTest(schema, modules);
    expect((await post(t, landBody(), { path: "/ingest/other" })).status).toBe(404);
    expect((await post(t, "not json")).status).toBe(400);
    expect((await post(t, landBody({ extra: true }))).status).toBe(400);
    expect((await post(t, landBody({ payloadJson: "{" }))).status).toBe(400);
    expect((await post(t, landBody({ mode: "guess" }))).status).toBe(400);
    expect((await post(t, landBody({ runId: "bad id" }))).status).toBe(400);
    const decisionSummary = { kind: "decision", sections: [] };
    expect((await post(t, landBody({ summary: decisionSummary }))).status).toBe(400);
    const stored = await t.run((ctx) => ctx.db.system.query("_storage").collect());
    expect(stored).toHaveLength(0);
  });

  test("records a run, its land rows and the latest pointer", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.init, {});
    const response = await post(t, landBody());
    expect(response.status).toBe(201);

    const streams = await t.query(api.workstreams.list, {});
    const land = streams.find((s) => s.key === "land")!;
    expect(land.status).toBe("live");
    expect(land.latest?.mode).toBe("measured");
    expect(land.latest?.summary.kind).toBe("land");
    expect(streams.find((s) => s.key === "swarm")!.latest).toBeNull();

    const matches = await t.query(api.land.matchesForSample, { sampleKey: "alaska_dggs_rdf2016_10:16MBW001:-200" });
    expect(matches?.matches[0].contractRecordId).toBe("ADL 802461");
    expect(await t.query(api.workstreams.payloadUrl, { runId: "land-test-1" })).toEqual(expect.any(String));
  });

  test("treats an identical re-publish as unchanged and a changed one as a conflict", async () => {
    const t = convexTest(schema, modules);
    expect((await post(t, landBody())).status).toBe(201);
    expect((await post(t, landBody())).status).toBe(200);
    expect((await post(t, landBody({ payloadJson: JSON.stringify({ rows: 2 }) }))).status).toBe(409);
    const runs = await t.run((ctx) => ctx.db.query("runs").collect());
    const files = await t.run((ctx) => ctx.db.system.query("_storage").collect());
    expect(runs).toHaveLength(1);
    expect(files).toHaveLength(1);
  });
});

describe("workstream rows", () => {
  test("seeding is idempotent and list works before any publish", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(internal.seed.init, {})).toBe(3);
    expect(await t.mutation(internal.seed.init, {})).toBe(0);
    const streams = await t.query(api.workstreams.list, {});
    expect(streams.map((s) => [s.key, s.owner, s.status]).sort()).toEqual([
      ["decision", "Salman", "planning"], ["land", "Arjin", "pending"], ["swarm", "Muhd", "pending"],
    ]);
    expect(await t.query(api.land.matchesForSample, { sampleKey: "x" })).toBeNull();
  });

  test("orphan cleanup removes only old unreferenced payloads", async () => {
    vi.useFakeTimers();
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.storage.store(new Blob(["{}"])));
    expect(await t.mutation(internal.ingest.cleanupOrphanPayloads, {})).toBe(0);
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    expect(await t.mutation(internal.ingest.cleanupOrphanPayloads, {})).toBe(1);
    vi.useRealTimers();
  });
});
