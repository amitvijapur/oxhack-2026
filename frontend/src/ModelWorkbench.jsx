"use client";

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, FileUp, RotateCcw } from 'lucide-react';
import { parseSwarmImport, runWorkbench } from '../../model/tok-option/workbench.mjs';
import { CAPITAL, EVIDENCE_RULE } from '../../model/tok-option/config.mjs';
import syntheticSwarmExample from '../../model/tok-option/example-swarm.json';
import { CashDiagnostics, DataCoverage, SwarmDiagnostics } from './ModelDiagnostics.jsx';
import { ContractLotBasis } from './ContractLotBasis.jsx';
import { capitalRatio, cashReturn, returnDifference, relativeChange, createConservativeDemo, isConservativeDemo } from './model-presentation.mjs';
import './model-workbench.css';

const GROUPS = ['industry', 'funds', 'government', 'community', 'retail'];
const SCENARIOS = [
  ['mine_approval', 'Mine approval'], ['proposed_tax', 'Proposed tax'],
  ['protest', 'Community protest'], ['mine_blocked', 'Mine blocked'],
  ['gold_reversal', 'Gold reversal'], ['sports_placebo', 'Sports placebo · diagnostic only'],
];
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const money = (value) => finite(value) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : 'Not available';
const number = (value, digits = 3) => finite(value) ? new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value) : 'Not available';
const percent = (value, digits = 1) => finite(value) ? `${number(value * 100, digits)}%` : 'Not available';
const usd0 = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const signedPercent = (value, digits = 2) => finite(value) ? `${value > 0 ? '+' : ''}${percent(value, digits)}` : 'Not available';
const percentagePoints = (value) => finite(value) ? `${value > 0 ? '+' : ''}${number(value * 100, Math.abs(value * 100) < 0.01 ? 4 : 2)} pp` : 'Not available';
const message = (value) => typeof value === 'string' ? value.replaceAll('_', ' ') : value?.message || value?.reason || JSON.stringify(value);
const actionText = (action) => ({ BUY_CANDIDATE: 'Demo buy candidate', SKIP: 'Skip this contract', INSUFFICIENT_DATA: 'Inputs missing', PENDING_SWARM: 'Swarm output pending' }[action] || 'No entry decision');

function NumericField({ label, name, value, onChange, unit, hint, step = 'any', min, max, scale = 1 }) {
  const id = `model-${name}`;
  return <label className="model-field" htmlFor={id}>
    <span>{label}</span>
    <span className="model-input-wrap"><input id={id} type="number" inputMode="decimal" value={finite(value) ? Number((value * scale).toPrecision(12)) : ''} step={step} min={min} max={max} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value) / scale)} aria-describedby={hint ? `${id}-hint` : undefined} /><span>{unit}</span></span>
    {hint && <small id={`${id}-hint`}>{hint}</small>}
  </label>;
}

function EvidenceScreen({ evidence, area }) {
  const gate = evidence?.gate || 'UNKNOWN';
  return <div className="model-evidence">
    <div className="model-evidence-head"><h3>Observed evidence</h3><span className={`model-status model-status-${gate.toLowerCase()}`}>{gate === 'PASS' ? 'Screen passes' : gate === 'FAIL' ? 'Screen fails' : 'Screen unknown'}</span></div>
    <p>Area {area} has <strong>{evidence?.pass ?? 0} qualifying samples</strong> out of {evidence?.total ?? 0} at the proposed {EVIDENCE_RULE.thresholdPpm} ppm primary-gold threshold.</p>
    <dl className="model-evidence-counts"><div><dt>Pass</dt><dd>{evidence?.pass ?? 0}</dd></div><div><dt>Fail</dt><dd>{evidence?.fail ?? 0}</dd></div><div><dt>Unknown</dt><dd>{evidence?.unknown ?? 0}</dd></div><div><dt>Qualifying range</dt><dd>{percent(evidence?.lowerFraction)} to {percent(evidence?.upperFraction)}</dd></div></dl>
    <p className="model-note">At least {EVIDENCE_RULE.minimumClassifiedSamples} classified samples and a {EVIDENCE_RULE.minimumQualifyingFraction * 100}% qualifying lower bound are required. This screen does not estimate ounces or deposit probability. A and B are comparison areas, not verified mineral parcels.</p>
  </div>;
}

function GoldForecast({ result, controls, onCapChange }) {
  const baseline = result.baseline?.goldForecast;
  const scenario = result.mapped?.goldForecast;
  return <section className="model-gold-forecast" aria-labelledby="model-gold-heading">
    <div className="model-section-heading"><h3 id="model-gold-heading">Hypothetical gold movement at {controls.horizonDays} days</h3><span className="model-status">Uncalibrated</span></div>
    <dl className="model-gold-values" aria-live="polite" aria-atomic="true"><div><dt>Baseline gold return from start</dt><dd>{signedPercent(relativeChange(baseline?.baselinePriceUsdPerOz, controls.price), 3)}</dd></div><div><dt>Scenario gold return from start</dt><dd>{signedPercent(relativeChange(scenario?.scenarioPriceUsdPerOz, controls.price), 3)}</dd></div><div><dt>Gold movement vs baseline</dt><dd>{signedPercent(scenario?.adjustment, 3)}</dd></div></dl>
    <p className="model-note">Gold-price movement is separate from the option return on upfront capital. Both are non-annualized over the selected horizon.</p>
    <details className="model-detail"><summary>Gold price assumptions in USD/oz<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content"><p>Starting gold: {money(controls.price)}. Baseline at the horizon: {money(baseline?.baselinePriceUsdPerOz)}. Scenario: {money(scenario?.scenarioPriceUsdPerOz)}.</p><p className="model-note">Starting gold is an editable model assumption, separate from the live quote in the header.</p></div></details>
    <NumericField label="Gold response cap" name="goldResponseCap" value={controls.goldResponseCap} onChange={onCapChange} unit="%" min={0} max={7} step={0.5} scale={100} hint="Assumed mining-support-to-gold response, adjustable from 0% to 7%. Not a calibrated forecast or a probability." />
    <p className="model-note">The cap bounds gold only. Option sensitivity can exceed 7%. The response changes material value before the option is repriced, with no second option markup. Contract risk and the assumed chance of no sale are unchanged by this response alone.</p>
  </section>;
}

function Flow({ result, controls }) {
  const mapped = result.mapped;
  const existing = result.signal?.usagePolicy === 'illustrative_contrast';
  const steps = [
    { title: 'Evidence screen', value: result.evidence?.gate || 'UNKNOWN', text: 'Primary gold samples determine eligibility.' },
    { title: 'Support signal', value: number(result.signal?.value, 6), text: existing ? 'Recorded event support compared with the matching Claude sports placebo.' : controls.scenarioId === 'baseline' ? 'Zero support response in the unadjusted baseline.' : 'The selected simulated or invented stakeholder signal, not a probability.' },
    { title: 'Hypothetical gold response', value: signedPercent(mapped?.goldForecast?.adjustment, 3), text: 'Gold-price movement relative to the same-horizon baseline.' },
    { title: 'Material value change', value: signedPercent(relativeChange(mapped?.rawMaterialValueUsd, result.baseline?.rawMaterialValueUsd)), text: 'Change versus baseline material value. Assumed quantities are unchanged.' },
    { title: 'Assignment price change', value: signedPercent(relativeChange(mapped?.assignmentValueUsd, result.baseline?.assignmentValueUsd)), text: 'Change versus baseline assignment proceeds, after conversion, success probability and buyer consideration.' },
    { title: 'Expected option return', value: percent(cashReturn(mapped), 2), text: `Expected net cash divided by upfront capital over ${controls.horizonDays} days, including no sale.` },
  ];
  return <div className="model-flow-wrap"><h3>Follow the calculation</h3><ol className="model-flow">{steps.map((step, index) => <li key={step.title}><div><span>{step.title}</span><strong>{step.value}</strong><p>{step.text}</p></div>{index < steps.length - 1 && <ArrowRight size={17} aria-hidden="true" />}</li>)}</ol></div>;
}

function Comparison({ result, controls }) {
  const baseline = result.baseline;
  const mapped = result.mapped;
  const rows = [
    ['Assignment proceeds / upfront capital', 'assignmentValueUsd', (r) => capitalRatio(r?.assignmentValueUsd, r?.amountAtRiskUsd)],
    ['Probability of sale by horizon', 'saleProbability', (r) => r?.saleProbability],
    ['Return if sold at horizon, after all costs', 'conditionalSaleProfitUsd', (r) => cashReturn(r, 'conditionalSaleProfitUsd')],
    ['Expected option return, including no sale', 'expectedNetCashUsd', (r) => cashReturn(r)],
    ['Cash return if no sale by horizon', 'noSaleReturn', (r) => capitalRatio(-r?.amountAtRiskUsd, r?.amountAtRiskUsd)],
    ['Weighted unsold mark / upfront capital, not cash', 'weightedNoSaleResidualMarkUsd', (r) => capitalRatio(r?.weightedNoSaleResidualMarkUsd, r?.amountAtRiskUsd)],
  ];
  const status = mapped?.entryAction || result.status;
  return <section className="model-results" aria-labelledby="model-results-heading">
    <div className="model-section-heading"><div><h3 id="model-results-heading">What changes at {controls.horizonDays} days?</h3><p>One assumed assignable option. Returns are non-annualized.</p></div><span className={`model-status ${mapped?.entryAction === 'BUY_CANDIDATE' ? 'model-status-pass' : 'model-status-unknown'}`}>{actionText(status)}</span></div>
    <p className="model-note">Return = expected net cash ÷ upfront capital. The denominator is premium + entry fee + unavoidable obligations, currently {money(mapped?.amountAtRiskUsd ?? baseline?.amountAtRiskUsd)}. Proceeds and unsold marks are ratios to that same capital, not net returns.</p>
    <div className="model-table-scroll"><table className="model-comparison"><caption className="sr-only">Baseline and selected scenario percentages, with no sale included in expected return.</caption><thead><tr><th scope="col">Measure</th><th scope="col">Baseline</th><th scope="col">{controls.scenarioId === 'baseline' ? 'Baseline comparison' : 'Selected scenario'}</th></tr></thead><tbody>{rows.map(([label, key, value]) => <tr key={key} className={key === 'expectedNetCashUsd' ? 'model-total-row' : undefined}><th scope="row">{label}</th><td>{percent(value(baseline), 2)}</td><td>{percent(value(mapped), 2)}</td></tr>)}</tbody></table></div>
    {result.signal?.usagePolicy === 'illustrative_contrast' && <p className="model-note">Baseline return uses the same hypothetical option with no support adjustment. The score comparison uses the matching Claude sports-placebo run.</p>}
    <div className="model-delta" aria-live="polite" aria-atomic="true"><span>Change versus baseline</span><div><span>Assignment price change <strong>{signedPercent(relativeChange(mapped?.assignmentValueUsd, baseline?.assignmentValueUsd))}</strong></span><span>Expected return difference <strong>{percentagePoints(returnDifference(baseline, mapped))}</strong></span></div></div>
    <p className="model-note">pp means percentage points between returns, not a percentage of baseline profit. If nothing sells, no cash is received and the cash return is −100% when upfront capital is positive. An unsold mark is separate from cash; the full commitment can ultimately be lost. The gold response cap does not limit that loss.</p>
    {mapped?.reasons?.length > 0 && <ul className="model-reasons">{mapped.reasons.map((reason, index) => <li key={index}>{message(reason)}</li>)}</ul>}
  </section>;
}

function HorizonChart({ horizons }) {
  const values = horizons.flatMap((row) => [cashReturn(row.baseline), cashReturn(row.mapped)]).filter(finite);
  if (values.length === 0) return null;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const y = (value) => 24 + (high - value) / span * 130;
  const zero = y(0);
  return <figure className="model-horizon-chart"><figcaption>Expected option return by holding period</figcaption><svg viewBox="0 0 600 200" role="img" aria-label="Baseline and selected scenario non-annualized expected returns for 30, 90 and 180 days. Exact percentages are in the table below.">
    <line x1="78" x2="585" y1={zero} y2={zero} className="model-chart-zero" />
    <text x="68" y={zero + 4} textAnchor="end">0%</text>
    {horizons.map((row, index) => <g key={row.days}>{['baseline', 'mapped'].map((key, series) => {
      const value = cashReturn(row[key]);
      if (!finite(value)) return null;
      const x = 120 + index * 165 + series * 31;
      return <rect key={key} x={x} width="24" y={Math.min(zero, y(value))} height={Math.max(1, Math.abs(zero - y(value)))} className={`model-bar-${key}`}><title>{`${row.days} days, ${key === 'mapped' ? 'selected scenario' : 'baseline'}: ${percent(value, 2)}`}</title></rect>;
    })}<text x={148 + index * 165} y="183" textAnchor="middle">{row.days} days</text></g>)}
  </svg><div className="model-chart-legend"><span><i className="model-bar-baseline" />Baseline</span><span><i className="model-bar-mapped" />Selected scenario</span></div></figure>;
}

function Horizons({ result }) {
  const rows = result.horizons || [];
  return <section className="model-horizons" aria-labelledby="model-horizons-heading"><h3 id="model-horizons-heading">Time changes the chance of an exit</h3><p className="model-note">Every 30 days is another assumed opportunity to complete an assignment. A longer horizon can increase the chance of a sale, but it also needs enough time before expiry.</p><HorizonChart horizons={rows} />
    <div className="model-table-scroll"><table><caption className="sr-only">Holding period comparison, all values generated by the same model.</caption><thead><tr><th scope="col">Horizon</th><th scope="col">Sale probability</th><th scope="col">Baseline return</th><th scope="col">Scenario return</th></tr></thead><tbody>{rows.map((row) => <tr key={row.days}><th scope="row">{row.days} days</th><td>{percent(row.mapped?.saleProbability ?? row.baseline?.saleProbability)}</td><td>{percent(cashReturn(row.baseline), 2)}</td><td>{percent(cashReturn(row.mapped), 2)}</td></tr>)}</tbody></table></div>
  </section>;
}

function FormulaTrace({ result, controls }) {
  const baseline = result.baseline;
  const mapped = result.mapped;
  const existing = result.signal?.usagePolicy === 'illustrative_contrast';
  return <details className="model-detail"><summary>Equations and worked numbers<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content model-formulas">
    <p>These equations describe an uncalibrated hypothetical relationship from mining support to gold price, then material value, option assignment and cash. Quantities, conversion, success probability and liquidity are assumptions.</p>
    <dl><div><dt>Grow the baseline gold price</dt><dd><code>Pbase(t) = P₀ × (1 + g)^(t / 365)</code><span>Baseline gold at the selected horizon is {money(baseline?.goldForecast?.baselinePriceUsdPerOz)} USD/oz.</span></dd></div>
      <div><dt>Compare stakeholder support</dt><dd><code>{controls.scenarioId === 'baseline' ? 's = 0 · unadjusted reference' : controls.scenarioId === 'synthetic' ? 's = invented sensitivity, bypassing stakeholder aggregation' : existing ? 's = Σ weight × (event mean − Claude sports-placebo mean) / 10' : 's = Σ weight × (scenario mean − baseline mean) / 10'}</code><span>{existing && 'Means equally weight days 3, 4 and 5. '}The support signal is {number(result.signal?.value, 6)}, not a probability.</span></dd></div>
      <div><dt>Apply the assumed gold response once</dt><dd><code>rAu = gold cap × s × exposure × retention</code><code>PAu,scenario(t) = PAu,base(t) × (1 + rAu)</code><span>At cap {percent(controls.goldResponseCap)}, the assumed gold return is {percent(mapped?.goldForecast?.adjustment, 3)} and scenario gold is {money(mapped?.goldForecast?.scenarioPriceUsdPerOz)} USD/oz. The same retained relative response is applied once to each sale-date baseline, without monthly compounding. Other material prices are unchanged.</span></dd></div>
      <div><dt>Revalue the material and interest</dt><dd><code>Vmaterial(t) = Σ Qm × Pm,scenario(t)</code><code>Vsuccess(t) = Vmaterial(t) × ownership × κ</code><span>Scenario material value is {money(mapped?.rawMaterialValueUsd)} and success-state interest value is {money(mapped?.successValueUsd)}. κ represents omitted development economics.</span></dd></div>
      <div><dt>Recompute assignment proceeds</dt><dd><code>A(t) = pGeo × max(Vsuccess(t) − K, 0)</code><span>Scenario assignment proceeds are {money(mapped?.assignmentValueUsd)}. There is no additional swarm markup here. The future buyer pays K on exercise; we only assign the option. The strike can amplify option sensitivity beyond the gold response cap.</span></dd></div>
      <div><dt>Include sale timing and no sale</dt><dd><code>wⱼ = (1 − h)^(j − 1) × h</code><code>Expected cash = Σ wⱼ × (A(30j) − exit fee) − upfront risk</code><span>At {controls.horizonDays} days, no-sale probability is {percent(mapped?.noSaleProbability)}. The gold response does not change the assumed sale hazard. No-sale cash proceeds are zero.</span></dd></div><div><dt>Express cash as a capital return</dt><dd><code>R = expected net cash / (premium + entry fee + unavoidable obligations)</code><code>ΔR in pp = 100 × (Rscenario − Rbaseline)</code><span>Scenario expected cash {money(mapped?.expectedNetCashUsd)} divided by {money(mapped?.amountAtRiskUsd)} upfront capital gives {percent(cashReturn(mapped), 2)} over {controls.horizonDays} days.</span></dd></div></dl>
    <p className="model-note">The contract proxy omits option time value and assumes geological success or failure resolves before the future buyer exercises. Cash is nominal, with no discounting. Sediment ppm never becomes recoverable ounces. The support-to-gold relationship has not demonstrated predictive performance.</p>
    {mapped?.intervals?.length > 0 && <div className="model-table-scroll"><table><caption>Expected-cash sale branches, each repriced at its sale date.</caption><thead><tr><th scope="col">Sale day</th><th scope="col">Branch probability</th><th scope="col">Assignment</th><th scope="col">After exit fee</th></tr></thead><tbody>{mapped.intervals.map((row) => <tr key={row.day}><th scope="row">Day {row.day}</th><td>{percent(row.weight, 3)}</td><td>{money(row.assignmentValueUsd)}</td><td>{money(row.netSaleProceedsUsd)}</td></tr>)}</tbody></table></div>}
  </div></details>;
}

function Portfolio({ portfolio, controls }) {
  const count = portfolio?.selectedIds?.length || 0;
  const available = portfolio?.status === 'illustrative';
  return <section className="model-portfolio"><div className="model-section-heading"><h3>Size the commitment</h3><span className="model-assumption">Hypothetical {usd0(CAPITAL.startingFundUsd)} fund</span></div><p>{available ? count ? `The optimizer includes the one assumed Area ${controls.area} contract in this cohort.` : 'The optimizer leaves this assumed contract out of the cohort.' : 'Portfolio selection is unavailable until the required model inputs are complete.'} It maximizes positive expected net cash after the evidence, expiry, terms and risk screens.</p><dl><div><dt>Selected contracts</dt><dd>{available ? count : 'Not available'}</dd></div><div><dt>Fund capital committed</dt><dd>{percent(available ? capitalRatio(portfolio?.totalRiskUsd, CAPITAL.startingFundUsd) : null, 2)}</dd></div><div><dt>Expected return on committed capital</dt><dd>{percent(available ? capitalRatio(portfolio?.totalExpectedNetCashUsd, portfolio?.totalRiskUsd) : null, 2)}</dd></div></dl><p className="model-note">Limits are {usd0(CAPITAL.maxRiskPerOptionUsd)} per whole contract, {usd0(CAPITAL.maxOpenRiskUsd)} open risk, {usd0(CAPITAL.maxWholeCohortCommittedUsd)} lifetime commitments for the whole cohort and {CAPITAL.maxPositions} positions. An empty selection has no invested-capital return. Returns are non-annualized over the selected horizon. One interest can appear once. No borrowing, exercise or reinvestment. Positions can fail together. This screen contains one assumed contract, not live listings.</p>{portfolio?.reasons?.length > 0 && <ul className="model-reasons">{portfolio.reasons.map((reason, index) => <li key={index}>{message(reason)}</li>)}</ul>}</section>;
}

function ExistingSwarmResults({ result, selected, horizonDays, onUse, onStrict, busy }) {
  const signal = result.signal;
  const usingPosts = signal?.usagePolicy === 'illustrative_contrast' && finite(signal.value);
  const source = result.sourceAudit?.swarm;
  const research = signal?.researchReadiness ?? source;
  const sourceUrl = source?.provenance?.sourceUrl;
  return <section className="model-existing-swarm" aria-labelledby="model-existing-swarm-heading">
    <div className="model-section-heading"><h3 id="model-existing-swarm-heading">Existing swarm results</h3>{selected && <span className="model-status">Hypothetical economics</span>}</div>
    <p>Compare the recorded mine-approval or court-block posts with the matching Claude sports-placebo run. No new simulation is needed.</p>
    <div className="model-source-actions"><button type="button" className="model-import-button" aria-pressed={selected} disabled={busy} onClick={onUse}>Use existing swarm results</button>{selected && <button type="button" className="model-text-button" onClick={onStrict}>Use strict source checks</button>}</div>
    {selected && <div className="model-existing-context">
      <p><strong>Recorded simulated posts, hypothetical economics.</strong> The mining-support-to-gold response is assumed and uncalibrated. Exposure and retention start at 100% and stay editable.</p>
      {usingPosts ? <p>Support contrast <strong className="tabular">{number(signal.value, 6)}</strong>; hypothetical gold return <strong className="tabular">{percent(result.mapped?.goldForecast?.adjustment, 3)}</strong>. The actual sign is retained.</p> : <p>Actual post-score comparisons are available only for mine approval and mine blocked. Other missing scenarios stay unavailable; baseline remains the unadjusted reference.</p>}
      <div className="model-existing-cash"><p>Expected option return at {horizonDays} days, including no sale; non-annualized.</p><dl aria-live="polite" aria-atomic="true"><div><dt>Baseline</dt><dd>{percent(cashReturn(result.baseline), 2)}</dd></div><div><dt>Selected scenario</dt><dd>{percent(cashReturn(result.mapped), 2)}</dd></div><div><dt>Change versus baseline</dt><dd>{percentagePoints(returnDifference(result.baseline, result.mapped))}</dd></div></dl></div>
      <p className="model-note">Research checks remain {research?.status === 'fail' ? 'failed' : 'incomplete'}. Matching these runs permits illustration only.</p>
    </div>}
    {selected && <details className="model-detail"><summary>Simulation provenance and original checks<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content">
      {usingPosts && <dl className="model-land-facts"><div><dt>Event run</dt><dd>{signal.scenarioRunId}</dd></div><div><dt>Score reference</dt><dd>{signal.referenceRunId} · Claude sports placebo</dd></div><div><dt>Score window</dt><dd>Days {(signal.scoreWindow ?? []).join(', ')} · equal daily means · support scores 0–10</dd></div><div><dt>Source revision</dt><dd>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">{signal.revision}</a> : signal.revision}</dd></div><div><dt>Input knowledge cutoff</dt><dd>{signal.knowledgeCutoff ?? 'Not supplied'}</dd></div><div><dt>Comparison method</dt><dd>{signal.methodVersion}</dd></div></dl>}
      <p className="model-note">The sports placebo is not an untreated control, and one seed does not estimate uncertainty. Matching recorded configurations does not clear the failed research checks. The common day-1 gold jump is not applied again as a separate return.</p>
      <SwarmDiagnostics diagnostic={research} illustrative />
    </div></details>}
  </section>;
}

export default function ModelWorkbench({ features, initialArea = 'A' }) {
  const [controls, setControls] = useState(() => ({ ...createConservativeDemo(), area: initialArea }));
  const [swarmRuns, setSwarmRuns] = useState(null);
  const [importName, setImportName] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const result = useMemo(() => runWorkbench({ features, controls, swarmRuns }), [features, controls, swarmRuns]);
  const existingSelected = controls.swarmPolicy === 'illustrative_contrast';
  const presetSelected = !swarmRuns && isConservativeDemo(controls);
  const syntheticSelected = controls.scenarioId === 'synthetic';
  const usingExistingPosts = result.signal?.usagePolicy === 'illustrative_contrast';
  const sourceSwarm = result.sourceAudit?.swarm;
  const sourceRunCount = sourceSwarm?.diagnosticRuns?.runs?.length ?? sourceSwarm?.runs?.runs?.length ?? 0;
  const sourceChecksBlocked = sourceSwarm?.diagnostics?.some((check) => check.status !== 'pass');
  const sourceCutoffMissing = sourceSwarm?.diagnostics?.find((check) => check.id === 'knowledge_cutoff')?.status !== 'pass';
  const sourceSwarmNote = `The bundled source has ${sourceRunCount} scored simulation ${sourceRunCount === 1 ? 'run' : 'runs'} for inspection. ${sourceChecksBlocked ? 'Failed or incomplete research checks block strict monetary use.' : 'Scenario readiness checks still apply.'}${sourceCutoffMissing ? ' The source knowledge cutoff is missing.' : ''}`;
  const set = (key, value) => setControls((current) => ({ ...current, [key]: value, mode: 'demo', ...(key === 'scenarioId' && value === 'synthetic' ? { swarmPolicy: 'strict' } : {}) }));
  const input = (name, label, options = {}) => <NumericField key={name} name={name} label={label} value={controls[name]} onChange={(value) => set(name, value)} {...options} />;
  const changeWeight = (group, value) => setControls((current) => ({ ...current, weights: { ...current.weights, [group]: value } }));
  const weightTotal = Object.values(controls.weights).every(finite) ? Object.values(controls.weights).reduce((sum, value) => sum + value, 0) : null;
  const normalizeWeights = () => {
    if (!finite(weightTotal) || weightTotal <= 0 || Object.values(controls.weights).some((weight) => weight < 0)) return;
    setControls((current) => ({ ...current, weights: Object.fromEntries(Object.entries(current.weights).map(([key, value]) => [key, value / weightTotal])) }));
  };

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportErrors([]);
    try {
      if (file.size > 2_000_000) throw new Error('This file is too large. Import a swarm JSON export smaller than 2 MB.');
      const parsed = parseSwarmImport(await file.text());
      if (parsed.errors?.length || !parsed.runs) setImportErrors(parsed.errors?.length ? parsed.errors : ['This file has no usable runs. Check the swarm import schema.']);
      else { setSwarmRuns(parsed.runs); setImportName(file.name); setControls((current) => ({ ...current, mode: 'demo', swarmPolicy: 'strict' })); }
    } catch (error) { setImportErrors([error.message || 'The file could not be read. Try importing it again.']); }
    finally { setImporting(false); event.target.value = ''; }
  }

  function loadSyntheticExample() {
    const parsed = parseSwarmImport(JSON.stringify(syntheticSwarmExample));
    if (parsed.errors?.length) { setImportErrors(parsed.errors); return; }
    setSwarmRuns(parsed.runs);
    setImportName('Bundled group-score example');
    setImportErrors([]);
    setControls((current) => ({ ...current, mode: 'demo', swarmPolicy: 'strict', scenarioId: 'mine_approval' }));
  }

  function useConservativeDemo() {
    setSwarmRuns(null);
    setImportName('');
    setImportErrors([]);
    setControls({ ...createConservativeDemo(), area: initialArea });
  }

  function useExistingResults() {
    setSwarmRuns(null);
    setImportName('');
    setImportErrors([]);
    setControls((current) => ({ ...current, mode: 'demo', swarmPolicy: 'illustrative_contrast', scenarioId: 'mine_approval', eventExposure: 1, retention: 1 }));
  }

  function downloadExample() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(syntheticSwarmExample, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tok-synthetic-swarm-example.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="model-workbench" id="option-model" aria-labelledby="model-heading">
    <div className="model-heading"><div><h2 id="model-heading">Hypothetical option model</h2><p>Follow a hypothetical gold movement through material value, option assignment and percentage returns.</p></div><button type="button" className="model-text-button" disabled={importing} onClick={useConservativeDemo}><RotateCcw size={14} aria-hidden="true" />Reset assumptions</button></div>
    <p className="model-mode-note">Samples, land context and recorded simulations are sourced. Contract terms, recoverable ounces, price forecasts and sale probabilities are hypothetical. No investment edge has been demonstrated.</p>
    <section className="model-return-summary" aria-labelledby="model-return-heading">
      <div className="model-section-heading"><h3 id="model-return-heading">Expected option return at {controls.horizonDays} days</h3><span className="model-status">{presetSelected ? 'Small-response synthetic demo' : syntheticSelected ? 'Custom synthetic sensitivity' : 'Hypothetical economics'}</span></div>
      <dl className="model-gold-values" aria-live="polite" aria-atomic="true"><div><dt>Selected scenario return</dt><dd>{percent(cashReturn(result.mapped), 2)}</dd></div><div><dt>Baseline return</dt><dd>{percent(cashReturn(result.baseline), 2)}</dd></div><div><dt>Difference versus baseline</dt><dd>{percentagePoints(returnDifference(result.baseline, result.mapped))}</dd></div><div><dt>Chance of no sale</dt><dd>{percent(result.mapped?.noSaleProbability, 1)}</dd></div></dl>
      <p className="model-note">Expected net cash ÷ upfront capital, where capital is premium + entry fee + unavoidable obligations. Returns are non-annualized; percentages are unavailable when upfront capital is zero. With positive upfront capital, no sale means a −100% cash return at the horizon; the full capital can ultimately be lost.</p>
      <div className="model-source-actions"><button type="button" className="model-import-button" aria-pressed={presetSelected} disabled={importing} onClick={useConservativeDemo}>Use conservative synthetic demo</button></div>
      <p className="model-note">{presetSelected ? 'Active preset: invented +0.5 signal, 1% gold response cap, 100% exposure, 50% retention and flat baseline growth produce an assumed +0.25% gold movement.' : syntheticSelected ? 'The selected signal is invented. Edited assumptions recalculate the synthetic example.' : 'The synthetic preset uses an invented signal and is separate from recorded swarm results.'} “Conservative” refers only to the small response assumptions, not verified fair pricing, low risk or demonstrated predictive accuracy. No trading edge is established.</p>
    </section>
    <ContractLotBasis controls={controls} />
    <GoldForecast result={result} controls={controls} onCapChange={(value) => set('goldResponseCap', value)} />
    <ExistingSwarmResults result={result} selected={existingSelected} horizonDays={controls.horizonDays} busy={importing} onUse={useExistingResults} onStrict={() => setControls((current) => ({ ...current, mode: 'demo', swarmPolicy: 'strict', scenarioId: 'baseline' }))} />
    <div className="model-toolbar"><label>Comparison area<select value={controls.area} onChange={(event) => set('area', event.target.value)}><option value="A">A · Tok west</option><option value="B">B · Tok east</option></select></label><label>Holding period<select value={controls.horizonDays} onChange={(event) => set('horizonDays', Number(event.target.value))}>{[30, 90, 180].map((days) => <option key={days} value={days}>{days} days{days === 90 ? ' · primary' : ''}</option>)}</select></label><label className="model-scenario-select">Scenario comparison<select value={controls.scenarioId} onChange={(event) => set('scenarioId', event.target.value)}><optgroup label="Reference and sensitivity"><option value="baseline">Baseline reference</option><option value="synthetic">Synthetic sensitivity</option></optgroup><optgroup label={existingSelected ? "Recorded comparisons and unavailable scenarios" : "News scenarios require imported runs"}>{SCENARIOS.map(([id, label]) => <option value={id} key={id}>{label}{existingSelected && !['mine_approval', 'mine_blocked'].includes(id) ? ' · unavailable' : ''}</option>)}</optgroup></select></label></div>
    <EvidenceScreen evidence={result.evidence} area={controls.area} />
    <details className="model-detail"><summary>Data sources and missing inputs<ChevronDown size={17} aria-hidden="true" /></summary><DataCoverage audit={result.sourceAudit} demo onUseGoldTrend={() => set('annualGrowthRate', result.sourceAudit.land.goldTrend.annualGrowthRate)} /></details>
    <details className="model-detail"><summary>Simulation source and import<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-import-row"><div><h3>Connect the swarm</h3><p>{importName ? <><Check size={14} aria-hidden="true" />{swarmRuns?.provenance === 'synthetic' ? 'Synthetic fixture loaded: ' : 'Imported simulation: '}<strong>{importName}</strong></> : sourceSwarmNote}</p></div><button type="button" className="model-import-button" onClick={loadSyntheticExample}>Load synthetic group-score demo</button><label className={`model-import-button${importing ? ' is-loading' : ''}`}><FileUp size={16} aria-hidden="true" /><span>{importing ? 'Reading file…' : 'Import swarm JSON'}</span><input type="file" accept=".json,application/json" onChange={importFile} disabled={importing} aria-label="Import swarm JSON" /></label>{importName && <button type="button" className="model-text-button" onClick={() => { setSwarmRuns(null); setImportName(''); setImportErrors([]); setControls((current) => ({ ...current, mode: 'demo', swarmPolicy: 'strict' })); }}>Clear import</button>}</div>
    <details className="model-import-help"><summary>Import format and example</summary><p>Use version 1 normalized JSON, or the team&apos;s scored report wrapped as <code>{'{report, metadata}'}</code>. Metadata must supply sourceId, knowledgeCutoff and eventDefinition. Each scenario needs seed 1 and all five groups on days 3, 4 and 5. Simulated signals also need complete baseline, placebo, judge and scenario diagnostics before they can change a model price.</p><button type="button" className="model-text-button" onClick={downloadExample}>Download the synthetic schema example</button><p>The bundled example is invented for testing the weights. It is not your teammate&apos;s simulation output. Import limit: 2 MB.</p>{swarmRuns && <p>Source: {swarmRuns.sourceId}. Knowledge cutoff: {swarmRuns.knowledgeCutoff}. {swarmRuns.eventDefinition}</p>}</details>
    {!existingSelected && <SwarmDiagnostics diagnostic={result.swarmDiagnostics} />}</details>
    {importErrors.length > 0 && <div className="model-error" role="alert"><strong>Import was not applied.</strong><ul>{importErrors.map((error, index) => <li key={index}>{message(error)}</li>)}</ul><p>The active source is unchanged.</p></div>}
    {result.validationErrors?.length > 0 && <div className="model-error" role="alert"><strong>Check these assumptions to calculate a result.</strong><ul>{result.validationErrors.map((error, index) => <li key={index}>{message(error)}</li>)}</ul></div>}
    {result.reasons?.length > 0 && <div className="model-notice" role="status">{result.reasons.map((reason, index) => <p key={index}>{message(reason)}</p>)}</div>}
    <Flow result={result} controls={controls} />
    <div className="model-body"><aside className="model-controls" aria-label="Model assumptions"><div className="model-controls-heading"><h3>Adjust the assumptions</h3><p>Changes recalculate the hypothetical model.</p></div>
      <fieldset>
        <legend className="sr-only">Hypothetical contract and market assumptions</legend>
        <details className="model-detail"><summary>Contract economics<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content model-field-grid">
          {input('entryPremiumUsd', 'Initial option payment', { unit: 'USD / contract', min: 0, step: 100, hint: 'Whole-contract amount. Starting scale follows selected historical payments, not a current quote.' })}
          {input('quantity', 'Recoverable gold assumption', { unit: 'troy oz', min: 0, step: 10, hint: 'Whole-property quantity conditional on success. Not derived from samples.' })}
          {input('price', 'Gold price assumption', { unit: 'USD/oz', min: 0, step: 50, hint: 'Editable starting model assumption, separate from the live gold quote in the page header.' })}
          {input('annualGrowthRate', 'Annual price growth', { unit: '% / year', scale: 100, min: -99.9, step: 1, hint: 'Forward assumption. The source section can apply the historical gold CAGR explicitly.' })}
          {input('ownershipFraction', 'Interest ownership', { unit: '%', scale: 100, min: 0, max: 100, step: 5 })}
          {input('kappa', 'Material-to-interest conversion', { unit: '%', scale: 100, min: 0, max: 100, step: 0.1 })}
          {input('pGeo', 'Geological success assumption', { unit: '%', scale: 100, min: 0, max: 100, step: 5, hint: 'An assumption independent of the evidence qualifying fraction.' })}
          {input('remainingBuyerConsiderationUsd', 'Future buyer exercise payment', { unit: 'USD', min: 0, step: 100 })}
        </div></details>
        <details className="model-detail"><summary>Exit timing and costs<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content model-field-grid">
          {input('hazardPer30Days', 'Sale chance in each 30-day interval', { unit: '%', scale: 100, min: 0, max: 100, step: 1, hint: 'Conditional on not already sold. Assumed constant across price scenarios.' })}
          {input('remainingMaturityDays', 'Time remaining to expiry', { unit: 'days', min: 0, step: 1, hint: 'Requires the chosen horizon plus a 15-day closing buffer.' })}
          {input('entryFeeUsd', 'Entry fee', { unit: 'USD', min: 0, step: 5 })}
          {input('exitFeeUsd', 'Exit fee if sold', { unit: 'USD', min: 0, step: 5 })}
          {input('unavoidableAdditionalObligationsUsd', 'Other upfront commitments', { unit: 'USD', min: 0, step: 10, hint: 'Later mandatory payments and uncapped obligations are unsupported.' })}
        </div></details>
        <details className="model-detail" open={controls.scenarioId === 'synthetic' ? true : undefined}><summary>Signal and stakeholder weights<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content">
          {controls.scenarioId === 'synthetic' && <div className="model-synthetic"><label htmlFor="model-signal-range">Synthetic signal <output>{number(controls.syntheticSignal)}</output></label><input id="model-signal-range" aria-label="Synthetic signal sensitivity" type="range" min="-1" max="1" step="0.01" value={finite(controls.syntheticSignal) ? controls.syntheticSignal : 0} onChange={(event) => set('syntheticSignal', Number(event.target.value))} /><div><span>−1 · negative bound</span><span>+1 · positive bound</span></div><p>Made-up sensitivity only. This bypasses stakeholder aggregation to test the chosen hypothetical gold response cap; the maximum permitted cap is 7%.</p></div>}
          <p className="model-note">{syntheticSelected ? 'Synthetic sensitivity bypasses these weights. There are no stakeholder observations behind the invented scalar.' : existingSelected ? 'Industry and funds lead the recorded contrast. Each group compares equal-weight means for days 3, 4 and 5 with the matching Claude sports-placebo run.' : 'Industry and funds lead the imported signal. Each group compares its equal-weight mean for days 3, 4 and 5 with baseline seed 1.'} Scores measure simulated support, not price probabilities.</p>
          <div className="model-field-grid model-weights">{GROUPS.map((group) => <NumericField key={group} name={`weight-${group}`} label={group[0].toUpperCase() + group.slice(1)} value={controls.weights[group]} onChange={(value) => changeWeight(group, value)} unit="%" min={0} max={100} step={1} scale={100} />)}</div>
          <div className="model-weight-total"><span>Total <strong>{percent(weightTotal, 2)}</strong></span><button type="button" className="model-text-button" disabled={!finite(weightTotal) || weightTotal <= 0 || Object.values(controls.weights).some((weight) => weight < 0)} onClick={normalizeWeights}>Normalize to 100%</button></div>
          <div className="model-field-grid">{input('eventExposure', 'Gold response exposure', { unit: '%', scale: 100, min: 0, max: 100, step: 5 })}{input('retention', 'Signal retained through horizon', { unit: '%', scale: 100, min: 0, max: 100, step: 5 })}</div>
          <p className="model-note">Exposure and retention are assumptions, not measured reliability. The support signal changes gold price through the chosen cap, then the option is repriced from material value. Synthetic sensitivity uses an invented signal instead of post scores.</p>
        </div></details>
      </fieldset>
    </aside><div className="model-output"><Comparison result={result} controls={controls} /><CashDiagnostics diagnostics={result.cashDiagnostics} controls={controls} evaluations={{ baseline: result.baseline, mapped: result.mapped }} /><Horizons result={result} /><Portfolio portfolio={result.portfolio} controls={controls} /></div></div>
    {result.signal?.provenance !== 'baseline_comparison' && result.signal?.groups?.length > 0 && <details className="model-detail"><summary>Inspect stakeholder contributions<ChevronDown size={17} aria-hidden="true" /></summary><div className="model-detail-content model-table-scroll"><table><caption>{syntheticSelected ? 'Invented scalar sensitivity has no stakeholder-level observations. These weights do not create source evidence.' : usingExistingPosts ? 'Recorded Claude event support compared with the matching sports-placebo run, using equal daily means for days 3, 4 and 5.' : 'Imported scenario support compared with baseline seed 1.'} Missing group-days cannot be filled with zero.</caption><thead><tr><th scope="col">Group</th><th scope="col">Weight</th><th scope="col">{usingExistingPosts ? 'Sports-placebo mean' : 'Baseline mean'}</th><th scope="col">Scenario mean</th><th scope="col">Normalized change</th><th scope="col">Contribution</th></tr></thead><tbody>{result.signal.groups.map((group) => <tr key={group.group}><th scope="row">{group.group}</th><td>{percent(group.weight)}</td><td>{number(group.baselineMean)}</td><td>{number(group.scenarioMean)}</td><td>{number(group.delta)}</td><td>{number(group.contribution, 4)}</td></tr>)}</tbody></table></div></details>}
    <FormulaTrace result={result} controls={controls} />
    <p className="model-footer-note">The prototype tests a possible relationship between news, mineral exposure and option assignment value. Geological samples are observed data. Simulated reactions and assumed economics are not evidence of predictive performance. Real contract terms, comparable transactions and chronological validation are still needed.</p>
  </section>;
}
