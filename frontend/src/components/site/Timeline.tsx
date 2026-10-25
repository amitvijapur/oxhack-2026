import { CHECK_LABELS } from "@/lib/copy.js";
import { formatDay } from "@/lib/workstreamSummary.js";
import type { EvidenceConfig } from "@/lib/types";
import type { DecisionRun, LandRun, Live } from "./live-types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, month, text: `${MONTHS[month - 1]} ${year}` };
}

/** The project's TIME story: what was measured when, what was checked since, and what to check next. */
export function Timeline({ timeline, live }: { timeline: EvidenceConfig["timeline"]; live: Live }) {
  const first = monthLabel(timeline.collection_months[0]);
  const last = monthLabel(timeline.collection_months.at(-1)!);
  const collected = first.year === last.year
    ? `${MONTHS[first.month - 1]}–${MONTHS[last.month - 1]} ${first.year}`
    : `${first.text} – ${last.text}`;
  const events: { when: string; what: string; next?: boolean }[] = [
    { when: collected, what: "Samples collected" },
    { when: monthLabel(timeline.publication.value).text, what: "Lab results published" },
  ];
  const land = live.land as LandRun | null;
  const decision = live.decision as DecisionRun | null;
  if (land?.summary.snapshotAt) events.push({ when: formatDay(land.summary.snapshotAt) ?? "Recently", what: "Land claims checked" });
  if (decision) {
    events.push({ when: formatDay(decision.publishedAt) ?? "Recently", what: "Decision run" });
    const open = decision.summary.sections[0].checks.filter((check) => check.status !== "pass");
    if (open.length) {
      const names = open.map((check) => (CHECK_LABELS[check.name as keyof typeof CHECK_LABELS] ?? check.name).toLowerCase());
      events.push({ when: "Next", what: `Confirm ${names.join(" and ")}`, next: true });
    }
  }
  return (
    <section className="section timeline-section" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="sr-only">Timeline</h2>
      <ol className="timeline">
        {events.map((event) => (
          <li key={event.what} className={event.next ? "is-next" : ""}>
            <span className="timeline-when">{event.when}</span>
            <span>{event.what}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">Dates are to the month: the survey gives no per-sample collection day.</p>
    </section>
  );
}
