"use client";

import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Source } from "@/lib/showcase";

export const STEPS = ["", "The ground", "The land", "The people", "The decision"] as const;

export type EvidenceItem = { label: string; href?: string; source?: Source };

/** The one quiet panel each screen gets: step, question, one sentence, its action, then Next. */
export function Panel({ step, title, lede, children, next, evidence, mode }: {
  step: 1 | 2 | 3 | 4;
  title: string;
  lede: React.ReactNode;
  children?: React.ReactNode;
  next?: { label: string; onClick: () => void };
  evidence: EvidenceItem[];
  /** How real the numbers on this screen are. */
  mode: "2016 survey" | "State records" | "Simulated" | "Model";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="panel" aria-labelledby={`${id}-title`}>
      <p className="panel-step">
        <span className="tabular">{step} / 4</span> · {STEPS[step]}
        <span className="mode-tag">{mode}</span>
      </p>
      <h1 id={`${id}-title`} className="panel-title">{title}</h1>
      <p className="panel-lede">{lede}</p>
      {children ? <div className="panel-body">{children}</div> : null}
      <div className="panel-foot">
        <button type="button" className="link-button" aria-expanded={open} aria-controls={`${id}-evidence`} onClick={() => setOpen(!open)}>
          {open ? "Hide evidence" : "Evidence"}
        </button>
        {next ? (
          <button type="button" className="next-button" onClick={next.onClick}>
            {next.label} <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {open ? (
        <ul id={`${id}-evidence`} className="evidence-list">
          {evidence.map((item) => (
            <li key={item.label}>
              {item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a> : item.label}
              {item.source ? (
                <span className="evidence-ref">
                  {item.source.ref.replace(/^origin\//, "")} @ {item.source.commit.slice(0, 7)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
