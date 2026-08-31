/* =============================================================================
   Derived currency holdings.

   One place that joins what the card was loaded with (fx.js), what the viewer
   has since loaded through the demo (DemoContext), and what has been spent
   (the simulator). Several components need the same figures, and computing
   them twice is how two parts of a dashboard start disagreeing about a balance.
   ============================================================================= */

import { CURRENCY_HOLDINGS, CURRENCY_META, lockDelta, buildRateHistory } from '../data/fx.js'

/**
 * @returns holdings in the viewer's chosen fallback order, each with the
 *          balance, both rates, the AUD delta and a 30-day series.
 */
export function buildHoldings({ currencyOrder, extraLoads = {}, liveRates, spentByCurrency = {} }) {
  const byCode = new Map(CURRENCY_HOLDINGS.map((holding) => [holding.code, holding]))

  // Anything the viewer loaded through the demo that wasn't on the card to
  // begin with still needs to appear in the stack.
  for (const code of Object.keys(extraLoads)) {
    if (!byCode.has(code)) {
      byCode.set(code, {
        code,
        loaded: 0,
        lockedRate: liveRates[code] ?? 1,
        liveRate: liveRates[code] ?? 1,
        lockedOn: new Date().toISOString().slice(0, 10),
        isDestination: false,
      })
    }
  }

  const ordered = currencyOrder
    .map((code) => byCode.get(code))
    .filter(Boolean)
    .concat([...byCode.values()].filter((holding) => !currencyOrder.includes(holding.code)))

  return ordered.map((holding, index) => {
    const extra = extraLoads[holding.code] ?? 0
    const spent = spentByCurrency[holding.code] ?? 0
    const liveRate = liveRates[holding.code] ?? holding.liveRate
    const totalLoaded = holding.loaded + extra

    return {
      ...holding,
      meta: CURRENCY_META[holding.code],
      order: index,
      extraLoaded: extra,
      totalLoaded,
      spent,
      balance: Math.max(0, totalLoaded - spent),
      liveRate,
      // The delta is measured against everything loaded, not the shrinking
      // balance — the saving was banked at load time and doesn't evaporate as
      // you spend it.
      deltaAud: lockDelta({ ...holding, loaded: totalLoaded }, liveRate),
      audBalance: Math.max(0, totalLoaded - spent) / holding.lockedRate,
      history: buildRateHistory(holding.code, liveRate),
    }
  })
}

/** Plain-language description of what pays when you tap in an unloaded currency. */
export function fallbackSentence(holdings) {
  if (holdings.length < 2) {
    return 'You only have one currency loaded, so there is nothing to fall back to.'
  }
  const next = holdings[0]
  return `If you tap in a currency you haven't loaded, we'll use your ${next.meta.symbol} balance next.`
}
