"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AREA_LABELS } from "@/lib/copy.js";
import { formatAssay } from "@/lib/evidence.js";
import type { Sample } from "@/lib/types";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

/** ⌘K / Ctrl+K: jump to any sample by ID, lab ID or area, then open it on the map. */
export function SampleSearch({ features, onSelect }: { features: Sample[]; onSelect: (feature: Sample) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button type="button" className="search-fab" onClick={() => setOpen(true)} aria-label="Find a sample (Command K)">
        <Search className="size-4" aria-hidden="true" />
        <span>Find a sample</span>
        <kbd>⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Find a sample" description="Search by sample ID, laboratory ID or area">
        <CommandInput placeholder="Sample ID, lab ID or area…" />
        <CommandList>
          <CommandEmpty>No samples match.</CommandEmpty>
          {(["A", "B"] as const).map((area) => (
            <CommandGroup key={area} heading={`${AREA_LABELS[area]} (${area})`}>
              {features.filter((f) => f.properties.area === area).map((f) => (
                <CommandItem
                  key={f.id}
                  value={`${f.properties.sample_id} ${f.properties.laboratory_sample_id} ${AREA_LABELS[area]}`}
                  onSelect={() => {
                    setOpen(false);
                    onSelect(f);
                  }}
                >
                  <span className="font-mono">{f.properties.sample_id}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{formatAssay(f.properties, "gold_primary")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
