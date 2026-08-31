/* =============================================================================
   Formatting helpers.

   Everything the traveller reads passes through here so that a yen figure looks
   identical in the receipt, the currency stack and the balance header. All times
   are rendered in the destination's timezone — a transaction that happened at
   14:32 in Tokyo should say 14:32, not 15:32 Sydney time.
   ============================================================================= */

import { CURRENCY_META } from '../data/fx.js'

const TOKYO = 'Asia/Tokyo'

const decimalsFor = (code) => CURRENCY_META[code]?.decimals ?? 2

/** `¥1,480` · `US$15.38` · `A$15.38` */
export function formatLocal(amount, code, { withSymbol = true } = {}) {
  const meta = CURRENCY_META[code]
  const decimals = decimalsFor(code)
  const value = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  return withSymbol ? `${meta?.symbol ?? ''}${value}` : value
}

/** `A$15.38` */
export function formatAud(amount, { decimals = 2 } = {}) {
  const value = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount))
  return `${amount < 0 ? '−' : ''}A$${value}`
}

/** `+A$38.28` / `−A$4.10` — for deltas where the sign is the message. */
export function formatSignedAud(amount, { decimals = 2 } = {}) {
  const sign = amount >= 0 ? '+' : '−'
  const value = new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(amount))
  return `${sign}A$${value}`
}

/** Rates always render to two decimals for JPY-like scales, three for USD-like. */
export function formatRate(rate, code) {
  const decimals = rate >= 10 ? 2 : 4
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate)
}

/** `96.20 JPY/AUD` */
export function formatRatePair(rate, code) {
  return `${formatRate(rate, code)} ${code}/AUD`
}

const tokyoTime = new Intl.DateTimeFormat('en-AU', {
  timeZone: TOKYO,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const tokyoDayLabel = new Intl.DateTimeFormat('en-AU', {
  timeZone: TOKYO,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const tokyoDayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: TOKYO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** `14:32`, in Tokyo. */
export function formatTime(timestamp) {
  return tokyoTime.format(new Date(timestamp))
}

/** `Tuesday 5 May`, in Tokyo — the sticky day header in the feed. */
export function formatDayLabel(timestamp) {
  return tokyoDayLabel.format(new Date(timestamp))
}

/** `2026-05-05` — stable key for grouping the feed by Tokyo day. */
export function dayKey(timestamp) {
  return tokyoDayKey.format(new Date(timestamp))
}

/** `Today` / `Yesterday` / the full label. */
export function formatRelativeDay(timestamp, now = Date.now()) {
  const key = dayKey(timestamp)
  if (key === dayKey(now)) return 'Today'
  if (key === dayKey(now - 86400000)) return 'Yesterday'
  return formatDayLabel(timestamp)
}

/** `5 May 2026` — for expiry dates and trip dates, in local Australian format. */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/** `5 May` — compact variant. */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(new Date(date))
}

/** Whole days between two dates, rounded toward zero. */
export function daysBetween(from, to) {
  return Math.round((new Date(to).setHours(12, 0, 0, 0) - new Date(from).setHours(12, 0, 0, 0)) / 86400000)
}

/** `18 days` / `1 day` / `Today` */
export function formatCountdown(days) {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

/** Percentage clamped to 0–100, for progress bars and rings. */
export function pct(value, total) {
  if (!total) return 0
  return Math.max(0, Math.min(100, (value / total) * 100))
}
