import type { Metadata } from "next";
import swarmSource from "../../../../model/tok-option/data/swarm-source.json";
import { buildWorkflowData } from "@/lib/swarm-workflow.mjs";
import { SwarmWorkflow } from "@/components/swarm/SwarmWorkflow";

export const metadata: Metadata = {
  title: "Swarm workflow · Land Arbitrage: Gold",
  description: "Follow recorded stakeholder simulations from source data through scoring, comparison and the canonical model's validation gate.",
};

export default function SwarmPage() {
  return <SwarmWorkflow data={buildWorkflowData(swarmSource)} />;
}
