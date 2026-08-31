/* =============================================================================
   Seeded pseudo-random number generation.

   Every random value in this prototype comes from here. Nothing calls
   Math.random(), which is what makes the demo replayable: the same seed
   produces the same merchants, the same amounts and the same sequence, every
   single time you load the page.

   The simulator runs several *independent* streams (transactions, FX jitter,
   injected events) so that, say, pausing to fire a DCC event by hand doesn't
   shift the organic transaction sequence that follows it.
   ============================================================================= */

/**
 * mulberry32 — small, fast, well-distributed 32-bit PRNG.
 * Returns a function producing floats in [0, 1).
 */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Float in [min, max). */
export function range(rng, min, max) {
  return min + rng() * (max - min)
}

/** Integer in [min, max] inclusive. */
export function intRange(rng, min, max) {
  return Math.floor(range(rng, min, max + 1))
}

/** Integer in [min, max], rounded down to the nearest `step`. */
export function steppedRange(rng, min, max, step) {
  return Math.max(min, Math.round(range(rng, min, max) / step) * step)
}

/** Uniform pick from an array. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

/**
 * Pick from an array of items carrying a numeric `weight`.
 * Used so konbini runs show up far more often than a teamLab ticket.
 */
export function weightedPick(rng, items, weightKey = 'weight') {
  const total = items.reduce((sum, item) => sum + (item[weightKey] ?? 1), 0)
  let threshold = rng() * total
  for (const item of items) {
    threshold -= item[weightKey] ?? 1
    if (threshold <= 0) return item
  }
  return items[items.length - 1]
}

/**
 * Shuffle a copy of `items` (Fisher–Yates), deterministically.
 */
export function shuffled(rng, items) {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
