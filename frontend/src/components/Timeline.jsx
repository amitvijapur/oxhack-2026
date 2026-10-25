import { CHECK_LABELS } from '../copy.js';
import { formatDay as dayLabel } from '../workstreamSummary.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return { year, month, text: `${MONTHS[month - 1]} ${year}` };
}

/** The project's TIME story: what was measured when, what was checked since, and what to check next. */
export default function Timeline({ timeline, live }) {
  const first = monthLabel(timeline.collection_months[0]);
  const last = monthLabel(timeline.collection_months.at(-1));
  const collected = first.year === last.year
    ? `${MONTHS[first.month - 1]}–${MONTHS[last.month - 1]} ${first.year}`
    : `${first.text} – ${last.text}`;
  const events = [
    { when: collected, what: 'Samples collected' },
    { when: monthLabel(timeline.publication.value).text, what: 'Lab results published' },
  ];
  if (live.land?.summary.snapshotAt) events.push({ when: dayLabel(live.land.summary.snapshotAt), what: 'Land claims checked' });
  if (live.decision) {
    events.push({ when: dayLabel(live.decision.publishedAt), what: 'Decision run' });
    const open = live.decision.summary.sections[0].checks.filter((check) => check.status !== 'pass');
    if (open.length) events.push({ when: 'Next', what: `Confirm ${open.map((c) => (CHECK_LABELS[c.name] ?? c.name).toLowerCase()).join(' and ')}`, next: true });
  }
  return <section className="timeline-section" aria-labelledby="timeline-heading">
    <h2 id="timeline-heading" className="sr-only">Timeline</h2>
    <ol className="timeline">
      {events.map((event) => <li key={event.what} className={event.next ? 'is-next' : ''}>
        <span className="timeline-when">{event.when}</span>
        <span className="timeline-what">{event.what}</span>
      </li>)}
    </ol>
    <p className="fine-print">Dates are to the month: the survey gives no per-sample collection day.</p>
  </section>;
}
