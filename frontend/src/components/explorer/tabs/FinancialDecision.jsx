"use client";

import { useMemo, useState } from 'react';
import { DECIDE_SCENARIOS, runDecideFinancial } from '../../../decide-financial.mjs';
import { ContractLotBasis } from '../../../ContractLotBasis.jsx';
import { CAPITAL } from '../../../../../model/tok-option/config.mjs';

const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const number = (value, digits = 2) => finite(value) ? value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : 'Not available';
const percent = (value, digits = 2) => finite(value) ? `${number(value * 100, digits)}%` : 'Not available';
const points = (value) => finite(value) ? `${value > 0 ? '+' : ''}${number(value * 100, value !== 0 && Math.abs(value * 100) < 0.01 ? 4 : 2)} pp` : 'Not available';
const money = (value) => finite(value) ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Not available';

export function FinancialDecisionResult({ view, area }) {
  const { result, controls, action } = view;
  const mapped = result.mapped;
  const diagnostics = result.cashDiagnostics.mapped;
  const breakEven = diagnostics?.breakEven;
  const recorded = controls.swarmPolicy === 'illustrative_contrast';
  const decision = action === 'BUY_CANDIDATE' ? 'Demo buy candidate' : action === 'SKIP' ? 'Skip hypothetical contract' : 'No financial decision';
  const explanation = !mapped ? 'The selected scenario cannot be priced with the available inputs.'
    : result.evidence.gate === 'FAIL' ? `Site ${area} fails the geological screen. Positive hypothetical cash math cannot override that gate.`
      : result.evidence.gate !== 'PASS' ? `Site ${area} has incomplete geological evidence. The cash math alone does not establish eligibility.`
        : mapped.expectedNetCashUsd <= 0 ? 'Expected net cash is not positive after upfront and exit costs.'
          : 'The assumed contract passes the model gates with positive expected net cash. No available contract or validated trading edge is established.';

  return <>
    <div className="financial-result" aria-live="polite" aria-atomic="true">
      <h4>{decision}</h4>
      <p className="note">{explanation}</p>
      <dl className="mini-stats financial-returns">
        <div><dt>Expected cash return</dt><dd className="tabular">{percent(view.expectedReturn)}</dd></div>
        <div><dt>Baseline return</dt><dd className="tabular">{percent(view.baselineReturn)}</dd></div>
        <div><dt>Change from baseline</dt><dd className="tabular">{points(view.deltaReturn)}</dd></div>
      </dl>
    </div>
    <p className="note">Returns are net cash ÷ upfront capital over {controls.horizonDays} days, not annualized. Upfront capital is premium + entry fee + unavoidable obligations, {money(mapped?.amountAtRiskUsd)} per whole contract. pp means percentage points.</p>
    <p className="note">Selected scenario: {money(mapped?.expectedNetCashUsd)} expected net cash and {money(mapped?.assignmentValueUsd)} modeled assignment proceeds at the horizon. Baseline: {money(result.baseline?.expectedNetCashUsd)} expected net cash and {money(result.baseline?.assignmentValueUsd)} assignment proceeds. Proceeds are not the initial entry payment.</p>

    <h4 className="financial-subhead">Cash risk by day {controls.horizonDays}</h4>
    <dl className="mini-stats financial-risks">
      <div><dt>Probability of no sale</dt><dd className="tabular">{percent(mapped?.noSaleProbability, 1)}</dd></div>
      <div><dt>Probability of negative net cash</dt><dd className="tabular">{percent(diagnostics?.negativeCashProbability, 1)}</dd></div>
      <div><dt>Median cash return</dt><dd className="tabular">{percent(view.medianReturn)}</dd></div>
      <div><dt>Worst modeled cash return</dt><dd className="tabular">{percent(view.worstReturn)}</dd></div>
    </dl>
    <p className="note">{finite(view.noSaleReturn) ? `No sale means ${percent(view.noSaleReturn)} cash return by the horizon. ` : 'Scenario cash risk is unavailable until its inputs can be evaluated. '}The unsold option may still have a mark, but that is not cash. A cash shortfall while held is not necessarily a final realized loss; all upfront capital can ultimately be lost. These probabilities use an assumed sale rate.</p>

    <h4 className="financial-subhead">What breaks even?</h4>
    <dl className="mini-stats financial-risks">
      <div><dt>Maximum entry premium</dt><dd className="tabular">{money(breakEven?.maximumEntryPremiumUsd)}</dd></div>
      <div><dt>Minimum sale rate per 30 days</dt><dd className="tabular">{breakEven?.hazardThresholdStatus === 'unattainable' ? 'Unattainable' : percent(breakEven?.minimumHazardPer30Days)}</dd></div>
    </dl>
    <p className="note">Assumed premium: {money(controls.entryPremiumUsd)}; headroom: {money(breakEven?.premiumHeadroomUsd)}. Assumed sale rate: {percent(controls.hazardPer30Days, 0)} per 30 days while unsold. Break-even sale probability by day {controls.horizonDays}: {breakEven?.hazardThresholdStatus === 'unattainable' ? 'Unattainable' : percent(breakEven?.minimumSaleProbability)}. Other assumptions stay fixed. These are model thresholds, not market quotes.</p>
    {breakEven?.hazardThresholdStatus === 'unattainable' && <p className="note">Even a certain sale cannot recover upfront capital at the modeled assignment proceeds. Increasing sale probability alone cannot break even.</p>}

    <details className="fold">
      <summary>Required resale hurdle for a 25% return</summary>
      <dl className="mini-stats financial-risks">
        <div><dt>Required gross assignment proceeds</dt><dd className="tabular">{money(view.targetResale?.requiredAssignmentProceedsUsd)}</dd></div>
        <div><dt>Model assignment proceeds at horizon</dt><dd className="tabular">{money(mapped?.assignmentValueUsd)}</dd></div>
      </dl>
      <p className="note">A 25% expected net cash return on all upfront capital over {controls.horizonDays} days, not annualized. The hurdle holds the same gross resale proceeds at each sale date and includes the assumed chance of no sale and exit fee. It is a target, not a forecast, quote or model assignment value.</p>
    </details>

    <details className="fold">
      <summary>Financial assumptions and signal source</summary>
      <ul className="fold-list">
        <li>One hypothetical assignable option evaluated against Site {area}&apos;s area-level evidence. These terms do not belong to the selected plot and are not an available offer.</li>
        <li>Model gold starts at {money(controls.price)}/oz, separate from the live quote above. Assumed annual growth: {percent(controls.annualGrowthRate)}. Scenario gold movement versus baseline: {percent(mapped?.goldForecast?.adjustment, 3)}.</li>
        <li>{number(controls.quantity, 0)} assumed recoverable ounces; {percent(controls.ownershipFraction, 0)} ownership; {percent(controls.kappa, 0)} economic conversion; {percent(controls.pGeo, 0)} geological success probability; {money(controls.remainingBuyerConsiderationUsd)} buyer consideration. Stream-sample ppm does not estimate these inputs.</li>
        <li>Entry fee {money(controls.entryFeeUsd)}, exit fee {money(controls.exitFeeUsd)}, unavoidable obligations {money(controls.unavoidableAdditionalObligationsUsd)}. Assignment and release of obligations are assumed; no mining or exercise is modeled.</li>
        <li>{recorded ? 'Recorded simulated support is compared with the matching sports-placebo run over days 3–5. This is an illustrative contrast, not a measured causal effect.' : controls.scenarioId === 'baseline' ? 'Baseline uses zero support adjustment.' : `Synthetic signal: ${controls.syntheticSignal > 0 ? '+' : ''}${number(controls.syntheticSignal)}. This is an invented sensitivity example, not a measured swarm result.`} Gold response cap {percent(controls.goldResponseCap, 0)}, exposure {percent(controls.eventExposure, 0)}, retention {percent(controls.retention, 0)}. The support-to-gold transfer is uncalibrated.</li>
        <li>The existing swarm research checks remain failed or incomplete. <a href="/swarm">Inspect the workflow and validation</a>. No predictive edge has been validated.</li>
        <li>Longer horizons mechanically allow more sale opportunities at the same assumed rate. The comparison does not estimate how news or asking price changes liquidity.</li>
      </ul>
    </details>
  </>;
}

export default function FinancialDecision({ features, area }) {
  const [horizonDays, setHorizonDays] = useState(90);
  const [scenarioId, setScenarioId] = useState('synthetic');
  const view = useMemo(() => runDecideFinancial({ features, area, horizonDays, scenarioId }), [features, area, horizonDays, scenarioId]);
  return <section className="financial-decision" aria-labelledby="financial-decision-heading">
    <p className="eyebrow">Hypothetical economics</p>
    <h3 id="financial-decision-heading">Financial decision and cash risk</h3>
    <p className="note">The geological screen is only the first gate. This separate calculation uses the existing model with assumed contract terms.</p>
    <p className="note">Model gold assumption: {money(view.controls.price)}/oz. The live gold quote above is not used here. Gold response cap {percent(view.controls.goldResponseCap, 0)}, retention {percent(view.controls.retention, 0)}; the transfer is uncalibrated.</p>
    <div className="financial-controls">
      <label>Holding period<select value={horizonDays} onChange={(event) => setHorizonDays(Number(event.target.value))}>{[30, 90, 180].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>
      <label>Financial scenario<select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>{DECIDE_SCENARIOS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    </div>
    <ContractLotBasis controls={view.controls} capitalPolicy={CAPITAL} compact />
    <FinancialDecisionResult view={view} area={area} />
  </section>;
}
