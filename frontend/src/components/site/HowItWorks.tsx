import { STEPS } from "@/lib/copy.js";
import { runMeta, summaryLine } from "@/lib/workstreamSummary.js";
import type { EvidenceConfig } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Live } from "./live-types";

export function HowItWorks({ live, pending, sampleCount }: { live: Live; pending: EvidenceConfig["pending"]; sampleCount: number }) {
  return (
    <section className="section workstreams" id="how-it-works" aria-labelledby="how-heading">
      <div className="section-head">
        <h2 id="how-heading">How it works</h2>
        <p>Four pieces, each owned by one teammate. Each one appears here when its owner publishes it.</p>
      </div>
      <ol className="how-grid">
        {STEPS.map((step, index) => {
          const latest = step.live ? live[step.live as keyof Live] : null;
          const owner = pending[step.key]?.owner ?? step.owner;
          const isLive = step.key === "evidence" || Boolean(latest);
          return (
            <li className="how-card workstream" key={step.key}>
              <div className="flex items-center justify-between">
                <span className="step-number">{index + 1}</span>
                <Badge variant={isLive ? "secondary" : "outline"}>{isLive ? "Live" : "Coming soon"}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              {latest ? <p className="how-result">{summaryLine(latest.summary)}<span>{runMeta(latest)}</span></p> : null}
              {step.key === "evidence" ? <p className="how-result">{sampleCount} samples, published November 2016<span>Measured · Alaska DGGS</span></p> : null}
              <p className="owner">{owner}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
