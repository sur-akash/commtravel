/* =============================================================================
   Foreign exchange — the "you locked, they float" scoreboard.

   Rate convention throughout the app: RATE = UNITS OF FOREIGN CURRENCY PER 1 AUD.
   So 96.2 means A$1 buys ¥96.2, and a higher number is better for the traveller.
   Converting a local amount to AUD is therefore always `local / rate`.

   Tune the demo here. Nothing in components hard-codes a rate or a balance.
   ============================================================================= */

import { mulberry32, range } from './rng.js'

/** Master seed. Change this and you get a different — but still repeatable — demo. */
export const DEMO_SEED = 20260427

/** A standard card's foreign transaction fee, used for every "you saved" figure. */
export const STANDARD_CARD_FX_FEE = 0.03 // 3%

/** CommBank Travel Money Card, overseas ATM withdrawal. Verified from CBA's fees page. */
export const TMC_OVERSEAS_ATM_FEE_AUD = 3.5

/** Cross-currency fallback on the TMC: Visa rate plus 3%. Verified from CBA's fees page. */
export const TMC_CROSS_CURRENCY_MARKUP = 0.03

/**
 * The 16 currencies the Travel Money Card supports. The point of the card, and
 * the thing no neobank offers: the rate is locked at load time on all of them.
 */
export const TMC_CURRENCIES = [
  'AUD', 'USD', 'GBP', 'EUR', 'NZD', 'THB', 'SGD', 'JPY',
  'HKD', 'CAD', 'CHF', 'CNY', 'VND', 'ZAR', 'AED', 'PHP',
]

export const CURRENCY_META = {
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese yen', decimals: 0, flag: 'JP' },
  USD: { code: 'USD', symbol: 'US$', name: 'US dollar', decimals: 2, flag: 'US' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian dollar', decimals: 2, flag: 'AU' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean won', decimals: 0, flag: 'KR' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, flag: 'EU' },
  GBP: { code: 'GBP', symbol: '£', name: 'British pound', decimals: 2, flag: 'GB' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai baht', decimals: 2, flag: 'TH' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore dollar', decimals: 2, flag: 'SG' },
}

/**
 * What's on the card for the Tokyo trip.
 *
 * `loaded` is the amount originally loaded at `lockedRate` — the rate-lock delta
 * is calculated against this fixed figure, not the shrinking balance, because
 * that's the honest scoreboard: the saving was banked at load time and doesn't
 * evaporate as you spend it.
 *
 * `order` is the fallback priority — which bucket pays when you tap in a
 * currency you haven't loaded. The user can drag to reorder it.
 */
export const CURRENCY_HOLDINGS = [
  {
    code: 'JPY',
    loaded: 165000,
    lockedRate: 96.2,
    liveRate: 94.1,
    lockedOn: '2026-04-14',
    order: 0,
    isDestination: true,
  },
  {
    code: 'USD',
    loaded: 400,
    lockedRate: 0.664,
    liveRate: 0.652,
    lockedOn: '2026-03-02',
    order: 1,
    isDestination: false,
  },
  {
    code: 'AUD',
    loaded: 300,
    lockedRate: 1,
    liveRate: 1,
    lockedOn: '2026-04-14',
    order: 2,
    isDestination: false,
  },
]

/**
 * Random-walk parameters for the live market rate.
 * ±0.15% per tick, clamped to a plausible band so a long demo can't drift
 * somewhere silly.
 */
export const FX_DRIFT = {
  JPY: { volatility: 0.0015, min: 92.4, max: 96.1 },
  USD: { volatility: 0.0009, min: 0.638, max: 0.671 },
  AUD: { volatility: 0, min: 1, max: 1 },
}

/** How often the live rate re-prices, in ms. */
export const FX_TICK_MS = 3000

/**
 * Advance one live rate by a single tick of the random walk.
 * Pure: give it a rate and an rng, get the next rate back.
 */
export function driftRate(code, rate, rng) {
  const drift = FX_DRIFT[code]
  if (!drift || drift.volatility === 0) return rate
  const move = range(rng, -drift.volatility, drift.volatility)
  const next = rate * (1 + move)
  return Math.min(drift.max, Math.max(drift.min, next))
}

/**
 * Build a 30-day history of daily closes ending at `endRate`, for the sparklines.
 * Deterministic per currency code, so the sparkline is stable across reloads.
 */
export function buildRateHistory(code, endRate, days = 30, seed = DEMO_SEED) {
  const rng = mulberry32(seed + code.charCodeAt(0) * 977 + code.charCodeAt(1) * 31)
  const drift = FX_DRIFT[code] ?? { volatility: 0.002, min: endRate * 0.9, max: endRate * 1.1 }

  // Walk backwards from today's rate, then reverse — this guarantees the series
  // terminates exactly on the live rate rather than drifting away from it.
  const series = [endRate]
  let rate = endRate
  for (let i = 1; i < days; i++) {
    const move = range(rng, -drift.volatility * 2.2, drift.volatility * 2.2)
    rate = Math.min(drift.max, Math.max(drift.min, rate * (1 + move)))
    series.push(rate)
  }
  return series.reverse()
}

/** Convert a local-currency amount to AUD at a given rate. */
export function toAud(localAmount, rate) {
  return localAmount / rate
}

/**
 * The rate-lock delta for one holding, in AUD.
 * Positive = the lock is winning.
 *
 * "You locked ¥ at 96.2. It's 94.1 today. You're A$38 ahead" — that A$38 is
 * the difference between what the loaded amount cost you and what the same
 * amount would cost at today's market rate.
 */
export function lockDelta(holding, liveRate) {
  const costAtLock = holding.loaded / holding.lockedRate
  const costToday = holding.loaded / liveRate
  return costToday - costAtLock
}

/** Sum of every holding's lock delta — the trip-wide "ahead/behind on FX" tile. */
export function totalLockDelta(holdings, liveRates) {
  return holdings.reduce(
    (sum, holding) => sum + lockDelta(holding, liveRates[holding.code] ?? holding.liveRate),
    0
  )
}
