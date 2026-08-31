/* =============================================================================
   LiveFeed — reverse chronological, grouped by Tokyo day with sticky headers.

   Two accessibility notes that shaped this:

   1. The feed is `aria-live="polite"` with `aria-relevant="additions"`, so a
      screen reader hears each arriving transaction without the whole list being
      re-announced when a rate ticks.
   2. The running savings counter is deliberately OUTSIDE that live region. It
      changes on every transaction too, and having both announce would read as
      a stutter.
   ============================================================================= */

import { useEffect, useRef, useState } from 'react'
import TransactionReceipt from './TransactionReceipt.jsx'
import { AnimatedNumber, Chip, Icon } from './primitives/index.jsx'
import { formatAud, dayKey, formatRelativeDay } from '../lib/format.js'
import './LiveFeed.css'

/** Group a newest-first list into day buckets, preserving order. */
function groupByDay(transactions) {
  const groups = []
  let current = null

  for (const tx of transactions) {
    const key = dayKey(tx.timestamp)
    if (!current || current.key !== key) {
      current = { key, timestamp: tx.timestamp, items: [] }
      groups.push(current)
    }
    current.items.push(tx)
  }

  return groups
}

/**
 * The running total. Pops slightly each time it grows — the "haptic-style
 * scale bounce" from the brief. Driven by a CSS animation keyed off the value,
 * so the global reduced-motion rule switches it off.
 */
function SavingsCounter({ value, count }) {
  const [popKey, setPopKey] = useState(0)
  const previous = useRef(value)

  useEffect(() => {
    if (value > previous.current + 0.001) setPopKey((k) => k + 1)
    previous.current = value
  }, [value])

  return (
    <div className="feed__counter">
      <span className="feed__counter-icon">
        <Icon name="check" size={20} />
      </span>
      <span className="feed__counter-body">
        <AnimatedNumber
          as="span"
          key={popKey}
          className="feed__counter-value feed__counter-value--pop"
          value={value}
          format={(n) => formatAud(n)}
        />
        <span className="feed__counter-label">
          saved this trip, across {count} {count === 1 ? 'transaction' : 'transactions'}
        </span>
      </span>
    </div>
  )
}

export default function LiveFeed({
  transactions,
  totals,
  controls,
  onLockCard,
  onLoadCurrency,
  onSeeCurrencies,
}) {
  const groups = groupByDay(transactions)

  return (
    <div className="feed">
      <SavingsCounter value={totals.savedAud} count={totals.count} />

      {transactions.length === 0 ? (
        <p className="feed__empty">
          Nothing yet. Press play and the first transaction will land in a few seconds.
        </p>
      ) : null}

      <div className="feed__list" aria-live="polite" aria-relevant="additions" aria-label="Transactions">
        {groups.map((group) => (
          <section className="feed__day" key={group.key}>
            <h3 className="feed__day-head">
              <span>{formatRelativeDay(group.timestamp)}</span>
              <Chip tone="outline">
                {group.items.length} {group.items.length === 1 ? 'transaction' : 'transactions'}
              </Chip>
            </h3>
            <div className="feed__day-items">
              {group.items.map((tx) => (
                <TransactionReceipt
                  key={tx.id}
                  transaction={tx}
                  onSettle={controls.settle}
                  onResolveSuspicious={controls.resolveSuspicious}
                  onLockCard={onLockCard}
                  onLoadCurrency={onLoadCurrency}
                  onSeeCurrencies={onSeeCurrencies}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="feed__cap">
        Showing the most recent {transactions.length}. Older transactions stay in your statement.
      </p>
    </div>
  )
}
