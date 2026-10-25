import type { WorkstreamKey } from "./validators";

/** Mirrors `pending` in public/data/gold-frontend-data.json until a run is published. */
export const DEFAULT_WORKSTREAMS: Record<WorkstreamKey, { owner: string; status: "pending" | "planning" }> = {
  land: { owner: "Arjin", status: "pending" },
  swarm: { owner: "Muhd", status: "pending" },
  decision: { owner: "Salman", status: "planning" },
};
