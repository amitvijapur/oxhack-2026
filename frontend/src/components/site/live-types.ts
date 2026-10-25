import type { LatestRun } from "@/lib/live";

/** The latest run of each live workstream, or null while unpublished or offline. */
export type Live = { land: LatestRun | null; swarm: LatestRun | null; decision: LatestRun | null };

export type DecisionRun = LatestRun & { summary: Extract<LatestRun["summary"], { kind: "decision" }> };
export type LandRun = LatestRun & { summary: Extract<LatestRun["summary"], { kind: "land" }> };
