import type { Infer } from "convex/values";
import { v } from "convex/values";
import { runEnvelope, WORKSTREAM_KEYS, type WorkstreamKey } from "./validators";
import { canonicalJson, decisionSummary, decisionRunMode } from "../../../model/tok-option/publish.mjs";

const envelopeObject = v.object(runEnvelope);
export type RunEnvelope = Infer<typeof envelopeObject>;

export const LIMITS = {
  bodyBytes: 8 * 1024 * 1024,
  inputs: 64,
  landMatches: 2000,
  listItems: 50,
} as const;

const RUN_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA256 = /^[0-9a-f]{64}$/;

/** The fields a publisher sends; anything else is rejected so typos cannot be silently dropped. */
export const BODY_KEYS = ["runId", "schemaVersion", "mode", "producer", "inputs", "summary", "landMatches", "payloadJson"] as const;

export function isWorkstream(value: string): value is WorkstreamKey {
  return (WORKSTREAM_KEYS as readonly string[]).includes(value);
}

/** Rules the validators cannot express. Returns a message, or null when the envelope is acceptable. */
export function envelopeProblem(envelope: RunEnvelope): string | null {
  const { workstream, summary } = envelope;
  if (!RUN_ID.test(envelope.runId)) return "runId must be 1-128 characters of letters, digits, '.', '_', ':' or '-'";
  if (!SHA256.test(envelope.payloadSha256)) return "payloadSha256 must be lowercase hex";
  if (summary.kind !== workstream) return `summary.kind '${summary.kind}' does not match workstream '${workstream}'`;
  if (envelope.inputs.length > LIMITS.inputs) return `at most ${LIMITS.inputs} inputs`;
  if (envelope.inputs.some((item) => !SHA256.test(item.sha256))) return "every input sha256 must be lowercase hex";
  if (workstream !== "land" && envelope.landMatches !== undefined) return "landMatches are only accepted for the land workstream";
  if ((envelope.landMatches?.length ?? 0) > LIMITS.landMatches) return `at most ${LIMITS.landMatches} landMatches per run`;
  if (summary.kind === "decision") {
    if (envelope.mode !== decisionRunMode(summary)) return "decision mode must match the canonical modelMode";
    if (summary.horizons.length !== 3 || summary.horizons.some((row, index) => row.days !== [30, 90, 180][index])) return "decision summary requires 30/90/180 day horizons";
    if (summary.reasons.length > LIMITS.listItems || summary.assumptions.length > LIMITS.listItems) return "decision reasons and assumptions hold at most 50 items";
    const outcomes = summary.horizons.flatMap((row) => [row.baseline, row.mapped]);
    for (const outcome of outcomes) {
      if (!outcome) continue;
      if (outcome.reasons.length > LIMITS.listItems) return "outcome reasons hold at most 50 items";
      for (const probability of [outcome.saleProbability, outcome.negativeCashProbability]) if (probability !== null && (!Number.isFinite(probability) || probability < 0 || probability > 1)) return "decision probabilities must be null or finite numbers from zero to one";
      for (const money of [outcome.assignmentValueUsd, outcome.expectedNetCashUsd, outcome.amountAtRiskUsd]) if (money !== null && !Number.isFinite(money)) return "decision money must be finite or null";
    }
  }
  if (summary.kind === "swarm" && summary.scenarios.length > LIMITS.listItems) return `at most ${LIMITS.listItems} scenarios`;
  return null;
}

/** Publish only projections of the canonical payload, with no editable second summary. */
export function decisionPayloadProblem(payload: unknown, summary: unknown, mode: unknown): string | null {
  try {
    const projected = decisionSummary(payload);
    if (mode !== decisionRunMode(projected)) return "decision mode must match the canonical modelMode";
    return canonicalJson(projected) === canonicalJson(summary) ? null : "decision summary does not match the canonical payload";
  } catch (error) {
    return error instanceof Error ? error.message : "invalid canonical assignment output";
  }
}

/** SHA-256 of a string's UTF-8 bytes as hex (stored on the run) and base64 (what storage.store expects). */
export async function sha256Of(text: string): Promise<{ hex: string; base64: string }> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return {
    hex: [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    // The backend parses this option as a `Digest: sha-256=<base64>` header, not hex.
    base64: btoa(String.fromCharCode(...bytes)),
  };
}
