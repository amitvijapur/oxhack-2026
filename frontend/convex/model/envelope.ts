import type { Infer } from "convex/values";
import { v } from "convex/values";
import { runEnvelope, WORKSTREAM_KEYS, type WorkstreamKey } from "./validators";

const envelopeObject = v.object(runEnvelope);
export type RunEnvelope = Infer<typeof envelopeObject>;

export const LIMITS = {
  bodyBytes: 8 * 1024 * 1024,
  inputs: 64,
  decisionSections: 50,
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
    if (summary.sections.length === 0 || summary.sections.length > LIMITS.decisionSections) {
      return `decision summary needs 1-${LIMITS.decisionSections} sections`;
    }
    if (summary.sections.some((s) => s.fragile.length > LIMITS.listItems || s.conditionalOn.length > LIMITS.listItems)) {
      return `fragile and conditionalOn hold at most ${LIMITS.listItems} items`;
    }
  }
  if (summary.kind === "swarm" && summary.scenarios.length > LIMITS.listItems) return `at most ${LIMITS.listItems} scenarios`;
  return null;
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
