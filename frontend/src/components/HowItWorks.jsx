import { STEPS } from '../copy.js';
import { runMeta, summaryLine } from '../workstreamSummary.js';

export default function HowItWorks({ live, pending, sampleCount }) {
  return <section className="how workstreams" id="how-it-works" aria-labelledby="how-heading">
    <div className="section-head">
      <h2 id="how-heading">How it works</h2>
      <p>Four pieces, each owned by one teammate. Each one appears here when its owner publishes it.</p>
    </div>
    <ol className="how-grid">
      {STEPS.map((step, index) => {
        const latest = step.live ? live[step.live] : null;
        const owner = pending[step.key]?.owner ?? step.owner;
        const isLive = step.key === 'evidence' || Boolean(latest);
        return <li className="how-card workstream" key={step.key}>
          <div className="how-top">
            <span className="step-number">{index + 1}</span>
            <span className={`chip ${isLive ? 'chip-ok' : 'chip-muted'}`}>{isLive ? 'Live' : 'Coming soon'}</span>
          </div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          {latest ? <p className="how-result">{summaryLine(latest.summary)}<span>{runMeta(latest)}</span></p> : null}
          {step.key === 'evidence' ? <p className="how-result">{sampleCount} samples, published November 2016<span>Measured · Alaska DGGS</span></p> : null}
          <p className="owner">{owner}</p>
        </li>;
      })}
    </ol>
  </section>;
}
