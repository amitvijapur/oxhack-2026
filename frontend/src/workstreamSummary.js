import { CHECK_LABELS } from './copy.js';
import { formatNumber } from './evidence.js';

/** How each run's values were obtained; shown beside every live result. */
export const MODE_LABELS = {
  measured: 'Measured snapshot',
  evidence_only: 'Evidence only',
  scenario: 'Scenario',
  empirical: 'Evaluated',
};

const usd = (value) => (typeof value === 'number' && Number.isFinite(value)
  ? `${value < 0 ? '−' : ''}$${Math.round(Math.abs(value)).toLocaleString('en-US')}`
  : 'not available');

const count = (value) => (typeof value === 'number' && Number.isFinite(value) ? formatNumber(value, 0) : '?');

/** One plain line per workstream summary. Missing values are named, never shown as zero. */
export function summaryLine(summary) {
  if (summary.kind === 'land') {
    const site = (key) => `${key}: ${count(summary.sites[key].insideActiveClaim)} of ${count(summary.sites[key].samples)} samples inside an active claim`;
    return `${site('A')} · ${site('B')}`;
  }
  if (summary.kind === 'decision') {
    const [first] = summary.sections;
    const more = summary.sections.length > 1 ? ` · +${summary.sections.length - 1} more` : '';
    const review = first.status && first.status !== 'ok' ? ` (${first.status.replace('_', ' ')})` : '';
    // A single unnamed section needs no label; NV sections are named by their cell.
    const label = summary.sections.length === 1 && first.label === 'decision' ? '' : `${first.label}: `;
    return `${label}${first.action ?? 'no action'}${review} · value ${usd(first.valueUsd)}${more}`;
  }
  return `${summary.runsJudged} of ${summary.runsTotal} runs judged · placebo check ${summary.checks.placebo ?? 'not reported'}`;
}

/** "24 Oct 2026" for an ISO date or timestamp; null when it cannot be read. */
export function formatDay(value) {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function runMeta(latest) {
  const date = new Date(latest.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const commit = latest.gitCommit ? ` · ${latest.gitCommit.slice(0, 7)}${latest.dirty ? '*' : ''}` : '';
  return `${MODE_LABELS[latest.mode] ?? latest.mode} · published ${date}${commit}`;
}

const STATUS_LABELS = { ok: 'Ready', manual_review: 'Needs review', excluded: 'Excluded' };
const CHECK_STATUS = { unknown: 'Not confirmed', fail: 'Failed', pass: 'Confirmed' };

const humanize = (name) => name.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

const months = (step) => (step.fromMonth === step.toMonth ? `Month ${step.fromMonth}` : `Months ${step.fromMonth}–${step.toMonth}`);

/** One sentence per run of the engine's month-by-month plan. */
export function planLine(step) {
  const action = step.action.toUpperCase();
  let what;
  if (action === 'HOLD') {
    what = step.sellIfOfferAtLeastUsd === null ? 'hold the option' : `hold; sell if offered ${usd(step.sellIfOfferAtLeastUsd)} or more`;
  } else if (action === 'LAPSE') {
    what = step.paymentUsd === null ? 'let the option lapse' : `let it lapse rather than pay the next ${usd(step.paymentUsd)}`;
  } else if (action === 'PAY_STAGE') {
    what = step.paymentUsd === null ? 'pay the next stage' : `pay the next ${usd(step.paymentUsd)} stage`;
  } else if (action === 'EXERCISE') {
    what = 'exercise the option';
  } else {
    what = step.action.toLowerCase().replaceAll('_', ' ');
  }
  return `${months(step)}: ${what}`;
}

/** What the Answer card shows for a published decision run; first section first. */
export function decisionView(summary) {
  const [first] = summary.sections;
  const percent = typeof first.pLoss === 'number' && Number.isFinite(first.pLoss) ? Math.round(first.pLoss * 100) : null;
  const value = typeof first.valueUsd === 'number' && Number.isFinite(first.valueUsd)
    ? `Expected value ${first.valueUsd >= 0 ? '+' : ''}${usd(first.valueUsd)}`
    : 'Expected value not available';
  return {
    label: first.label,
    action: first.action ?? 'No action',
    statusLabel: first.status ? STATUS_LABELS[first.status] ?? humanize(first.status) : null,
    needsReview: Boolean(first.status && first.status !== 'ok'),
    valueLine: percent === null ? value : `${value} · ${percent}% chance of losing money`,
    checks: first.checks.filter((check) => check.status !== 'pass').map((check) => ({
      ...check, label: CHECK_LABELS[check.name] ?? humanize(check.name), statusText: CHECK_STATUS[check.status] ?? humanize(check.status),
    })),
    planLines: first.plan.map(planLine),
    fragile: first.fragile,
    moreSections: summary.sections.length - 1,
  };
}
