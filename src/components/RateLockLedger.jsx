/* =============================================================================
   RateLockLedger — "you locked, they float".

   The Travel Money Card locks the rate at load time across 16 currencies. No
   neobank offers that, and CommBank currently mentions it as a bullet point.
   This is the same fact as a scoreboard: what you locked, what it's worth now,
   and the difference in dollars.
   ============================================================================= */

import { useState } from 'react'
import { AnimatedNumber, Button, Chip, Icon, Sparkline } from './primitives/index.jsx'
import { formatAud, formatDate, formatLocal, formatRate, formatSignedAud } from '../lib/format.js'
import './RateLockLedger.css'

function RateAlertControl({ holding, current, onSet, onClear }) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(() => (holding.lockedRate * 1.01).toFixed(2))

  if (current) {
    return (
      <div className="ledger__alert ledger__alert--set">
        <Icon name="clock" size={16} />
        <span>
          We&rsquo;ll tell you if {holding.code} passes{' '}
          <strong data-figure>{formatRate(current, holding.code)}</strong>
        </span>
        <Button size="sm" variant="ghost" onClick={() => onClear(holding.code)}>
          Remove
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" icon="clock" onClick={() => setOpen(true)}>
        Set a rate alert
      </Button>
    )
  }

  return (
    <div className="ledger__alert">
      <label className="ledger__alert-label" htmlFor={`alert-${holding.code}`}>
        Tell me when 1 AUD buys more than
      </label>
      <div className="ledger__alert-row">
        <input
          id={`alert-${holding.code}`}
          className="ledger__alert-input"
          type="number"
          step="0.01"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />
        <span className="ledger__alert-code">{holding.code}</span>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            onSet(holding.code, Number(target))
            setOpen(false)
          }}
        >
          Set alert
        </Button>
      </div>
    </div>
  )
}

export default function RateLockLedger({ holdings, rateAlerts, onSetAlert, onClearAlert, onLoad }) {
  const tradeable = holdings.filter((holding) => holding.code !== 'AUD')

  return (
    <div className="ledger">
      {tradeable.map((holding) => {
        const ahead = holding.deltaAud >= 0
        const movePct = ((holding.liveRate - holding.lockedRate) / holding.lockedRate) * 100

        return (
          <article className="ledger__card" key={holding.code}>
            <header className="ledger__head">
              <div>
                <h3 className="ledger__title">
                  {holding.meta.name}
                  {holding.isDestination ? <Chip tone="brand">Destination</Chip> : null}
                </h3>
                <p className="ledger__balance" data-figure>
                  {formatLocal(Math.round(holding.balance), holding.code)}{' '}
                  <span className="ledger__balance-note">
                    of {formatLocal(holding.totalLoaded, holding.code)} loaded
                  </span>
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onLoad(holding.code)}>
                Load more
              </Button>
            </header>

            {/* The scoreboard: locked vs live vs the difference in dollars. */}
            <div className="ledger__scores">
              <div className="ledger__score">
                <span className="ledger__score-label">You locked at</span>
                <span className="ledger__score-value" data-figure>
                  {formatRate(holding.lockedRate, holding.code)}
                </span>
                <span className="ledger__score-note">on {formatDate(holding.lockedOn)}</span>
              </div>

              <div className="ledger__score">
                <span className="ledger__score-label">It&rsquo;s trading at</span>
                <AnimatedNumber
                  className="ledger__score-value"
                  value={holding.liveRate}
                  format={(n) => formatRate(n, holding.code)}
                  duration={600}
                />
                <span className="ledger__score-note">
                  {movePct >= 0 ? '+' : '−'}
                  {Math.abs(movePct).toFixed(2)}% since you locked
                </span>
              </div>

              <div className={`ledger__score ledger__score--delta ${ahead ? 'is-ahead' : 'is-behind'}`}>
                <span className="ledger__score-label">
                  You&rsquo;re {ahead ? 'ahead' : 'behind'}
                </span>
                <AnimatedNumber
                  className="ledger__score-value"
                  value={holding.deltaAud}
                  format={(n) => formatSignedAud(n)}
                />
                <span className="ledger__score-note">
                  vs buying the same {holding.meta.symbol} today
                </span>
              </div>
            </div>

            <p className="ledger__sentence">
              You locked {holding.meta.symbol} at {formatRate(holding.lockedRate, holding.code)}.
              It&rsquo;s {formatRate(holding.liveRate, holding.code)} today. You&rsquo;re{' '}
              <strong>
                {formatAud(Math.abs(holding.deltaAud))} {ahead ? 'ahead' : 'behind'}
              </strong>
              .
            </p>

            <div className="ledger__chart">
              <Sparkline
                values={holding.history}
                height={72}
                tone={ahead ? 'var(--color-success)' : 'var(--color-alert)'}
                fill
                label={`30-day rate history for ${holding.meta.name}, from ${formatRate(Math.min(...holding.history), holding.code)} to ${formatRate(Math.max(...holding.history), holding.code)}`}
              />
              <div className="ledger__chart-axis">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            <RateAlertControl
              holding={holding}
              current={rateAlerts[holding.code]}
              onSet={onSetAlert}
              onClear={onClearAlert}
            />
          </article>
        )
      })}
    </div>
  )
}
