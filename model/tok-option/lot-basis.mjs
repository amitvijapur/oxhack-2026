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

const REFERENCE_UNIT = Object.freeze({ initialPremiumUsd: 650, quantity: 500, remainingBuyerConsiderationUsd: 4000, entryFeeUsd: 50, exitFeeUsd: 50 });
const EXPOSURE_SCALE = 30000 / REFERENCE_UNIT.initialPremiumUsd;

/** Frozen invented exposure, not a valuation inferred from a historical payment. */
export const SYNTHETIC_LOT_PROFILE = Object.freeze({
  id: 'synthetic-same-interest-whole-contract-v1', provenance: 'assumed', currency: 'USD', unit: 'whole_contract',
  referenceUnit: REFERENCE_UNIT, initialPremiumUsd: 30000, scaleFactor: EXPOSURE_SCALE,
  quantity: REFERENCE_UNIT.quantity * EXPOSURE_SCALE, quantityUnit: 'troy_oz',
  remainingBuyerConsiderationUsd: REFERENCE_UNIT.remainingBuyerConsiderationUsd * EXPOSURE_SCALE,
  ownershipFraction: 0.5, kappa: 0.02, pGeo: 0.25, price: 2000, annualGrowthRate: 0,
  assumption: 'One synthetic whole-contract interest retains the invented reference unit economics by scaling both quantity and remaining buyer consideration. The scale is frozen; editing the premium does not change exposure or assignment value.',
  limitations: Object.freeze([
    'The reference unit and its premium-to-exposure ratio are invented arithmetic assumptions, not evidence of mispricing, resources, fair value or attainable returns.',
    'The historical USD 30,000 initial-payment reference does not establish this quantity, buyer consideration or assignment price. This is not the valuation of Tibbs or Northway.',
    'The scale factor is not a number of tradable contracts. This example remains one indivisible assumed interest.',
    'Fixed USD 50 fees are a separate assumption. Proportionally scaled reference fees preserve the original arithmetic return and can exceed the approved risk limit.',
    'Assignment consent, real obligations, resources, sale probability and exit prices remain unverified. No observed market outcome calibrates this profile.',
  ]),
});

export function exposureContext(controls) {
  const selectedInputs = Object.fromEntries(['quantity', 'remainingBuyerConsiderationUsd', 'ownershipFraction', 'kappa', 'pGeo', 'price', 'annualGrowthRate'].map((key) => [key, controls[key]]));
  return {
    ...SYNTHETIC_LOT_PROFILE,
    selectionKind: Object.entries(selectedInputs).every(([key, value]) => value === SYNTHETIC_LOT_PROFILE[key]) ? 'default_synthetic_profile' : 'custom_assumed_exposure',
    selectedInputs,
  };
}

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
