import './contract-lot.css';

const money = (value) => typeof value === 'number' && Number.isFinite(value)
  ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Not available';
const percent = (value) => typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : 'Not available';

/** @param {{ comparison: import('./lib/algorithm-workflow.mjs').AlgorithmFeeComparison | null | undefined, compact?: boolean }} props */
export function FeeSensitivity({ comparison, compact = false }) {
  const fixed = comparison?.fixedFees;
  const proportional = comparison?.proportionalFees;
  if (!fixed || !proportional) return null;
  const content = <>
    <div className="fee-sensitivity-table"><table><caption>Same exposure, premium, signal and sale probability. Different assumed fees.</caption><thead><tr><th>Fee policy</th><th>Entry / exit fee</th><th>Return</th><th>Risk gate</th></tr></thead><tbody>
      <tr><th>Fixed fees</th><td>{money(fixed.entryFeeUsd)} / {money(fixed.exitFeeUsd)}</td><td>{percent(fixed.returnRatio)}</td><td>{fixed.riskGate}</td></tr>
      <tr><th>Proportional reference fees</th><td>{money(proportional.entryFeeUsd)} / {money(proportional.exitFeeUsd)}</td><td>{percent(proportional.returnRatio)}</td><td>{proportional.riskGate}</td></tr>
    </tbody></table></div>
    <p>Keeping fees fixed reduces their share of the larger synthetic contract. The difference comes from this fee assumption, not a predicted edge. Proportional fees use the frozen original scale, not the edited premium.</p>
    <p>Proportional-fee upfront capital is {money(proportional.amountAtRiskUsd)}; decision {proportional.entryAction === 'SKIP' ? 'SKIP' : proportional.entryAction === 'BUY_CANDIDATE' ? 'conditional demo candidate' : 'unavailable'}. The risk gate includes fees.</p>
  </>;
  return compact
    ? <details className="contract-lot fee-sensitivity contract-lot-compact"><summary>Fee sensitivity · {percent(fixed.returnRatio)} vs {percent(proportional.returnRatio)}</summary>{content}</details>
    : <section className="contract-lot fee-sensitivity" aria-label="Fee assumption sensitivity"><h3>What changes when fees scale too?</h3>{content}</section>;
}
