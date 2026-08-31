/* =============================================================================
   Dual-currency balance header — Up's Travel Mode, in CommBank's clothes.

   The local currency is primary and AUD sits beneath it, with the live rate
   between them. A toggle flips which is which, because which one you want to
   read depends on whether you're budgeting or just buying a coffee.
   ============================================================================= */

import { AnimatedNumber, Button, Chip } from './primitives/index.jsx'
import { CURRENCY_META } from '../data/fx.js'
import { formatLocal, formatAud, formatRate } from '../lib/format.js'
import './BalanceHeader.css'

export default function BalanceHeader({
  currency,
  localBalance,
  audBalance,
  otherHoldings = [],
  liveRate,
  lockedRate,
  primaryIsLocal,
  onFlip,
  travelModeOn,
  cardLocked,
}) {
  const meta = CURRENCY_META[currency]

  const primary = primaryIsLocal
    ? { value: localBalance, render: (n) => formatLocal(Math.round(n), currency), label: meta.name }
    : { value: audBalance, render: (n) => formatAud(n), label: 'Australian dollars' }

  const secondary = primaryIsLocal
    ? { text: formatAud(audBalance), label: 'Australian dollars' }
    : { text: formatLocal(Math.round(localBalance), currency), label: meta.name }

  return (
    <section className="balance" aria-label="Card balance">
      <div className="balance__chips">
        <Chip tone={travelModeOn ? 'brand' : 'outline'} icon={travelModeOn ? 'plane' : undefined}>
          {travelModeOn ? 'Travel Mode is on' : 'Travel Mode is off'}
        </Chip>
        {cardLocked ? <Chip tone="alert" icon="lock">Card locked</Chip> : null}
      </div>

      <p className="balance__label">Available to spend</p>

      <AnimatedNumber
        as="p"
        className="balance__primary"
        value={primary.value}
        format={primary.render}
        duration={520}
      />

      {/* The live rate sits between the two figures — it's the thing that
          explains why they don't move together. */}
      <div className="balance__rate">
        <span className="balance__rate-live">
          <span className="balance__pulse" key={liveRate.toFixed(3)} aria-hidden="true" />
          <AnimatedNumber
            value={liveRate}
            format={(n) => `1 AUD = ${formatRate(n, currency)} ${currency}`}
            duration={600}
          />
        </span>
        <span className="balance__rate-locked">
          You&rsquo;re spending at your locked {formatRate(lockedRate, currency)}
        </span>
      </div>

      {/* The same balance, in the other currency — not a different total. Mixing
          the yen balance with the AUD value of every other bucket would make the
          two figures look like they disagree. Other buckets get their own line. */}
      <p className="balance__secondary" data-figure>
        {secondary.text}
        <span className="sr-only"> in {secondary.label}</span>
      </p>

      {otherHoldings.length ? (
        <p className="balance__others">
          Plus{' '}
          {otherHoldings
            .map((holding) => formatLocal(Math.round(holding.balance), holding.code))
            .join(' and ')}{' '}
          in your other buckets.
        </p>
      ) : null}

      <Button variant="secondary" size="sm" icon="refresh" onClick={onFlip}>
        Show {primaryIsLocal ? 'AUD' : meta.name} first
      </Button>
    </section>
  )
}
