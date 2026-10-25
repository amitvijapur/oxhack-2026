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
    return `${first.label}: ${first.action ?? 'no action'}${review} · value ${usd(first.valueUsd)}${more}`;
  }
  return `${summary.runsJudged} of ${summary.runsTotal} runs judged · placebo check ${summary.checks.placebo ?? 'not reported'}`;
}

export function runMeta(latest) {
  const date = new Date(latest.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const commit = latest.gitCommit ? ` · ${latest.gitCommit.slice(0, 7)}${latest.dirty ? '*' : ''}` : '';
  return `${MODE_LABELS[latest.mode] ?? latest.mode} · published ${date}${commit}`;
}
