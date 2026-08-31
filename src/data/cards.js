/* =============================================================================
   Card products — "which one should I pack for this trip?"

   Every fee and benefit below is taken from CommBank's published product pages,
   not invented. The comparison is the honest one: no single card wins on
   everything, and the recommendation logic says why.

   Sources: commbank.com.au/travel/travel-money-card, /banking/debit-cards/
   world-debit-mastercard, /credit-cards, /travel/travel-insurance.
   ============================================================================= */

export const CARD_PRODUCTS = [
  {
    id: 'tmc',
    name: 'Travel Money Card',
    scheme: 'Visa',
    last4: '4417',
    tagline: 'Lock your rate before you go',
    monthlyFeeAud: 0,
    intlTransactionFeePct: 0,
    overseasAtmFeeAud: 3.5,
    loadFeeAud: 0,
    closureFeeAud: 0,
    inactivityFeeAud: 0,
    ratesLocked: true,
    currencyCount: 16,
    loungePassesPerYear: 0,
    insurance: null,
    crossCurrencyMarkupPct: 3,
    strengths: [
      'Rate locked at load, across 16 currencies',
      'No load, reload, closure or inactivity fee',
      'Emergency cash often the same day',
      'Comes as two cards — keep the spare separate',
    ],
    watchOuts: [
      'AUD $3.50 at overseas ATMs',
      'Visa rate plus 3% if you spend a currency you have not loaded',
    ],
  },
  {
    id: 'wdm',
    name: 'World Debit Mastercard',
    scheme: 'Mastercard',
    last4: '9902',
    tagline: 'No fees, floating rate, your own money',
    monthlyFeeAud: 10,
    intlTransactionFeePct: 0,
    overseasAtmFeeAud: 0,
    loadFeeAud: 0,
    ratesLocked: false,
    currencyCount: null,
    loungePassesPerYear: 2,
    loungeProgram: 'Mastercard Travel Pass',
    loungeNetworkSize: 1300,
    insurance: {
      type: 'included',
      maxDaysPerTrip: 21,
      requiresActivation: true,
      spendThresholdAud: 0,
    },
    strengths: [
      '0% international transaction fee',
      '$0 at any overseas ATM',
      'Two complimentary lounge visits a year',
      'Included international travel insurance, up to 21 days a trip',
    ],
    watchOuts: [
      '$10 a month, whether you travel or not',
      'You take the market rate on the day — no lock',
      'Insurance still has to be activated before you go',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate Awards credit card',
    scheme: 'Mastercard',
    last4: '5531',
    tagline: 'Cover, lounges and points — if you spend enough',
    monthlyFeeAud: 35,
    monthlyFeeWaivedAtAud: 4000,
    intlTransactionFeePct: 0,
    overseasAtmFeeAud: 3.5,
    ratesLocked: false,
    currencyCount: null,
    loungePassesPerYear: 2,
    loungeProgram: 'complimentary airport lounge passes',
    pointsPerDollar: 3,
    insurance: {
      type: 'included',
      requiresActivation: true,
      spendThresholdAud: 500,
      thresholdNote:
        'Spend $500 in a single transaction on prepaid travel, or redeem $500 in Awards points or travel credits',
    },
    strengths: [
      '0% international transaction fee',
      'Included international travel insurance once activated',
      'Two complimentary airport lounge passes each calendar year',
      'Up to 3 Awards points per $1',
    ],
    watchOuts: [
      '$35 a month unless you spend $4,000 in a statement period',
      'Cover only switches on after $500 of prepaid travel',
    ],
  },
  {
    id: 'smart',
    name: 'Smart Awards credit card',
    scheme: 'Mastercard',
    last4: '7708',
    tagline: 'The same cover, a lower bar',
    monthlyFeeAud: 19,
    monthlyFeeWaivedAtAud: 2000,
    intlTransactionFeePct: 0,
    overseasAtmFeeAud: 3.5,
    ratesLocked: false,
    currencyCount: null,
    loungePassesPerYear: 0,
    loungeProgram: 'lounge access available, fee applies',
    pointsPerDollar: 1.5,
    insurance: {
      type: 'included',
      requiresActivation: true,
      spendThresholdAud: 500,
      thresholdNote: 'Same $500 prepaid travel condition as Ultimate Awards',
    },
    strengths: [
      '0% international transaction fee',
      'Included international travel insurance once activated',
      'Up to 1.5 Awards points per $1',
      'Monthly fee waived at $2,000 of spend, not $4,000',
    ],
    watchOuts: ['$19 a month below the spend threshold', 'Lounge access costs extra'],
  },
]

export function getCard(id) {
  return CARD_PRODUCTS.find((card) => card.id === id)
}

/**
 * Which card to pack, given the trip.
 *
 * The logic is deliberately explicit rather than a score: a reader should be
 * able to follow the reason and agree or disagree with it.
 */
export function recommendForTrip({ currencyLoaded, lengthDays }) {
  const reasons = []

  if (currencyLoaded) {
    reasons.push({
      cardId: 'tmc',
      role: 'Pack this one',
      why: 'Your yen is already loaded at a locked rate. Every tap in Japan costs you nothing in fees and nothing in rate movement.',
    })
    reasons.push({
      cardId: 'wdm',
      role: 'Bring as backup',
      why: 'Free at any overseas ATM, and the only card here that works in a currency your Travel Money Card cannot hold.',
    })
  } else {
    reasons.push({
      cardId: 'wdm',
      role: 'Pack this one',
      why: 'Nothing is loaded yet, so the no-fee card is the safe default. $0 international transaction fee and $0 at any ATM.',
    })
    reasons.push({
      cardId: 'tmc',
      role: 'Worth loading',
      why: `Locking your rate before you go removes the one variable you cannot control on a ${lengthDays}-day trip.`,
    })
  }

  reasons.push({
    cardId: 'ultimate',
    role: 'For flights and hotels',
    why: 'Put prepaid travel here and your included cover switches on at $500 — and unlike most credit cards, it charges nothing extra for spending overseas.',
  })

  return reasons
}
