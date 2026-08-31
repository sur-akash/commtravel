/* =============================================================================
   The map underneath the ATM locator.

   There is no tile service here, by design — the brief rules out network calls,
   and a bank's cash-finder shouldn't need one to draw. So the streets are
   GENERATED: a seeded procedural network laid out in metres around a real
   centre point, then converted to latitude and longitude so it projects like
   any other geography.

   That choice is deliberate rather than lazy. A hand-drawn map is fixed at one
   zoom and one place; this one has real coordinates, so it pans, zooms and
   scales correctly, and swapping in a real vector source later means replacing
   this file and nothing else.

   It is a plausible city, not Shibuya. The ATMs on top of it are placed at
   their real coordinates, and the UI says as much.

   Everything is a function of a CENTRE and a SEED, so searching for another
   city regenerates the streets around it — deterministically, the same layout
   every time you go back. Tokyo keeps a curated list of real cash points;
   anywhere else gets plausible ones drawn from the operators that actually
   dominate that country.
   ============================================================================= */

import { mulberry32, range, intRange } from './rng.js'

const CITY_SEED = 448211

/** Shibuya Station. Everything is generated around this point. */
export const MAP_CENTRE = { lat: 35.658, lon: 139.7016 }

export const MAP_ZOOM = { min: 13, max: 18, initial: 15.6 }

/** Metres → degrees. Longitude compresses with latitude, so it takes the centre. */
const M_PER_DEG_LAT = 110574
const metresPerDegLon = (lat) => 111320 * Math.cos((lat * Math.PI) / 180)

const makeToLatLon = (centre) => {
  const perLon = metresPerDegLon(centre.lat)
  return (east, north) => ({
    lat: centre.lat + north / M_PER_DEG_LAT,
    lon: centre.lon + east / perLon,
  })
}

/* -----------------------------------------------------------------------------
   Generation
   -------------------------------------------------------------------------- */

const EXTENT = 2600 // metres from centre, in each direction

/** Smooth a polyline so generated roads bend rather than kink. */
function smooth(points, passes = 2) {
  let result = points
  for (let pass = 0; pass < passes; pass++) {
    const next = [result[0]]
    for (let i = 1; i < result.length - 1; i++) {
      next.push([
        (result[i - 1][0] + result[i][0] * 2 + result[i + 1][0]) / 4,
        (result[i - 1][1] + result[i][1] * 2 + result[i + 1][1]) / 4,
      ])
    }
    next.push(result[result.length - 1])
    result = next
  }
  return result
}

function buildNetwork(centre, seed) {
  const toLatLon = makeToLatLon(centre)
  const rng = mulberry32(seed)
  const roads = []

  const push = (points, kind, name) => {
    roads.push({
      kind,
      name,
      path: smooth(points).map(([east, north]) => toLatLon(east, north)),
    })
  }

  /* --- Arterials: long routes wandering through the centre ---------------- */
  const arterialCount = 7
  for (let i = 0; i < arterialCount; i++) {
    const angle = (i / arterialCount) * Math.PI + range(rng, -0.2, 0.2)
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    // Offset so they don't all cross at exactly the same point.
    const offsetX = range(rng, -320, 320)
    const offsetY = range(rng, -320, 320)

    const points = []
    for (let t = -EXTENT; t <= EXTENT; t += 220) {
      const wobble = Math.sin(t / 700 + i) * range(rng, 40, 110)
      points.push([offsetX + dx * t - dy * wobble, offsetY + dy * t + dx * wobble])
    }
    push(points, 'arterial', null)
  }

  /* --- Secondary streets: a warped grid ----------------------------------- */
  const gridAngle = range(rng, -0.35, 0.35)
  const cos = Math.cos(gridAngle)
  const sin = Math.sin(gridAngle)
  const spacing = 115

  for (let axis = 0; axis < 2; axis++) {
    for (let offset = -EXTENT; offset <= EXTENT; offset += spacing) {
      const jitter = range(rng, -34, 34)
      const points = []
      for (let t = -EXTENT; t <= EXTENT; t += 150) {
        const wobble = Math.sin(t / 420 + offset / 300) * 26
        const a = offset + jitter + wobble
        const [east, north] = axis === 0 ? [t, a] : [a, t]
        points.push([east * cos - north * sin, east * sin + north * cos])
      }
      push(points, 'street', null)
    }
  }

  /* --- Lanes: short connectors, only drawn when zoomed in ----------------- */
  const laneCount = 320
  for (let i = 0; i < laneCount; i++) {
    const east = range(rng, -EXTENT * 0.8, EXTENT * 0.8)
    const north = range(rng, -EXTENT * 0.8, EXTENT * 0.8)
    const angle = range(rng, 0, Math.PI * 2)
    const length = range(rng, 70, 210)
    push(
      [
        [east, north],
        [east + Math.cos(angle) * length, north + Math.sin(angle) * length],
      ],
      'lane',
      null
    )
  }

  return roads
}

/** The rail line and its station — the landmark that orients the map. */
function buildRail(centre) {
  const toLatLon = makeToLatLon(centre)
  const points = []
  for (let t = -EXTENT; t <= EXTENT; t += 200) {
    points.push([t * 0.28 + Math.sin(t / 900) * 190, t])
  }
  return {
    path: smooth(points, 3).map(([east, north]) => toLatLon(east, north)),
    station: toLatLon(0, 0),
  }
}

/** A couple of green blobs, because a city map without parks reads as a circuit. */
function buildParks(centre, seed) {
  const toLatLon = makeToLatLon(centre)
  const rng = mulberry32(seed ^ 0x9e37)
  const seeds = [
    { east: -760, north: 620, radius: 430 },
    { east: 880, north: -540, radius: 300 },
    { east: -420, north: -980, radius: 220 },
  ]

  return seeds.map(({ east, north, radius }) => {
    const points = []
    const steps = 26
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const r = radius * range(rng, 0.72, 1.25)
      points.push([east + Math.cos(angle) * r, north + Math.sin(angle) * r])
    }
    return smooth(points, 2).map(([e, n]) => toLatLon(e, n))
  })
}

/**
 * A whole generated city. Cached per centre so panning and re-selecting the
 * same place doesn't rebuild several thousand polyline points.
 */
const cityCache = new Map()

export function buildCity(centre, key = 'default') {
  if (cityCache.has(key)) return cityCache.get(key)

  // Seed from the key so each place gets its own layout, the same one every time.
  let seed = CITY_SEED
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0

  const city = {
    roads: buildNetwork(centre, seed),
    rail: buildRail(centre),
    parks: buildParks(centre, seed),
  }
  cityCache.set(key, city)
  return city
}

/* -----------------------------------------------------------------------------
   Cash points

   Real coordinates around Shibuya. `surchargeLocal` is the operator's own fee,
   which is the number the locator exists to surface — CommBank's AUD $3.50 is
   the same wherever you go, but this one is not, and nothing tells you before
   you walk there.
   -------------------------------------------------------------------------- */

export const CASH_POINTS = [
  {
    id: 'seven-centergai',
    name: '7-Eleven ATM',
    detail: 'Shibuya Center-gai',
    lat: 35.6595,
    lon: 139.6985,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'japan-post',
    name: 'Japan Post Bank ATM',
    detail: 'Shibuya Post Office',
    lat: 35.6612,
    lon: 139.704,
    open: '09:00 – 19:00',
    surchargeLocal: 0,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'aeon-hikarie',
    name: 'AEON Bank ATM',
    detail: 'Shibuya Hikarie B2',
    lat: 35.6591,
    lon: 139.7038,
    open: '07:00 – 23:00',
    surchargeLocal: 0,
    accepts: ['Visa'],
    type: 'atm',
  },
  {
    id: 'familymart-dogenzaka',
    name: 'FamilyMart / E-net ATM',
    detail: 'Dōgenzaka',
    lat: 35.6565,
    lon: 139.696,
    open: '24 hours',
    surchargeLocal: 330,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'mufg-shibuya',
    name: 'MUFG Bank',
    detail: 'Partner branch, Shibuya',
    lat: 35.6604,
    lon: 139.7003,
    open: '09:00 – 15:00',
    surchargeLocal: 0,
    accepts: ['Visa', 'Mastercard'],
    type: 'branch',
  },
  {
    id: 'seven-hachiko',
    name: '7-Eleven ATM',
    detail: 'Hachikō exit',
    lat: 35.6586,
    lon: 139.7005,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'lawson-jinnan',
    name: 'Lawson ATM',
    detail: 'Jinnan 1-chōme',
    lat: 35.6626,
    lon: 139.6995,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'smbc-shibuya',
    name: 'SMBC',
    detail: 'Partner branch, Shibuya',
    lat: 35.6572,
    lon: 139.7024,
    open: '09:00 – 15:00',
    surchargeLocal: 0,
    accepts: ['Visa', 'Mastercard'],
    type: 'branch',
  },
  {
    id: 'seven-ebisu',
    name: '7-Eleven ATM',
    detail: 'Ebisu Nishi',
    lat: 35.6489,
    lon: 139.7,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'japan-post-harajuku',
    name: 'Japan Post Bank ATM',
    detail: 'Harajuku',
    lat: 35.6703,
    lon: 139.7027,
    open: '09:00 – 21:00',
    surchargeLocal: 0,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'aeon-daikanyama',
    name: 'AEON Bank ATM',
    detail: 'Daikanyama',
    lat: 35.6485,
    lon: 139.7031,
    open: '08:00 – 22:00',
    surchargeLocal: 0,
    accepts: ['Visa'],
    type: 'atm',
  },
  {
    id: 'familymart-omotesando',
    name: 'FamilyMart / E-net ATM',
    detail: 'Omotesandō',
    lat: 35.6654,
    lon: 139.7124,
    open: '24 hours',
    surchargeLocal: 330,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'mizuho-aoyama',
    name: 'Mizuho Bank',
    detail: 'Partner branch, Aoyama',
    lat: 35.6664,
    lon: 139.7181,
    open: '09:00 – 15:00',
    surchargeLocal: 0,
    accepts: ['Visa', 'Mastercard'],
    type: 'branch',
  },
  {
    id: 'seven-nakameguro',
    name: '7-Eleven ATM',
    detail: 'Nakameguro',
    lat: 35.6441,
    lon: 139.6989,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
  {
    id: 'lawson-yoyogi',
    name: 'Lawson ATM',
    detail: 'Yoyogi-Hachiman',
    lat: 35.6693,
    lon: 139.6907,
    open: '24 hours',
    surchargeLocal: 220,
    accepts: ['Visa', 'Mastercard'],
    type: 'atm',
  },
]

/* -----------------------------------------------------------------------------
   Cash points anywhere else

   Searching a city you aren't in should still show you something useful, so
   these are generated — but from the operators that genuinely dominate each
   country, with surcharges in the right ballpark and the right currency. A
   generic "Partner ATM" everywhere would be less honest, not more.
   -------------------------------------------------------------------------- */

/** [name, typical surcharge in local currency]. 0 means the operator takes nothing. */
const OPERATORS = {
  JPN: [['7-Eleven ATM', 220], ['FamilyMart / E-net ATM', 330], ['Japan Post Bank ATM', 0], ['AEON Bank ATM', 0], ['Lawson ATM', 220]],
  GBR: [['Barclays', 0], ['HSBC', 0], ['NatWest', 0], ['Link ATM', 0], ['Cardtronics ATM', 195]],
  USA: [['Chase', 300], ['Bank of America', 300], ['Wells Fargo', 300], ['Allpoint ATM', 0], ['7-Eleven ATM', 275]],
  IDN: [['BCA', 0], ['Bank Mandiri', 0], ['BNI', 25000], ['BRI', 25000], ['CIMB Niaga', 25000]],
  THA: [['Bangkok Bank', 220], ['Kasikornbank', 220], ['SCB', 220], ['Krungsri', 220], ['TMBThanachart', 220]],
  NZL: [['ANZ', 0], ['ASB', 0], ['Westpac NZ', 0], ['Kiwibank', 0], ['BNZ', 0]],
  SGP: [['DBS', 0], ['OCBC', 0], ['UOB', 0], ['POSB', 0]],
  FRA: [['BNP Paribas', 0], ['Société Générale', 0], ['Crédit Agricole', 0], ['LCL', 0]],
  ITA: [['Intesa Sanpaolo', 0], ['UniCredit', 0], ['BPER Banca', 0], ['Euronet ATM', 4]],
  ESP: [['CaixaBank', 0], ['BBVA', 0], ['Santander', 0], ['Euronet ATM', 4]],
  DEU: [['Deutsche Bank', 0], ['Commerzbank', 0], ['Sparkasse', 0], ['Euronet ATM', 4]],
  VNM: [['Vietcombank', 55000], ['BIDV', 55000], ['Techcombank', 55000], ['VPBank', 55000]],
  IND: [['State Bank of India', 0], ['HDFC Bank', 0], ['ICICI Bank', 0], ['Axis Bank', 0]],
  ARE: [['Emirates NBD', 0], ['ADCB', 0], ['Mashreq', 0], ['FAB', 0]],
  MYS: [['Maybank', 0], ['CIMB', 0], ['Public Bank', 0], ['RHB', 0]],
  KOR: [['KB Kookmin', 3600], ['Shinhan Bank', 3600], ['Woori Bank', 3600], ['CU ATM', 3600]],
  HKG: [['HSBC', 0], ['Hang Seng Bank', 0], ['Bank of China (HK)', 0], ['JETCO ATM', 0]],
  FJI: [['ANZ Fiji', 0], ['BSP', 0], ['Westpac Fiji', 0], ['HFC Bank', 0]],
  DEFAULT: [['Partner bank ATM', 0], ['Local bank ATM', 0], ['Independent ATM', 0], ['Airport ATM', 0]],
}

/** Rough surcharge scale for a currency we have no operator list for. */
const FALLBACK_SURCHARGE_AUD = 3

export function buildCashPoints(centre, key, { cc, currency, perAud = 1 } = {}) {
  // Tokyo is curated: real machines, real coordinates.
  if (key === 'tokyo') return CASH_POINTS

  let seed = 0x51ed
  for (let i = 0; i < key.length; i++) seed = (seed * 33 + key.charCodeAt(i)) >>> 0
  const rng = mulberry32(seed)
  const toLatLon = makeToLatLon(centre)

  const known = OPERATORS[cc]
  const operators = known ?? OPERATORS.DEFAULT
  const points = []
  const count = intRange(rng, 9, 14)

  for (let i = 0; i < count; i++) {
    const [name, surcharge] = operators[Math.floor(rng() * operators.length)]
    // Clustered near the centre, thinning out — how ATMs actually distribute.
    const distance = Math.exp(range(rng, Math.log(120), Math.log(1900)))
    const angle = range(rng, 0, Math.PI * 2)
    const { lat, lon } = toLatLon(Math.cos(angle) * distance, Math.sin(angle) * distance)
    const isBranch = !name.includes('ATM')

    points.push({
      id: `gen-${key}-${i}`,
      name,
      detail: isBranch ? 'Partner branch' : 'Cash machine',
      lat,
      lon,
      open: isBranch ? '09:00 – 16:00' : rng() > 0.35 ? '24 hours' : '07:00 – 23:00',
      // A named operator listed at zero IS zero — inventing a fee for Barclays
      // would contradict the data. Only the unknown-country fallback rolls one.
      surchargeLocal:
        surcharge > 0
          ? surcharge
          : known || rng() > 0.4
            ? 0
            : Math.round(FALLBACK_SURCHARGE_AUD * perAud),
      accepts: rng() > 0.2 ? ['Visa', 'Mastercard'] : ['Visa'],
      type: isBranch ? 'branch' : 'atm',
    })
  }

  return points
}
