"use client";

import { X } from "lucide-react";

export type Tab = "decide" | "land" | "crowd";
export const TABS: { id: Tab; label: string }[] = [
  { id: "decide", label: "Decide" },
  { id: "land", label: "Land" },
  { id: "crowd", label: "Crowd" },
];

/** The explorer's one side panel: plain text tabs, the selected tab content's content. */
export function Panel({ tab, onTab, onClose, children }: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="panel" data-tab={tab} aria-label="Explorer">
      <div className="panel-head">
        <div className="tabs" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="tab-panel" onClick={() => onTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Back to the time-lapse"><X className="size-4" /></button>
      </div>
      {/* Keyed by tab, so each tab opens at its top. */}
      <div key={tab} className="panel-scroll" id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {children}
      </div>
    </aside>
  );
}
