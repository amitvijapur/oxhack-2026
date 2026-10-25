import { ChevronDown } from 'lucide-react';

const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const money = (x) => finite(x) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(x) : 'Not available';
const percent = (x, digits = 2) => finite(x) ? `${(x * 100).toFixed(digits)}%` : 'Not available';
const label = (status) => ({ pass: 'Pass', fail: 'Failed', unknown: 'Pending', synthetic: 'Synthetic', supplied: 'Supplied', partial: 'Partial', missing: 'Missing', blocked: 'Blocked' }[status] || 'Pending');
const tone = (status) => ['pass', 'supplied'].includes(status) ? 'pass' : ['fail', 'blocked'].includes(status) ? 'fail' : 'unknown';

export function DataCoverage({ audit, demo, onUseGoldTrend }) {
  if (!audit) return null;
  const { land, swarm, modelGaps } = audit;
  const summary = land.summary;
  const trend = land.goldTrend;
  const coverage = [...(land.coverage || []), ...(swarm.coverage || []), ...modelGaps.filter((row) => row.id === 'predictive_validation')];
  return <section className="model-data-audit" aria-labelledby="model-data-heading">
    <div className="model-section-heading"><div><h3 id="model-data-heading">What the branch data fills</h3><p>Sources are connected. Important economic inputs are still missing.</p></div><span className="model-status model-status-unknown">Partial coverage</span></div>
    <dl className="model-source-facts">
      <div><dt>Active-claim sample overlaps</dt><dd>{summary?.activeClaimSamples ?? 'Unknown'} / {summary?.totalSamples ?? 'Unknown'}</dd></div>
      <div><dt>State-land sample overlaps</dt><dd>{summary?.stateLandSamples ?? 'Unknown'} / {summary?.totalSamples ?? 'Unknown'}</dd></div>
      <div><dt>Historical gold growth</dt><dd>{percent(trend?.annualGrowthRate)}<small>Annual-average CAGR, {trend?.startYear ?? '?'} to {trend?.endYear ?? '?'}</small></dd></div>
    </dl>
    <p className="model-note">Claim and land polygons are overlapping context layers. A sample inside a claim does not establish an available option or the rights its owner can convey.</p>
    {finite(trend?.annualGrowthRate) && <div className="model-trend-action"><button type="button" className="model-import-button" disabled={!demo} onClick={onUseGoldTrend}>Use historical gold growth in demo</button><p className="model-note">Uses {percent(trend.annualGrowthRate)} as a hypothetical annual growth rate. This is a description of past annual averages, not a forecast. {demo ? 'The gold price and recoverable ounces remain separate assumptions.' : 'Choose the hypothetical demo to apply it.'}</p></div>}
    <details className="model-detail"><summary>Inspect source coverage and remaining gaps<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content">
      <div className="model-coverage-list">{coverage.map((row, i) => <div key={`${row.id}-${i}`}><div><strong>{row.label}</strong><span className={`model-status model-status-${tone(row.status)}`}>{label(row.status)}</span></div><p>{row.detail}</p></div>)}</div>
      <dl className="model-land-facts">{land.facts?.map((row, i) => <div key={i}><dt>{row.label}</dt><dd>{row.value}<small>{row.detail}</small></dd></div>)}</dl>
      <div className="model-source-links">{[['Land', land.provenance], ['Swarm', swarm.provenance]].map(([name, source]) => source && <p key={name}>{name} source: <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.branch} at {source.revision?.slice(0, 7)}</a>. Retrieved {source.retrievedAt}. Historical availability is recorded separately and has not been validated for backtesting.</p>)}</div>
    </div></details>
  </section>;
}

export function SwarmDiagnostics({ diagnostic }) {
  if (!diagnostic) return null;
  const shared = (diagnostic.diagnostics || []).filter((check) => !/^(direction|mirror)_/.test(check.id));
  const scenarios = (diagnostic.diagnostics || []).filter((check) => /^(direction|mirror)_/.test(check.id));
  const checks = (rows) => <div className="model-check-list">{rows.map((check) => <div key={check.id}><div><strong>{check.label}</strong><span className={`model-status model-status-${tone(check.status)}`}>{label(check.status)}</span></div><p>{check.detail}</p></div>)}</div>;
  return <section className="model-swarm-diagnostics" aria-labelledby="model-swarm-diagnostics-heading">
    <div className="model-section-heading"><div><h3 id="model-swarm-diagnostics-heading">Check the simulation before using its signal</h3><p>These checks test simulator behaviour. They do not establish a trading edge.</p></div><span className={`model-status model-status-${tone(diagnostic.status)}`}>{label(diagnostic.status)}</span></div>
    {checks(shared)}
    {scenarios.length > 0 && <details className="model-detail"><summary>Inspect scenario directions and mirror checks<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content">{checks(scenarios)}</div></details>}
  </section>;
}

export function CashDiagnostics({ diagnostics, controls }) {
  const selected = diagnostics?.mapped;
  const baseline = diagnostics?.baseline;
  const ready = selected?.status === 'illustrative';
  const noSale = selected?.outcomes?.find((row) => row.kind === 'no_sale');
  const saleProbability = ready && noSale ? 1 - noSale.probability : null;
  const breakEven = selected?.breakEven;
  const comparisons = [
    ['Probability of negative cash', 'negativeCashProbability', percent],
    ['Median cash outcome', 'medianCashUsd', money],
    ['Worst cash outcome with nonzero probability', 'worstCashUsd', money],
  ];
  return <section className="model-cash-diagnostics" aria-labelledby="model-cash-diagnostics-heading">
    <h3 id="model-cash-diagnostics-heading">What sits behind the average?</h3>
    <p className="model-note">Cash outcomes by day {controls.horizonDays}, under the selected assumptions. An unsold option can still be held, so negative cash at this horizon is not necessarily a realized investment loss.</p>
    {ready && noSale && <figure className="model-outcome-chart"><div className="model-outcome-bar" role="img" aria-label={`${percent(saleProbability)} chance of sale and ${percent(noSale.probability)} chance of no sale.`}><span style={{ width: percent(saleProbability, 6) }} /><span style={{ width: percent(noSale.probability, 6) }} /></div><figcaption><span>Sale {percent(saleProbability)}</span><span>No sale {percent(noSale.probability)}, cash {money(noSale.netCashUsd)}</span></figcaption></figure>}
    <div className="model-table-scroll"><table><caption className="sr-only">Cash outcome diagnostics, including the no-sale branch.</caption><thead><tr><th scope="col">Measure</th><th scope="col">Baseline</th><th scope="col">Selected scenario</th></tr></thead><tbody>{comparisons.map(([name, key, format]) => <tr key={key}><th scope="row">{name}</th><td>{format(baseline?.[key])}</td><td>{format(selected?.[key])}</td></tr>)}</tbody></table></div>
    {!ready && <p className="model-note">Select a complete demo scenario to see its cash distribution and break-even thresholds.</p>}
    {ready && <>
      <h4>How much room before expected cash reaches zero?</h4>
      <dl className="model-break-even">
        <div><dt>Maximum entry premium</dt><dd>{money(breakEven?.maximumEntryPremiumUsd)}<small>Current assumption {money(controls.entryPremiumUsd)}</small></dd></div>
        <div><dt>Premium headroom</dt><dd>{money(breakEven?.premiumHeadroomUsd)}</dd></div>
        <div><dt>Minimum sale probability by horizon</dt><dd>{percent(breakEven?.minimumSaleProbability)}</dd></div>
        <div><dt>Minimum sale chance per 30 days</dt><dd>{percent(breakEven?.minimumHazardPer30Days)}</dd></div>
        <div><dt>Break-even assignment value, flat-price sensitivity</dt><dd>{money(breakEven?.minimumConstantAssignmentValueUsd)}</dd></div>
      </dl>
      <p className="model-note">These are arithmetic thresholds, not confidence intervals. At zero expected cash the policy skips entry. Other eligibility checks still apply.</p>
      {breakEven?.reasons?.length > 0 && <ul className="model-reasons">{breakEven.reasons.map((reason) => <li key={reason}>{reason.replaceAll('_', ' ')}</li>)}</ul>}
      <details className="model-detail"><summary>Inspect every cash branch<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content model-table-scroll"><table><caption>Sale proceeds minus all upfront commitments. The unsold mark is excluded.</caption><thead><tr><th scope="col">Outcome</th><th scope="col">Probability</th><th scope="col">Net cash</th></tr></thead><tbody>{selected.outcomes.map((row, i) => <tr key={i}><th scope="row">{row.kind === 'no_sale' ? `No sale by day ${controls.horizonDays}` : `Sale at day ${row.day}`}</th><td>{percent(row.probability)}</td><td>{money(row.netCashUsd)}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
