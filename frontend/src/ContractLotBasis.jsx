import { LOT_BASIS } from '../../model/tok-option/lot-basis.mjs';
import './contract-lot.css';

const money = (value) => typeof value === 'number' && Number.isFinite(value)
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  : 'Not available';

/**
 * @param {{ controls: { entryPremiumUsd: number, entryFeeUsd: number, unavoidableAdditionalObligationsUsd: number }, compact?: boolean, lotBasis?: import('./lib/algorithm-workflow.mjs').AlgorithmLotBasis, capitalPolicy?: import('./lib/algorithm-workflow.mjs').AlgorithmCapitalPolicy | null }} props
 */
export function ContractLotBasis({ controls, compact = false, lotBasis = LOT_BASIS, capitalPolicy = null }) {
  const values = [controls.entryPremiumUsd, controls.entryFeeUsd, controls.unavoidableAdditionalObligationsUsd];
  const upfront = values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    ? values.reduce((total, value) => total + value, 0) : null;
  const content = <>
    <dl className="contract-lot-costs">
      <div><dt>Initial payment</dt><dd>{money(controls.entryPremiumUsd)}</dd></div>
      <div><dt>Assumed entry fee</dt><dd>{money(controls.entryFeeUsd)}</dd></div>
      <div><dt>Other upfront commitments</dt><dd>{money(controls.unavoidableAdditionalObligationsUsd)}</dd></div>
      <div><dt>Total upfront capital</dt><dd>{money(upfront)}</dd></div>
    </dl>
    <p>USD per whole contract. The {money(lotBasis.initialPremiumUsd)} starting payment uses {lotBasis.referenceCount} selected historical initial payments as a scale reference, not a current Tok quote or a per-acre price.</p>
    {capitalPolicy && <p>Hypothetical fund {money(capitalPolicy.startingFundUsd)}. Limits: {money(capitalPolicy.maxRiskPerOptionUsd)} per contract, {money(capitalPolicy.maxOpenRiskUsd)} open risk, {money(capitalPolicy.maxWholeCohortCommittedUsd)} lifetime cohort commitments and {capitalPolicy.maxPositions} positions.</p>}
    <details className="contract-lot-sources"><summary>Historical reference and separate obligations</summary>
      <ul>{lotBasis.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.project}, {source.agreementDate}</a> · {money(source.initialPaymentUsd)} initial payment</li>)}</ul>
      <p>The historical contracts also had annual payments, exploration commitments, royalties and contingent payments. Northway paid a separate scholarship. These obligations are not included in the initial-payment reference or copied into this hypothetical contract. The demo assumes no further upfront commitments; an actual obligation schedule and assignment consent remain unverified.</p>
    </details>
  </>;
  return compact
    ? <details className="contract-lot contract-lot-compact"><summary>Whole contract · {money(upfront)} upfront</summary>{content}</details>
    : <section className="contract-lot" aria-label="Whole-contract cost basis"><h3>One whole contract</h3>{content}</section>;
}
