import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkBearer, secretEnvName } from "./model/auth";
import { BODY_KEYS, LIMITS, isWorkstream, sha256Of } from "./model/envelope";

const http = httpRouter();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * POST /ingest/<decision|swarm|land>, called by scripts/publish_run.py.
 * Body: the run envelope plus `payloadJson`, the producer's full output as a JSON string.
 */
const ingest = httpAction(async (ctx, request) => {
  const workstream = new URL(request.url).pathname.slice("/ingest/".length);
  if (!isWorkstream(workstream)) return json(404, { error: "unknown workstream" });

  const auth = await checkBearer(request, workstream);
  if (auth === "not_configured") return json(503, { error: `${secretEnvName(workstream)} is not set on this deployment` });
  if (auth !== "ok") return json(401, { error: "invalid publish secret" });

  if (Number(request.headers.get("Content-Length") ?? 0) > LIMITS.bodyBytes) return json(413, { error: "body exceeds 8 MB" });
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.bodyBytes) return json(413, { error: "body exceeds 8 MB" });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { error: "body is not JSON" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return json(400, { error: "body must be a JSON object" });
  const fields = body as Record<string, unknown>;
  const unknownKeys = Object.keys(fields).filter((key) => !(BODY_KEYS as readonly string[]).includes(key));
  if (unknownKeys.length) return json(400, { error: `unknown fields: ${unknownKeys.join(", ")}` });
  const { payloadJson, ...rest } = fields;
  if (typeof payloadJson !== "string") return json(400, { error: "payloadJson must be a string" });
  try {
    JSON.parse(payloadJson);
  } catch {
    return json(400, { error: "payloadJson is not valid JSON" });
  }

  const digest = await sha256Of(payloadJson);
  const payloadSha256 = digest.hex;
  const envelope = { ...rest, workstream, payloadSha256, payloadBytes: new TextEncoder().encode(payloadJson).length };

  let check;
  try {
    // Argument validators reject malformed envelopes before anything is stored.
    check = await ctx.runQuery(internal.ingest.checkRun, envelope as never);
  } catch (error) {
    // Keep the validator's first line ("Object is missing the required field ..."), not its full schema dump.
    const message = error instanceof Error ? error.message.split("\n\n")[0] : "invalid envelope";
    return json(400, { error: message });
  }
  if (check.status === "invalid") return json(400, { error: check.message });
  if (check.status === "unchanged") return json(200, { status: "unchanged", runId: fields.runId, workstream });
  if (check.status === "conflict") return json(409, { error: "runId already holds a different payload; publish with a new runId" });

  const payloadFileId = await ctx.storage.store(new Blob([payloadJson], { type: "application/json" }), { sha256: digest.base64 });
  try {
    const status = await ctx.runMutation(internal.ingest.recordRun, { ...envelope, payloadFileId } as never);
    if (status === "unchanged") await ctx.storage.delete(payloadFileId);
    return json(status === "created" ? 201 : 200, { status, runId: fields.runId, workstream, payloadSha256 });
  } catch (error) {
    // Storing a file and recording the run are separate steps; do not leave the file behind.
    await ctx.storage.delete(payloadFileId);
    throw error;
  }
});

http.route({ pathPrefix: "/ingest/", method: "POST", handler: ingest });

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => json(200, { ok: true })),
});

export default http;
