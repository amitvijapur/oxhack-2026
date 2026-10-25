import { ArrowDown, ArrowRight } from "lucide-react";
import { HERO, STEPS } from "@/lib/copy.js";
import { MODE_LABELS, decisionView, formatDay } from "@/lib/workstreamSummary.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Details } from "./Details";
import type { DecisionRun, Live } from "./live-types";

function AnswerCard({ decision }: { decision: DecisionRun | null }) {
  if (!decision) {
    return (
      <aside className="answer-card is-pending" aria-labelledby="answer-heading">
        <p className="eyebrow">The answer</p>
        <h2 id="answer-heading" className="answer-action">Coming soon</h2>
        <p className="text-muted-foreground">The decision model’s result appears here once Salman publishes it.</p>
      </aside>
    );
  }
  const view = decisionView(decision.summary);
  return (
    <aside className="answer-card" aria-labelledby="answer-heading">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">The answer · {MODE_LABELS[decision.mode as keyof typeof MODE_LABELS] ?? decision.mode}</p>
        {view.statusLabel ? <Badge variant={view.needsReview ? "outline" : "secondary"}>{view.statusLabel}</Badge> : null}
      </div>
      <h2 id="answer-heading" className="answer-action">{view.action}</h2>
      <p className="tabular">{view.valueLine}</p>
      {view.checks.length > 0 ? (
        <div className="mt-5">
          <h3 className="answer-subhead">Check these first</h3>
          <ul className="grid gap-2">
            {view.checks.map((check: { name: string; label: string; statusText: string; evidence?: string | null }) => (
              <li key={check.name} className="text-sm">
                <span className="font-medium">{check.label}</span>
                <span className="text-muted-foreground"> · {check.statusText}</span>
                {check.evidence ? <Details summary="Why"><p>{check.evidence}</p></Details> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {view.planLines.length > 0 ? (
        <div className="mt-5">
          <h3 className="answer-subhead">When</h3>
          <ol className="grid list-decimal gap-1 pl-5 text-sm">
            {view.planLines.map((line: string) => <li key={line}>{line}</li>)}
          </ol>
        </div>
      ) : null}
      {view.fragile.length > 0 ? (
        <Details summary="What would change the answer">
          <ul className="grid list-disc gap-1 pl-5">{view.fragile.map((item: string) => <li key={item}>{item}</li>)}</ul>
        </Details>
      ) : null}
      {view.moreSections > 0 ? <p className="mt-3 text-xs text-muted-foreground">Showing {view.label}; {view.moreSections} more in the full output.</p> : null}
    </aside>
  );
}

type Step = (typeof STEPS)[number];

function stepStatus(step: Step, live: Live, sampleCount: number) {
  if (step.key === "evidence") return { live: true, text: `${sampleCount} samples · 2016` };
  const latest = live[step.live as keyof Live];
  if (!latest) return { live: false, text: "Coming soon" };
  const summary = latest.summary;
  if (summary.kind === "decision") {
    const view = decisionView(summary);
    return { live: true, text: view.statusLabel ? `${view.action} · ${view.statusLabel.toLowerCase()}` : view.action };
  }
  if (summary.kind === "land") return { live: true, text: `Checked ${formatDay(summary.snapshotAt) ?? "recently"}` };
  return { live: true, text: `${summary.runsJudged} of ${summary.runsTotal} runs scored` };
}

export function Hero({ live, sampleCount, onExplore }: { live: Live; sampleCount: number; onExplore: () => void }) {
  return (
    <section className="hero" id="answer" aria-labelledby="hero-heading">
      <div className="hero-grid">
        <div>
          <h1 id="hero-heading" className="hero-title">{HERO.question}</h1>
          <p className="lede">{HERO.lede}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#map" onClick={onExplore}>{HERO.cta}<ArrowRight aria-hidden="true" /></a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#how-it-works">{HERO.secondary}<ArrowDown aria-hidden="true" /></a>
            </Button>
          </div>
        </div>
        <AnswerCard decision={live.decision as DecisionRun | null} />
      </div>
      <ol className="steps" aria-label="How the pieces fit">
        {STEPS.map((step, index) => {
          const status = stepStatus(step, live, sampleCount);
          return (
            <li key={step.key}>
              <a href={step.href}>
                <span className="step-number">{index + 1}</span>
                <span className="font-medium">{step.title}</span>
                <span className={`step-status${status.live ? " is-live" : ""}`}>{status.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
