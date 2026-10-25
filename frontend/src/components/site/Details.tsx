import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A native disclosure: works without JavaScript and keeps find-in-page. */
export function Details({ summary, children, className }: { summary: string; children: ReactNode; className?: string }) {
  return (
    <details className={cn("details group mt-3", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
        {summary}
      </summary>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </details>
  );
}
