/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { DEFAULT_CONTROLS, runWorkbench } from "../../model/tok-option/workbench.mjs";
import { decisionOutput, decisionSummary } from "../../model/tok-option/publish.mjs";

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

describe("decision runs", () => {
  beforeEach(() => vi.stubEnv("INGEST_SECRET_DECISION", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  const features = ["A", "B"].flatMap((area) => Array.from({ length: 12 }, (_, index) => ({ properties: {
    area, sample_id: `${area}-${index}`, source_id: "test-assays", gold_primary_unit: "ppm",
    gold_primary_status: "quantified", gold_primary_value_ppm: area === "A" ? 0.02 : 0.001,
  } })));
  // The JS workbench's default [] infers never[] at this TypeScript test boundary.
  const evaluateWorkbench = runWorkbench as (options: { features: typeof features; controls: Record<string, unknown> }) => ReturnType<typeof runWorkbench>;
  function bodyFor(controls: Record<string, unknown> = {}) {
    const selected = { ...DEFAULT_CONTROLS, mode: "demo", ...controls };
    const selection = { area: selected.area, horizonDays: selected.horizonDays, scenarioId: selected.scenarioId };
    const output = decisionOutput({ selection, result: evaluateWorkbench({ features, controls: selected }) });
    const body = { ...landBody(), runId: "assignment-demo", mode: selected.mode === "demo" ? "scenario" : "evidence_only", summary: decisionSummary(output), payloadJson: JSON.stringify(output) };
    delete (body as Record<string, unknown>).landMatches;
    return body;
  }

  test("lists a canonical 90 day summary without changing the saved payload", async () => {
    const t = convexTest(schema, modules);
    const body = bodyFor();
    expect((await post(t, body, { path: "/ingest/decision" })).status).toBe(201);
    const decision = (await t.query(api.workstreams.list, {})).find((s) => s.key === "decision")!;
    expect(decision.latest?.summary).toEqual(body.summary);
    if (decision.latest?.summary.kind !== "decision") throw new Error("missing decision summary");
    expect(decision.latest.summary.selected.mapped?.entryAction).toBe("BUY_CANDIDATE");
    expect(decision.latest.summary.selected.mapped?.expectedNetCashUsd).toBeCloseTo(7.6);
    expect(decision.latest.summary.selected.mapped?.negativeCashProbability).toBeCloseTo(0.512);
    const stored = await t.run(async (ctx) => {
      const run = await ctx.db.query("runs").first();
      return (await ctx.storage.get(run!.payloadFileId))!.text();
    });
    expect(stored).toEqual(body.payloadJson);
  });

  test("pending, real and missing swarm outputs preserve null money and readiness", async () => {
    for (const controls of [{ mode: "pending" }, { mode: "real" }, { scenarioId: "mine_approval" }]) {
      const t = convexTest(schema, modules);
      const body = bodyFor(controls);
      expect((await post(t, body, { path: "/ingest/decision" })).status).toBe(201);
      const summary = (await t.query(api.workstreams.list, {})).find((s) => s.key === "decision")!.latest!.summary;
      if (summary.kind !== "decision") throw new Error("missing decision summary");
      expect(summary.selected.mapped).toBeNull();
      if (controls.mode) expect(summary.selected.baseline).toBeNull();
    }
  });

  test("failing evidence remains SKIP rather than an actionable quote", async () => {
    const t = convexTest(schema, modules);
    const body = bodyFor({ area: "B" });
    expect((await post(t, body, { path: "/ingest/decision" })).status).toBe(201);
    expect(body.summary.readiness.evidenceGate).toBe("FAIL");
    expect(body.summary.selected.mapped?.entryAction).toBe("SKIP");
  });

  test("rejects legacy engines, changed summaries, unsupported horizons and inflated modes before storing", async () => {
    const t = convexTest(schema, modules);
    const legacy = bodyFor();
    legacy.payloadJson = JSON.stringify({ action: "BUY", value_usd: 8218.9 });
    expect((await post(t, legacy, { path: "/ingest/decision" })).status).toBe(400);
    const changed = bodyFor();
    changed.summary.selected.mapped!.expectedNetCashUsd = 100000;
    expect((await post(t, changed, { path: "/ingest/decision" })).status).toBe(400);
    const horizon = bodyFor();
    const payload = JSON.parse(horizon.payloadJson);
    payload.selection.horizonDays = 12;
    horizon.payloadJson = JSON.stringify(payload);
    expect((await post(t, horizon, { path: "/ingest/decision" })).status).toBe(400);
    expect((await post(t, { ...bodyFor(), mode: "empirical" }, { path: "/ingest/decision" })).status).toBe(400);
    expect(await t.run((ctx) => ctx.db.system.query("_storage").collect())).toHaveLength(0);
  });

  test("decision publishing still requires its own secret and is idempotent", async () => {
    const t = convexTest(schema, modules);
    const body = bodyFor();
    expect((await post(t, body, { path: "/ingest/decision", secret: "wrong" })).status).toBe(401);
    expect((await post(t, body, { path: "/ingest/decision" })).status).toBe(201);
    expect((await post(t, body, { path: "/ingest/decision" })).status).toBe(200);
    const other = bodyFor({ horizonDays: 180 });
    expect((await post(t, other, { path: "/ingest/decision" })).status).toBe(409);
  });
});

describe("workstream rows", () => {
  test("seeding is idempotent and list works before any publish", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(internal.seed.init, {})).toBe(3);
    expect(await t.mutation(internal.seed.init, {})).toBe(0);
    const streams = await t.query(api.workstreams.list, {});
    expect(streams.map((s) => [s.key, s.owner, s.status]).sort()).toEqual([
      ["decision", "Amit", "planning"], ["land", "Arjin", "pending"], ["swarm", "Muhd", "pending"],
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
