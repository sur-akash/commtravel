/* =============================================================================
   TravelOrbits — every CommBank customer overseas, right now.

   The argument for putting this on a bank's travel homepage: it is the only
   proof a customer will ever see that the bank actually works abroad. A page
   can claim "accepted worldwide"; a globe with a light going on in Ubud two
   seconds ago demonstrates it.

   Two of the four panels are deliberately NOT the obvious ones. A
   transactions-per-minute trend line and a top-countries bar chart are what
   every fintech puts here, and neither says anything a CommBank customer could
   act on. These do:

   · Fees not charged — the product thesis as a running total. Every dollar on
     that counter is a dollar a card charging the usual 3% would have taken.
   · Currencies in play — the 16 the Travel Money Card can hold, lighting up as
     they are spent. It makes the rate-lock story visible instead of stated, and
     the currencies that stay dark are exactly the ones the card cannot cover.
   ============================================================================= */

import { useSyncExternalStore } from 'react'
import Globe from './Globe.jsx'
import { AnimatedNumber, Icon } from './primitives/index.jsx'
import { getGlobalFeed, CURRENCY_ACTIVE_MS } from '../data/globalFeed.js'
import { formatWorldAmount } from '../data/globe.js'
import { TMC_CURRENCIES, STANDARD_CARD_FX_FEE } from '../data/fx.js'
import { CATEGORIES } from '../data/merchants.js'
import { formatAud } from '../lib/format.js'
import './TravelOrbits.css'

function useGlobalFeed() {
  const feed = getGlobalFeed()
  return useSyncExternalStore(feed.subscribe, feed.getSnapshot, feed.getSnapshot)
}

function LiveDot({ label = 'Live' }) {
  return (
    <span className="orbit-live">
      <span className="orbit-live__dot" aria-hidden="true" />
      {label}
    </span>
  )
}

/* -----------------------------------------------------------------------------
   Panels
   -------------------------------------------------------------------------- */

function GlobalReach({ count, baseline }) {
  const ratio = Math.min(1, count / 195)
  const above = count - baseline

  return (
    <article className="orbit-card orbit-card--reach">
      <header className="orbit-card__head">
        <h3 className="orbit-card__title">Global reach</h3>
        <LiveDot />
      </header>
      <p className="orbit-card__lede">
        Countries with a CommBank card transaction in the last hour
      </p>
      <div className="orbit-reach">
        <AnimatedNumber
          className="orbit-reach__value"
          value={count}
          format={(n) => String(Math.round(n))}
          duration={520}
        />
        <div className="orbit-reach__bars">
          <span className="orbit-reach__track">
            <span className="orbit-reach__fill" style={{ width: `${ratio * 100}%` }} />
          </span>
          <span className="orbit-reach__baseline">
            {above >= 0 ? `${above} above` : `${Math.abs(above)} below`} the {baseline} average
          </span>
        </div>
      </div>
    </article>
  )
}

/**
 * Fees not charged. Replaces the transactions-per-minute trend line: it is the
 * same underlying stream, expressed as the thing the customer actually gets.
 */
function FeesNotCharged({ amount, transactionsToday }) {
  return (
    <article className="orbit-card orbit-card--fees">
      <header className="orbit-card__head">
        <h3 className="orbit-card__title">Fees not charged today</h3>
        <LiveDot />
      </header>
      <AnimatedNumber
        className="orbit-fees__value"
        value={amount}
        format={(n) => formatAud(n, { decimals: 0 })}
        duration={700}
      />
      <p className="orbit-card__lede">
        What a card charging the usual {STANDARD_CARD_FX_FEE * 100}% foreign transaction fee would
        have taken from CommBank customers overseas since midnight.
      </p>
      <p className="orbit-fees__foot">
        Across <strong>{transactionsToday.toLocaleString('en-AU')}</strong> international
        transactions
      </p>
    </article>
  )
}

function RecentSpending({ ticker }) {
  return (
    <article className="orbit-card orbit-card--spend">
      <header className="orbit-card__head">
        <h3 className="orbit-card__title">Recent intl. spending</h3>
        <LiveDot />
      </header>
      <ul className="orbit-spend">
        {ticker.map((transaction) => (
          <li className="orbit-spend__row" key={transaction.id}>
            <span className="orbit-spend__icon">
              <Icon name={CATEGORIES[transaction.category]?.icon ?? 'bag'} size={16} />
            </span>
            <span className="orbit-spend__place">
              {transaction.city}, {transaction.cc}
            </span>
            <span className="orbit-spend__amount">
              {formatWorldAmount(transaction.localAmount, transaction.currency)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

/**
 * The 16 currencies the Travel Money Card can hold, lighting up as they are
 * spent. Replaces the top-countries bar chart — this one is specific to the
 * product rather than generic travel trivia.
 */
function CurrenciesInPlay({ lastSeen, activeCount }) {
  const now = Date.now()

  return (
    <article className="orbit-card orbit-card--currencies">
      <header className="orbit-card__head">
        <h3 className="orbit-card__title">Currencies in play</h3>
        <LiveDot />
      </header>
      <p className="orbit-card__lede">
        <strong>{activeCount}</strong> of the {TMC_CURRENCIES.length} your Travel Money Card holds,
        spent in the last few seconds
      </p>
      <ul className="orbit-currencies">
        {TMC_CURRENCIES.map((code) => {
          const age = now - (lastSeen[code] ?? 0)
          const isLive = age < CURRENCY_ACTIVE_MS
          // Recent ones burn brightest, then cool off rather than snapping out.
          const heat = isLive ? 1 - age / CURRENCY_ACTIVE_MS : 0
          return (
            <li
              key={code}
              className={`orbit-currency ${isLive ? 'is-live' : ''}`}
              style={isLive ? { '--heat': heat.toFixed(2) } : undefined}
            >
              {code}
            </li>
          )
        })}
      </ul>
      <p className="orbit-currencies__foot">
        Each was loaded at a rate its holder locked before they left.
      </p>
    </article>
  )
}

/* -----------------------------------------------------------------------------
   Section
   -------------------------------------------------------------------------- */

export default function TravelOrbits() {
  const feed = useGlobalFeed()

  return (
    <section className="orbits" aria-labelledby="orbits-title">
      <div className="container">
        <div className="orbits__head">
          <span className="orbits__chip">
            CommBank travel orbits
            <LiveDot />
          </span>
          <h2 className="orbits__title" id="orbits-title">
            Right now, {feed.countryCount} countries are taking a CommBank card
          </h2>
          <p className="orbits__lede">
            Every mark is an international transaction as it happens. Not a promise that the card
            works overseas — a picture of it working. Drag the globe to turn it.
          </p>
        </div>

        <div className="orbits__stage">
          <div className="orbits__globe">
            <Globe pings={feed.pings} />
          </div>

          <div className="orbits__cards">
            <GlobalReach count={feed.countryCount} baseline={feed.countryBaseline} />
            <FeesNotCharged
              amount={feed.feesNotChargedAud}
              transactionsToday={feed.totalToday}
            />
            <RecentSpending ticker={feed.ticker} />
            <CurrenciesInPlay
              lastSeen={feed.currencyLastSeen}
              activeCount={feed.activeCurrencies}
            />
          </div>
        </div>

        <p className="orbits__foot">
          Simulated for this concept. The transaction stream is generated locally from a seeded
          model of Australian outbound travel — no live data is used, and nothing leaves your
          browser.
        </p>
      </div>
    </section>
  )
}
