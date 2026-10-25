"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { EvidenceItem } from "./Panel";

/** The opt-in detail sheet beside the map: one per screen, closed by default. */
export function DeepDive({ title, kicker, mode, onClose, evidence, children }: {
  title: string;
  kicker: string;
  mode: string;
  onClose: () => void;
  evidence: EvidenceItem[];
  children: React.ReactNode;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      className="deep"
      aria-label={title}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="deep-head">
        <div>
          <p className="panel-step">{kicker}<span className="mode-tag">{mode}</span></p>
          <h2 className="deep-title">{title}</h2>
        </div>
        <button ref={close} type="button" className="deep-close" onClick={onClose} aria-label="Close deep dive">
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>
      <div className="deep-body">{children}</div>
      <details className="deep-foot">
        <summary className="deep-foot-title">Sources ({evidence.length})</summary>
        <ul className="evidence-list">
          {evidence.map((item) => (
            <li key={item.label}>
              {item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a> : item.label}
              {item.source ? <span className="evidence-ref">{item.source.ref.replace(/^origin\//, "")} @ {item.source.commit.slice(0, 7)}</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </motion.aside>
  );
}

export function Section({ title, lede, children }: { title: string; lede?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="deep-section">
      <h3>{title}</h3>
      {lede ? <p className="deep-lede">{lede}</p> : null}
      {children}
    </section>
  );
}
