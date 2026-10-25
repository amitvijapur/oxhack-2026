/** A historical payment reference, not a current offer or full contract cost. */
export const LOT_BASIS = Object.freeze({
  id: 'regional-initial-payment-whole-contract-v1',
  currency: 'USD',
  unit: 'whole_contract',
  initialPremiumUsd: 30000,
  referenceKind: 'selected_historical_initial_payments',
  referenceCount: 2,
  sources: Object.freeze([
    Object.freeze({ project: 'Tibbs', label: 'Tectonic 2019 Q2 MD&A, pp4–5', agreementDate: '2017-06', initialPaymentUsd: 30000, url: 'https://www.tectonicmetals.com/_resources/financials/MDA-Q2-2019-FINAL.pdf?v=070606' }),
    Object.freeze({ project: 'Northway', label: 'Tectonic audited 2018 statements, pp17–19', agreementDate: '2018-06', initialPaymentUsd: 30000, url: 'https://www.tectonicmetals.com/_resources/financials/FS-Tectonic-2018YE-AUDITED.pdf?v=090403' }),
  ]),
  limitations: Object.freeze([
    'Two selected historical initial payments from the same acquirer, not a representative current Tok average or an available assignable option.',
    'The reference excludes fees, scholarships, exploration work, recurring payments, royalties and other obligations; it is not full contract capital.',
    'Northway also involved a separate USD 25,000 scholarship and USD 400,000 first-year exploration obligation. These are not included in the initial-payment statistic.',
    'Comparison areas A and B are sample partitions, not legal parcels. No observed assignment resale price or margin is supplied.',
    'Use of the historical payment as a hypothetical option premium does not verify equivalent rights, assignment permission, term or current value.',
  ]),
});

/** Transaction costs remain separate invented demo assumptions. */
export const DEMO_ENTRY_COSTS = Object.freeze({ entryFeeUsd: 50, exitFeeUsd: 50, unavoidableAdditionalObligationsUsd: 0 });

export function lotContext(controls) {
  return {
    ...LOT_BASIS,
    selectedInitialPremiumUsd: controls.entryPremiumUsd,
    selectionKind: controls.entryPremiumUsd === LOT_BASIS.initialPremiumUsd ? 'historical_reference_applied_as_assumption' : 'custom_assumed_premium',
    economicsProvenance: 'assumed',
    entryFeeUsd: controls.entryFeeUsd,
    exitFeeUsd: controls.exitFeeUsd,
    unavoidableAdditionalObligationsUsd: controls.unavoidableAdditionalObligationsUsd,
    additionalCostProvenance: 'assumed',
  };
}
