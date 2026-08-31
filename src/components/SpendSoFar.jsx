/* =============================================================================
   Spend so far.

   Budget ring, category bars, spend by day, and the trip-wide rate-lock delta.
   Horizontal bars rather than a pie chart: you can read six categories against
   each other at a glance on a 390px screen, which is not true of a pie.
   ============================================================================= */

import { AnimatedNumber, Icon, Ring, Sparkline } from './primitives/index.jsx'
import { CATEGORIES } from '../data/merchants.js'
import { formatAud, formatSignedAud, formatDateShort } from '../lib/format.js'
import './SpendSoFar.css'

export default function SpendSoFar({
  spentAud,
  budgetAud,
  dayOfTrip,
  lengthDays,
  byCategory,
  byDay,
  fxDeltaAud,
  savedAud,
}) {
  const daysElapsed = Math.max(1, dayOfTrip)
  const daysRemaining = Math.max(0, lengthDays - dayOfTrip)
  const projected = (spentAud / daysElapsed) * lengthDays
  const overBudget = projected > budgetAud

  const categories = Object.entries(byCategory)
    .map(([id, amount]) => ({ id, amount, meta: CATEGORIES[id] ?? CATEGORIES.retail }))
    .sort((a, b) => b.amount - a.amount)

  const categoryMax = categories.length ? categories[0].amount : 1

  // byDay is keyed by ISO date; sort so the sparkline runs left to right in time.
  const days = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }))

  const ahead = fxDeltaAud >= 0

  return (
    <div className="spend">
      {/* --- Budget ring --- */}
      <div className="spend__ring-row">
        <Ring
          value={spentAud}
          max={budgetAud}
          size={148}
          thickness={14}
          tone={overBudget ? 'var(--color-warn-edge)' : 'var(--color-text)'}
          label={`${formatAud(spentAud)} spent of a ${formatAud(budgetAud)} budget`}
        >
          <AnimatedNumber
            className="spend__ring-value"
            value={spentAud}
            format={(n) => formatAud(n, { decimals: 0 })}
          />
          <span className="spend__ring-label">of {formatAud(budgetAud, { decimals: 0 })}</span>
        </Ring>

        <div className="spend__ring-facts">
          <div className="spend__fact">
            <span className="spend__fact-value" data-figure>
              {daysRemaining}
            </span>
            <span className="spend__fact-label">
              {daysRemaining === 1 ? 'day left' : 'days left'} · day {dayOfTrip} of {lengthDays}
            </span>
          </div>
          <div className="spend__fact">
            <span
              className={`spend__fact-value ${overBudget ? 'is-warn' : ''}`}
              data-figure
            >
              {formatAud(projected, { decimals: 0 })}
            </span>
            <span className="spend__fact-label">
              projected by the time you fly home
              {overBudget ? ` — ${formatAud(projected - budgetAud, { decimals: 0 })} over` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* --- FX tile --- */}
      <div className={`spend__fx ${ahead ? 'spend__fx--ahead' : 'spend__fx--behind'}`}>
        <span className="spend__fx-icon">
          <Icon name={ahead ? 'arrowUp' : 'arrowDown'} size={20} />
        </span>
        <span>
          <AnimatedNumber
            as="span"
            className="spend__fx-value"
            value={fxDeltaAud}
            format={(n) => formatSignedAud(n)}
          />
          <span className="spend__fx-label">
            {ahead
              ? 'ahead on FX, because you locked before you left'
              : 'behind on FX — the market moved your way after you locked'}
          </span>
        </span>
      </div>

      <div className="spend__saved">
        <span className="spend__saved-value" data-figure>
          {formatAud(savedAud)}
        </span>
        <span className="spend__saved-label">
          saved in fees so far, against a card charging the usual 3%
        </span>
      </div>

      {/* --- Categories --- */}
      <div>
        <p className="eyebrow">Where it went</p>
        <ul className="spend__bars">
          {categories.map((category) => (
            <li className="spend__bar-row" key={category.id}>
              <span className="spend__bar-label">
                <Icon name={category.meta.icon} size={16} />
                {category.meta.label}
              </span>
              <span className="spend__bar-track">
                <span
                  className="spend__bar-fill"
                  style={{ width: `${(category.amount / categoryMax) * 100}%` }}
                />
              </span>
              <span className="spend__bar-value" data-figure>
                {formatAud(category.amount, { decimals: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* --- By day --- */}
      {days.length > 1 ? (
        <div>
          <p className="eyebrow">By day</p>
          <div className="spend__days">
            <Sparkline
              values={days.map((day) => day.amount)}
              height={56}
              tone="var(--color-text)"
              fill
              label={`Daily spend across ${days.length} days, from ${formatAud(Math.min(...days.map((d) => d.amount)), { decimals: 0 })} to ${formatAud(Math.max(...days.map((d) => d.amount)), { decimals: 0 })}`}
            />
            <div className="spend__days-axis">
              <span>{formatDateShort(days[0].date)}</span>
              <span>{formatDateShort(days[days.length - 1].date)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
