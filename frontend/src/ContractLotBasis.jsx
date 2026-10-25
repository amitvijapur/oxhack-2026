import { LOT_BASIS, SYNTHETIC_LOT_PROFILE } from '../../model/tok-option/lot-basis.mjs';
import './contract-lot.css';

const money = (value) => typeof value === 'number' && Number.isFinite(value)
  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  : 'Not available';

/**
 * @param {{ controls: { entryPremiumUsd: number, entryFeeUsd: number, unavoidableAdditionalObligationsUsd: number, quantity: number, remainingBuyerConsiderationUsd: number, ownershipFraction: number, kappa: number, pGeo: number, price: number, annualGrowthRate: number }, compact?: boolean, lotBasis?: import('./lib/algorithm-workflow.mjs').AlgorithmLotBasis, syntheticProfile?: import('./lib/algorithm-workflow.mjs').AlgorithmSyntheticProfile, capitalPolicy?: import('./lib/algorithm-workflow.mjs').AlgorithmCapitalPolicy | null }} props
 */
export function ContractLotBasis({ controls, compact = false, lotBasis = LOT_BASIS, syntheticProfile = SYNTHETIC_LOT_PROFILE, capitalPolicy = null }) {
  const values = [controls.entryPremiumUsd, controls.entryFeeUsd, controls.unavoidableAdditionalObligationsUsd];
  const upfront = values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    ? values.reduce((total, value) => total + value, 0) : null;
  const syntheticDefault = ['quantity', 'remainingBuyerConsiderationUsd', 'ownershipFraction', 'kappa', 'pGeo', 'price', 'annualGrowthRate'].every((key) => controls[key] === syntheticProfile[key]);
  const content = <>
    <p><strong>{syntheticDefault ? 'Synthetic larger-contract profile' : 'Custom assumed exposure'}</strong>. Selected quantity {typeof controls.quantity === 'number' ? controls.quantity.toLocaleString('en-US', { maximumFractionDigits: 1 }) : 'unavailable'} oz. Buyer consideration {typeof controls.remainingBuyerConsiderationUsd === 'number' ? controls.remainingBuyerConsiderationUsd.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'unavailable'}.</p>
    <p>The default quantity and buyer consideration scale an earlier invented example once by {syntheticProfile.scaleFactor.toLocaleString('en-US', { maximumFractionDigits: 4 })}. They are not measured resources or an independently validated valuation. Editing the premium does not change exposure or forecast.</p>
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
