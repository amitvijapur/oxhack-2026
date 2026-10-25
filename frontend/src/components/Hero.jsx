import { ArrowDown, ArrowRight } from 'lucide-react';
import { HERO, STEPS } from '../copy.js';
import { MODE_LABELS, decisionView, formatDay } from '../workstreamSummary.js';
import Details from './Details.jsx';

function AnswerCard({ decision }) {
  if (!decision) {
    return <aside className="answer-card is-pending" aria-labelledby="answer-heading">
      <p className="eyebrow">The answer</p>
      <h2 id="answer-heading" className="answer-action">Coming soon</h2>
      <p className="answer-line">The decision model’s result appears here once Salman publishes it.</p>
    </aside>;
  }
  const view = decisionView(decision.summary);
  return <aside className="answer-card" aria-labelledby="answer-heading">
    <div className="answer-top">
      <p className="eyebrow">The answer · {MODE_LABELS[decision.mode] ?? decision.mode}</p>
      {view.statusLabel ? <span className={`chip ${view.needsReview ? 'chip-warn' : 'chip-ok'}`}>{view.statusLabel}</span> : null}
    </div>
    <h2 id="answer-heading" className="answer-action">{view.action}</h2>
    <p className="answer-line">{view.valueLine}</p>
    {view.checks.length > 0 ? <div className="answer-block">
      <h3>Check these first</h3>
      <ul className="check-list">{view.checks.map((check) => <li key={check.name}>
        <span className="check-name">{check.label}</span><span className="check-status">{check.statusText}</span>
        {check.evidence ? <Details summary="Why" className="check-why"><p>{check.evidence}</p></Details> : null}
      </li>)}</ul>
    </div> : null}
    {view.planLines.length > 0 ? <div className="answer-block">
      <h3>When</h3>
      <ol className="plan-list">{view.planLines.map((line) => <li key={line}>{line}</li>)}</ol>
    </div> : null}
    {view.fragile.length > 0 ? <Details summary="What would change the answer">
      <ul className="plain-list">{view.fragile.map((item) => <li key={item}>{item}</li>)}</ul>
    </Details> : null}
    {view.moreSections > 0 ? <p className="answer-note">Showing {view.label}; {view.moreSections} more in the full output.</p> : null}
  </aside>;
}

function stepStatus(step, live, sampleCount) {
  if (step.key === 'evidence') return { live: true, text: `${sampleCount} samples · 2016` };
  const latest = live[step.live];
  if (!latest) return { live: false, text: 'Coming soon' };
  if (latest.summary.kind === 'decision') {
    const view = decisionView(latest.summary);
    return { live: true, text: view.statusLabel ? `${view.action} · ${view.statusLabel.toLowerCase()}` : view.action };
  }
  if (latest.summary.kind === 'land') return { live: true, text: `Checked ${formatDay(latest.summary.snapshotAt) ?? 'recently'}` };
  return { live: true, text: `${latest.summary.runsJudged} of ${latest.summary.runsTotal} runs scored` };
}

export default function Hero({ live, sampleCount }) {
  return <section className="hero" id="answer" aria-labelledby="hero-heading">
    <div className="hero-grid">
      <div className="hero-copy">
        <h1 id="hero-heading">{HERO.question}</h1>
        <p className="lede">{HERO.lede}</p>
        <div className="hero-actions">
          <a className="button" href="#map">{HERO.cta}<ArrowRight size={17} aria-hidden="true" /></a>
          <a className="text-button" href="#how-it-works">{HERO.secondary}<ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </div>
      <AnswerCard decision={live.decision} />
    </div>
    <ol className="steps" aria-label="How the pieces fit">
      {STEPS.map((step, index) => {
        const status = stepStatus(step, live, sampleCount);
        return <li key={step.key}><a href={step.href}>
          <span className="step-number">{index + 1}</span>
          <span className="step-title">{step.title}</span>
          <span className={`step-status${status.live ? ' is-live' : ''}`}>{status.text}</span>
        </a></li>;
      })}
    </ol>
  </section>;
}
