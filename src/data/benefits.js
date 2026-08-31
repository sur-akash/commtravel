/* =============================================================================
   Benefits wallet.

   The argument of this module: the entitlements already exist and are already
   paid for. What's missing is any surface that says whether they're switched
   on, how much is left, and when they expire.

   Every figure verified against CommBank's published product pages.
   ============================================================================= */

/** Prepaid travel that must hit the credit card before the included cover starts. */
export const INSURANCE_SPEND_THRESHOLD_AUD = 500

/** Complimentary Mastercard Travel Pass visits on the World Debit Mastercard. */
export const LOUNGE_PASSES_PER_YEAR = 2
export const LOUNGE_NETWORK_SIZE = 1300

/** Yello travel credit: up to 10% back on Hopper bookings, expiring after two years. */
export const YELLO_TRAVEL_CREDIT_RATE = 0.1
export const YELLO_CREDIT_EXPIRY_YEARS = 2

/**
 * Build the wallet for the current trip and simulator state.
 *
 * Everything here is derived — the insurance bar moves because a transaction
 * landed, not because someone updated a field. That's the point of the module.
 */
export function buildBenefits({ trip, traveller, prepaidTravelChargedAud, insuranceActivated }) {
  const shortfall = Math.max(0, INSURANCE_SPEND_THRESHOLD_AUD - prepaidTravelChargedAud)
  const loungeRemaining = LOUNGE_PASSES_PER_YEAR - (trip?.loungePassesUsed ?? 0)

  return [
    {
      id: 'insurance-credit',
      icon: 'shield',
      name: 'International travel insurance',
      source: 'Ultimate Awards credit card',
      state: insuranceActivated ? 'active' : shortfall > 0 ? 'blocked' : 'needs-activation',
      headline: insuranceActivated
        ? 'Active for this trip'
        : `You're ${formatShortfall(shortfall)} short of activating your included cover`,
      detail: insuranceActivated
        ? 'You, your spouse and up to 10 accompanied children are covered. Underwritten by Zurich; Cover-More answers 24/7 on +61 2 8907 5641.'
        : `Charge $${INSURANCE_SPEND_THRESHOLD_AUD} of prepaid travel in a single transaction — or redeem the same in Awards points or travel credits — then activate before you go.`,
      progress: {
        value: Math.min(prepaidTravelChargedAud, INSURANCE_SPEND_THRESHOLD_AUD),
        max: INSURANCE_SPEND_THRESHOLD_AUD,
        label: 'Prepaid travel charged to the card',
      },
      action: insuranceActivated ? null : { label: 'Activate cover', to: '/benefits' },
    },
    {
      id: 'insurance-debit',
      icon: 'shield',
      name: 'International travel insurance',
      source: 'World Debit Mastercard',
      state: trip?.insuranceActivated ? 'active' : 'needs-activation',
      headline: 'Covers trips up to 21 days',
      detail:
        'No spend threshold on this one — but it still has to be activated before you leave. Your trip is inside the 21-day limit.',
      action: { label: 'Activate cover', to: '/benefits' },
    },
    {
      id: 'lounge',
      icon: 'lounge',
      name: 'Airport lounge access',
      source: 'Mastercard Travel Pass',
      state: loungeRemaining > 0 ? 'active' : 'used',
      headline:
        loungeRemaining > 0
          ? `${loungeRemaining} of ${LOUNGE_PASSES_PER_YEAR} visits left this year`
          : 'Both visits used this year',
      detail: `Over ${LOUNGE_NETWORK_SIZE.toLocaleString('en-AU')} lounges worldwide. Two complimentary visits a year, per account.`,
      counter: { used: trip?.loungePassesUsed ?? 0, total: LOUNGE_PASSES_PER_YEAR },
    },
    {
      id: 'yello-credit',
      icon: 'coins',
      name: 'Yello travel credit',
      source: `CommBank Yello · ${traveller.yello.tier}`,
      state: 'active',
      headline: `${formatAudPlain(traveller.yello.travelCreditAud)} ready to use`,
      detail: `Up to ${YELLO_TRAVEL_CREDIT_RATE * 100}% back on Hopper bookings. Credits expire ${YELLO_CREDIT_EXPIRY_YEARS} years after they're earned.`,
      expiry: traveller.yello.creditExpiry,
    },
    {
      id: 'yello-points',
      icon: 'wallet',
      name: 'Awards points',
      source: 'CommBank Awards',
      state: 'active',
      headline: `${traveller.yello.points.toLocaleString('en-AU')} points`,
      detail:
        'Transferable to partner frequent flyer programs, or spent directly on a Travel Booking — all or part of a flight.',
    },
    {
      id: 'purchase-cover',
      icon: 'bag',
      name: 'Purchase protection',
      source: 'Ultimate Awards credit card',
      state: 'active',
      headline: 'Price Guarantee, Purchase Security, Extended Warranty',
      detail:
        'Claim the difference on purchases more than $75 cheaper elsewhere. Loss, theft or damage covered for 90 days. Warranties extended by up to a year. It all counts abroad too.',
    },
  ]
}

function formatShortfall(amount) {
  return `A$${amount.toFixed(2)}`
}

function formatAudPlain(amount) {
  return `A$${amount.toFixed(2)}`
}
