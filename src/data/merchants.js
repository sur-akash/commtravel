/* =============================================================================
   The Tokyo merchant set.

   Amounts are in yen and sized to be plausible: a Lawson run is under ¥1,500,
   a teamLab ticket is a fixed price, an ATM dispenses in ¥10,000 notes.

   `weight` controls how often each one appears in the feed — konbini runs and
   train fares dominate a real Tokyo day, so they dominate here too.
   `hours` bounds the time of day it can appear, which is what makes the seeded
   day-1-to-3 history read like an actual itinerary rather than noise.
   ============================================================================= */

export const CATEGORIES = {
  convenience: { id: 'convenience', label: 'Convenience', icon: 'store' },
  transport: { id: 'transport', label: 'Transport', icon: 'train' },
  dining: { id: 'dining', label: 'Eating out', icon: 'bowl' },
  retail: { id: 'retail', label: 'Shopping', icon: 'bag' },
  attraction: { id: 'attraction', label: 'Attractions', icon: 'ticket' },
  cash: { id: 'cash', label: 'Cash', icon: 'atm' },
}

export const MERCHANTS = [
  {
    id: 'lawson',
    name: 'Lawson',
    location: 'Shibuya',
    category: 'convenience',
    min: 380,
    max: 1450,
    step: 10,
    weight: 18,
    hours: [0, 24], // konbini are genuinely 24-hour
  },
  {
    id: 'familymart',
    name: 'FamilyMart',
    location: 'Shinjuku',
    category: 'convenience',
    min: 250,
    max: 1280,
    step: 10,
    weight: 12,
    hours: [0, 24],
  },
  {
    id: 'jr-east',
    name: 'JR East ticket machine',
    location: 'Shinjuku Station',
    category: 'transport',
    min: 170,
    max: 1320,
    step: 10,
    weight: 14,
    hours: [6, 23],
  },
  {
    id: 'suica',
    name: 'Suica top-up',
    location: 'Toei Ōedo Line',
    category: 'transport',
    min: 1000,
    max: 3000,
    step: 1000,
    weight: 8,
    hours: [6, 22],
  },
  {
    id: 'ichiran',
    name: 'Ichiran Ramen',
    location: 'Shibuya',
    category: 'dining',
    min: 980,
    max: 2380,
    step: 10,
    weight: 11,
    hours: [11, 23],
  },
  {
    id: 'kissaten',
    name: 'Kissa Ginza',
    location: 'Ginza',
    category: 'dining',
    min: 620,
    max: 1980,
    step: 10,
    weight: 9,
    hours: [8, 18],
  },
  {
    id: 'don-quijote',
    name: 'Don Quijote',
    location: 'Shibuya',
    category: 'retail',
    min: 1240,
    max: 8600,
    step: 10,
    weight: 8,
    hours: [10, 24],
  },
  {
    id: 'uniqlo',
    name: 'Uniqlo Ginza',
    location: 'Ginza',
    category: 'retail',
    min: 1990,
    max: 7990,
    step: 10,
    weight: 6,
    hours: [10, 21],
  },
  {
    id: 'teamlab',
    name: 'teamLab Planets',
    location: 'Toyosu',
    category: 'attraction',
    min: 3800,
    max: 3800,
    step: 100,
    weight: 3,
    hours: [9, 20],
  },
  {
    id: 'taxi',
    name: 'Tokyo MK Taxi',
    location: 'Roppongi',
    category: 'transport',
    min: 740,
    max: 3800,
    step: 10,
    weight: 6,
    hours: [0, 24], // Tokyo taxis run all night
  },
]

/** The ATM used by the injectable withdrawal event. */
export const ATM_MERCHANT = {
  id: 'seven-atm',
  name: '7-Eleven ATM',
  location: 'Asakusa',
  category: 'cash',
  min: 10000,
  max: 30000,
  step: 10000,
  hours: [0, 24],
}

/** Merchants used by specific scripted demo events. */
export const EVENT_MERCHANTS = {
  dcc: {
    id: 'don-quijote-dcc',
    name: 'Don Quijote',
    location: 'Shinjuku',
    category: 'retail',
  },
  declined: {
    id: 'seoul-cafe',
    name: 'Café Onion Anguk',
    location: 'Seoul',
    category: 'dining',
  },
  insurance: {
    id: 'jr-shinkansen',
    name: 'JR Tōkai Shinkansen',
    location: 'Tokyo Station',
    category: 'transport',
  },
  suspicious: {
    id: 'unknown-online',
    name: 'DIGITAL GOODS TYO',
    location: 'Card not present',
    category: 'retail',
  },
}

export function getMerchant(id) {
  return (
    MERCHANTS.find((merchant) => merchant.id === id) ??
    (ATM_MERCHANT.id === id ? ATM_MERCHANT : undefined)
  )
}

export function getCategory(id) {
  return CATEGORIES[id] ?? CATEGORIES.retail
}
