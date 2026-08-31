/* =============================================================================
   Trip state — the spine of the product.

   Today CommBank collects your destination and dates through NetBank purely so
   its fraud rules don't decline you, and hands nothing back. Here that same
   registration becomes an object the whole portal reacts to.

   Three demo states, switchable from the home page:
     'none'     — no trip registered
     'upcoming' — Tokyo, departing in 18 days
     'active'   — in Tokyo, day 4 of 9

   Dates are computed relative to load, so the demo never goes stale.
   ============================================================================= */

const DAY = 86400000

/** Midday local, so timezone maths can never tip a date over a boundary. */
function dayOffset(days, base = Date.now()) {
  const date = new Date(base + days * DAY)
  date.setHours(12, 0, 0, 0)
  return date
}

export const TRIP_LENGTH_DAYS = 9
export const ACTIVE_TRIP_DAY = 4
export const UPCOMING_TRIP_COUNTDOWN = 18

/** The traveller and what CommBank already knows about them. This is the point:
    every checklist item below is answered from data the bank already holds. */
export const TRAVELLER = {
  firstName: 'Alex',
  lastName: 'Nguyen',
  homeCurrency: 'AUD',
  passport: {
    number: 'PA••••417',
    expiry: dayOffset(940), // comfortably valid — the checklist proves it
    country: 'Australia',
  },
  yello: {
    // Yello's real tiers are Plus, Gold and Diamond.
    tier: 'Diamond',
    points: 18420,
    travelCreditAud: 64.5,
    creditExpiry: dayOffset(610),
  },
}

/** The cards in the wallet. Fees and benefits verified against CommBank's
    published product pages — see cards.js for the full comparison data. */
export const CARDS = [
  {
    id: 'tmc',
    name: 'Travel Money Card',
    scheme: 'Visa',
    last4: '4417',
    expiry: dayOffset(720),
    status: 'active',
    isPrimaryForTrip: true,
  },
  {
    id: 'tmc-backup',
    name: 'Travel Money Card — backup',
    scheme: 'Visa',
    last4: '4425',
    expiry: dayOffset(720),
    status: 'inactive', // issued with the pair, never activated. Surface it.
    isBackup: true,
    note: 'Issued with your card. Keep it somewhere separate from your wallet.',
  },
  {
    id: 'wdm',
    name: 'World Debit Mastercard',
    scheme: 'Mastercard',
    last4: '9902',
    expiry: dayOffset(455),
    status: 'active',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Awards credit card',
    scheme: 'Mastercard',
    last4: '5531',
    expiry: dayOffset(1180),
    status: 'active',
  },
]

/** Localised emergency contacts, swapped in per destination.
    CommBank numbers verified from commbank.com.au/support/overseas.html. */
export const EMERGENCY_CONTACTS = {
  JP: {
    country: 'Japan',
    police: { label: 'Police', number: '110' },
    ambulance: { label: 'Fire and ambulance', number: '119' },
    embassy: {
      label: 'Australian Embassy, Tokyo',
      number: '+81 3 5232 4111',
      address: '2-1-14 Mita, Minato-ku, Tokyo',
    },
  },
  DEFAULT: {
    country: 'Overseas',
    police: { label: 'Local emergency', number: '112' },
    ambulance: { label: 'Local emergency', number: '112' },
    embassy: {
      label: 'Australian consular emergency centre',
      number: '+61 2 6261 3305',
    },
  },
}

/** CommBank's own always-on lines. These are the real published numbers. */
export const CBA_CONTACTS = {
  overseas: {
    label: 'CommBank, 24/7 from overseas',
    number: '+61 2 9999 3283',
    note: 'Reverse the charges through the local international operator from any landline.',
  },
  travelMoneyCardAu: {
    label: 'Travel Money Card, from Australia',
    number: '1300 660 700',
  },
  coverMore: {
    label: 'Cover-More emergency assistance, 24/7',
    number: '+61 2 8907 5641',
  },
}

const TOKYO = {
  city: 'Tokyo',
  country: 'Japan',
  countryCode: 'JP',
  currency: 'JPY',
  timezone: 'Asia/Tokyo',
  utcOffset: '+9',
}

/**
 * The three demo states. `dates` are derived at module load.
 */
export const TRIP_STATES = {
  none: {
    id: 'none',
    label: 'No trip',
    shortLabel: 'No trip',
    description: 'Nothing registered. This is what most customers see today.',
    trip: null,
  },

  upcoming: {
    id: 'upcoming',
    label: `Trip in ${UPCOMING_TRIP_COUNTDOWN} days`,
    shortLabel: 'In 18 days',
    description: 'Registered and counting down. The checklist fills itself in.',
    trip: {
      id: 'trip-tokyo-upcoming',
      status: 'upcoming',
      destination: TOKYO,
      departure: dayOffset(UPCOMING_TRIP_COUNTDOWN),
      return: dayOffset(UPCOMING_TRIP_COUNTDOWN + TRIP_LENGTH_DAYS - 1),
      lengthDays: TRIP_LENGTH_DAYS,
      travellers: 2,
      budgetAud: 1200,
      currencyLoaded: true, // locked 18 days out — the whole point of the product
      insuranceActivated: false,
      prepaidTravelChargedAud: 320, // $180 short of the $500 activation threshold
      loungePassesUsed: 0,
      travelModeOn: false,
    },
  },

  active: {
    id: 'active',
    label: `In Tokyo, day ${ACTIVE_TRIP_DAY}`,
    shortLabel: 'Day 4',
    description: 'Mid-trip. The dashboard is live and transactions are landing.',
    trip: {
      id: 'trip-tokyo-active',
      status: 'active',
      destination: TOKYO,
      departure: dayOffset(-(ACTIVE_TRIP_DAY - 1)),
      return: dayOffset(TRIP_LENGTH_DAYS - ACTIVE_TRIP_DAY),
      lengthDays: TRIP_LENGTH_DAYS,
      dayOfTrip: ACTIVE_TRIP_DAY,
      travellers: 2,
      budgetAud: 1200,
      currencyLoaded: true,
      insuranceActivated: false,
      prepaidTravelChargedAud: 320,
      loungePassesUsed: 1,
      travelModeOn: true,
    },
  },
}

export const TRIP_STATE_ORDER = ['none', 'upcoming', 'active']

export const DEFAULT_TRIP_STATE = 'active'

export function getTripState(id) {
  return TRIP_STATES[id] ?? TRIP_STATES[DEFAULT_TRIP_STATE]
}

export function getEmergencyContacts(countryCode) {
  return EMERGENCY_CONTACTS[countryCode] ?? EMERGENCY_CONTACTS.DEFAULT
}

/** Day N of M for an active trip. */
export function tripDay(trip, now = Date.now()) {
  if (!trip) return null
  const elapsed = Math.floor((now - new Date(trip.departure).setHours(0, 0, 0, 0)) / DAY)
  return Math.min(trip.lengthDays, Math.max(1, elapsed + 1))
}

export { dayOffset, DAY }
