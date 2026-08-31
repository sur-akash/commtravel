/* =============================================================================
   Destination search.

   One index, two consumers: the register-trip flow ("where are you going?") and
   the cash locator ("show me ATMs in…"). Both search the same cities, so a
   place you can register a trip to is a place you can find cash in.

   Cities come from src/data/globe.js — the same weighted set that drives the
   live globe — plus the neighbourhoods of the demo's own destination, because
   somebody looking for an ATM searches "Shibuya", not "Tokyo".
   ============================================================================= */

import { WORLD_CITIES, WORLD_CURRENCIES } from './globe.js'
import { TMC_CURRENCIES } from './fx.js'

/**
 * Neighbourhood-level entries for the trip destination. These resolve to a
 * point inside the city rather than to the city centre.
 */
const LOCALITIES = [
  { name: 'Shibuya', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.658, lon: 139.7016, currency: 'JPY' },
  { name: 'Shinjuku', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6896, lon: 139.7006, currency: 'JPY' },
  { name: 'Harajuku', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6702, lon: 139.7027, currency: 'JPY' },
  { name: 'Ginza', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6717, lon: 139.765, currency: 'JPY' },
  { name: 'Asakusa', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.7118, lon: 139.7967, currency: 'JPY' },
  { name: 'Ebisu', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6467, lon: 139.71, currency: 'JPY' },
  { name: 'Daikanyama', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6485, lon: 139.7031, currency: 'JPY' },
  { name: 'Nakameguro', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6441, lon: 139.6989, currency: 'JPY' },
  { name: 'Omotesandō', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6654, lon: 139.7124, currency: 'JPY' },
  { name: 'Roppongi', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6627, lon: 139.7314, currency: 'JPY' },
  { name: 'Toyosu', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6549, lon: 139.7967, currency: 'JPY' },
  { name: 'Yoyogi', parent: 'Tokyo', cc: 'JPN', country: 'Japan', lat: 35.6693, lon: 139.6907, currency: 'JPY' },
]

/** Everything searchable, in one flat list. */
export const DESTINATIONS = [
  ...WORLD_CITIES.map((city) => ({
    id: `${city.cc}-${city.name}`,
    kind: 'city',
    name: city.name,
    country: city.country,
    cc: city.cc,
    lat: city.lat,
    lon: city.lon,
    currency: city.currency,
    weight: city.weight ?? 1,
  })),
  ...LOCALITIES.map((place) => ({
    id: `loc-${place.name}`,
    kind: 'locality',
    name: place.name,
    parent: place.parent,
    country: place.country,
    cc: place.cc,
    lat: place.lat,
    lon: place.lon,
    currency: place.currency,
    weight: 6,
  })),
]

/** Countries, derived from the cities so the two can never disagree. */
export const COUNTRIES = Object.values(
  DESTINATIONS.filter((d) => d.kind === 'city').reduce((acc, city) => {
    if (!acc[city.cc]) {
      acc[city.cc] = {
        id: `country-${city.cc}`,
        kind: 'country',
        name: city.country,
        country: city.country,
        cc: city.cc,
        currency: city.currency,
        // A country resolves to its heaviest city — the one Australians
        // actually go to, which for Indonesia is Bali, not Jakarta.
        lat: city.lat,
        lon: city.lon,
        weight: city.weight,
      }
    } else if (city.weight > acc[city.cc].weight) {
      acc[city.cc].lat = city.lat
      acc[city.cc].lon = city.lon
      acc[city.cc].weight = city.weight
    }
    return acc
  }, {})
)

const SEARCHABLE = [...DESTINATIONS, ...COUNTRIES]

/**
 * What people actually type. Nobody searches "Denpasar" — they search "Bali".
 * Keyed by the city or country name the alias should resolve to.
 */
const ALIASES = {
  Denpasar: ['bali', 'kuta', 'ngurah rai'],
  Ubud: ['bali'],
  Seminyak: ['bali'],
  'Ho Chi Minh City': ['saigon', 'hcmc'],
  'New York': ['nyc', 'manhattan', 'brooklyn'],
  'Los Angeles': ['la', 'hollywood'],
  'United Kingdom': ['uk', 'britain', 'great britain', 'england'],
  'United States': ['usa', 'us', 'america'],
  Netherlands: ['holland'],
  'Türkiye': ['turkey'],
  'Hong Kong': ['hk'],
  Nadi: ['fiji'],
  Denarau: ['fiji'],
  Queenstown: ['south island'],
  Niseko: ['hokkaido', 'ski japan'],
  Phuket: ['patong'],
  'Kuala Lumpur': ['kl'],
  Malé: ['maldives'],
  Reykjavík: ['reykjavik', 'iceland'],
  Zürich: ['zurich'],
  'Omotesandō': ['omotesando'],
  UAE: ['dubai', 'emirates'],
  Czechia: ['czech republic', 'prague'],
}

const aliasesFor = (item) => [...(ALIASES[item.name] ?? []), ...(ALIASES[item.country] ?? [])]

/** Strip accents so "Omotesando" finds "Omotesandō". */
const normalise = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/**
 * Rank matches: a name that starts with the query beats one that merely
 * contains it, and a heavier destination beats a lighter one on a tie.
 */
export function searchDestinations(query, { limit = 8, kinds } = {}) {
  const q = normalise(query)
  const pool = kinds ? SEARCHABLE.filter((item) => kinds.includes(item.kind)) : SEARCHABLE

  if (!q) {
    return [...pool]
      .filter((item) => item.kind !== 'locality')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
  }

  const scored = []
  for (const item of pool) {
    const name = normalise(item.name)
    const country = normalise(item.country ?? '')
    const cc = normalise(item.cc ?? '')

    const aliases = aliasesFor(item)

    let score = 0
    if (name === q) score = 1000
    else if (name.startsWith(q)) score = 700
    else if (aliases.some((alias) => alias === q)) score = 650
    else if (country.startsWith(q)) score = 500
    else if (cc === q) score = 480
    else if (aliases.some((alias) => alias.startsWith(q))) score = 420
    else if (name.includes(q)) score = 300
    else if (country.includes(q)) score = 200
    else continue

    // Countries float above their own cities when the query names the country.
    if (item.kind === 'country') score += 40
    scored.push({ item, score: score + Math.min(item.weight, 40) })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item)
}

/** A one-line description for a result row. */
export function describeDestination(item) {
  if (item.kind === 'country') return 'Country'
  if (item.kind === 'locality') return `${item.parent}, ${item.country}`
  return item.country
}

/** Whether the Travel Money Card can hold this destination's currency. */
export function isCurrencySupported(currency) {
  return TMC_CURRENCIES.includes(currency)
}

export function currencyName(code) {
  return WORLD_CURRENCIES[code] ? code : code
}
