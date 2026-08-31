/* =============================================================================
   The transaction simulator.

   Scenario: Tokyo, day 4 of 9. A Travel Money Card holding JPY, USD and AUD.
   JPY was locked at 96.2/AUD; the market is floating around 94.1.

   Determinism: every value comes from a seeded PRNG, so the same seed replays
   the same demo. Four independent streams keep the parts from interfering —
   firing a DCC event by hand doesn't shift the organic transaction sequence
   that follows it, and FX jitter doesn't perturb either. Timestamps are the one
   thing that moves between runs: they're anchored to load time so the demo
   always reads as "today".

   Nothing here touches the DOM or React. It's a plain observable store; the
   `useSimulator` hook subscribes to it.
   ============================================================================= */

import { mulberry32, intRange, range, steppedRange, weightedPick } from './rng.js'
import {
  DEMO_SEED,
  CURRENCY_HOLDINGS,
  FX_TICK_MS,
  STANDARD_CARD_FX_FEE,
  TMC_OVERSEAS_ATM_FEE_AUD,
  TMC_CROSS_CURRENCY_MARKUP,
  driftRate,
  toAud,
} from './fx.js'
import { MERCHANTS, ATM_MERCHANT, EVENT_MERCHANTS, CATEGORIES } from './merchants.js'
import { TRIP_STATES, DAY } from './trip.js'

/** Newest-first feed, capped so a long-running demo can't grow the DOM forever. */
export const FEED_CAP = 50

/** Organic transactions arrive on this interval, divided by the speed multiplier. */
export const TX_INTERVAL_MS = [6000, 9000]

/** Driver resolution. Everything is scheduled off this one timer. */
const DRIVER_MS = 200

export const SPEEDS = [1, 4, 16]

/**
 * The demo moments you can fire on demand. Each one is a scripted transaction
 * with fixed numbers, drawn from its own RNG stream.
 */
export const EVENT_TYPES = [
  {
    id: 'dcc',
    label: 'Merchant offered to charge in AUD',
    hint: 'Dynamic currency conversion, declined',
  },
  {
    id: 'atm',
    label: 'ATM withdrawal with a surcharge',
    hint: 'CommBank fee and operator fee, itemised',
  },
  {
    id: 'declined',
    label: 'Declined — currency not on the card',
    hint: 'Korean won, one of the 16 it does not hold',
  },
  {
    id: 'insurance',
    label: 'Large purchase — activates your cover',
    hint: 'Crosses the $500 prepaid travel threshold',
  },
  {
    id: 'suspicious',
    label: 'Suspicious charge',
    hint: 'Card not present, needs confirming',
  },
]

let idCounter = 0
const nextId = () => `tx-${++idCounter}`

/* -----------------------------------------------------------------------------
   Transaction construction
   -------------------------------------------------------------------------- */

/**
 * The standard case, and the one the whole pitch rests on: a tap in the local
 * currency, paid from the matching balance, at the rate locked at load time,
 * with a fee line of exactly zero.
 */
function buildPurchase({ merchant, localAmount, timestamp, currency = 'JPY', lockedRate }) {
  const audAmount = toAud(localAmount, lockedRate)
  return {
    id: nextId(),
    kind: 'purchase',
    merchant: merchant.name,
    location: merchant.location,
    category: merchant.category,
    icon: CATEGORIES[merchant.category]?.icon ?? 'bag',
    timestamp,
    currency,
    localAmount,
    audAmount,
    rateApplied: lockedRate,
    rateIsLocked: true,
    feeAud: 0,
    bucket: currency,
    card: 'Travel Money Card',
    // What a card charging the usual 3% foreign transaction fee would have cost.
    savedAud: audAmount * STANDARD_CARD_FX_FEE,
  }
}

/**
 * Dynamic currency conversion. The merchant's terminal offers to bill you in
 * AUD at its own, worse, rate. Always decline it — this receipt shows why, with
 * the number the traveller would otherwise never see.
 */
function buildDccEvent({ timestamp, lockedRate }) {
  const merchant = EVENT_MERCHANTS.dcc
  const localAmount = 1480
  const audAmount = toAud(localAmount, lockedRate)
  const offeredRate = 91.4
  const wouldHavePaidAud = toAud(localAmount, offeredRate)

  return {
    ...buildPurchase({ merchant, localAmount, timestamp, lockedRate }),
    kind: 'dcc',
    dcc: {
      offeredRate,
      wouldHavePaidAud,
      avoidedAud: wouldHavePaidAud - audAmount,
    },
  }
}

/**
 * An overseas ATM withdrawal. Two separate fees, shown as two separate lines,
 * because they come from two different people: CommBank charges AUD $3.50, and
 * the machine's operator charges its own surcharge on top.
 */
function buildAtmEvent({ timestamp, lockedRate, rng }) {
  const localAmount = steppedRange(rng, 10000, 30000, 10000)
  const audAmount = toAud(localAmount, lockedRate)
  const operatorSurchargeLocal = 220 // 7-Eleven's standard yen surcharge
  const operatorSurchargeAud = toAud(operatorSurchargeLocal, lockedRate)

  return {
    id: nextId(),
    kind: 'atm',
    merchant: ATM_MERCHANT.name,
    location: ATM_MERCHANT.location,
    category: ATM_MERCHANT.category,
    icon: CATEGORIES.cash.icon,
    timestamp,
    currency: 'JPY',
    localAmount,
    audAmount,
    rateApplied: lockedRate,
    rateIsLocked: true,
    feeAud: TMC_OVERSEAS_ATM_FEE_AUD + operatorSurchargeAud,
    bucket: 'JPY',
    card: 'Travel Money Card',
    savedAud: audAmount * STANDARD_CARD_FX_FEE - TMC_OVERSEAS_ATM_FEE_AUD,
    atm: {
      cbaFeeAud: TMC_OVERSEAS_ATM_FEE_AUD,
      operatorSurchargeLocal,
      operatorSurchargeAud,
      // Accurate, and more useful than "it would have been free": CommBank's own
      // fee disappears on the World Debit Mastercard, the operator's does not.
      wdmWouldSaveAud: TMC_OVERSEAS_ATM_FEE_AUD,
    },
  }
}

/**
 * A decline with a real cause. The Travel Money Card holds 16 currencies and
 * Korean won isn't one of them — so there is no balance to fall back to, and
 * the honest answer is to reach for a different card.
 */
function buildDeclinedEvent({ timestamp }) {
  const merchant = EVENT_MERCHANTS.declined
  return {
    id: nextId(),
    kind: 'declined',
    merchant: merchant.name,
    location: merchant.location,
    category: merchant.category,
    icon: CATEGORIES[merchant.category]?.icon ?? 'bowl',
    timestamp,
    currency: 'KRW',
    localAmount: 38000,
    audAmount: null,
    rateApplied: null,
    rateIsLocked: false,
    feeAud: 0,
    bucket: null,
    card: 'Travel Money Card',
    savedAud: 0,
    declined: {
      reason: 'currency-not-held',
      currency: 'KRW',
      currencyName: 'Korean won',
    },
  }
}

/**
 * The large purchase that crosses the $500 prepaid-travel threshold and
 * switches the included credit card travel insurance on.
 *
 * Charged to the Ultimate Awards card, which — unlike most credit cards —
 * charges 0% international transaction fee. So there is no trade-off to
 * confess here: the spend costs nothing extra AND buys the cover. The only
 * cost is the rate, which is the market's rather than a locked one.
 */
function buildInsuranceEvent({ timestamp, lockedRate }) {
  const merchant = EVENT_MERCHANTS.insurance
  const localAmount = 28400
  const rateApplied = 94.4 // Mastercard rate on the day, not a locked one
  const audAmount = toAud(localAmount, rateApplied)
  const feeAud = 0 // Ultimate Awards: 0% international transaction fee

  return {
    id: nextId(),
    kind: 'insurance',
    merchant: merchant.name,
    location: merchant.location,
    category: merchant.category,
    icon: CATEGORIES[merchant.category]?.icon ?? 'train',
    timestamp,
    currency: 'JPY',
    localAmount,
    audAmount,
    rateApplied,
    rateIsLocked: false,
    feeAud,
    bucket: null,
    card: 'Ultimate Awards credit card',
    savedAud: 0,
    insurance: {
      countsTowardActivationAud: audAmount,
      tmcWouldHaveCostAud: toAud(localAmount, lockedRate),
    },
  }
}

/** A card-not-present charge that wants confirming before anything else happens. */
function buildSuspiciousEvent({ timestamp, lockedRate }) {
  const merchant = EVENT_MERCHANTS.suspicious
  const localAmount = 14800
  const audAmount = toAud(localAmount, lockedRate)

  return {
    id: nextId(),
    kind: 'suspicious',
    merchant: merchant.name,
    location: merchant.location,
    category: merchant.category,
    icon: 'alert',
    timestamp,
    currency: 'JPY',
    localAmount,
    audAmount,
    rateApplied: lockedRate,
    rateIsLocked: true,
    feeAud: 0,
    bucket: 'JPY',
    card: 'Travel Money Card',
    savedAud: 0,
    suspicious: { resolved: null },
  }
}

const EVENT_BUILDERS = {
  dcc: buildDccEvent,
  atm: buildAtmEvent,
  declined: buildDeclinedEvent,
  insurance: buildInsuranceEvent,
  suspicious: buildSuspiciousEvent,
}

/* -----------------------------------------------------------------------------
   The store
   -------------------------------------------------------------------------- */

export function createSimulator({ seed = DEMO_SEED, autoStart = true } = {}) {
  const trip = TRIP_STATES.active.trip
  const holdings = CURRENCY_HOLDINGS
  const lockedRate = holdings.find((h) => h.code === 'JPY').lockedRate

  let listeners = new Set()
  let timer = null
  let snapshot = null

  // Four independent streams. See the header comment.
  let txRng
  let fxRng
  let eventRng
  let historyRng

  let running
  let speed
  let liveRates
  let transactions
  let totals
  let spentByCurrency
  let prepaidTravelChargedAud
  let insuranceActivated
  let lastArrival
  let txAccumulator
  let fxAccumulator
  let nextTxDelay

  /* --- derived bookkeeping ------------------------------------------------ */

  function resetInternals() {
    txRng = mulberry32(seed)
    fxRng = mulberry32(seed ^ 0x5f3759df)
    eventRng = mulberry32(seed ^ 0x9e3779b9)
    historyRng = mulberry32(seed ^ 0x2545f491)

    running = autoStart
    speed = 1
    liveRates = Object.fromEntries(holdings.map((h) => [h.code, h.liveRate]))
    transactions = []
    totals = {
      spentAud: 0,
      savedAud: 0,
      feesPaidAud: 0,
      count: 0,
      byCategory: {},
      byDay: {},
    }
    spentByCurrency = Object.fromEntries(holdings.map((h) => [h.code, 0]))
    prepaidTravelChargedAud = trip.prepaidTravelChargedAud
    insuranceActivated = trip.insuranceActivated
    lastArrival = null
    txAccumulator = 0
    fxAccumulator = 0
    nextTxDelay = intRange(txRng, TX_INTERVAL_MS[0], TX_INTERVAL_MS[1])
  }

  /**
   * Fold one transaction into the running totals. Totals accumulate rather than
   * being recomputed from `transactions`, because that array is capped at 50 —
   * recomputing would quietly lose the earlier days' spend.
   */
  function accumulate(tx) {
    if (tx.kind === 'declined') {
      totals.count += 1
      return
    }
    const spend = (tx.audAmount ?? 0) + (tx.feeAud ?? 0)
    totals.spentAud += spend
    totals.savedAud += tx.savedAud ?? 0
    totals.feesPaidAud += tx.feeAud ?? 0
    totals.count += 1

    const cat = tx.category ?? 'retail'
    totals.byCategory[cat] = (totals.byCategory[cat] ?? 0) + spend

    const key = new Date(tx.timestamp).toISOString().slice(0, 10)
    totals.byDay[key] = (totals.byDay[key] ?? 0) + spend

    if (tx.bucket) {
      spentByCurrency[tx.bucket] = (spentByCurrency[tx.bucket] ?? 0) + tx.localAmount
    }
    if (tx.insurance) {
      prepaidTravelChargedAud += tx.insurance.countsTowardActivationAud
      if (prepaidTravelChargedAud >= 500) insuranceActivated = true
    }
  }

  function push(tx, { isNew = false } = {}) {
    accumulate(tx)
    transactions = [{ ...tx, isNew }, ...transactions].slice(0, FEED_CAP)
    if (isNew) lastArrival = tx
  }

  /* --- history ------------------------------------------------------------ */

  /**
   * Seed days 1 → now so the feed opens populated and the day grouping is
   * visible immediately, rather than starting empty and taking a minute to
   * look like anything.
   */
  function seedHistory() {
    const now = Date.now()
    const departureMidnight = new Date(trip.departure).setHours(0, 0, 0, 0)
    const built = []

    for (let day = 0; day < trip.lengthDays; day++) {
      const dayStart = departureMidnight + day * DAY
      if (dayStart > now) break

      // A realistic Tokyo day for two people, weighted to the merchant mix.
      const count = intRange(historyRng, 6, 9)
      for (let i = 0; i < count; i++) {
        const merchant = weightedPick(historyRng, MERCHANTS)
        const [openHour, closeHour] = merchant.hours
        const hour = range(historyRng, openHour, closeHour)
        const timestamp = dayStart + hour * 3600000

        // Skip anything that would land in the future — day 4 is only partly done.
        if (timestamp > now - 60000) continue

        const localAmount = steppedRange(historyRng, merchant.min, merchant.max, merchant.step)
        built.push(buildPurchase({ merchant, localAmount, timestamp, lockedRate }))
      }
    }

    built.sort((a, b) => a.timestamp - b.timestamp)
    built.forEach((tx) => push(tx))
  }

  /* --- live ticking ------------------------------------------------------- */

  function tickRates() {
    const next = {}
    for (const holding of holdings) {
      next[holding.code] = driftRate(holding.code, liveRates[holding.code], fxRng)
    }
    liveRates = next
  }

  /**
   * Which merchants could plausibly be taking a payment right now, in Tokyo.
   * Without this you get Ichiran Ramen at 04:00, which is the sort of detail
   * that quietly tells a viewer the data is fake. Konbini are open around the
   * clock, so there's always something in the list.
   */
  function openNow() {
    const hour = Number(
      new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Asia/Tokyo',
        hour: 'numeric',
        hour12: false,
      }).format(new Date())
    )
    const open = MERCHANTS.filter((m) => hour >= m.hours[0] && hour < m.hours[1])
    return open.length ? open : MERCHANTS.filter((m) => m.category === 'convenience')
  }

  function emitOrganic() {
    const merchant = weightedPick(txRng, openNow())
    const localAmount = steppedRange(txRng, merchant.min, merchant.max, merchant.step)
    push(buildPurchase({ merchant, localAmount, timestamp: Date.now(), lockedRate }), {
      isNew: true,
    })
  }

  function driver() {
    if (!running) return

    // FX runs on wall-clock time, sped up but floored so 16× isn't a strobe.
    fxAccumulator += DRIVER_MS
    if (fxAccumulator >= Math.max(750, FX_TICK_MS / speed)) {
      fxAccumulator = 0
      tickRates()
    }

    txAccumulator += DRIVER_MS * speed
    if (txAccumulator >= nextTxDelay) {
      txAccumulator = 0
      nextTxDelay = intRange(txRng, TX_INTERVAL_MS[0], TX_INTERVAL_MS[1])
      emitOrganic()
    }

    notify()
  }

  /* --- snapshot / subscription -------------------------------------------- */

  function buildSnapshot() {
    return {
      running,
      speed,
      liveRates,
      lockedRate,
      transactions,
      totals,
      spentByCurrency,
      prepaidTravelChargedAud,
      insuranceActivated,
      lastArrival,
      trip,
      holdings,
    }
  }

  function notify() {
    snapshot = buildSnapshot()
    listeners.forEach((listener) => listener(snapshot))
  }

  function ensureTimer() {
    if (timer == null) timer = setInterval(driver, DRIVER_MS)
  }

  /* --- public API --------------------------------------------------------- */

  const api = {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener)
      ensureTimer()
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && timer != null) {
          clearInterval(timer)
          timer = null
        }
      }
    },

    play() {
      running = true
      notify()
    },

    pause() {
      running = false
      notify()
    },

    toggle() {
      running = !running
      notify()
    },

    setSpeed(next) {
      speed = SPEEDS.includes(next) ? next : 1
      notify()
    },

    /** Fire a scripted demo moment. Draws from its own stream so the organic
        sequence after it is unchanged. */
    injectEvent(type) {
      const build = EVENT_BUILDERS[type]
      if (!build) return null
      const tx = build({ timestamp: Date.now(), lockedRate, rng: eventRng })
      push(tx, { isNew: true })
      notify()
      return tx
    },

    /** Answer the "Was this you?" prompt on a suspicious charge. */
    resolveSuspicious(id, answer) {
      transactions = transactions.map((tx) =>
        tx.id === id && tx.suspicious ? { ...tx, suspicious: { resolved: answer } } : tx
      )
      notify()
    },

    /** Clear the `isNew` flag once a receipt has finished animating in, so a
        re-render can't replay the entrance animation. */
    settle(id) {
      let changed = false
      transactions = transactions.map((tx) => {
        if (tx.id === id && tx.isNew) {
          changed = true
          return { ...tx, isNew: false }
        }
        return tx
      })
      if (changed) notify()
    },

    reset() {
      resetInternals()
      seedHistory()
      notify()
    },

    destroy() {
      if (timer != null) clearInterval(timer)
      timer = null
      listeners.clear()
    },
  }

  resetInternals()
  seedHistory()
  snapshot = buildSnapshot()

  return api
}

/**
 * One of every receipt state, built off to the side.
 * Used by the design-review page so all five can be seen at once without
 * injecting them into the real feed.
 */
export function createSampleTransactions() {
  const lockedRate = CURRENCY_HOLDINGS.find((h) => h.code === 'JPY').lockedRate
  const rng = mulberry32(DEMO_SEED ^ 0xabcdef)
  const now = Date.now()
  const merchant = MERCHANTS.find((m) => m.id === 'lawson')

  return [
    buildPurchase({ merchant, localAmount: 1480, timestamp: now - 1000 * 60 * 12, lockedRate }),
    buildDccEvent({ timestamp: now - 1000 * 60 * 40, lockedRate }),
    buildAtmEvent({ timestamp: now - 1000 * 60 * 90, lockedRate, rng }),
    buildDeclinedEvent({ timestamp: now - 1000 * 60 * 150 }),
    buildInsuranceEvent({ timestamp: now - 1000 * 60 * 210, lockedRate }),
    buildSuspiciousEvent({ timestamp: now - 1000 * 60 * 280, lockedRate }),
  ]
}

/** One shared instance for the app. The preview route and the dashboard read
    the same stream, so the demo stays coherent as you move between them. */
let sharedSimulator = null

export function getSimulator() {
  if (!sharedSimulator) sharedSimulator = createSimulator()
  return sharedSimulator
}

export function resetSimulator() {
  if (sharedSimulator) sharedSimulator.reset()
}
