/* =============================================================================
   The worldwide view — every CommBank customer overseas, not just yours.

   Deliberately a separate store from simulator.js. That one is a single trip's
   ledger and has to stay deterministic and inspectable; this one is an ambient
   backdrop that ticks faster, keeps far less history, and feeds the globe.

   Same discipline though: one seeded PRNG, no Math.random, no network.
   ============================================================================= */

import { mulberry32, intRange, range, weightedPick, pick } from './rng.js'
import { WORLD_CITIES, WORLD_CURRENCIES, GLOBAL_CATEGORIES } from './globe.js'
import { TMC_CURRENCIES, STANDARD_CARD_FX_FEE } from './fx.js'

const GLOBAL_SEED = 71042

/** A transaction lands somewhere in the world roughly this often. */
const ARRIVAL_MS = [900, 1900]

/** How many rows the "recent international spending" ticker holds. */
const TICKER_SIZE = 5

/** How long a ping stays lit on the globe. */
export const PING_LIFETIME_MS = 5200

/** Pings older than this are dropped entirely. */
const MAX_PINGS = 90

const DRIVER_MS = 250

/** Baseline for the "countries seen in the last hour" counter. */
const COUNTRY_BASELINE = 114

/** How often that counter re-prices. */
const COUNTRY_DRIFT_MS = 6000

/** A currency counts as "in play" if it has been spent within this window. */
export const CURRENCY_ACTIVE_MS = 12000

/**
 * A day of transactions-per-minute, at hourly resolution. Shaped by the fact
 * that Australians travelling are mostly in Asia and Europe, so the curve
 * troughs when both are asleep and peaks through the European afternoon.
 */
function buildThroughputSeries(rng) {
  const shape = [
    38, 33, 28, 23, 19, 17, 16, 18, 20, 22, 23, 25, 27, 30, 34, 39, 44, 48, 52, 55, 54, 50, 46, 44,
  ]
  return shape.map((value) => Math.round(value + range(rng, -2.5, 2.5)))
}

export function createGlobalFeed({ seed = GLOBAL_SEED } = {}) {
  let listeners = new Set()
  let timer = null
  let snapshot = null

  let rng
  let idCounter = 0
  let ticker
  let pings
  let countryCount
  let throughput
  let accumulator
  let countryAccumulator
  let nextArrival
  let totalToday
  let feesNotChargedAud
  let currencyLastSeen

  function reset() {
    rng = mulberry32(seed)
    idCounter = 0
    ticker = []
    pings = []
    throughput = buildThroughputSeries(rng)
    accumulator = 0
    countryAccumulator = 0
    nextArrival = intRange(rng, ARRIVAL_MS[0], ARRIVAL_MS[1])
    totalToday = intRange(rng, 41200, 43800)

    // Fees a card charging the usual 3% would have taken today, and didn't.
    // Opens partway through the day rather than at zero.
    feesNotChargedAud = range(rng, 386000, 412000)
    currencyLastSeen = {}

    // The country counter is its own figure, not a tally of the ticker. The
    // ticker is a five-row sample of a stream; the counter is every country any
    // customer transacted in this hour, which is far more places than there are
    // cities in this file. Modelling it as a slow drift around the baseline is
    // honest about that, where counting distinct cities would cap it at ~48.
    countryCount = COUNTRY_BASELINE + intRange(rng, 4, 12)

    // Open with a few rows already in the ticker rather than an empty panel.
    for (let i = 0; i < TICKER_SIZE; i++) emit({ silent: true })
  }

  function emit({ silent = false } = {}) {
    const city = weightedPick(rng, WORLD_CITIES)
    const meta = WORLD_CURRENCIES[city.currency] ?? { perAud: 1, decimals: 2 }

    // A long tail: most taps are coffee and trains, a few are hotels.
    const audAmount = Math.exp(range(rng, Math.log(6), Math.log(900)))
    const localAmount = audAmount * meta.perAud

    const transaction = {
      id: `g-${++idCounter}`,
      city: city.name,
      cc: city.cc,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      currency: city.currency,
      localAmount:
        meta.decimals === 0 ? Math.round(localAmount / 10) * 10 : Math.round(localAmount * 100) / 100,
      audAmount,
      category: pick(rng, GLOBAL_CATEGORIES),
      at: Date.now(),
    }

    ticker = [transaction, ...ticker].slice(0, TICKER_SIZE)

    // Only the 16 currencies the Travel Money Card can hold count as "in play".
    // Spending in anything else is exactly the case the card cannot cover, so
    // lighting it here would misrepresent the product.
    if (TMC_CURRENCIES.includes(city.currency)) {
      currencyLastSeen = { ...currencyLastSeen, [city.currency]: Date.now() }
    }

    if (!silent) {
      totalToday += 1
      feesNotChargedAud += transaction.audAmount * STANDARD_CARD_FX_FEE
      pings = [...pings, { id: transaction.id, lat: city.lat, lon: city.lon, born: Date.now() }].slice(
        -MAX_PINGS
      )
    }
    return transaction
  }

  function driver() {
    accumulator += DRIVER_MS
    if (accumulator >= nextArrival) {
      accumulator = 0
      nextArrival = intRange(rng, ARRIVAL_MS[0], ARRIVAL_MS[1])
      emit()
    }

    // Nudge the country counter every few seconds so it reads as live rather
    // than frozen, clamped to a plausible band around the baseline.
    countryAccumulator += DRIVER_MS
    if (countryAccumulator >= COUNTRY_DRIFT_MS) {
      countryAccumulator = 0
      const step = intRange(rng, -1, 1)
      countryCount = Math.max(
        COUNTRY_BASELINE - 4,
        Math.min(COUNTRY_BASELINE + 17, countryCount + step)
      )
    }

    // Retire expired pings so the array can't grow unbounded.
    const cutoff = Date.now() - PING_LIFETIME_MS
    if (pings.length && pings[0].born < cutoff) {
      pings = pings.filter((ping) => ping.born >= cutoff)
    }

    notify()
  }

  function build() {
    const cutoff = Date.now() - CURRENCY_ACTIVE_MS
    const active = TMC_CURRENCIES.filter((code) => (currencyLastSeen[code] ?? 0) > cutoff)

    return {
      ticker,
      pings,
      countryCount,
      countryBaseline: COUNTRY_BASELINE,
      throughput,
      totalToday,
      feesNotChargedAud,
      currencyLastSeen,
      activeCurrencies: active.length,
    }
  }

  function notify() {
    snapshot = build()
    listeners.forEach((listener) => listener(snapshot))
  }

  const api = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      if (timer == null) timer = setInterval(driver, DRIVER_MS)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && timer != null) {
          clearInterval(timer)
          timer = null
        }
      }
    },
    reset() {
      reset()
      notify()
    },
  }

  reset()
  snapshot = build()
  return api
}

let shared = null

export function getGlobalFeed() {
  if (!shared) shared = createGlobalFeed()
  return shared
}
