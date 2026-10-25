"use client";

import type { Source } from "@/lib/showcase";

export type EvidenceItem = { label: string; href?: string; source?: Source };

/** One panel tab: its sections, then a collapsed list of sources. */
export function TabBody({ evidence, children }: { evidence: EvidenceItem[]; children: React.ReactNode }) {
  return (
    <div className="tab-body">
      {children}
      <details className="sources">
        <summary>Sources ({evidence.length})</summary>
        <ul>
          {evidence.map((item) => (
            <li key={item.label}>
              {item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a> : item.label}
              {item.source ? <span className="source-ref">{item.source.ref.replace(/^origin\//, "")} @ {item.source.commit.slice(0, 7)}</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function Section({ title, lede, children }: { title: string; lede?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="section">
      <h3>{title}</h3>
      {lede ? <p className="section-lede">{lede}</p> : null}
      {children}
    </section>
  );
}
